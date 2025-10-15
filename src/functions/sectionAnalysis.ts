// argus-frontend/src/functions/sectionAnalysis.ts

export interface SectionAnalysis {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  text?: string; // Add text analysis
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

const generateSectionText = (section: string, analysis: SectionAnalysis): string => {
  const { accuracy, subcategories } = analysis;
  
  // Get subcategory insights
  const subcatEntries = Object.entries(subcategories);
  const topSubcat = subcatEntries.reduce((max, current) => 
    current[1].accuracy > max[1].accuracy ? current : max, 
    subcatEntries[0] || ['', { accuracy: 0 }]
  );
  const weakSubcat = subcatEntries.reduce((min, current) => 
    current[1].accuracy < min[1].accuracy ? current : min, 
    subcatEntries[0] || ['', { accuracy: 100 }]
  );

  const sectionInsights = {
    logic: {
      high: "Your logical reasoning skills demonstrate exceptional analytical thinking and problem-solving abilities. You excel at breaking down complex problems, identifying patterns, and drawing valid conclusions from given information. Your ability to think systematically and methodically sets you apart in logical analysis.",
      medium: "Your logical reasoning shows good foundational skills with clear potential for growth. You understand basic logical concepts but can benefit from practicing different types of reasoning exercises, including syllogisms, conditional statements, and pattern recognition. Regular practice with logic puzzles will strengthen your analytical abilities.",
      low: "Logical reasoning is a skill that develops through systematic thinking and pattern recognition. Consider working on puzzles, brain teasers, and step-by-step problem-solving approaches. Focus on understanding cause-and-effect relationships, identifying assumptions, and practicing structured thinking methods."
    },
    math: {
      high: "Your mathematical abilities demonstrate strong computational skills and deep conceptual understanding. You show proficiency in mathematical reasoning, problem-solving strategies, and the ability to apply mathematical principles to various contexts. Your numerical fluency and analytical approach to mathematical problems are well-developed.",
      medium: "Your mathematical foundation is solid with clear potential for further development. You grasp core concepts but can benefit from practicing varied problem types and focusing on understanding underlying mathematical principles. Working on word problems and real-world applications will help bridge theory and practice.",
      low: "Mathematics requires building strong fundamentals through consistent, structured practice. Start with mastering basic concepts and gradually work toward more complex problems. Focus on understanding the 'why' behind mathematical operations rather than just memorizing procedures, and practice regularly to build confidence."
    },
    reading: {
      high: "Your reading comprehension skills demonstrate excellent ability to understand, analyze, and interpret written material across various contexts. You show strong critical thinking, inference skills, and the ability to identify main ideas, supporting details, and author perspectives. Your reading fluency and analytical depth are impressive.",
      medium: "Your reading comprehension shows good understanding with opportunities for deeper analysis and interpretation. Focus on active reading strategies such as annotating texts, asking questions while reading, and practicing critical thinking exercises. Work on identifying implicit meanings and evaluating author credibility and bias.",
      low: "Reading comprehension improves through active engagement with diverse texts and consistent practice. Focus on summarizing main ideas, making inferences from context clues, and analyzing author intent and tone. Practice with different text types and gradually increase complexity to build confidence and skills."
    },
    writing: {
      high: "Your writing skills demonstrate strong communication abilities, clear expression, and excellent command of language conventions. You show effective organization, varied sentence structures, and appropriate tone for different contexts. Your ability to articulate thoughts clearly and persuasively is well-developed.",
      medium: "Your writing shows good potential with areas for refinement and expansion. Focus on improving clarity, organization, and expanding your vocabulary and sentence variety. Practice different writing styles and work on developing stronger arguments and more engaging introductions and conclusions.",
      low: "Writing skills develop through regular practice, feedback, and gradual skill building. Focus on mastering basic grammar, sentence structure, and organizing thoughts clearly before expressing them. Start with simple, clear sentences and gradually work toward more complex structures and sophisticated vocabulary."
    }
  };

  const insights = sectionInsights[section as keyof typeof sectionInsights];
  if (!insights) return '';

  let text = '';
  
  if (accuracy >= 85) {
    text = insights.high;
  } else if (accuracy >= 65) {
    text = insights.medium;
  } else {
    text = insights.low;
  }

  // Add specific subcategory insights if there are significant differences
  if (subcatEntries.length > 1) {
    const topAccuracy = topSubcat[1].accuracy;
    const weakAccuracy = weakSubcat[1].accuracy;
    
    if (topAccuracy > weakAccuracy + 20) {
      text += ` You show particular strength in ${topSubcat[0]} compared to other areas.`;
    }
    
    if (weakAccuracy < accuracy - 15 && weakAccuracy < 70) {
      text += ` Consider focusing additional practice on ${weakSubcat[0]} to balance your skills.`;
    }
  }

  return text;
};

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

  // Calculate accuracies and generate text
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

    // Generate text analysis for sections with questions
    if (sectionAnalysis.totalQuestions > 0) {
      sectionAnalysis.text = generateSectionText(section, sectionAnalysis);
    }
  });

  return analysisData;
};