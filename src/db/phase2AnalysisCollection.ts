// argus-frontend/src/db/phase2AnalysisCollection.ts
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface Phase2Analysis {
  studentId: string;
  submissionId: string;
  big5Analysis: any;
  logicAnalysis: any;
  mathAnalysis: any;
  readingAnalysis: any;
  writingAnalysis: any;
  createdAt: any;
  updatedAt: any;
}

export const getPhase2Analysis = async (studentId: string): Promise<Phase2Analysis | null> => {
  try {
    const analysisQuery = query(
      collection(db, 'phase_2_analysis'),
      where('studentId', '==', studentId)
    );
    
    const analysisSnapshot = await getDocs(analysisQuery);
    
    if (analysisSnapshot.empty) {
      return null;
    }
    
    const analysisDoc = analysisSnapshot.docs[0];
    return analysisDoc.data() as Phase2Analysis;
  } catch (error) {
    console.error('Error fetching phase 2 analysis:', error);
    throw error;
  }
};

export const createPhase2Analysis = async (
  studentId: string, 
  submissionId: string,
  computedAnalysis?: any // Add this parameter
): Promise<Phase2Analysis> => {
  try {
    const newAnalysis: Phase2Analysis = {
      studentId,
      submissionId,
      big5Analysis: computedAnalysis?.big5Analysis || {},
      logicAnalysis: computedAnalysis?.logicAnalysis || {},
      mathAnalysis: computedAnalysis?.mathAnalysis || {},
      readingAnalysis: computedAnalysis?.readingAnalysis || {},
      writingAnalysis: computedAnalysis?.writingAnalysis || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const analysisRef = doc(collection(db, 'phase_2_analysis'));
    await setDoc(analysisRef, newAnalysis);
    
    return newAnalysis;
  } catch (error) {
    console.error('Error creating phase 2 analysis:', error);
    throw error;
  }
};

export const updatePhase2Analysis = async (
  studentId: string, 
  analysisData: Partial<Phase2Analysis>
): Promise<void> => {
  try {
    const analysisQuery = query(
      collection(db, 'phase_2_analysis'),
      where('studentId', '==', studentId)
    );
    
    const analysisSnapshot = await getDocs(analysisQuery);
    
    if (analysisSnapshot.empty) {
      throw new Error('Analysis document not found');
    }
    
    const analysisDoc = analysisSnapshot.docs[0];
    await updateDoc(doc(db, 'phase_2_analysis', analysisDoc.id), {
      ...analysisData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating phase 2 analysis:', error);
    throw error;
  }
};