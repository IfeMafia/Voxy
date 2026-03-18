import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MessageInput = ({ onSendMessage, onTyping, isLoading, placeholder = "Write a message..." }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim());
      setContent('');
      if (onTyping) onTyping(false);
      // Reset height
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  useEffect(() => {
    if (!onTyping) return;
    
    const isCurrentlyTyping = content.trim().length > 0;
    onTyping(isCurrentlyTyping);

    const timeout = setTimeout(() => {
      onTyping(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [content, onTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
    setContent(target.value);
  };

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-10 bg-black border-t border-white/[0.03] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex items-end gap-2 sm:gap-4 relative group">
        <div className="flex-1 flex items-end gap-1 sm:gap-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2.5 focus-within:ring-4 focus-within:ring-[#00D18F]/5 focus-within:border-[#00D18F]/30 transition-all duration-500 shadow-2xl relative">
          <Button type="button" variant="ghost" size="icon" className="hidden sm:flex text-zinc-500 hover:text-white h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl transition-colors">
            <Paperclip className="size-5" />
          </Button>
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={() => onTyping?.(false)}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none py-2.5 sm:py-4 px-2 sm:px-3 text-[15px] sm:text-[16px] text-white placeholder:text-zinc-700 font-medium resize-none min-h-[44px] sm:min-h-[56px] leading-relaxed transition-all"
          />

          <Button type="button" variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl transition-colors">
            <Smile className="size-5" />
          </Button>
        </div>
        
        <button
          type={content.trim() ? "submit" : "button"}
          disabled={isLoading}
          className={`size-12 sm:size-16 rounded-2xl sm:rounded-3xl font-bold flex items-center justify-center transition-all duration-500 shadow-xl active:scale-90 shrink-0 ${
            content.trim() 
              ? 'bg-[#00D18F] text-black hover:bg-emerald-400 hover:scale-105 shadow-[#00D18F]/20' 
              : 'bg-white/5 text-zinc-500 hover:bg-white/10'
          }`}
        >
          {content.trim() ? (
            <Send className="size-5 sm:size-6 translate-x-0.5 -translate-y-0.5 transition-transform duration-500" strokeWidth={3} />
          ) : (
            <Mic className="size-5 sm:size-6 transition-transform duration-500" strokeWidth={3} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
