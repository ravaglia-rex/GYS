import React from "react";
import FrameCapture from "../FrameCapture";
import AudioCapture from "../AudioCapture";
import InternetSpeedTest from "../InternetSpeedTest";
import TabSwitchingMonitor from "../TabSwitchingMonitor";
import FormEmbedding from "../tally/FormEmbedding";

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