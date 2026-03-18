import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Bot, User } from 'lucide-react';

const MessageList = ({ messages, isTyping, typingAvatar, businessName, onTypeComplete, conversationId, onDelete, isCustomerView, typingUser }) => {
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, typingUser]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-10 bg-[#000000] scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10">
        {messages && messages.length > 0 ? (
          messages.map((msg, index) => (
            <MessageBubble 
              key={msg.id || index} 
              message={msg} 
              senderType={msg.sender_type} 
              businessName={businessName}
              onTypeComplete={onTypeComplete}
              conversationId={conversationId}
              onDelete={onDelete}
              isMe={isCustomerView ? msg.sender_type === 'customer' : msg.sender_type === 'owner'}
            />
          ))
        ) : (
          <div className="h-full py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
            <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-[#00D18F]/5 blur-xl group-hover:bg-[#00D18F]/10 transition-colors" />
               <Bot size={32} className="text-[#00D18F] relative z-10" />
            </div>
            <h3 className="text-sm sm:text-lg font-bold text-white tracking-widest uppercase">Start Conversation</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-[240px] leading-relaxed font-medium">Say hello to get started. Our AI is ready to help you instantly.</p>
          </div>
        )}
        
        {typingUser && (
          <div className="flex justify-start animate-in fade-in duration-500">
            <div className="flex gap-3 sm:gap-5">
               <div className={`size-8 sm:size-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-2xl overflow-hidden border ${
                 typingUser === "ai" 
                  ? "bg-[#00D18F]/5 border-[#00D18F]/20 text-[#00D18F]" 
                  : typingUser === "owner"
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                    : "bg-white/5 border-white/5 text-zinc-500"
               }`}>
                {typingUser === 'ai' ? (
                  <img src="/favicon.jpg" alt="Voxy AI" className="size-full object-cover" />
                ) : typingUser === 'owner' ? (
                  <div className="size-full bg-blue-500/10 flex items-center justify-center font-bold text-xs">B</div>
                ) : (
                  <div className="size-full flex items-center justify-center font-bold text-zinc-600 text-xs">C</div>
                )}
              </div>
              <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-[2rem] rounded-tl-[0.4rem] sm:rounded-tl-[0.5rem] flex items-center gap-1.5 sm:gap-2 border ${
                typingUser === "ai" 
                  ? "bg-white/[0.03] border-white/[0.05]" 
                  : "bg-[#1A1A1A] border-white/5"
              }`}>
                <span className={`size-1 sm:size-1.5 rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_8px_currentColor] ${typingUser === "ai" ? "bg-[#00D18F] text-[#00D18F]" : "bg-zinc-500 text-zinc-500"}`}></span>
                <span className={`size-1 sm:size-1.5 rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_8px_currentColor] ${typingUser === "ai" ? "bg-[#00D18F] text-[#00D18F]" : "bg-zinc-500 text-zinc-500"}`}></span>
                <span className={`size-1 sm:size-1.5 rounded-full animate-bounce shadow-[0_0_8px_currentColor] ${typingUser === "ai" ? "bg-[#00D18F] text-[#00D18F]" : "bg-zinc-500 text-zinc-500"}`}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={scrollRef} className="h-4" />
      </div>
    </div>
  );
};

export default MessageList;
