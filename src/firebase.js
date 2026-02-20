// 1. UPDATE THIS IMPORT: Add getApps and getApp
import { initializeApp, getApps, getApp } from "firebase/app"; 
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDY2kUbBvVt6G0GOH7WaHuEn1RAiBetW3Y",
  authDomain: "thebookparlor-4027b.firebaseapp.com",
  projectId: "thebookparlor-4027b",
  storageBucket: "thebookparlor-4027b.firebasestorage.app",
  messagingSenderId: "1047497601657",
  appId: "1:1047497601657:web:28a4e63fe0dc028b4ddaa8",
  measurementId: "G-Y30TEYYYEZ"
};

// 2. THE FIX: Check if Firebase is already initialized before starting it
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 

console.log("🔥 Firebase initialized successfully!");