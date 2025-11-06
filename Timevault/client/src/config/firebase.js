// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjlkB1lNt6DHGMDBL15M5vDcQaRljKfhk",
  authDomain: "timevault-b4d6e.firebaseapp.com",
  projectId: "timevault-b4d6e",
  storageBucket: "timevault-b4d6e.appspot.com",
  messagingSenderId: "475198819571",
  appId: "1:475198819571:web:e42f7aac940e14fc72bb86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;