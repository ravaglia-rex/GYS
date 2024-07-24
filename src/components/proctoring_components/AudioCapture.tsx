import React, { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { SAMPLE_RATE, SAMPLE_SIZE, AUDIO_RATE } from '../../constants/constants';

import { pushAudioData } from '../../functions/object_storage/push_audio_data';

import { useDispatch } from 'react-redux';
import { cleanupAudioCaptureResources } from '../../state_data/audioCaptureSlice';
import { cleanupFrameResources } from '../../state_data/frameCaptureSlice';
import { useToast } from '../ui/use-toast';
import { auth } from '../../firebase/firebase';
import * as Sentry from '@sentry/react';

const AudioCapture: React.FC = () => {
  const { toast } = useToast();
  const [audiostream, setAudioStream] = useState<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioData = useRef<ArrayBuffer[]>([]);
  const dispatch = useDispatch();
  const exam_id = localStorage.getItem('currentFormId') || "<UNKNOWN_FORM_ID>";
  const navigate = useNavigate();

  useEffect(() => {
    if(exam_id === "") return;
    startRecording();

    return () => {
      audioData.current = [];
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (audiostream) {
        audiostream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam_id]);

  const startRecording = async () => {
    try {
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }  
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: SAMPLE_RATE, sampleSize: SAMPLE_SIZE } });
      setAudioStream(audioStream);
      const mime_types = ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4"].filter(MediaRecorder.isTypeSupported);
      if (mime_types.length === 0) {
        console.error("Browser not supported for audio recording.");
        dispatch(cleanupAudioCaptureResources());
        dispatch(cleanupFrameResources());
        Sentry.withScope((scope) => {
          scope.setTag('location', 'AudioCapture.startRecording');
          Sentry.captureException(new Error('Browser not supported for audio recording.'));
        });
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
        if (event.data.size > 0) {
          let audio_buffer = await event.data.arrayBuffer();
          if(audioData.current.length <= 2) {
            audioData.current.push(audio_buffer);
          }
          else{
            audioData.current[1] = audio_buffer;
          }
          pushAudioData(auth?.currentUser?.uid||'11111', exam_id, new Date().toISOString(), audioData.current);
        }
      });

      recorderRef.current.start(AUDIO_RATE);
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'AudioCapture.startRecording');
        Sentry.captureException(error);
      });
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

  return (
    null
  );
};

export default AudioCapture;