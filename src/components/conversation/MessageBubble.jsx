import { useState, useRef } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import Typewriter from '../chat/Typewriter';

const MessageBubble = ({ message, senderType, businessName, onTypeComplete, conversationId, onDelete, isMe }) => {
  const isOwner = senderType === 'owner';
  const isAI = senderType === 'ai';
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const longPressTimer = useRef(null);

  const getSenderLabel = () => {
    if (isMe) return 'You';
    if (isOwner) return businessName || 'Business';
    if (isAI) return 'VOXY AI';
    return 'Customer';
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => setShowDelete(true), 500);
  };

  const handleLongPressEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowDelete(false);
    if (!conversationId || !message.id) return;
    try {
      await fetch(`/api/conversations/${conversationId}/messages/${message.id}`, { method: 'DELETE' });
      onDelete?.(message.id);
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  return (
    <div
      className={`flex flex-col mb-8 group ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-700`}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onClick={() => setShowDelete(prev => !prev)}
    >
      <div className={`flex gap-3 sm:gap-5 max-w-[95%] sm:max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`size-8 sm:size-10 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center border shadow-xl overflow-hidden transition-all duration-500 ${
          isAI
            ? "bg-[#00D18F]/5 border-[#00D18F]/20 text-[#00D18F]"
            : isOwner
              ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
              : isMe
                ? "bg-[#00D18F]/10 border-[#00D18F]/20 text-[#00D18F]"
                : "bg-white/5 border-white/5 text-zinc-500"
        }`}>
          {isAI ? (
            <img src="/favicon.jpg" alt="VOXY AI" className="size-full object-cover" />
          ) : isOwner ? (
            <div className="size-full bg-blue-500/10 flex items-center justify-center font-bold text-xs">B</div>
          ) : isMe ? (
            <div className="size-full flex items-center justify-center font-bold text-xs"><Check className="size-4" /></div>
          ) : (
            <div className="size-full flex items-center justify-center font-bold text-zinc-600 text-xs">C</div>
          )}
        </div>

        <div className={`flex flex-col space-y-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-center gap-3 px-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
              isOwner ? 'text-blue-400' : isAI ? 'text-[#00D18F]' : isMe ? 'text-[#00D18F]' : 'text-zinc-500'
            }`}>
              {getSenderLabel()}
            </span>
          </div>

          <div className={`relative px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-[2rem] text-[14px] sm:text-[15px] leading-relaxed transition-all duration-700 shadow-2xl hover:scale-[1.01] ${
            isMe 
              ? 'bg-[#00D18F] text-black font-bold rounded-tr-[0.4rem] sm:rounded-tr-[0.5rem] shadow-[#00D18F]/10'
              : isOwner 
                ? 'bg-blue-600/10 text-white border border-blue-500/20 rounded-tl-[0.4rem] sm:rounded-tl-[0.5rem]' 
                : isAI
                  ? 'bg-white/[0.03] text-zinc-100 border border-white/[0.05] rounded-tl-[0.4rem] sm:rounded-tl-[0.5rem]'
                  : 'bg-[#1A1A1A] text-zinc-200 border border-white/5 rounded-tl-[0.4rem] sm:rounded-tl-[0.5rem]'
          }`}>
            {message.isNew && !isMe ? (
              <Typewriter 
                text={message.content} 
                onComplete={() => onTypeComplete?.(message.id)} 
              />
            ) : (
              message.content
            )}

            {/* Action buttons */}
            <div className={`absolute -top-3 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 transition-opacity duration-200 ${showDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-[#111] border border-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Copy"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00D18F]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {showDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 animate-in fade-in zoom-in-90 duration-150"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-2 px-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
             <span className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isMe && (
              <Check className="size-2.5 text-[#00D18F]" strokeWidth={3} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
