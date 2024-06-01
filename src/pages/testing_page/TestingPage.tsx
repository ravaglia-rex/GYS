import React from "react";
import FrameCapture from "../../components/FrameCapture";
import AudioCapture from "../../components/AudioCapture";
import InternetSpeedTest from "../../components/InternetSpeedTest";
import TabSwitchingMonitor from "../../components/TabSwitchingMonitor";
import FormEmbedding from "../../components/tally/FormEmbedding";

const TestingPage: React.FC = () => {
  return (
    <div>
      <FrameCapture />
      <AudioCapture />
      <InternetSpeedTest />
      <TabSwitchingMonitor />
      <FormEmbedding />
    </div>
  );
};

export default TestingPage;