import React, { useState, useEffect } from "react";
import FrameCapture from "../../components/FrameCapture";
import AudioCapture from "../../components/AudioCapture";
import InternetSpeedTest from "../../components/InternetSpeedTest";
import TabSwitchingMonitor from "../../components/TabSwitchingMonitor";
import FormEmbedding from "../../components/tally/FormEmbedding";
import BigSpinner from "../../components/BigSpinner";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../state_data/reducer";
import { setLoadState } from '../../state_data/loadSlice';

const TestingPage: React.FC = () => {
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
    }
    setIsBuffering(false);
  }, [storedIsProctored, storedExamDuration]);

  useEffect(() => {
    if (!isProctored) {
      dispatch(setLoadState(false));
    }
  }, [isProctored, dispatch]);

  return (
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
  );
};

export default TestingPage;
