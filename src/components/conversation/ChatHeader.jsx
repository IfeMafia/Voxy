import { Clock, ShieldCheck, Trash2, ChevronLeft, MoreVertical } from 'lucide-react';
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AI Responding':
      case 'Active':
      case 'Active Now':
      case 'Online':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-[#00D18F]/10 text-[#00D18F] shadow-[0_0_8px_rgba(0,209,143,0.1)]">Active</span>;
      case 'AI Resolved':
      case 'Resolved':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">Resolved</span>;
      case 'Needs Owner Response':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400">Needs Review</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-zinc-500">{status}</span>;
    }
  };

  return (
    <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.03] px-4 py-4 sm:px-6 flex items-center justify-between gap-4 relative z-50 shadow-xl">
      <div className="flex items-center gap-2 sm:gap-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => backUrl ? router.push(backUrl) : router.back()}
            className="rounded-full hover:bg-white/10 -ml-2 h-9 w-9 sm:h-10 sm:w-10 text-zinc-500 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        
        <div className="relative flex-shrink-0">
          <div className="size-10 sm:size-11 rounded-xl bg-[#00D18F]/10 flex items-center justify-center text-[#00D18F] font-bold text-base border border-[#00D18F]/10 overflow-hidden shadow-inner">
            {typeof Icon === 'string' ? (
              <img src={Icon} alt={name} className="size-full object-cover" />
            ) : Icon ? (
              <Icon className="size-4" />
            ) : (
              name?.charAt(0) || 'C'
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-[#0A0A0A] rounded-md border border-white/5">
            <ShieldCheck className="w-2.5 h-2.5 text-[#00D18F]" />
          </div>
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate leading-none">
              {name || 'Unknown'}
            </h1>
            {getStatusBadge(status)}
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] mt-1.5 opacity-60">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active Now' || status === 'Online' ? 'bg-[#00D18F] shadow-[0_0_8px_#00D18F]' : 'bg-zinc-800'}`}></div>
            {status === 'Active Now' || status === 'Online' ? 'Online' : 'Recent'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 relative">
        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{aiLabel}</span>
          <Switch checked={aiEnabled} onCheckedChange={onToggleAi} className="scale-75" />
        </div>
        
        <div className="relative" ref={menuRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowMenu(!showMenu)} 
            className={`rounded-xl h-9 w-9 border border-white/5 transition-all duration-300 ${showMenu ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  onClear();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
