import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Building2, 
  Settings,
  LogOut,
  Users,
  X,
  Bookmark,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const role = pathname.startsWith('/lighthouse') ? 'admin' : (user?.role || 'customer');

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/conversations/unread-count');
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 15000); // 15s refresh
      return () => clearInterval(interval);
    }
  }, [user]);

  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Dashboard', href: '/lighthouse/dashboard', icon: LayoutDashboard },
        { name: 'Users', href: '/lighthouse/users', icon: Users },
        { name: 'Settings', href: '/lighthouse/settings', icon: Settings },
      ];
    } else if (role === 'customer') {
      return [
        { name: 'Chat', href: '/customer/chat', icon: MessageSquare, badge: unreadCount },
        { name: 'Find Business', href: '/customer/find-business', icon: Building2 },
        { name: 'Settings', href: '/customer/settings', icon: Settings },
      ];
    } else {
      return [
        { name: 'Dashboard', href: '/business/dashboard', icon: LayoutDashboard },
        { name: 'Conversations', href: '/business/conversation', icon: MessageCircle, badge: unreadCount },
        { name: 'Settings', href: '/business/settings', icon: Settings },
      ];
    }
  };

  const navItems = getNavItems();
  const userDisplayName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'User';
  const roleLabel = (role === 'business' || role === 'business_owner') ? 'Business' : role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed lg:static top-0 left-0 z-[70] h-[100dvh] w-64 bg-white dark:bg-black flex flex-col border-r border-zinc-100 dark:border-white/5 transition-all duration-500 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} shadow-xl dark:shadow-none
      `}>
        {/* Logo Section */}
        <div className="p-6 pt-8 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-10 flex items-center justify-center">
              <img src="/favicon.jpg" alt="Voxy Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase tracking-tighter transition-colors">VOXY</span>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation Items - Added min-h-0 to ensure it can shrink */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-6 min-h-0 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? "bg-zinc-100 dark:bg-[#111111] text-[#00D18F]" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-[#0a0a0a]"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#00D18F]" : "text-zinc-400 dark:text-white/60 group-hover:text-zinc-900 dark:group-hover:text-white"}`} />
                <span className="font-semibold text-sm tracking-wide flex-1">{item.name}</span>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00D18F] text-black text-[10px] font-black min-w-[1.25rem] text-center shadow-[0_0_12px_rgba(0,209,143,0.3)] animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Bottom Section - Allowing content to wrap naturally */}
        <div className="p-3 border-t border-white/5 space-y-1 mb-2 shrink-0">
          {/* Logout */}
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-[#0a0a0a] rounded-xl transition-all w-full group"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-semibold text-sm tracking-wide">Logout</span>
          </button>

          {/* User Profile */}
          <Link 
            href={role === 'admin' ? '/lighthouse/profile' : (role === 'business' || role === 'business_owner' ? '/business/settings' : '/customer/settings')}
            className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-100 dark:border-white/5 mt-2 hover:border-[#00D18F]/30 transition-all group/profile shadow-sm dark:shadow-none"
          >
            <div className="size-10 shrink-0 rounded-full bg-[#00D18F] flex items-center justify-center text-black font-bold text-sm">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="font-bold text-sm text-zinc-900 dark:text-white break-words leading-tight tracking-tight group-hover/profile:text-[#00D18F] transition-colors">
                {userDisplayName}
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1 break-words">
                {roleLabel}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}

