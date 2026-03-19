import { useState, useRef } from 'react';
import { Check, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import Typewriter from '../chat/Typewriter';

const MessageBubble = ({ message, senderType, businessName, onTypeComplete, conversationId, onDelete, isMe }) => {
  const isOwner = senderType === 'owner';
  const isAI = senderType === 'ai';
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const isImageMessage = message.content?.startsWith('[img]');
  const imageUrl = isImageMessage ? message.content.slice(5) : null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setShowOptions(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowOptions(false);
    if (!conversationId || !message.id) return;
    try {
      await fetch(`/api/conversations/${conversationId}/messages/${message.id}`, { method: 'DELETE' });
      onDelete?.(message.id);
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  return (
    <div className={`flex flex-col mb-2 ${isMe ? 'items-end' : 'items-start'} group animate-in fade-in duration-300`}>
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && (
          <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 mb-1">
            {isAI ? (
              <img src="/favicon.jpg" alt="AI" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500/10 text-blue-500 font-bold text-[8px] uppercase">
                {businessName?.charAt(0) || 'B'}
              </div>
            )}
          </div>
        )}

        <div className="relative group/bubble">
          <div className={`
            ${isImageMessage ? 'p-1' : 'px-3.5 py-2.5'} 
            rounded-2xl text-sm leading-relaxed shadow-sm
            ${isMe 
              ? 'bg-[#00D18F] text-black rounded-br-sm' 
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-white/5 rounded-bl-sm'}
          `}>
            {isImageMessage ? (
              <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  alt="Shared"
                  className="max-w-[200px] sm:max-w-[280px] max-h-[300px] rounded-xl object-cover"
                  loading="lazy"
                />
              </a>
            ) : (isAI && message.isNew) ? (
              <Typewriter 
                text={message.content} 
                onComplete={() => onTypeComplete?.(message.id)} 
              />
            ) : (
              message.content
            )}
            
            <div className={`flex items-center gap-1 mt-1 justify-end opacity-50 text-[9px] ${isMe ? 'text-black/70' : 'text-zinc-500'}`}>
              <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isMe && <Check className="w-3 h-3" strokeWidth={3} />}
            </div>
          </div>

          {/* Context Options */}
          <div className={`absolute top-0 ${isMe ? '-left-10' : '-right-10'} opacity-0 group-hover/bubble:opacity-100 transition-opacity`}>
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-1 hover:bg-white/5 rounded-lg text-zinc-500"
            >
              <MoreHorizontal size={14} />
            </button>
            
            {showOptions && (
              <div className={`absolute bottom-full mb-2 ${isMe ? 'left-0' : 'right-0'} bg-zinc-950 border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150`}>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-colors text-left"
                >
                  {copied ? <Check className="w-3 h-3 text-[#00D18F]" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-colors text-left"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
