import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { LogOut } from 'lucide-react';

export default function Sidebar() {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Assistant', href: '/assistant', icon: '🤖' },
    { name: 'Conversations', href: '/conversations', icon: '💬' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'Business', href: '/business', icon: '🏢' },
    { name: 'Languages', href: '/languages', icon: '🌐' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  const userDisplayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userRole = user?.user_metadata?.role || 'Member';

  return (
    <div className="w-64 bg-black text-zinc-400 min-h-screen p-6 flex flex-col border-r border-white/5">
      <div className="mb-10 flex items-center gap-3">
        <img src="/favicon.jpg" alt="Voxy Logo" className="size-8 rounded-lg object-cover" />
        <span className="text-xl font-bold tracking-tight text-white">Voxy</span>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href} 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-[#00D18F] transition-all group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="font-semibold">{item.name}</span>
          </Link>
        ))}
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all group mt-4"
        >
          <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold">Logout</span>
        </button>
      </nav>
      
      <div className="pt-6 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-full bg-[#00D18F] text-black flex items-center justify-center font-bold text-lg shadow-lg shadow-[#00D18F]/20">
            {userDisplayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-white uppercase tracking-tighter truncate w-32">{userDisplayName}</div>
            <div className="text-xs text-zinc-500 font-medium capitalize">{userRole.replace('_', ' ')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
