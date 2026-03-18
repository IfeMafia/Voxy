import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

export const VoiceButton = ({ onAudioReady, isLoading }) => {
  const { state, error, startRecording, stopRecording, isRecording, isProcessing } = useVoiceRecorder();

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

  const busy = isLoading || isProcessing;

  return (
    <div className="relative group flex items-center justify-center">
      <button
        type="button"
        disabled={busy}
        onClick={handleToggleRecording}
        className={`size-12 sm:size-16 rounded-2xl sm:rounded-3xl font-bold flex items-center justify-center transition-all duration-500 shadow-xl shrink-0 ${
          isRecording 
            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-red-500/20' 
            : busy
              ? 'bg-[#00D18F]/20 text-[#00D18F]/50 cursor-not-allowed'
              : 'bg-white/5 text-zinc-500 hover:bg-white/10'
        }`}
        title={error ? error : isRecording ? "Stop Recording" : "Start Voice Message"}
      >
        {busy ? (
          <Loader2 className="size-5 sm:size-6 animate-spin text-[#00D18F]" />
        ) : isRecording ? (
          <Square className="size-5 sm:size-6 transition-transform duration-500 fill-current" />
        ) : (
          <Mic className="size-5 sm:size-6 transition-transform duration-500" strokeWidth={3} />
        )}
      </button>

      {/* Error Tooltip */}
      {error && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/10 text-red-500 text-xs px-3 py-1.5 rounded-lg border border-red-500/20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {error}
        </div>
      )}
    </div>
  );
};
