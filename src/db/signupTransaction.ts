import {
    runTransaction,
    doc,
    collection
} from 'firebase/firestore';
import db from './db';

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

export const runSignUpTransaction = async (student: Student, email: string, examID: string, isQualified: boolean | null, eligibleDateTime: string) => {
    try {
        await runTransaction(db, async (transaction) => {
            // Step 1: Create the student record
            const studentRef = doc(collection(db, "students"), student.uid);
            transaction.set(studentRef, student);
            
            // Step 2: Add email to email mapping collection
            const emailMappingRef = doc(collection(db, "student_email_mappings"), student.uid);
            transaction.set(emailMappingRef, {
                email,
            });

            // Step 3: Add the exam id to phase 1 uids collection
            if(examID !== null && examID !== ""){
                const examIDRef = doc(collection(db, "phase_1_uids"), examID);
                transaction.set(examIDRef, {
                    examID: examID
                });
            }

            // Step 4: Map the user to an exam id based on the eligibility
            let form_link: string | null = null;
            if (isQualified === null) {
                form_link = "npByEB";
            } else if (isQualified) {
                form_link = "mOGkN8";
            }
            if (form_link !== null) {
                const examMappingRef = doc(collection(db, "student_exam_mappings"), student.uid);
                const newExamData = {
                    uid: student.uid,
                    form_link: form_link,
                    completed: false,
                    eligibility_at: eligibleDateTime,
                };
                transaction.set(examMappingRef, newExamData);
            }
        });
    } catch (e) {
        console.error(e);
        throw new Error(`Error creating ${student.first_name} ${student.last_name}. Please contact talentsearch@argus.ai`);
    }
};