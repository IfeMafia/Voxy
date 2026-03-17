import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

const MessageInput = ({ onSendMessage, isLoading }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="p-6 bg-[#111111] border-t border-white/[0.03] relative z-10">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative group bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] p-2 flex items-end focus-within:border-[#00D18F]/30 focus-within:ring-4 focus-within:ring-[#00D18F]/5 transition-all duration-500">
          <button type="button" className="p-3 text-zinc-600 hover:text-white transition-colors">
            <Paperclip size={20} />
          </button>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Express your thoughts..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-white text-[15px] placeholder:text-zinc-700 transition-all resize-none max-h-32 font-medium"
          />
          <button type="button" className="p-3 text-zinc-600 hover:text-white transition-colors">
            <Smile size={20} />
          </button>
        </div>
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="bg-[#00D18F] text-black size-14 rounded-2xl font-bold hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-30 disabled:grayscale disabled:scale-100 flex items-center justify-center shadow-xl shadow-[#00D18F]/20 group"
        >
          <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-500" strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
