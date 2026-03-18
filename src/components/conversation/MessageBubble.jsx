import React from 'react';
import { Bot, User, Check } from 'lucide-react';

const MessageBubble = ({ message, senderType }) => {
  const isOwner = senderType === 'owner';
  const isAI = senderType === 'ai';

  const getSenderLabel = () => {
    if (isOwner) return 'Owner';
    if (isAI) return 'AI';
    return 'Customer';
  };

  return (
    <div className={`flex flex-col mb-3 group ${isOwner ? 'items-end' : 'items-start'}`}>
      <div className={`flex flex-col max-w-[80%] sm:max-w-[65%] ${isOwner ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-1 px-1 opacity-30 group-hover:opacity-60 transition-opacity duration-300 ${isOwner ? 'flex-row-reverse' : ''}`}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
            {getSenderLabel()}
          </span>
          <span className="text-[9px] font-medium text-zinc-700 uppercase tracking-widest">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={`relative px-3 py-2 rounded-lg text-[13px] leading-snug transition-all duration-300 ${
          isOwner 
            ? 'bg-voxy-primary text-[#050505] font-medium rounded-tr-none' 
            : 'bg-[#1A1A1A] text-voxy-text border border-white/5 rounded-tl-none'
        }`}>
          {message.content}
          
          {isOwner && (
            <div className="absolute -bottom-4 right-0 flex items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                <Check className="size-2 text-voxy-primary" />
                <span className="text-[7px] font-bold uppercase tracking-widest text-voxy-primary">Sent</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
