import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin
// In a real environment, you'd use a service account key
// Here we rely on default credentials or project ID
try {
  admin.initializeApp({
    projectId: "tidepayslip"
  });
} catch (e) {
  console.error("Firebase Admin Init Error:", e);
}

const db = getFirestore();
const auth = getAuth();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Admin Role Assignment
  app.post("/api/assignAdminRole", async (req, res) => {
    const { uid, accessCode, fullName, email } = req.body;

    if (!uid || !accessCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // 1. Verify Access Code from Firestore
      const systemDoc = await db.collection("settings").doc("system").get();
      const storedCode = systemDoc.data()?.adminAccessCode;

      if (accessCode !== storedCode) {
        return res.status(403).json({ error: "Invalid Admin Access Code" });
      }

      // 2. Set Custom Claims
      await auth.setCustomUserClaims(uid, { role: "admin" });

      // 3. Create Firestore User Document
      await db.collection("users").doc(uid).set({
        displayName: fullName,
        email: email,
        role: "admin",
        status: "active", // Admins are auto-approved for this demo
        employeeId: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "self-registration"
      });

      // 4. Log Activity
      await db.collection("activities").add({
        action: "ADMIN_REGISTERED",
        userId: uid,
        performedByName: fullName,
        details: `Admin registered with email ${email}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error assigning admin role:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
