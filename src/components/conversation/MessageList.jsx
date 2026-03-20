import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Bot } from 'lucide-react';

const MessageList = ({ messages, isTyping, typingAvatar, typingUser, businessName, businessLogo, onTypeComplete, conversationId, onDelete, isCustomerView, onPlayAiAudio, playingAiAudioId }) => {
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

  // Determine who is typing and what avatar/label to show
  const getTypingInfo = () => {
    if (!typingUser) return null;

    // Customer view: if AI or owner is typing, show on left
    if (isCustomerView) {
      if (typingUser === 'ai') {
        return { label: 'VOXY AI', avatar: businessLogo || '/favicon.jpg', isImage: true, side: 'left' };
      }
      if (typingUser === 'owner') {
        return { label: businessName?.toUpperCase() || 'BUSINESS', avatar: businessLogo, isImage: !!businessLogo, initial: businessName?.charAt(0) || 'B', side: 'left' };
      }
    }

    // Business view: if customer is typing, show on left
    if (!isCustomerView) {
      if (typingUser === 'customer') {
        return { label: 'CUSTOMER', avatar: null, isImage: false, initial: typingAvatar || 'C', side: 'left' };
      }
      if (typingUser === 'ai') {
        return { label: 'VOXY AI', avatar: '/favicon.jpg', isImage: true, side: 'left' };
      }
    }

    return null;
  };

  const typingInfo = getTypingInfo();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 bg-transparent scrollbar-none transition-all">
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
            <p className="text-[10px] text-zinc-500 mt-2 max-w-[200px] leading-relaxed">Start your conversation with {businessName || 'the business'}.</p>
          </div>
        )}
        
        {(typingInfo || isTyping) && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex flex-col items-start gap-2">
              {typingInfo && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] mx-1 text-zinc-400 dark:text-zinc-600">
                  {typingInfo.label}
                </span>
              )}
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {typingInfo?.isImage ? (
                    <img src={typingInfo.avatar} alt="Typing" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#00D18F] font-bold text-[10px] uppercase">
                      {typingInfo?.initial || 'V'}
                    </span>
                  )}
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1 shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-[#00D18F] animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 rounded-full bg-[#00D18F] animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 rounded-full bg-[#00D18F] animate-bounce"></span>
                </div>
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
