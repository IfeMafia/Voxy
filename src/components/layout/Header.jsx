import { Bell, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function Header({ title, onMenuClick }) {
  return (
    <header className="h-16 border-b border-white/5 bg-white dark:bg-black flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors text-zinc-500"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-display font-bold text-zinc-900 dark:text-white tracking-tight truncate max-w-[150px] sm:max-w-none">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-400">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-900 overflow-hidden border border-white/10 flex-shrink-0">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Samkiel" alt="User" />
        </div>
      </div>
    </header>
  );
}
