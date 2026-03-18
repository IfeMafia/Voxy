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
      className={`flex flex-col mb-4 group ${isMe ? 'items-end' : 'items-start'}`}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onClick={() => setShowDelete(prev => !prev)}
    >
      <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''} ${isOwner ? 'text-blue-400' : isAI ? 'text-[#00D18F]' : isMe ? 'text-[#00D18F]' : 'text-zinc-500'}`}>
          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
            {getSenderLabel()}
          </span>
          <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest opacity-40">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={`relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed transition-all duration-300 shadow-xl ${
          isMe 
            ? 'bg-[#00D18F]/10 text-[#00D18F] border border-[#00D18F]/20 rounded-tr-none'
            : isOwner 
              ? 'bg-blue-600/10 text-blue-100 border border-blue-500/20 rounded-tl-none' 
              : isAI
                ? 'bg-[#00D18F]/10 text-[#00D18F] border border-[#00D18F]/20 rounded-tl-none'
                : 'bg-[#1A1A1A] text-zinc-200 border border-white/5 rounded-tl-none'
        }`}>
          {message.isNew && !isMe ? (
            <Typewriter 
              text={message.content} 
              onComplete={() => onTypeComplete?.(message.id)} 
            />
          ) : (
            message.content
          )}

          {/* Action buttons: always visible on mobile, hover on desktop */}
          <div className={`absolute -top-3 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 transition-opacity duration-200 ${showDelete ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md bg-[#222] border border-white/10 text-zinc-400 hover:text-white"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3 text-[#00D18F]" /> : <Copy className="w-3 h-3" />}
            </button>
            {showDelete && (
              <button
                onClick={handleDelete}
                className="p-1 rounded-md bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 animate-in fade-in zoom-in-90 duration-150"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {isMe && (
            <div className={`absolute -bottom-5 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 opacity-40`}>
              <Check className="size-2 text-[#00D18F]" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#00D18F]">Sent</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
