import { ChevronLeft, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

const ChatHeader = ({ name, status, icon: Icon, aiEnabled, aiLabel = "AI", onToggleAi, onClear, showBack, backUrl, businessSlug }) => {
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

  // Wrap name/avatar in Link if businessSlug is provided (customer view)
  const profileLink = businessSlug ? `/customer/business/${businessSlug}` : null;

  const AvatarAndName = (
    <div className={`flex items-center gap-4 min-w-0 ${profileLink ? 'cursor-pointer group/profile' : ''}`}>
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-[#1A1A1A] border border-zinc-200 dark:border-white/5 flex items-center justify-center overflow-hidden shadow-sm group-hover/profile:border-[#00D18F]/50 transition-colors">
          {typeof Icon === 'string' ? (
            <img src={Icon} alt={name} className="w-full h-full object-cover" />
          ) : Icon ? (
            <Icon className="w-5 h-5 text-[#00D18F]" />
          ) : (
            <span className="text-[#00D18F] font-bold text-sm uppercase">{name?.charAt(0)}</span>
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00D18F] border-[3px] border-zinc-50 dark:border-[#0F0F0F] rounded-full shadow-sm" />
        )}
      </div>
      
      <div className="min-w-0">
        <h1 className="text-base font-black text-zinc-900 dark:text-white truncate leading-none mb-1.5 tracking-tight group-hover/profile:text-[#00D18F] transition-colors">
          {name || 'Business'}
        </h1>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em] whitespace-nowrap opacity-60">
          {isOnline ? 'Online' : 'AI Assistant'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="sticky top-0 z-50 bg-zinc-50 dark:bg-[#0F0F0F] border-b border-zinc-200 dark:border-white/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 transition-all">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (backUrl ? router.push(backUrl) : router.back())}
            className="h-9 w-9 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 dark:text-zinc-500 transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          </Button>
        )}
        
        {profileLink ? (
          <Link href={profileLink}>
            {AvatarAndName}
          </Link>
        ) : (
          AvatarAndName
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-4 bg-zinc-100/80 dark:bg-white/[0.03] px-4 py-2 rounded-full border border-zinc-200 dark:border-white/5">
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] opacity-80">{aiLabel}</span>
          <Switch checked={aiEnabled} onCheckedChange={onToggleAi} className="scale-90" />
        </div>
        
        <div className="relative" ref={menuRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowMenu(!showMenu)} 
            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{aiLabel}</span>
                <Switch checked={aiEnabled} onCheckedChange={onToggleAi} className="scale-75" />
              </div>
              {profileLink && (
                <Link
                  href={profileLink}
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  View Profile
                </Link>
              )}
              <button
                onClick={() => {
                  onClear();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors text-left"
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
