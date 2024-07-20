import {
    doc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import db from "./db";
import axios from "axios";
import { STUDENTS_APIS, FETCH_STUDENT_DATA, UPDATE_STUDENT_DATA } from "../constants/constants";

// CREATE STUDENT RECORD
type Student = {
    uid: string;
    first_name: string;
    last_name: string;
    school_id: string;
    grade: number;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
};

export const createStudent = async (student: Student) => {
    try {
        const docRef = doc(db, "students", student.uid);
        await setDoc(docRef, student);
        return { message: `Student ${student.first_name} ${student.last_name} created successfully!` };
    } catch (e) {
        throw new Error(`Error creating ${student.first_name} ${student.last_name}. Please contact talentsearch@argus.ai`);
    }
};

export const getStudent = async (userId: string) => {
    try {
        const encodedUID = encodeURIComponent(userId);
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_STUDENT_DATA}/${encodedUID}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching student for user ${userId}. Please contact talentsearch@argus.ai`);
    }
}

export const updateStudent = async (user_id: string, student: {first_name?: string, last_name?: string, parent_name?: string, parent_email?: string, parent_phone?: string}) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${UPDATE_STUDENT_DATA}`, {uid: user_id, student});
        console.log(response.data);
        return;
    } catch (error) {
        throw new Error(`Error updating student for user ${user_id}. Please contact talentsearch@argus.ai`);
    }
}

export const getSchoolId = async (userId: string) => {
    try {
        const studentsRef = collection(db, "students");
        const studentQuery = query(studentsRef, where("uid", "==", userId));
        const studentSnapshot = await getDocs(studentQuery);
        if (studentSnapshot.empty) {
            throw new Error(`No matching student found for user ${userId}. Please contact talentsearch@argus.ai`);
        }
        const studentData = studentSnapshot.docs[0].data();
        return studentData.school_id;
    } catch (error) {
        throw new Error(`Error fetching school ID for user ${userId}. Please contact talentsearch@argus.ai`);
    }
}