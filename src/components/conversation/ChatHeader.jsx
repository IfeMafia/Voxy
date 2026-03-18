import { ChevronLeft, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const ChatHeader = ({ name, status, icon: Icon, aiEnabled, aiLabel = "AI", onToggleAi, onClear, showBack, backUrl }) => {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOnline = status === 'Online' || status === 'Active Now';

  return (
    <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (backUrl ? router.push(backUrl) : router.back())}
            className="h-8 w-8 hover:bg-white/5 text-zinc-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
              {typeof Icon === 'string' ? (
                <img src={Icon} alt={name} className="w-full h-full object-cover" />
              ) : Icon ? (
                <Icon className="w-4 h-4 text-[#00D18F]" />
              ) : (
                <span className="text-[#00D18F] font-bold text-xs uppercase">{name?.charAt(0)}</span>
              )}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00D18F] border-2 border-black rounded-full" />
            )}
          </div>
          
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate leading-none mb-1">
              {name || 'Business'}
            </h1>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest whitespace-nowrap">
              {isOnline ? 'Online' : 'AI Assistant'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{aiLabel}</span>
          <Switch checked={aiEnabled} onCheckedChange={onToggleAi} className="scale-75 translate-x-1" />
        </div>
        
        <div className="relative" ref={menuRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowMenu(!showMenu)} 
            className="h-8 w-8 hover:bg-white/5 text-zinc-400"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{aiLabel}</span>
                <Switch checked={aiEnabled} onCheckedChange={onToggleAi} className="scale-75" />
              </div>
              <button
                onClick={() => {
                  onClear();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
