import { getFirestore } from "firebase/firestore";
import { app } from "./firebase"; // we’ll fix this export below

export const db = getFirestore(app);
