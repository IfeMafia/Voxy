import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

export const VoiceButton = ({ onAudioReady, isLoading }) => {
  const { state, error, startRecording, stopRecording, isRecording } = useVoiceRecorder({ 
    onAutoStop: (blob) => {
      if (blob) onAudioReady(blob);
    }
  });

  const handleToggleRecording = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        onAudioReady(audioBlob);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div className="relative group flex items-center justify-center shrink-0">
      {/* Animated Ripple for Recording State */}
      {isRecording && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
          <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-10 scale-150" />
        </div>
      )}

      <button
        type="button"
        disabled={isLoading}
        onClick={handleToggleRecording}
        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isRecording 
            ? 'bg-red-500 text-white border-red-400' 
            : isLoading
              ? 'bg-zinc-100 dark:bg-white/5 text-zinc-600 cursor-not-allowed'
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 shadow-sm'
        }`}
        title={error || (isRecording ? "Stop Recording" : "Start Transcribing")}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isRecording ? (
          <Square size={16} fill="currentColor" strokeWidth={0} />
        ) : (
          <Mic size={18} strokeWidth={2.5} />
        )}
      </button>

      {/* recording Label for desktop/large screens */}
      {isRecording && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-[10px] font-bold px-3 py-1 rounded-full text-white whitespace-nowrap animate-bounce">
          Rec
        </div>
      )}

      {/* Error Tooltip */}
      {error && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/10 text-red-500 text-[10px] px-3 py-1.5 rounded-lg border border-red-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {error}
        </div>
      )}
    </div>
  );
};
