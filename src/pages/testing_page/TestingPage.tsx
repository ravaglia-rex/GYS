import React from "react";
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

  return (
    <div>
      <FrameCapture />
      <AudioCapture />
      <InternetSpeedTest />
      <TabSwitchingMonitor />
      {loading? <BigSpinner />:<FormEmbedding />}
    </div>
  );
};

export default TestingPage;