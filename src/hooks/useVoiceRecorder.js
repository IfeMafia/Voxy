import { useState, useRef, useCallback } from 'react';

export const useVoiceRecorder = () => {
  const [state, setState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setState('recording');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied or unavailable.');
      setState('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setState('processing');
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const resetState = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return {
    state,
    error,
    startRecording,
    stopRecording,
    resetState,
    isRecording: state === 'recording',
    isProcessing: state === 'processing'
  };
};
