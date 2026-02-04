import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCHtbFfZcgMfowK6ocFSKfCmbKRWbQsIY4",
  authDomain: "payments-757c9.firebaseapp.com",
  projectId: "payments-757c9",
  storageBucket: "payments-757c9.firebasestorage.app",
  messagingSenderId: "116039902216",
  appId: "1:116039902216:web:98c95ae3405195833b1dbd",
  measurementId: "G-DSEQ8L9SN1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;