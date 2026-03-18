import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, isTyping, typingAvatar }) => {
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0D0D0D] scrollbar-thin scrollbar-thumb-[#1A1A1A] scrollbar-track-transparent">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((msg, index) => (
            <MessageBubble 
              key={msg.id || index} 
              message={msg} 
              senderType={msg.sender_type} 
            />
          ))
        ) : (
          <div className="h-full py-20 flex flex-col items-center justify-center text-center">
            <div className="size-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-[#1A1A1A]">
               <svg className="size-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
               </svg>
            </div>
            <h3 className="text-sm font-bold text-voxy-text tracking-tight uppercase tracking-widest">No Messages Yet</h3>
            <p className="text-xs text-voxy-muted mt-1 max-w-[200px] leading-relaxed font-medium">This is the beginning of your conversation with the customer.</p>
          </div>
        )}
        
        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2">
              <div className="size-4 rounded-full bg-voxy-primary/10 border border-voxy-primary/20 flex items-center justify-center">
                <span className="text-[7px] font-black text-voxy-primary italic">AI</span>
              </div>
              <div className="bg-[#121212] border border-[#1A1A1A] px-3 py-2 rounded-xl rounded-tl-sm flex items-center gap-1">
                <span className="size-1 bg-voxy-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="size-1 bg-voxy-primary rounded-full animate-bounce [animation-delay:-0.15s] "></span>
                <span className="size-1 bg-voxy-primary rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={scrollRef} className="h-2" />
      </div>
    </div>
  );
};

export default MessageList;
