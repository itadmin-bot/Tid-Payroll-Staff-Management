import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";

// Initialize Firebase Admin
// In a real environment, you'd use a service account key
// Here we rely on default credentials or project ID
try {
  admin.initializeApp();
  console.log("Firebase Admin Initialized. Project ID:", admin.app().options.projectId || "Default");
} catch (e) {
  console.error("Firebase Admin Init Error:", e);
}

const db = admin.firestore();
const auth = admin.auth();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      projectId: admin.app().options.projectId || "Default",
      envProjectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "Not Set"
    });
  });

  // API Route for Admin Role Assignment
  app.post("/api/assignAdminRole", async (req, res) => {
    const { uid, accessCode, fullName, email } = req.body;
    console.log(`Assigning admin role to ${email} (${uid})`);

    if (!uid || !accessCode) {
      console.error("Missing required fields for admin assignment");
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // 1. Verify Access Code from Firestore
      const systemDoc = await db.collection("settings").doc("system").get();
      let storedCode = systemDoc.data()?.adminAccessCode;

      // If no code exists yet, initialize with default
      if (!storedCode) {
        storedCode = "TIDE-ADMIN-2026-X9FQ";
        await db.collection("settings").doc("system").set({ adminAccessCode: storedCode });
      }

      if (accessCode !== storedCode) {
        console.warn(`Invalid access code attempt for ${email}`);
        return res.status(403).json({ error: "Invalid Admin Access Code" });
      }

      // 2. Set Custom Claims
      console.log(`Setting custom claims for ${uid}`);
      await auth.setCustomUserClaims(uid, { role: "admin" });

      // 3. Create Firestore User Document
      console.log(`Creating user document for ${uid}`);
      await db.collection("users").doc(uid).set({
        displayName: fullName,
        email: email,
        role: "admin",
        status: "active",
        employeeId: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "self-registration",
        isOnline: true,
        lastActive: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Log Activity
      await db.collection("activities").add({
        action: "ADMIN_REGISTERED",
        userId: uid,
        performedByName: fullName,
        details: `Admin registered with email ${email}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Admin role successfully assigned to ${email}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error assigning admin role:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route for Changing User Role
  app.post("/api/changeUserRole", async (req, res) => {
    const { adminUid, targetUid, newRole } = req.body;

    try {
      // 1. Verify caller is admin
      const adminUser = await auth.getUser(adminUid);
      if (adminUser.customClaims?.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized: Admin only" });
      }

      // 2. Prevent self-demotion
      if (adminUid === targetUid) {
        return res.status(400).json({ error: "Admins cannot demote themselves" });
      }

      // 3. Assign Custom Claims
      await auth.setCustomUserClaims(targetUid, { role: newRole });

      // 4. Update Firestore
      await db.collection("users").doc(targetUid).update({
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 5. Log Activity
      await db.collection("activities").add({
        action: "ROLE_CHANGED",
        targetUserId: targetUid,
        performedBy: adminUid,
        details: `Role changed to ${newRole}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Deleting User
  app.post("/api/deleteUser", async (req, res) => {
    const { adminUid, targetUid } = req.body;

    try {
      const adminUser = await auth.getUser(adminUid);
      if (adminUser.customClaims?.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (adminUid === targetUid) {
        return res.status(400).json({ error: "Admins cannot delete themselves" });
      }

      // Delete from Auth
      await auth.deleteUser(targetUid);
      // Delete from Firestore
      await db.collection("users").doc(targetUid).delete();

      await db.collection("activities").add({
        action: "USER_DELETED",
        targetUserId: targetUid,
        performedBy: adminUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Updating Access Code
  app.post("/api/updateAccessCode", async (req, res) => {
    const { adminUid, newCode } = req.body;

    try {
      const adminUser = await auth.getUser(adminUid);
      if (adminUser.customClaims?.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await db.collection("settings").doc("system").update({
        adminAccessCode: newCode
      });

      await db.collection("activities").add({
        action: "ACCESS_CODE_CHANGED",
        performedBy: adminUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
