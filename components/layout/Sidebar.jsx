import Link from 'next/link';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Building2, 
  Globe, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Assistant', href: '/assistant', icon: Bot },
    { name: 'Conversations', href: '/conversations', icon: MessageSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Business', href: '/business', icon: Building2 },
    { name: 'Languages', href: '/languages', icon: Globe },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-zinc-50 dark:bg-black text-zinc-500 dark:text-zinc-400 min-h-screen p-6 flex flex-col border-r border-zinc-200 dark:border-white/5 transition-colors">
      <div className="mb-10 flex items-center gap-3">
        <img src="/favicon.jpg" alt="Voxy Logo" className="size-8 rounded-lg object-cover" />
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Voxy</span>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href} 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 hover:text-[#00D18F] transition-all group"
          >
            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">{item.name}</span>
          </Link>
        ))}
      </nav>
      
      <div className="pt-6 border-t border-zinc-200 dark:border-white/5 mt-auto">
        <div className="flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-full bg-[#00D18F] text-black flex items-center justify-center font-bold text-lg shadow-lg shadow-[#00D18F]/20">
            S
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">SAMKIEL</div>
            <div className="text-xs text-zinc-500 font-medium">Administrator</div>
          </div>
        </div>
      </div>
    </div>
  );
}
