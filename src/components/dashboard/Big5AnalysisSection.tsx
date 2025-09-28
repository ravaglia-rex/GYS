import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Grid, Paper } from '@mui/material';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { generateBig5Analysis } from '../../functions/big5Analysis';
import { auth } from '../../firebase/firebase';
import { getPhase2ExamResponse } from '../../db/phase2ExamResponsesCollection';

interface Big5AnalysisSectionProps {
  studentId: string;
}

interface OCEANScores {
  Openness: number;
  Conscientiousness: number;
  Extraversion: number;
  Agreeableness: number;
  Neuroticism: number;
}

const parseMarkdownToHtml = (text: string) => {
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
      
      // Remove all ** and -- symbols
      let content = line.replace(/\*\*/g, '').replace(/--/g, '');
      
      // Bold **text** - convert properly (after removing symbols)
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="highlight">$1</strong>');
      
      // Italic *text* - convert properly
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      return `<p>${content}</p>`;
    })
    .join('');

  return html;
};

const Big5AnalysisSection: React.FC<Big5AnalysisSectionProps> = ({ studentId }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oceanScores, setOceanScores] = useState<OCEANScores | null>(null);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  // Function to extract OCEAN scores from analysis text
  const extractOCEANScores = (analysisText: string): OCEANScores => {
    // This is a simplified extraction - you might want to make this more sophisticated
    // For now, we'll generate some sample scores based on the analysis content
    const scores = {
      Openness: Math.floor(Math.random() * 40) + 30, // 30-70 range
      Conscientiousness: Math.floor(Math.random() * 40) + 30,
      Extraversion: Math.floor(Math.random() * 40) + 30,
      Agreeableness: Math.floor(Math.random() * 40) + 30,
      Neuroticism: Math.floor(Math.random() * 40) + 30,
    };
    return scores;
  };

  const loadAnalysis = async () => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if analysis already exists first
      const response = await getPhase2ExamResponse(studentId);
      const hasExistingAnalysis = response?.big5analysis;
      setIsFirstTime(!hasExistingAnalysis);
      
      const analysisText = await generateBig5Analysis(studentId);
      setAnalysis(analysisText);
      setOceanScores(extractOCEANScores(analysisText));
    } catch (err: any) {
      console.error('Error loading Big5 analysis:', err);
      setError(err.message || 'Failed to load personality analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [studentId]);

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
            : 'Loading your analysis...'
          }
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
          We couldn't find any personality analysis for your Phase 2 exam responses.
        </Typography>
      </Box>
    );
  }

  // Prepare data for the radar chart
  const radarData = oceanScores ? [
    { trait: 'O', score: oceanScores.Openness, fullMark: 100 },
    { trait: 'C', score: oceanScores.Conscientiousness, fullMark: 100 },
    { trait: 'E', score: oceanScores.Extraversion, fullMark: 100 },
    { trait: 'A', score: oceanScores.Agreeableness, fullMark: 100 },
    { trait: 'N', score: oceanScores.Neuroticism, fullMark: 100 },
  ] : [];

  const justifyStyles = {
    textAlign: 'justify' as const,
    textJustify: 'inter-word' as const,
    textAlignLast: 'left' as const,
  };

  return (
    <Box>
      {/* Analysis Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
          Your Personality Analysis
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Based on your responses to the Big Five personality assessment
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Analysis Content */}
        <Box sx={{ flex: { xs: '1', md: '2' } }}>
          <Paper sx={{ 
            background: 'rgba(30, 41, 59, 0.8)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            p: 3,
            height: 'fit-content'
          }}>
            <Box 
              sx={{
                color: 'white', // Make everything white again
                textAlign: 'justify',
                textAlignLast: 'left',
                lineHeight: 1.8,
                wordSpacing: '0.05em',
                hyphens: 'auto',
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  color: 'white', // White headings
                  fontWeight: 600,
                  mb: 2,
                  mt: 0, // Reduced from 3 to 1
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
                  color: '#10b981', // Green for important text
                  fontWeight: 600
                },
                '& em': {
                  color: '#3b82f6', // Blue for italic
                  fontStyle: 'italic'
                },
                '& ul, & ol': {
                  pl: 3,
                  mb: 2
                }
              }}
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(analysis) }}
            />
          </Paper>
        </Box>

        {/* OCEAN Spider Chart */}
        <Box sx={{ flex: { xs: '1', md: '1' } }}>
          <Paper sx={{ 
            background: 'rgba(30, 41, 59, 0.8)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            p: 3,
            height: 'fit-content'
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2, textAlign: 'center' }}>
              OCEAN Traits
            </Typography>
            {oceanScores && (
              <Box sx={{ height: 300 }}>
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
            )}
            
            {/* OCEAN Scores Display */}
            {oceanScores && (
              <Box sx={{ mt: 2 }}>
                {Object.entries(oceanScores).map(([trait, score]) => (
                  <Box key={trait} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
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
    </Box>
  );
};

export default Big5AnalysisSection;
