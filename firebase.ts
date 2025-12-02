import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Safely access environment variables if available (Vite/Vercel)
// Fallback to the new ladakh-connect1 config provided
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCdarhgeDVba6Dz5xNGcyvkBFK7Vp8XMSg",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "ladakh-connect1.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "ladakh-connect1",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "ladakh-connect1.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "665150606046",
  appId: env.VITE_FIREBASE_APP_ID || "1:665150606046:web:a3f2ce2cdf7b460987904f",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-WS5L3SL28C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export const db = getFirestore(app);