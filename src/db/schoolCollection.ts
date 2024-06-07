import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    doc,
    query,
    where
} from "firebase/firestore";
import db from "./db";

// CREATE SCHOOL RECORD
type School = {
    school_name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    number_of_students: number;
    tuition: number;
};

export const createSchool = async (school: School) => {
    try {
        await addDoc(collection(db, "schools"), school);
        return { message: `School ${school.school_name} created successfully!` };
    } catch (e) {
        throw new Error(`Error creating ${school.school_name}. Please contact administrator!`);
    }
};

// READ SCHOOL RECORD
export const readSchool = async (school_id: string) => {
    try {
        const docRef = doc(db, "schools", school_id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            throw new Error(`School ${school_id} not found`);
        }
    } catch (e) {
        throw new Error(`Error reading school ${school_id}. Please contact administrator!`);
    }
};

// FETCH ALL SCHOOL NAMES
export const fetchSchoolNames = async () => {
    try {
        const schools = await getDocs(collection(db, "schools"));
        return schools.docs.map(doc => doc.data().school_name);
    } catch (e) {
        throw new Error(`Error fetching schools. Please contact administrator!`);
    }
};

// GET SCHOOL ID BY NAME
export const getSchoolIdByName = async (school_name: string) => {
    try {
        const schoolsRef = collection(db, "schools");
        const q = query(schoolsRef, where("school_name", "==", school_name.trim()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            throw new Error(`School with name ${school_name} not found`);
        } else {
            const doc = querySnapshot.docs[0]; // Assuming school names are unique
            return doc.id;
        }
    } catch (e) {
        throw new Error(`Error fetching school ID for ${school_name}. Please contact administrator!`);
    }
};

// FETCH ALL SCHOOL IDS AND NAMES
export const fetchSchools = async () => {
    try {
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        return schoolsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().school_name,
        }));
    } catch (e) {
        throw new Error(`Error fetching schools. Please contact administrator!`);
    }
};
