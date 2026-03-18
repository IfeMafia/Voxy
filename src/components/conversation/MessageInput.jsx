"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Mic, Loader2, Play, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceButton } from '@/components/chat/VoiceButton';

const VOICE_STATUS_CONFIG = {
  recording: {
    label: "Recording...",
    color: "text-red-500",
    icon: <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
  },
  processing: {
    label: "AI is thinking...",
    color: "text-[#00D18F]",
    icon: <Loader2 className="w-3 h-3 animate-spin mr-2" />
  },
  speaking: {
    label: "AI is speaking...",
    color: "text-blue-400",
    icon: <Volume2 className="w-3 h-3 animate-pulse mr-2" />
  }
};

const MessageInput = ({ 
  onSendMessage, 
  onAudioReady, 
  onTyping, 
  onFileUpload,
  isLoading, 
  voiceStatus,
  placeholder = "Message..." 
}) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (selectedFile && onFileUpload) {
      onFileUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (content.trim() && !isLoading) {
      onSendMessage(content.trim());
      setContent('');
      onTyping?.(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
    setContent(target.value);

    if (onTyping) {
      onTyping(target.value.trim().length > 0);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert("Only images are allowed currently.");
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB.");
        return;
    }
    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const statusConfig = voiceStatus ? VOICE_STATUS_CONFIG[voiceStatus] : null;

  return (
    <div className="w-full shrink-0 border-t border-white/[0.03] bg-black/40 backdrop-blur-xl px-3 py-3 sm:px-6 sm:py-4 md:px-10 md:py-6">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex flex-col gap-3">
        
        {/* Voice Status Indicator Banner */}
        {statusConfig && (
          <div className="flex items-center justify-center py-1.5 px-4 rounded-full bg-white/[0.03] border border-white/[0.05] self-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            {statusConfig.icon}
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        )}

        {/* Selected Image Preview (Clean and Modern) */}
        {selectedFile && (
          <div className="flex animate-in zoom-in-95 duration-300">
            <div className="relative group p-1 bg-white/[0.05] rounded-2xl border border-white/10 group">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={removeFile}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-400 text-white rounded-full shadow-2xl transition-all scale-90 group-hover:scale-100"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 sm:gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-[#00D18F] hover:bg-[#00D18F]/10 transition-all active:scale-95"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-[1.8rem] px-5 py-1.5 focus-within:border-[#00D18F]/30 focus-within:bg-white/[0.05] transition-all duration-300">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                autoFocus
                className="w-full bg-transparent border-none outline-none py-2 text-[15px] text-white placeholder:text-zinc-600 resize-none min-h-[40px] max-h-[160px]"
              />
          </div>

          <div className="flex items-center gap-2">
            <VoiceButton onAudioReady={onAudioReady} isLoading={isLoading} />
            
            {(content.trim() || selectedFile) && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-12 h-12 rounded-full bg-[#00D18F] text-black flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,209,143,0.3)] active:scale-95 disabled:opacity-50"
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
