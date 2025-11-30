import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDhCOMgDyxHrC_c5XqqKl_MopFpiZiD00M",
  authDomain: "ladakh-connect-8fd80.firebaseapp.com",
  projectId: "ladakh-connect-8fd80",
  storageBucket: "ladakh-connect-8fd80.firebasestorage.app",
  messagingSenderId: "123365996700",
  appId: "1:123365996700:web:7719b13b22d10d8f299559",
  measurementId: "G-9DE7J6TDLZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);