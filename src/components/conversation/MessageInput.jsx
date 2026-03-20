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

  useEffect(() => {
    // Only auto-focus on desktop devices to avoid keyboard popups on mobile
    const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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
        const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) {
          textareaRef.current.focus();
        }
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
    <div className="w-full shrink-0 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#0F0F0F] px-3 py-2 sm:px-8 sm:py-6 transition-all">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-4">
        
        {/* Voice Status Indicator Banner */}
        {statusConfig && (
          <div className="flex items-center justify-center py-2 px-6 rounded-full bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 self-center animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-sm">
            {statusConfig.icon}
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedFile && (
          <div className="flex animate-in zoom-in-95 duration-300">
            <div className="relative group p-1 bg-zinc-100 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-xl border border-zinc-200 dark:border-white/10"
              />
              <button
                type="button"
                onClick={removeFile}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full transition-all scale-90"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
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
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-2 focus-within:bg-zinc-50 dark:focus-within:bg-white/[0.05] focus-within:border-[#00D18F]/30 transition-all duration-300 flex items-center">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className="w-full bg-transparent border-none outline-none py-2 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 resize-none min-h-[44px] max-h-[160px]"
              />
          </div>

          <div className="flex items-center gap-3">
            <VoiceButton onAudioReady={onAudioReady} isLoading={isLoading} />
            
            {(content.trim() || selectedFile) && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-12 h-12 rounded-full bg-[#00D18F] text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all font-bold"
              >
                <Send size={18} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
