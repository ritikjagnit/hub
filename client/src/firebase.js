// NOTE: This is a stale duplicate. The active Firebase config is at src/config/firebase.js
// Kept here to avoid breaking any legacy references.
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBZ2Jmd_b4YEbrT_7srJYlWBE5bQS0kZAA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "project-management-syste-965b4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-management-syste-965b4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "project-management-syste-965b4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "565673224744",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:565673224744:web:0c7f39cc54c340fb0ea31d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-42XFBNPDZK"
};

export const app = initializeApp(firebaseConfig);