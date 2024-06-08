import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { cleanupAudioCaptureResources } from '../../state_data/audioCaptureSlice';
import { cleanupFrameResources } from '../../state_data/frameCaptureSlice';
import { auth } from '../../firebase/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getSchoolId } from '../../db/studentCollection';
import { getExamId } from '../../db/examMappingCollection';
import { useToast } from '../ui/use-toast';

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
  const [formLink, setFormLink] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFormLink = async () => {
      if (!userId) return;

      try {
        // Fetch school ID based on user ID
        const schoolId = await getSchoolId(userId);

        // Fetch form link based on school ID
        const exam_link = await getExamId(schoolId);
        setFormLink(exam_link);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Form Embedding Error',
          description: error.message,
        });
      }
    };

    fetchFormLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
  }, [loading, formLink]); // Depend on the loading state and formLink

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
      {!loading && formLink && (
        <iframe 
          data-tally-src={formLink}
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
