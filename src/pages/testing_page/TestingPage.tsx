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
  const dispatch = useDispatch();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const storedIsProctored = localStorage.getItem('isProctored');
  const [isProctored, setIsProctored] = useState<boolean>(false);

  useEffect(() => {
    setIsProctored(storedIsProctored === 'true');
  }, [storedIsProctored]);

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
      {loading ? (
        <BigSpinner />
      ) : (
        <FormEmbedding setSubmitted={setIsSubmitted} />
      )}
    </div>
  );
};

export default TestingPage;
