import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_n_qO5Sd6feezXYFQ-xDs89MPRGCqw-8",
  authDomain: "uvathrifts-85b46.firebaseapp.com",
  projectId: "uvathrifts-85b46",
  storageBucket: "uvathrifts-85b46.firebasestorage.app",
  messagingSenderId: "179071432031",
  appId: "1:179071432031:web:429f980bb19dd7d5ccf2ea",
  measurementId: "G-H5K0K28QYE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);