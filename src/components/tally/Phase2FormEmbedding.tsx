import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../state_data/reducer';
import { cleanupAudioCaptureResources } from '../../state_data/audioCaptureSlice';
import { cleanupFrameResources } from '../../state_data/frameCaptureSlice';
import { runPhase2ExamSubmissionTransaction } from '../../db/studentSubmissionMapping';
import { auth } from '../../firebase/firebase';
import * as Sentry from '@sentry/react';
import { resetExamDetails } from '../../state_data/examDetailsSlice';

declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void;
    };
  }
}

interface Phase2FormEmbeddingProps {
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  examDuration: number;
}

const Phase2FormEmbedding: React.FC<Phase2FormEmbeddingProps> = ({ setSubmitted, examDuration }) => {
  const loading = useSelector((state: RootState) => state.load.loading);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const exam_id = localStorage.getItem('currentFormId') || "<UNKNOWN_FORM_ID>";
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(examDuration * 60);


  useEffect(() => {
    const widgetScriptSrc = 'https://tally.so/widgets/embed.js';

    const load = () => {
      if (window.Tally) {
        window.Tally.loadEmbeds();
        return;
      }

      document
        .querySelectorAll<HTMLIFrameElement>('iframe[data-tally-src]:not([src])')
        .forEach((iframeEl) => {
          if (iframeEl.dataset.tallySrc) {
            iframeEl.src = iframeEl.dataset.tallySrc;
          }
        });
    };

    if (window.Tally) {
      load();
      return;
    }

    if (document.querySelector(`script[src="${widgetScriptSrc}"]`) === null) {
      const script = document.createElement('script');
      script.src = widgetScriptSrc;
      script.onload = () => {
        load();
      };
      script.onerror = (error) => {
        load();
      };
      document.body.appendChild(script);
      return;
    } else {
      load();
    }
  }, [loading, exam_id]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      
      if (typeof e.data === 'string' && e.data.includes('Tally.FormSubmitted')) {
        
        try {
          const data = JSON.parse(e.data);
          const student_uid = auth.currentUser?.uid || "<UNKNOWN_USER_ID>";
          const submission_id = data.payload.id;
          const submission_time = data.payload.createdAt;
          const form_id = data.payload.formId;
          

          setSubmitted(true);


          await runPhase2ExamSubmissionTransaction(student_uid, submission_id, form_id, submission_time);


          dispatch(cleanupAudioCaptureResources());
          dispatch(cleanupFrameResources());
          
          setSubmissionComplete(true);
          
          if(document.fullscreenElement){
            document.exitFullscreen();
          }
          
          dispatch(resetExamDetails());
          
        } catch (error) {
          
          Sentry.withScope((scope) => {
            scope.setTag('location', 'Phase2FormEmbedding.handleMessage');
            scope.setExtra('messageData', e.data);
            scope.setExtra('user', auth.currentUser);
            scope.setExtra('exam_id', exam_id);
            Sentry.captureException(error);
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev > 0) {
          return prev - 1;
        } else {
          clearInterval(interval);
          return 0;
        }
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [examDuration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };


  return (
    <div>
      {!loading && exam_id && (
        <>
          <iframe 
            data-tally-src={`https://tally.so/embed/${exam_id}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`}
            loading="lazy"
            width="100%"
            height="216"
            frameBorder={0}
            marginHeight={0}
            marginWidth={0}
            title="Argus Talent Assessment - Phase 2"
          >
          </iframe>
        </>
      )}
      <div id="timerContainer" style={{ position: 'fixed', top: '10px', right: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="40px" height="40px"><path d="M12 1C5.924 1 1 5.924 1 12s4.924 11 11 11 11-4.924 11-11S18.076 1 12 1zm0 20c-4.963 0-9-4.037-9-9s4.037-9 9-9 9 4.037 9 9-4.037 9-9 9zm.5-13H11v7h5v-1.5h-3.5z"/></svg>
        <table id="timerTable" style={{ fontSize: '45px', color: timeRemaining <= examDuration*6? 'red' : 'black', fontFamily: 'Arial', fontWeight: 'bold', border: '0px solid black', textAlign: 'center' }}>
          <tr>
            <td>{formatTime(timeRemaining)}</td>
          </tr>
        </table>
      </div>
      {submissionComplete && (
        <>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Phase 2 assessment submitted successfully! You can now navigate to the dashboard.</p>
            <button 
              onClick={() => {
                navigate('/dashboard');
              }} 
              style={{ 
                padding: '10px 20px', 
                fontSize: '16px', 
                backgroundColor: '#007BFF', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer' 
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Phase2FormEmbedding;
