import React, { useEffect, useRef, useState } from 'react';

const AudioCapture:React.FC = () => {
  const workerRef = useRef<Worker>();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audiostream, setAudioStream] = useState<MediaStream | null>(null);
  const [prediction, setPrediction] = useState<number>(-1);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const isModelLoaded = useRef<boolean>(false); // Track model loading

  useEffect(() => {
    workerRef.current = new Worker(new URL('../audio_flagging_modules/audioWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (event) => {
      console.log(event.data);
      if (event.data.type === 'modelLoaded') {
        console.log('Model loaded successfully');
        isModelLoaded.current = true;
      } else if (event.data.type === 'prediction') {
        setPrediction(event.data.classIndex);
      } else if (event.data.type === 'error') {
        console.error(event.data.message);
      }
    };

    return () => {
      workerRef.current?.terminate();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (audiostream) {
        audiostream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      // Load the model if it hasn't been loaded yet
      if (!isModelLoaded.current) {
        workerRef.current?.postMessage({ type: 'loadModel' });
      }

      const audioStream = await navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, sampleRate: 16000, sampleSize: 16}});
      const mime_types = ["audio/webm", "audio/mp4"].filter(MediaRecorder.isTypeSupported);
      if (mime_types.length === 0) {
        return alert("Browser not supported for audio recording.");
      }
      setAudioStream(audioStream);
      setIsRecording(true);
      const recorder = new MediaRecorder(audioStream, { mimeType: mime_types[0] });
      recorderRef.current = recorder;

      recorder.addEventListener('dataavailable', async (event) => {
        if (event.data.size > 0 && workerRef.current) {
          let audioData = await event.data.arrayBuffer();
          const byteLength = audioData.byteLength;
          if (byteLength % 4 !== 0) {
            const remainder = byteLength % 4;
            const newByteLength = byteLength - remainder;
            audioData = audioData.slice(0,newByteLength);
          }
          workerRef.current.postMessage({ type: 'predict', audioData });
        }
      });

      recorder.start(3000);
    } catch (error) {
      console.error('Error accessing the microphone:', error);
      alert('Error accessing microphone: ' + error);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (audiostream) {
      audiostream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setAudioStream(null);
  };

  return (
    <div>
      {!isRecording && <button onClick={startRecording}>Start Audio Capture</button>}
      {isRecording && <button onClick={stopRecording}>Stop Audio Capture</button>}
      {prediction !== -1 && <p>Predicted Class: {prediction}</p>}
    </div>
  );
};

export default AudioCapture;
