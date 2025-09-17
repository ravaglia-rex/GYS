import React, { useState, useEffect } from "react";
import FrameCapture from "../../components/proctoring_components/FrameCapture";
import AudioCapture from "../../components/proctoring_components/AudioCapture";
import InternetSpeedTest from "../../components/proctoring_components/InternetSpeedTest";
import TabSwitchingMonitor from "../../components/proctoring_components/TabSwitchingMonitor";
import Phase2FormEmbedding from "../../components/tally/Phase2FormEmbedding";
import BigSpinner from "../../components/ui/BigSpinner";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../state_data/reducer";
import { setLoadState } from '../../state_data/loadSlice';
import * as Sentry from "@sentry/react";

const TestingPhase2Page: React.FC = () => {
  const loading = useSelector((state: RootState) => state.load.loading);
  const [isBuffering, setIsBuffering] = useState(true);
  const dispatch = useDispatch();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const storedIsProctored = localStorage.getItem('isProctored');
  const storedExamDuration = localStorage.getItem('examDuration');
  const [isProctored, setIsProctored] = useState<boolean>(false);
  const [examDuration, setExamDuration] = useState<number>(0);


  useEffect(() => {
    
    setIsProctored(storedIsProctored === 'true');
    const parseExamDuration = Number(storedExamDuration);
    if(!isNaN(parseExamDuration) && parseExamDuration > 0) {
      setExamDuration(parseExamDuration);
    } else {
    }
    setIsBuffering(false);
    
  }, [storedIsProctored, storedExamDuration]);

  useEffect(() => {
    if (!isProctored) {
      dispatch(setLoadState(false));
    } else {
    }
  }, [isProctored, dispatch]);

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag("location", "TestingPhase2Page");
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
          <>
            <BigSpinner />
          </>
        ) : (
          <>
            <Phase2FormEmbedding setSubmitted={setIsSubmitted} examDuration={examDuration}/>
          </>
        )}
      </div>
    </Sentry.ErrorBoundary>
  );
};

export default TestingPhase2Page;
