import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { cleanupAudioCaptureResources } from '../../state_data/audioCaptureSlice';
import { cleanupFrameResources } from '../../state_data/frameCaptureSlice';
import { auth } from '../../firebase/firebase';
import { createSubmissionRecord } from '../../db/studentSubmissionMapping';
import { markExamComplete } from '../../db/studentExamMappings';

declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void;
    };
  }
}

interface FormEmbeddingProps {
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
}

const FormEmbedding: React.FC<FormEmbeddingProps> = ({setSubmitted}) => {
  const loading = useSelector((state: RootState) => state.load.loading);
  const dispatch = useDispatch();
  const exam_id = localStorage.getItem('currentFormId') || "<UNKNOWN_FORM_ID>";

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
      script.onload = load;
      script.onerror = load;
      document.body.appendChild(script);
      return;
    }
  }, [loading, exam_id]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (typeof e.data === 'string' && e.data.includes('Tally.FormSubmitted')) {
        try {
          const data = JSON.parse(e.data);
          const student_uid = auth.currentUser?.uid||"<UNKNOWN_USER_ID>";
          const submission_id = data.payload.id;
          const submission_time = data.payload.createdAt;
          const form_id = data.payload.formId;
          setSubmitted(true);
          
          await createSubmissionRecord({
            student_uid,
            submission_id,
            form_id,
            submission_time,
          });

          await markExamComplete(student_uid, form_id);

          dispatch(cleanupAudioCaptureResources());
          dispatch(cleanupFrameResources());
        } catch (error) {
          console.error('Error parsing message data:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <div>
      {!loading && exam_id && (
        <iframe 
          data-tally-src={`https://tally.so/embed/${exam_id}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`}
          loading="lazy"
          width="100%"
          height="216"
          frameBorder={0}
          marginHeight={0}
          marginWidth={0}
          title="Argus Talent Exam"
        >
        </iframe>
      )}
    </div>
  );
}

export default FormEmbedding;
