// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyASEptdXfKraqgV2we5qL9N1X3n7BwFb-w",
  authDomain: "tidepayslip.firebaseapp.com",
  projectId: "tidepayslip",
  storageBucket: "tidepayslip.firebasestorage.app",
  messagingSenderId: "690747483147",
  appId: "1:690747483147:web:b044fe01a9a1fa4114530e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
