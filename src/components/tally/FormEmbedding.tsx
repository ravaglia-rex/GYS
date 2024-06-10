import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { cleanupAudioCaptureResources } from '../../state_data/audioCaptureSlice';
import { cleanupFrameResources } from '../../state_data/frameCaptureSlice';

declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void;
    };
  }
}

const FormEmbedding: React.FC = () => {
  const loading = useSelector((state: RootState) => state.load.loading);
  const dispatch = useDispatch();
  const exam_id = useSelector((state: RootState) => state.examDetails.examId);

  useEffect(() => {
    const widgetScriptSrc = 'https://tally.so/widgets/embed.js';

    const load = () => {
      // Load Tally embeds
      if (window.Tally) {
        window.Tally.loadEmbeds();
        return;
      }

      // Fallback if window.Tally is not available
      document
        .querySelectorAll<HTMLIFrameElement>('iframe[data-tally-src]:not([src])')
        .forEach((iframeEl) => {
          if (iframeEl.dataset.tallySrc) {  // Make sure dataset.tallySrc exists
            iframeEl.src = iframeEl.dataset.tallySrc;  // Properly set src from dataset
          }
        });
    };

    // If Tally is already loaded, load the embeds
    if (window.Tally) {
      load();
      return;
    }

    // If the Tally widget script is not loaded yet, load it
    if (document.querySelector(`script[src="${widgetScriptSrc}"]`) === null) {
      const script = document.createElement('script');
      script.src = widgetScriptSrc;
      script.onload = load;
      script.onerror = load;
      document.body.appendChild(script);
      return;
    }
  }, [loading, exam_id]); // Depend on the loading state and exam_id

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === 'string' && e.data.includes('Tally.FormSubmitted')) {
        try {
          const payload = JSON.parse(e.data).payload;
          console.log('Form submitted:', payload);
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
          title="GYS - Preliminary Exam"
        >
        </iframe>
      )}
    </div>
  );
}

export default FormEmbedding;
