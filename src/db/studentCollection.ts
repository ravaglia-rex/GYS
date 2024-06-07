import {
    doc,
    setDoc,
} from "firebase/firestore";
import db from "./db";

// CREATE STUDENT RECORD
type Student = {
    uid: string;
    first_name: string;
    last_name: string;
    school_id: string;
};

export const createStudent = async (student: Student) => {
    try {
        const docRef = doc(db, "students", student.uid);
        await setDoc(docRef, student);
        return { message: `Student ${student.first_name} ${student.last_name} created successfully!` };
    } catch (e) {
        throw new Error(`Error creating ${student.first_name} ${student.last_name}. Please contact administrator!`);
    }
};