import {
    doc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import db from "./db";

// CREATE STUDENT RECORD
type Student = {
    uid: string;
    first_name: string;
    last_name: string;
    school_id: string;
    grade: number;
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

export const getSchoolId = async (userId: string) => {
    try {
        const studentsRef = collection(db, "students");
        const studentQuery = query(studentsRef, where("uid", "==", userId));
        const studentSnapshot = await getDocs(studentQuery);
        if (studentSnapshot.empty) {
            throw new Error(`No matching student found for user ${userId}. Please contact administrator!`);
        }
        const studentData = studentSnapshot.docs[0].data();
        return studentData.school_id;
    } catch (error) {
        throw new Error(`Error fetching school ID for user ${userId}. Please contact administrator!`);
    }
}