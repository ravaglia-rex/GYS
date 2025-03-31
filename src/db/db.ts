import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const db = getFirestore();
export const auth = getAuth();
export default db;