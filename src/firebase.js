import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB35hcdG4LEtbstuG57Oi1FAh5h-uMuNgo",
  authDomain: "live-meeting-bd35f.firebaseapp.com",
  projectId: "live-meeting-bd35f",
  storageBucket: "live-meeting-bd35f.firebasestorage.app",
  messagingSenderId: "669013656160",
  appId: "1:669013656160:web:fbc616492c68f9a71cf905"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
