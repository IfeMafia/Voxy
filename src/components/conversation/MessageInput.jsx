import React, { useState, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

const MessageInput = ({ onSendMessage, onTyping, isLoading }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim());
      setContent('');
      if (onTyping) onTyping(false);
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
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 bg-[#0A0A0A] border-t border-[#1A1A1A] relative z-10">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative group bg-[#111111] border border-[#1A1A1A] rounded-xl p-1.5 flex items-end focus-within:border-voxy-primary/30 transition-all duration-300">
          <button type="button" className="p-2 text-zinc-600 hover:text-voxy-text transition-colors">
            <Paperclip className="size-4" />
          </button>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none py-2 px-1 text-voxy-text text-sm placeholder:text-zinc-700 transition-all resize-none max-h-32 font-medium"
          />
          <button type="button" className="p-2 text-zinc-600 hover:text-voxy-text transition-colors">
            <Smile className="size-4" />
          </button>
        </div>
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="bg-voxy-primary text-black size-10 rounded-xl font-bold hover:bg-[#00b57c] transition-all duration-300 disabled:opacity-20 disabled:scale-100 flex items-center justify-center group shrink-0 active:scale-95"
        >
          <Send className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
