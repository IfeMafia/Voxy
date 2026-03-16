import { Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function Header({ title }) {
  return (
    <header className="h-16 border-b border-white/5 bg-white dark:bg-black flex items-center justify-between px-8 sticky top-0 z-10 transition-colors">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">{title}</h2>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-400">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-zinc-900 overflow-hidden border border-white/10">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Samkiel" alt="User" />
        </div>
      </div>
    </header>
  );
}
