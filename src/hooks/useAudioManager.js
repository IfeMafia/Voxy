import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Global Audio Manager Hook
 * Ensures only one audio instance plays at a time and provides request cancellation.
 */
export const useAudioManager = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeUrl, setActiveUrl] = useState(null);
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setActiveUrl(null);
  }, []);

  const play = useCallback((url) => {
    if (!url) return;

    // 1. Priority Control: Kill any current playback immediately
    stop();

    try {
      // 2. Initialize new audio instance
      const audio = new Audio(url);
      audioRef.current = audio;
      setActiveUrl(url);

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        setActiveUrl(null);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        console.error("Audio playback error for:", url);
        stop();
      };

      // 3. Execute playback
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Playback prevented (likely autoplay policy):", error);
          stop();
        });
      }
    } catch (err) {
      console.error("Failed to initialize audio:", err);
      stop();
    }
  }, [stop]);

  /**
   * Request Management
   * Returns a fresh AbortSignal and cancels any previous active requests.
   */
  const getNewAbortSignal = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancel previous API call
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stop]);

  return {
    play,
    stop,
    isPlaying,
    activeUrl,
    getNewAbortSignal
  };
};
