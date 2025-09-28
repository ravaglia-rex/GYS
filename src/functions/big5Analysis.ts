import { getPhase2ExamResponse, saveBig5Analysis } from '../db/phase2ExamResponsesCollection';

export interface Big5Question {
  questionId: string;
  label: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  selectedValue: string;
  selectedText: string;
  category: {
    main: string;
    sub: string;
  };
}

export const filterBig5Questions = (responseData: any): Big5Question[] => {
  const big5Questions: Big5Question[] = [];
  
  Object.entries(responseData).forEach(([questionId, questionData]: [string, any]) => {
    // Check if this is a Big5 question based on category
    if (questionData.category?.main === 'big5' && 
        questionData.type === 'MULTIPLE_CHOICE' && 
        questionData.label && 
        questionData.options && 
        questionData.value && 
        questionData.value.length > 0) {
      
      const selectedValue = questionData.value[0];
      const selectedOption = questionData.options.find((opt: any) => opt.id === selectedValue);
      
      big5Questions.push({
        questionId,
        label: questionData.label,
        options: questionData.options,
        selectedValue,
        selectedText: selectedOption?.text || 'No response',
        category: questionData.category
      });
    }
  });
  
  return big5Questions;
};

export const generateBig5Analysis = async (studentId: string): Promise<string> => {
  try {
    // Fetch the phase 2 exam response
    const response = await getPhase2ExamResponse(studentId);
    
    if (!response) {
      throw new Error('No phase 2 exam response found for this student');
    }
    
    // Check if analysis already exists
    if (response.big5analysis) {
      return response.big5analysis;
    }
    
    // Filter Big5 questions
    const big5Questions = filterBig5Questions(response.responseData);
    
    if (big5Questions.length === 0) {
      throw new Error('No Big5 personality questions found in the response data');
    }
    
    // Generate analysis using LLM
    const analysis = await callLLMForBig5Analysis(big5Questions);
    
    // Save the analysis to Firebase
    await saveBig5Analysis(response.submissionId, analysis);
    
    return analysis;
  } catch (error) {
    console.error('Error generating Big5 analysis:', error);
    throw error;
  }
};

const callLLMForBig5Analysis = async (big5Questions: Big5Question[]): Promise<string> => {
  try {
    // Group questions by Big5 category
    const questionsByCategory = big5Questions.reduce((acc, q) => {
      const category = q.category.sub;
      if (!acc[category]) acc[category] = [];
      acc[category].push(q);
      return acc;
    }, {} as Record<string, Big5Question[]>);

    // Prepare category-specific analysis
    const categoryAnalyses = Object.entries(questionsByCategory)
      .map(([category, questions]) => {
        const categoryQuestions = questions
          .map((q, index) => `${index + 1}. ${q.label}\n   Answer: ${q.selectedText}`)
          .join('\n\n');
        return `## ${category} Analysis\n\nQuestions:\n${categoryQuestions}`;
      })
      .join('\n\n');

    const prompt = `You are a professional psychologist analyzing personality traits based on the Big Five personality model. 

Please analyze the following personality assessment responses and provide a comprehensive personality analysis report with category-specific insights.

${categoryAnalyses}

Please provide a detailed analysis that includes:
1. Overall personality profile summary
2. Detailed breakdown of each Big Five trait (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
3. Category-specific insights for each trait
4. Strengths and areas for growth
5. Learning style preferences
6. Career and academic recommendations
7. Personal development suggestions

Make the analysis engaging, positive, and actionable for a student. Use a warm, encouraging tone while being professional and insightful.`;

    // Use local URL for development, production URL for production
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    const CLOUD_FUNCTION_URL = isDevelopment 
      ? "http://127.0.0.1:5001/argus-talent-search/asia-south1/generateBig5Analysis"
      : "https://asia-south1-argus-ai-446509.cloudfunctions.net/generateBig5Analysis";

    console.log('Calling Big5 analysis function:', CLOUD_FUNCTION_URL);
    console.log('Request body:', { prompt, max_tokens: 1500 });

    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, max_tokens: 1500 }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from Big5 analysis function:", response.status, errorText);
      return generateFallbackAnalysis(big5Questions);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data.analysis || generateFallbackAnalysis(big5Questions);
  } catch (error) {
    console.error("Error calling LLM for Big5 analysis:", error);
    return generateFallbackAnalysis(big5Questions);
  }
};


const generateFallbackAnalysis = (big5Questions: Big5Question[]): string => {
  // Group questions by category for a more meaningful fallback
  const questionsByCategory = big5Questions.reduce((acc, q) => {
    const category = q.category.sub;
    if (!acc[category]) acc[category] = [];
    acc[category].push(q);
    return acc;
  }, {} as Record<string, Big5Question[]>);

  const categorySummary = Object.entries(questionsByCategory)
    .map(([category, questions]) => {
      const responses = questions.map(q => q.selectedText).join(', ');
      return `**${category}**: ${responses}`;
    })
    .join('\n\n');

  return `# Personality Analysis Report

## Overview
Based on your responses to ${big5Questions.length} personality assessment questions, here's your personalized analysis:

## Your Responses by Category
${categorySummary}

## Key Insights
Your responses reveal interesting patterns about your personality and preferences. While we're working on generating a more detailed AI-powered analysis, here are some initial observations:

## Response Summary
- Total Questions Answered: ${big5Questions.length}
- Assessment Date: ${new Date().toLocaleDateString()}
- Categories Assessed: ${Object.keys(questionsByCategory).length}

## Next Steps
Our advanced AI analysis system is currently being updated. A more detailed personality breakdown will be available soon, including:
- Big Five personality trait analysis
- Learning style preferences  
- Career and academic recommendations
- Personal development suggestions

Thank you for completing the assessment!`;
};
