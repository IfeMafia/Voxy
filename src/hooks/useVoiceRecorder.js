import { useState, useRef, useCallback } from 'react';

export const useVoiceRecorder = (options = {}) => {
  const [state, setState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  
  // VAD Refs
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceStartRef = useRef(null);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const finalMimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        audioChunksRef.current = [];
        
        // Cleanup VAD and streams
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(console.error);
          audioContextRef.current = null;
        }
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

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // --- Mobile Safari / HTTP Polyfill & Checks ---
      if (typeof window !== 'undefined') {
        if (!navigator.mediaDevices) {
          navigator.mediaDevices = {};
        }
        if (!navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia = function(constraints) {
            const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.getUserMedia;
            if (!getUserMedia) {
              return Promise.reject(new Error('Browser API missing. Ensure you are on HTTPS.'));
            }
            return new Promise((resolve, reject) => {
              getUserMedia.call(navigator, constraints, resolve, reject);
            });
          };
        }
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported. Please ensure you are using a secure connection (HTTPS).');
      }

      // Explicit constraints often help mobile browsers prompt
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      streamRef.current = stream;
      
      // Determine the best MIME type for iOS Safari compatibility
      const mimeType = (typeof window.MediaRecorder !== 'undefined' && window.MediaRecorder.isTypeSupported)
        ? (window.MediaRecorder.isTypeSupported('audio/webm') 
            ? 'audio/webm' 
            : window.MediaRecorder.isTypeSupported('audio/mp4') 
              ? 'audio/mp4' 
              : '')
        : '';

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setState('recording');
      
      // Initialize Voice Activity Detection (VAD)
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        silenceStartRef.current = null; // reset
        
        const checkSilence = () => {
          if (mediaRecorderRef.current?.state !== 'recording') return;
          
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const avg = sum / dataArray.length;
          
          if (avg < 15) { // 15 is a standard noise floor threshold
            if (!silenceStartRef.current) {
              silenceStartRef.current = Date.now();
            } else if (Date.now() - silenceStartRef.current > 2000) {
              // 2 seconds of absolute silence reached!
              stopRecording().then(blob => {
                 if (blob && options.onAutoStop) {
                    options.onAutoStop(blob);
                 }
              });
              return; // End loop
            }
          } else {
            silenceStartRef.current = null; // Activity detected, reset silence timer
          }
          animationFrameRef.current = requestAnimationFrame(checkSilence);
        };
        
        checkSilence();
      }
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      const isHttp = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
      setError(isHttp ? 'Microphone requires HTTPS. Please test on localhost or a secure connection.' : 'Microphone access denied or unavailable. Please check permissions.');
      setState('idle');
    }
  }, []);

  // stopRecording was hoisted up to avoid dependency cycles

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
