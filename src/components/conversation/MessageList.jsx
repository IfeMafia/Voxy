import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Bot } from 'lucide-react';

const MessageList = ({ messages, isTyping, typingAvatar, businessName, onTypeComplete, conversationId, onDelete, isCustomerView, typingUser }) => {
  const scrollRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, typingUser]);

  // Initial scroll to bottom without animation for better UX when opening chat
  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-white dark:bg-[#0A0A0A] scrollbar-none transition-colors duration-500">
      <div className="max-w-3xl mx-auto space-y-6">
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
          <div className="h-full py-20 flex flex-col items-center justify-center text-center opacity-50">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200 dark:border-white/5 shadow-inner">
               <Bot size={24} className="text-[#00D18F]" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">No messages yet</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-2 max-w-[200px] leading-relaxed">Start your conversation with {businessName || 'the business'}.</p>
          </div>
        )}
        
        {(typingUser || isTyping) && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform hover:scale-110">
                <img src="/favicon.jpg" alt="AI" className="w-full h-full object-cover" />
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1 shadow-sm">
                <span className="w-1 h-1 rounded-full bg-[#00D18F] animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 rounded-full bg-[#00D18F] animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 rounded-full bg-[#00D18F] animate-bounce"></span>
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
