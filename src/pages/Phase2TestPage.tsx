import React, { useState } from 'react';
import { runPhase2ExamSubmissionTransaction } from '../db/studentSubmissionMapping';

const Phase2TestPage: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testPhase2Submission = async () => {
    setIsLoading(true);
    setTestResult('🧪 Testing Phase 2 submission...');
    
    try {
      const result = await runPhase2ExamSubmissionTransaction(
        "test_student_123",
        "test_submission_456",
        "test_form_789",
        new Date().toISOString()
      );
      
      setTestResult(`✅ Success: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`❌ Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>�� Phase 2 Submission Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>This page tests the Phase 2 exam submission functionality.</p>
        <p>Click the button below to test the submission.</p>
      </div>

      <button 
        onClick={testPhase2Submission}
        disabled={isLoading}
        style={{ 
          padding: '15px 30px', 
          fontSize: '16px',
          backgroundColor: isLoading ? '#ccc' : '#007BFF', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isLoading ? '🔄 Testing...' : '🧪 Test Phase 2 Submission'}
      </button>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        minHeight: '100px'
      }}>
        {testResult || 'Click the button above to start testing...'}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>What This Tests:</h3>
        <ul>
          <li>✅ Function import and accessibility</li>
          <li>✅ API call construction</li>
          <li>✅ Authentication flow</li>
          <li>✅ Backend communication</li>
          <li>✅ Error handling</li>
        </ul>
      </div>
    </div>
  );
};

export default Phase2TestPage;