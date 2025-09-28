import { db } from '../firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export interface Phase2ExamResponse {
  submissionId: string;
  studentId: string;
  responseData: {
    [questionId: string]: {
      key: string;
      label: string;
      options: Array<{
        id: string;
        text: string;
      }>;
      type: string;
      value: string[];
    };
  };
  big5analysis?: string;
  createdAt?: any;
}

export const getPhase2ExamResponse = async (studentId: string): Promise<Phase2ExamResponse | null> => {
  try {
    console.log('Looking for Phase 2 exam data for student:', studentId);
    
    // First, get the submission ID from student_submission_mappings
    const submissionMappingQuery = query(
      collection(db, 'student_submission_mappings'),
      where('student_uid', '==', studentId)
    );
    
    const submissionMappingSnapshot = await getDocs(submissionMappingQuery);
    console.log('Submission mapping query results:', submissionMappingSnapshot.docs.length, 'documents found');
    
    if (submissionMappingSnapshot.empty) {
      console.log('No submission mapping found for student:', studentId);
      return null;
    }
    
    const submissionMappingDoc = submissionMappingSnapshot.docs[0];
    const submissionMappingData = submissionMappingDoc.data();
    console.log('Submission mapping data:', submissionMappingData);
    
    const submissionId = submissionMappingData.submission_id;
    
    if (!submissionId) {
      console.log('No submission ID found for student:', studentId);
      return null;
    }
    
    console.log('Looking for Phase 2 exam response with submission ID:', submissionId);
    
    // Query the collection to find document with matching submissionId field
    const responseQuery = query(
      collection(db, 'phase_2_exam_responses'),
      where('submissionId', '==', submissionId)
    );
    
    const responseSnapshot = await getDocs(responseQuery);
    
    if (responseSnapshot.empty) {
      console.log('No phase 2 exam response found for submission ID:', submissionId);
      return null;
    }
    
    const responseDoc = responseSnapshot.docs[0];
    
    const responseData = responseDoc.data();
    console.log('Phase 2 exam response found:', !!responseData);
    
    return {
      submissionId,
      studentId,
      responseData: responseData?.responseData || {},
      big5analysis: responseData?.big5analysis,
      createdAt: responseData?.createdAt
    };
  } catch (error) {
    console.error('Error fetching phase 2 exam response:', error);
    throw error;
  }
};

export const saveBig5Analysis = async (submissionId: string, analysis: string): Promise<void> => {
  try {
    // First, find the document by submissionId
    const responseQuery = query(
      collection(db, 'phase_2_exam_responses'),
      where('submissionId', '==', submissionId)
    );
    
    const responseSnapshot = await getDocs(responseQuery);
    
    if (responseSnapshot.empty) {
      throw new Error(`No document found with submissionId: ${submissionId}`);
    }
    
    const responseDoc = responseSnapshot.docs[0];
    
    // Update the document using its actual document ID
    await updateDoc(doc(db, 'phase_2_exam_responses', responseDoc.id), {
      big5analysis: analysis,
      analysisUpdatedAt: new Date()
    });
  } catch (error) {
    console.error('Error saving Big5 analysis:', error);
    throw error;
  }
};
