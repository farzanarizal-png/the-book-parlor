import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- NEW: Import Storage
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY2kUbBvVt6G0GOH7WaHuEn1RAiBetW3Y",
  authDomain: "thebookparlor-4027b.firebaseapp.com",
  projectId: "thebookparlor-4027b",
  storageBucket: "thebookparlor-4027b.firebasestorage.app",
  messagingSenderId: "1047497601657",
  appId: "1:1047497601657:web:28a4e63fe0dc028b4ddaa8",
  measurementId: "G-Y30TEYYYEZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- NEW: Initialize and export Storage

console.log("🔥 Firebase initialized successfully!");