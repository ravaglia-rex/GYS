import React, {useState} from "react";
import FrameCapture from "../../components/FrameCapture";
import AudioCapture from "../../components/AudioCapture";
import InternetSpeedTest from "../../components/InternetSpeedTest";
import TabSwitchingMonitor from "../../components/TabSwitchingMonitor";
import FormEmbedding from "../../components/tally/FormEmbedding";
import BigSpinner from "../../components/BigSpinner";
import { useSelector } from "react-redux";
import { RootState } from "../../state_data/reducer";

const TestingPage: React.FC = () => {
  const loading = useSelector((state: RootState) => state.load.loading);
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <div>
      <FrameCapture isSubmitted={isSubmitted}/>
      <AudioCapture />
      <InternetSpeedTest />
      <TabSwitchingMonitor isSubmitted={isSubmitted} />
      {loading? <BigSpinner />:<FormEmbedding setSubmitted={setIsSubmitted}/>}
    </div>
  );
};

export default TestingPage;