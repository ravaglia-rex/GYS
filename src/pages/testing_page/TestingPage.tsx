import React, { useState, useEffect } from "react";
import FrameCapture from "../../components/proctoring_components/FrameCapture";
import AudioCapture from "../../components/proctoring_components/AudioCapture";
import InternetSpeedTest from "../../components/proctoring_components/InternetSpeedTest";
import TabSwitchingMonitor from "../../components/proctoring_components/TabSwitchingMonitor";
import FormEmbedding from "../../components/tally/FormEmbedding";
import BigSpinner from "../../components/ui/BigSpinner";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../state_data/reducer";
import { setLoadState } from '../../state_data/loadSlice';
import * as Sentry from "@sentry/react";

const TestingPage: React.FC = () => {
  const loading = useSelector((state: RootState) => state.load.loading);
  const [isBuffering, setIsBuffering] = useState(true);
  const dispatch = useDispatch();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Get data from localStorage first, then fallback to URL params
  const urlParams = new URLSearchParams(window.location.search);
  const storedIsProctored = localStorage.getItem('isProctored') || urlParams.get('isProctored');
  const storedExamDuration = localStorage.getItem('examDuration') || urlParams.get('examDuration');
  
  const [isProctored, setIsProctored] = useState<boolean>(false);
  const [examDuration, setExamDuration] = useState<number>(0);

  useEffect(() => {
    // Set form ID if it came from URL params
    if (urlParams.get('formId') && !localStorage.getItem('currentFormId')) {
      localStorage.setItem('currentFormId', urlParams.get('formId') || '');
    }
    
    // Set isProctored if it came from URL params
    if (urlParams.get('isProctored') && !localStorage.getItem('isProctored')) {
      localStorage.setItem('isProctored', urlParams.get('isProctored') || 'false');
    }
    
    // Set exam duration if it came from URL params
    if (urlParams.get('examDuration') && !localStorage.getItem('examDuration')) {
      localStorage.setItem('examDuration', urlParams.get('examDuration') || '60');
    }
    
    setIsProctored(storedIsProctored === 'true');
    const parseExamDuration = Number(storedExamDuration);
    if(!isNaN(parseExamDuration) && parseExamDuration > 0) {
      setExamDuration(parseExamDuration);
    }
    setIsBuffering(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedIsProctored, storedExamDuration]);

  useEffect(() => {
    if (!isProctored) {
      dispatch(setLoadState(false));
    }
  }, [isProctored, dispatch]);

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag("location", "TestingPage");
      }}
    >
      <div>
        {isProctored && !isSubmitted ? (
          <>
            <FrameCapture isSubmitted={isSubmitted} />
            <AudioCapture />
            <InternetSpeedTest />
            <TabSwitchingMonitor isSubmitted={isSubmitted} />
          </>
        ) : null}
        {loading || isBuffering ? (
          <BigSpinner />
        ) : (
          <FormEmbedding setSubmitted={setIsSubmitted} examDuration={examDuration}/>
        )}
      </div>
    </Sentry.ErrorBoundary>
  );
};

export default TestingPage;
