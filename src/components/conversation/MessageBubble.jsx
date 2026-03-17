import React from 'react';
import { Bot, User, Check } from 'lucide-react';

const MessageBubble = ({ message, senderType }) => {
  const isOwner = senderType === 'owner';
  const isAI = senderType === 'ai';
  const isCustomer = senderType === 'customer';

  const getSenderLabel = () => {
    if (isOwner) return 'You';
    if (isAI) return 'VOXY AI';
    return 'Customer';
  };

  return (
    <div className={`flex flex-col mb-10 group ${isOwner ? 'items-end' : 'items-start'}`}>
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isOwner ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-3 mb-2 px-2 opacity-50 group-hover:opacity-100 transition-opacity duration-500 ${isOwner ? 'flex-row-reverse' : ''}`}>
          <div className={`size-6 rounded-lg flex items-center justify-center border shadow-sm ${
            isAI ? 'bg-[#00D18F]/10 border-[#00D18F]/20 text-[#00D18F]' : 'bg-white/5 border-white/5 text-zinc-500'
          }`}>
            {isAI ? <Bot size={12} /> : <User size={12} />}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {getSenderLabel()}
          </span>
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={`relative px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed shadow-lg transition-all duration-700 hover:scale-[1.01] ${
          isOwner 
            ? 'bg-[#00D18F] text-black font-bold rounded-tr-[0.5rem]' 
            : 'bg-white/[0.03] text-zinc-100 border border-white/[0.05] rounded-tl-[0.5rem]'
        }`}>
          {message.content}
          
          {isOwner && (
            <div className="absolute -bottom-5 right-2 flex items-center gap-1 opacity-40">
               <Check size={10} className="text-[#00D18F]" />
               <span className="text-[8px] font-bold uppercase tracking-wider text-[#00D18F]">Delivered</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
