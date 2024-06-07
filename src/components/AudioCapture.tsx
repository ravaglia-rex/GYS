import React, { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { SAMPLE_RATE, SAMPLE_SIZE, AUDIO_RATE } from '../constants/constants';

import { pushAudioData } from '../functions/object_storage/push_audio_data';

import { useDispatch } from 'react-redux';
import { setAudioCaptureSlice, cleanupAudioCaptureResources } from '../state_data/audioCaptureSlice';
import { cleanupFrameResources } from '../state_data/frameCaptureSlice';
import { useToast } from './ui/use-toast';

const AudioCapture: React.FC = () => {
  const workerRef = useRef<Worker>();
  const { toast } = useToast();
  const [audiostream, setAudioStream] = useState<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const isModelLoaded = useRef<boolean>(false); // Track model loading
  const audioData = useRef<ArrayBuffer[]>([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    workerRef.current = new Worker(new URL('../audio_flagging_modules/audioWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'modelLoaded') {
        isModelLoaded.current = true;
        startRecording();
      } else if (event.data.type === 'prediction') {
      } else if (event.data.type === 'error') {
        console.error(event.data.message);
        // evict the user to the error page and stop all recording; for this we'll also need to stop recording the video feed
        dispatch(cleanupAudioCaptureResources());
        dispatch(cleanupFrameResources());
        toast({
          variant: 'destructive',
          title: 'Audio Error',
          description: event.data.message,
        });
        navigate('/audio_error');
      }
    };

    // Load the model on component mount
    workerRef.current.postMessage({ type: 'loadModel' });

    return () => {
      workerRef.current?.terminate();
      audioData.current = [];
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
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }  
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: SAMPLE_RATE, sampleSize: SAMPLE_SIZE } });
      setAudioStream(audioStream);

      dispatch(setAudioCaptureSlice({ audioWorker: workerRef.current, audioStream }));
      const mime_types = ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4"].filter(MediaRecorder.isTypeSupported);
      if (mime_types.length === 0) {
        console.error("Browser not supported for audio recording.");
        dispatch(cleanupAudioCaptureResources());
        dispatch(cleanupFrameResources());
        toast({
          variant: 'destructive',
          title: 'Audio Error',
          description: 'Browser not supported for audio recording.'
        });
        navigate('/audio_error');
        return;
      }
      const recorder = new MediaRecorder(audioStream, { mimeType: mime_types[0] });
      recorderRef.current = recorder;

      recorderRef.current.addEventListener('dataavailable', async (event) => {
        if (event.data.size > 0 && workerRef.current) {
          let audio_buffer = await event.data.arrayBuffer();
          if(audioData.current.length <= 2) {
            audioData.current.push(audio_buffer);
          }
          else{
            audioData.current[1] = audio_buffer;
          }
          // decodeAudioData(audioData.current).then((decodedData) => {
          //   workerRef.current?.postMessage({ type: 'predict', audioData: decodedData });
          // });
          pushAudioData('11111', 'abcd', new Date().toISOString(), audioData.current);
        }
      });

      recorderRef.current.start(AUDIO_RATE);
    } catch (error) {
      console.error('Error accessing the microphone:', error);
      dispatch(cleanupAudioCaptureResources());
      dispatch(cleanupFrameResources());
      toast({
        variant: 'destructive',
        title: 'Audio Error',
        description: 'Error accessing the microphone.'
      });
      navigate('/audio_error');
    }
  };

  // const decodeAudioData = async (audioData: ArrayBuffer[]): Promise<Float32Array> => {
  //   const audio_context = new AudioContext({ sampleRate: 16000 });
  //   try {
  //       const decoded_data = await audio_context.decodeAudioData(audioData);
  //       return decoded_data.getChannelData(0);
  //   } catch (error) {
  //       console.error("Failed to decode audio data:", error);
  //       throw error;
  //   }
  // };


  // const stopRecording = () => {
  //   if (recorderRef.current && recorderRef.current.state !== 'inactive') {
  //     recorderRef.current.stop();
  //   }
  //   if (audiostream) {
  //     audiostream.getTracks().forEach(track => track.stop());
  //   }
  //   setIsRecording(false);
  //   setAudioStream(null);
  // };

  return (
    // <div>
    //   {isRecording ? <p>Recording...</p> : <p>Ready to record</p>}
    //   {prediction !== -1 && <p>Predicted Class: {prediction}</p>}
    // </div>
    null
  );
};

export default AudioCapture;