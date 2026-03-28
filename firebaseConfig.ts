import { initializeApp } from "firebase/app";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app);
