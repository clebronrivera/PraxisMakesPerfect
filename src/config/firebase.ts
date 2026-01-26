// src/config/firebase.ts
// Firebase configuration and initialization

import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCtABgT9UVIT89RHQWSXgnRS14GAy89_o",
  authDomain: "praxismakesperfect-65c57.firebaseapp.com",
  projectId: "praxismakesperfect-65c57",
  storageBucket: "praxismakesperfect-65c57.firebasestorage.app",
  messagingSenderId: "521016285044",
  appId: "1:521016285044:web:7f9b7ac0f872b7a85efe21",
  measurementId: "G-CCYSWQ24BF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (for storing user data in the cloud)
export const db = getFirestore(app);

// Initialize Authentication (for user accounts)
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
