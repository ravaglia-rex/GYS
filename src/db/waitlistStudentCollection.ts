import {
    addDoc,
    collection,
} from "firebase/firestore";
import db from "./db";

// CREATE STUDENT RECORD
type Student = {
    first_name: string;
    last_name: string;
    school_id: string;
    grade: number;
    email: string;
};

export const createWaitlistedStudent = async (student: Student) => {
    try{
        await addDoc(collection(db, "waitlisted_students"), student);
        return { message: `Student ${student.first_name} ${student.last_name} created successfully!` };
    } catch (e) {
        throw new Error(`Error creating ${student.first_name} ${student.last_name}. Please contact talentsearch@argus.ai`);
    }
};