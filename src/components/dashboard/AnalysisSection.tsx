// argus-frontend/src/components/dashboard/AnalysisSection.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Calculate as CalculateIcon,
  MenuBook as MenuBookIcon,
  Edit as EditIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { generateBig5Analysis } from '../../functions/big5Analysis';
import { computeSectionAnalysis } from '../../functions/sectionAnalysis';
import { getPhase2ExamResponse } from '../../db/phase2ExamResponsesCollection';
import { getPhase2Analysis, createPhase2Analysis } from '../../db/phase2AnalysisCollection';

interface AnalysisSectionProps {
  studentId: string;
}

interface OCEANScores {
  Openness: number;
  Conscientiousness: number;
  Extraversion: number;
  Agreeableness: number;
  Neuroticism: number;
}


const sectionIcons = {
  big5: <PsychologyIcon />,
  logic: <LightbulbIcon />,
  math: <CalculateIcon />,
  reading: <MenuBookIcon />,
  writing: <EditIcon />
};

const sectionColors = {
  big5: '#8b5cf6',
  logic: '#f59e0b',
  math: '#ef4444',
  reading: '#10b981',
  writing: '#3b82f6'
};

const parseMarkdownToHtml = (text: string) => {
  console.log('🔍 Full analysis text:', text);
  
  // Remove the main title line
  const lines = text.split('\n');
  const filteredLines = lines.filter(line => 
    !line.trim().startsWith('# Comprehensive Personality Analysis Report')
  );
  const filteredText = filteredLines.join('\n');

  // Split by single newlines first to handle line breaks properly
  let html = filteredText
    .split(/\n/)
    .map(line => {
      line = line.trim();
      
      console.log('🔍 Processing line:', line);
      
      // Skip empty lines
      if (!line) return '<br/>';
      
      // Headings
      if (/^#{1,6}\s/.test(line)) {
        const level = line.match(/^#{1,6}/)![0].length;
        const content = line.replace(/^#{1,6}\s/, '');
        return `<h${level}>${content}</h${level}>`;
      }
      
      // Lists
      if (/^[-*]\s/.test(line)) {
        return `<li>${line.replace(/^[-*]\s/, '')}</li>`;
      }
      
      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        return `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
      }
      
      // Check for section headings at the start of lines and make them bold
      const sectionHeadings = [
        'Overall Personality Profile Summary:',
        'OCEAN Traits Analysis:',
        'Key Strengths:',
        'Areas for Growth:',
        'Personal Development Suggestions:',
        'Conclusion:'
      ];
      
      for (const heading of sectionHeadings) {
        if (line.startsWith(heading)) {
          console.log('🎯 Found matching heading:', heading);
          // Extract the heading and the rest of the content
          const remainingText = line.substring(heading.length).trim();
          return `<p><strong style="color: #10b981; font-weight: 600; font-size: 1rem; margin-bottom: 8px; margin-top: 16px;">${heading}</strong> ${remainingText}</p>`;
        }
      }
      
      // Remove all ** and -- symbols
      let content = line.replace(/\*\*/g, '').replace(/--/g, '');
      
      // Bold **text** - convert properly (after removing symbols)
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="highlight">$1</strong>');
      
      // Italic *text* - convert properly
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      return `<p>${content}</p>`;
    })
    .join('');

  console.log('🔍 Final HTML:', html);
  return html;
};

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ studentId }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [oceanScores, setOceanScores] = useState<OCEANScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    big5: false, // Changed from true to false
    logic: false,
    math: false,
    reading: false,
    writing: false
  });

  // Updated function to extract OCEAN scores from typeTotals.big5 and convert to percentages
  const extractOCEANScoresFromTypeTotals = (typeTotals: any): OCEANScores | null => {
    if (!typeTotals?.big5) {
      return null;
    }

    const big5Scores = typeTotals.big5;
    const maxScore = 20; // Changed from 16 to 20 since each trait is out of 20
    
    return {
      Openness: Math.round((big5Scores.openness || 0) / maxScore * 100),
      Conscientiousness: Math.round((big5Scores.conscientiousness || 0) / maxScore * 100),
      Extraversion: Math.round((big5Scores.extraversion || 0) / maxScore * 100),
      Agreeableness: Math.round((big5Scores.agreeableness || 0) / maxScore * 100),
      Neuroticism: Math.round((big5Scores.neuroticism || 0) / maxScore * 100),
    };
  };

  const loadAnalysis = async () => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Always get the fresh Phase 2 exam response first to get current scores
      const response = await getPhase2ExamResponse(studentId);
      if (!response) {
        throw new Error('No Phase 2 exam response found');
      }
      
      // Extract OCEAN scores from typeTotals (this is the source of truth)
      const scoresFromTypeTotals = extractOCEANScoresFromTypeTotals(response?.typeTotals);
      
      if (scoresFromTypeTotals) {
        setOceanScores(scoresFromTypeTotals);
      } else {
        // Fallback scores
        const fallbackScores = {
          Openness: 50,
          Conscientiousness: 60,
          Extraversion: 55,
          Agreeableness: 45,
          Neuroticism: 40,
        };
        setOceanScores(fallbackScores);
      }
      
      // Check if we have existing analysis
      let analysisData = await getPhase2Analysis(studentId);
      
      if (!analysisData) {
        // Check for existing Big5 analysis
        const hasExistingAnalysis = response?.big5analysis;
        setIsFirstTime(!hasExistingAnalysis);
        
        // Compute section analysis from response data
        const computedAnalysis = computeSectionAnalysis(response.responseData);
        
        // Generate Big 5 analysis
        const big5AnalysisText = await generateBig5Analysis(studentId);
        computedAnalysis.big5Analysis = { 
          text: big5AnalysisText,
          oceanScores: scoresFromTypeTotals || {
            Openness: 50,
            Conscientiousness: 60,
            Extraversion: 55,
            Agreeableness: 45,
            Neuroticism: 40,
          }
        };
        
        // Double-check that no analysis was created in the meantime (race condition protection)
        const existingAnalysisCheck = await getPhase2Analysis(studentId);
        if (!existingAnalysisCheck) {
          // Create analysis record with all data at once
          analysisData = await createPhase2Analysis(studentId, response.submissionId, computedAnalysis);
        } else {
          analysisData = existingAnalysisCheck;
        }
      } else {
        // Analysis already exists, but we still use fresh scores from response
        setIsFirstTime(false);
      }
      
      setAnalysis(analysisData);
      
    } catch (err: any) {
      console.error('Error loading analysis:', err);
      setError(err.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderSectionAnalysis = (sectionKey: string, sectionData: any) => {
    if (!sectionData || sectionData.totalQuestions === 0) {
      return (
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
          No questions found for this section
        </Typography>
      );
    }

  // const getPerformanceText = (accuracy: number, sectionKey: string) => {
  //   if (accuracy >= 90) {
  //     return `Excellent performance in ${sectionKey}! You demonstrate strong mastery of the concepts.`;
  //   } else if (accuracy >= 80) {
  //     return `Very good performance in ${sectionKey}. You show solid understanding with room for continued improvement.`;
  //   } else if (accuracy >= 70) {
  //     return `Good performance in ${sectionKey}. You have a decent grasp of the material and can build upon this foundation.`;
  //   } else if (accuracy >= 60) {
  //     return `Satisfactory performance in ${sectionKey}.`;
  //   } else {
  //     return `Keep working on improving your skills in ${sectionKey}.`;
  //   }
  // };

    return (
      <Box>
        {/* Section Text Analysis */}
        {sectionData.text && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
            <Typography variant="body1" sx={{ color: 'white', lineHeight: 1.6 }}>
              {sectionData.text}
            </Typography>
          </Box>
        )}

        {/* Overall Performance Text */}
        {/* <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
          <Typography variant="body1" sx={{ color: 'white', lineHeight: 1.6 }}>
            {getPerformanceText(sectionData.accuracy, sectionKey)}
          </Typography>
        </Box> */}

        {/* Overall Performance Stats */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Overall Performance
            </Typography>
            <Chip 
              label={`${sectionData.accuracy}%`}
              sx={{ 
                backgroundColor: sectionData.accuracy >= 80 ? '#10b981' : 
                                sectionData.accuracy >= 60 ? '#f59e0b' : '#ef4444',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={sectionData.accuracy} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: sectionData.accuracy >= 80 ? '#10b981' : 
                                sectionData.accuracy >= 60 ? '#f59e0b' : '#ef4444'
              }
            }}
          />
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
            {sectionData.correctAnswers} out of {sectionData.totalQuestions} questions correct
          </Typography>
        </Box>

        {/* Subcategories */}
        {Object.keys(sectionData.subcategories).length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Performance by Topic
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              {Object.entries(sectionData.subcategories).map(([subcategory, data]: [string, any]) => (
                <Paper 
                  key={subcategory}
                  sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                      {subcategory}
                    </Typography>
                    <Chip 
                      label={`${data.accuracy}%`}
                      size="small"
                      sx={{ 
                        backgroundColor: data.accuracy >= 80 ? '#10b981' : 
                                        data.accuracy >= 60 ? '#f59e0b' : '#ef4444',
                        color: 'white'
                      }}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.accuracy} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: data.accuracy >= 80 ? '#10b981' : 
                                        data.accuracy >= 60 ? '#f59e0b' : '#ef4444'
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 1 }}>
                    {data.correct} out of {data.total} questions
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderBig5Analysis = () => {
    if (!analysis?.big5Analysis?.text) return null;

    // Prepare data for the radar chart
    const radarData = oceanScores ? [
      { trait: 'O', score: oceanScores.Openness, fullMark: 100 },
      { trait: 'C', score: oceanScores.Conscientiousness, fullMark: 100 },
      { trait: 'E', score: oceanScores.Extraversion, fullMark: 100 },
      { trait: 'A', score: oceanScores.Agreeableness, fullMark: 100 },
      { trait: 'N', score: oceanScores.Neuroticism, fullMark: 100 },
    ] : [];

    return (
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Analysis Content */}
        <Box sx={{ flex: { xs: '1', md: '2' } }}>
          <Paper sx={{ 
            background: 'rgba(30, 41, 59, 0.8)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            p: 2,
            height: 'fit-content'
          }}>
            <Box 
              sx={{
                color: 'white',
                textAlign: 'justify',
                textAlignLast: 'left',
                lineHeight: 1.8,
                wordSpacing: '0.05em',
                hyphens: 'auto',
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  color: 'white',
                  fontWeight: 600,
                  mb: 2,
                  mt: 0,
                  textAlign: 'left'
                },
                '& p': {
                  color: 'white',
                  fontSize: '0.95rem',
                  mb: 0.1,
                  textAlign: 'justify',
                  textAlignLast: 'left',
                  lineHeight: 1.8
                },
                '& li': {
                  textAlign: 'justify',
                  textAlignLast: 'left',
                  lineHeight: 1.6,
                  mb: 0.1,
                  fontSize: '0.9rem',
                  fontWeight: 400,
                  color: 'white'
                },
                '& strong.highlight': {
                  color: '#10b981',
                  fontWeight: 600
                },
                '& em': {
                  color: '#3b82f6',
                  fontStyle: 'italic'
                },
                '& ul, & ol': {
                  pl: 3,
                  mb: 2
                }
              }}
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(analysis.big5Analysis.text) }}
            />
          </Paper>
        </Box>

        {/* OCEAN Spider Chart */}
        <Box sx={{ flex: { xs: '1', md: '1' } }}>
          <Paper sx={{ 
            background: 'rgba(30, 41, 59, 0.8)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            p: 1.5,
            height: 'fit-content'
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 0.5, textAlign: 'center' }}>
              OCEAN Traits
            </Typography>
            
            {oceanScores ? (
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                    <PolarAngleAxis 
                      dataKey="trait" 
                      tick={{ fill: 'white', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  No OCEAN scores available
                </Typography>
              </Box>
            )}
            
            {/* OCEAN Scores Display */}
            {oceanScores && (
              <Box sx={{ mt: 0.5 }}>
                {Object.entries(oceanScores).map(([trait, score]) => (
                  <Box key={trait} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {trait}:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                      {score}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2,
        py: 4
      }}>
        <CircularProgress size={40} sx={{ color: '#8b5cf6' }} />
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          {isFirstTime === true 
            ? 'Getting analysis, please wait 1-2 minutes...' 
            : 'Analyzing your exam performance...'
          }
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', maxWidth: 400 }}>
          This comprehensive analysis can take a few minutes to load. Please wait while we process your responses and create detailed insights.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        background: 'rgba(239, 68, 68, 0.1)', 
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 2,
        p: 3,
        mb: 3
      }}>
        <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 600, mb: 2 }}>
          Analysis Error
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!analysis) {
    return (
      <Box sx={{ 
        background: 'rgba(59, 130, 246, 0.1)', 
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 2,
        p: 3,
        textAlign: 'center'
      }}>
        <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600, mb: 2 }}>
          No Analysis Available
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          We couldn't find any analysis for your Phase 2 exam responses.
        </Typography>
      </Box>
    );
  }

  const sections = [
    { key: 'big5', title: 'Personality Analysis', data: analysis.big5Analysis },
    { key: 'logic', title: 'Logic & Reasoning', data: analysis.logicAnalysis },
    { key: 'math', title: 'Mathematics', data: analysis.mathAnalysis },
    { key: 'reading', title: 'Reading Comprehension', data: analysis.readingAnalysis },
    { key: 'writing', title: 'Writing Skills', data: analysis.writingAnalysis }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
          Comprehensive Exam Analysis
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Detailed insights into your performance across all exam sections
        </Typography>
      </Box>

      {/* Analysis Sections */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sections.map(({ key, title, data }) => (
          <Accordion
            key={key}
            expanded={expandedSections[key]}
            onChange={() => handleSectionToggle(key)}
            sx={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0 }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                  gap: 2
                }
              }}
            >
              <Box sx={{ color: sectionColors[key as keyof typeof sectionColors], display: 'flex', alignItems: 'center', gap: 1 }}>
                {sectionIcons[key as keyof typeof sectionIcons]}
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {title}
                </Typography>
              </Box>
              {key !== 'big5' && data && (
                <Chip 
                  label={`${data.accuracy || 0}%`}
                  sx={{ 
                    backgroundColor: (data.accuracy || 0) >= 80 ? '#10b981' : 
                                    (data.accuracy || 0) >= 60 ? '#f59e0b' : '#ef4444',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              )}
            </AccordionSummary>
            <AccordionDetails>
              {key === 'big5' ? (
                // Big 5 Analysis with OCEAN spider chart
                renderBig5Analysis()
              ) : (
                // Section Analysis
                renderSectionAnalysis(key, data)
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default AnalysisSection;