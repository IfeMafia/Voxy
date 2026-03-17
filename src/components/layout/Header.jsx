import { Bell, Menu, Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function Header({ title, onMenuClick }) {
  return (
    <header className="h-20 border-b border-zinc-100 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-3xl flex items-center justify-between px-6 sm:px-10 sticky top-0 z-50 transition-all duration-500">
      <div className="flex items-center gap-6">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-3 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all text-zinc-500 active:scale-90"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 dark:text-white tracking-tight truncate max-w-[180px] sm:max-w-none">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <ThemeToggle />
        <button className="p-3 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all text-zinc-400 relative group active:scale-95">
          <Bell className="w-6 h-6" />
        </button>
        
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden border border-zinc-200 dark:border-white/10 flex-shrink-0 shadow-sm group cursor-pointer transition-all duration-300">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Samkiel" 
            alt="User" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        </div>
      </div>
    </header>
  );
}
