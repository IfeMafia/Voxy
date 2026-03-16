import Link from 'next/link';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Building2, 
  Settings,
  LogOut,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const role = user?.role || 'customer';

  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ];
    } else if (role === 'customer') {
      return [
        { name: 'Chat', href: '/customer/chat', icon: MessageSquare },
        { name: 'Find Business', href: '/customer/find-business', icon: Building2 },
        { name: 'Bookmarks', href: '/customer/bookmarks', icon: Bot },
        { name: 'Settings', href: '/customer/settings', icon: Settings },
      ];
    } else {
      return [
        { name: 'Dashboard', href: '/business/dashboard', icon: LayoutDashboard },
        { name: 'Conversations', href: '/business/conversation', icon: MessageSquare },
        { name: 'Settings', href: '/business/settings', icon: Settings },
      ];
    }
  };

  const navItems = getNavItems();
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const userRoleDisplay = role === 'business_owner' ? 'Business' : role;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed lg:static top-0 left-0 z-[70] h-screen w-64 bg-zinc-50 dark:bg-black p-6 flex flex-col border-r border-zinc-200 dark:border-white/5 transition-all duration-300 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.jpg" alt="Voxy Logo" className="size-8 rounded-lg object-cover" />
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Voxy</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto py-2 -mx-2 px-2 custom-scrollbar">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              onClick={() => onClose?.()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 hover:text-[#00D18F] transition-all group"
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">{item.name}</span>
            </Link>
          ))}
          
        </nav>
        
        <div className="pt-6 border-t border-zinc-200 dark:border-white/5 mt-auto">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all group mb-4"
          >
            <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold">Logout</span>
          </button>

          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#00D18F] text-black flex items-center justify-center font-bold text-lg shadow-lg shadow-[#00D18F]/20 flex-shrink-0">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tighter truncate leading-tight">{userDisplayName}</div>
              <div className="text-[10px] text-zinc-500 font-medium capitalize truncate">{userRoleDisplay.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
