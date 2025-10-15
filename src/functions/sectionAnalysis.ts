// argus-frontend/src/functions/sectionAnalysis.ts
import { Phase2ExamResponse } from '../db/phase2ExamResponsesCollection';

export interface SectionAnalysis {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  subcategories: {
    [subcategory: string]: {
      total: number;
      correct: number;
      accuracy: number;
    };
  };
}

export interface AnalysisData {
  big5Analysis: any;
  logicAnalysis: SectionAnalysis;
  mathAnalysis: SectionAnalysis;
  readingAnalysis: SectionAnalysis;
  writingAnalysis: SectionAnalysis;
}

export const computeSectionAnalysis = (responseData: any): AnalysisData => {
  const sections = ['logic', 'math', 'reading', 'writing'];
  const analysisData: AnalysisData = {
    big5Analysis: {}, // Will be populated separately
    logicAnalysis: { totalQuestions: 0, correctAnswers: 0, accuracy: 0, subcategories: {} },
    mathAnalysis: { totalQuestions: 0, correctAnswers: 0, accuracy: 0, subcategories: {} },
    readingAnalysis: { totalQuestions: 0, correctAnswers: 0, accuracy: 0, subcategories: {} },
    writingAnalysis: { totalQuestions: 0, correctAnswers: 0, accuracy: 0, subcategories: {} }
  };

  // Process each question
  Object.values(responseData).forEach((question: any) => {
    if (!question.category?.main || question.category.main === 'big5') {
      return; // Skip Big 5 questions or questions without category
    }

    const section = question.category.main;
    const subcategory = question.category.sub;
    
    if (sections.includes(section)) {
      const sectionKey = `${section}Analysis` as keyof AnalysisData;
      const sectionAnalysis = analysisData[sectionKey] as SectionAnalysis;
      
      sectionAnalysis.totalQuestions++;
      
      if (question.correct === true) {
        sectionAnalysis.correctAnswers++;
      }
      
      // Track subcategories
      if (!sectionAnalysis.subcategories[subcategory]) {
        sectionAnalysis.subcategories[subcategory] = {
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }
      
      sectionAnalysis.subcategories[subcategory].total++;
      if (question.correct === true) {
        sectionAnalysis.subcategories[subcategory].correct++;
      }
    }
  });

  // Calculate accuracies
  sections.forEach(section => {
    const sectionKey = `${section}Analysis` as keyof AnalysisData;
    const sectionAnalysis = analysisData[sectionKey] as SectionAnalysis;
    
    sectionAnalysis.accuracy = sectionAnalysis.totalQuestions > 0 
      ? Math.round((sectionAnalysis.correctAnswers / sectionAnalysis.totalQuestions) * 100)
      : 0;
    
    // Calculate subcategory accuracies
    Object.values(sectionAnalysis.subcategories).forEach(subcat => {
      subcat.accuracy = subcat.total > 0 
        ? Math.round((subcat.correct / subcat.total) * 100)
        : 0;
    });
  });

  return analysisData;
};