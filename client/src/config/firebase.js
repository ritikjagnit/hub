import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
export { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

import { getAnalytics } from "firebase/analytics";

// Firebase Configuration provided by the user
const sanitizeEnvVar = (val) => {
  if (typeof val !== 'string') return val;
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
};

const firebaseConfig = {
  apiKey: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_API_KEY) || "AIzaSyBZ2Jmd_b4YEbrT_7srJYlWBE5bQS0kZAA",
  authDomain: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || "project-management-syste-965b4.firebaseapp.com",
  projectId: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_PROJECT_ID) || "project-management-syste-965b4",
  storageBucket: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || "project-management-syste-965b4.firebasestorage.app",
  messagingSenderId: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "565673224744",
  appId: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_APP_ID) || "1:565673224744:web:0c7f39cc54c340fb0ea31d",
  measurementId: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || "G-42XFBNPDZK"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
// Set standard prompts
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { 
  app,
  analytics,
  auth, 
  googleProvider 
};

