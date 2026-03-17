import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, isTyping }) => {
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      {messages && messages.length > 0 ? (
        messages.map((msg, index) => (
          <MessageBubble 
            key={msg.id || index} 
            message={msg} 
            senderType={msg.sender_type} 
          />
        ))
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
            <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M16 12h.01M16 12h.01M16 12h.01M16 12h.01M16 12h.01" />
            </svg>
          </div>
          <p>Start the conversation below.</p>
        </div>
      )}
      
      {isTyping && (
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300 py-2">
          <div className="bg-zinc-900/50 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
            <span className="size-1 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="size-1 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="size-1 bg-[#00D18F] rounded-full animate-bounce"></span>
          </div>
        </div>
      )}
      
      <div ref={scrollRef} className="h-4" />
    </div>
  );
};

export default MessageList;
