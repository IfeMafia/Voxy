"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Inbox,
  Users,
  ShoppingBag,
  ClipboardList,
  Bot,
  Wallet,
  Settings,
  LogOut,
  Activity,
  Building2,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const BUSINESS_NAV = [
  { name: 'Overview',     href: '/business/dashboard',  icon: LayoutDashboard },
  { name: 'Inbox',        href: '/business/inbox',       icon: Inbox },
  { name: 'Customers',    href: '/business/customers',   icon: Users },
  { name: 'Products',     href: '/business/products',    icon: ShoppingBag },
  { name: 'Orders',       href: '/business/orders',      icon: ClipboardList },
  { name: 'AI Employee',  href: '/business/ai',          icon: Bot },
  { name: 'Payments',     href: '/business/wallet',      icon: Wallet },
];

const ADMIN_NAV = [
  { name: 'Dashboard',         href: '/lighthouse/dashboard',  icon: LayoutDashboard },
  { name: 'Platform Overview', href: '/lighthouse',            icon: Activity },
  { name: 'Businesses',        href: '/lighthouse/businesses', icon: Building2 },
  { name: 'Customers',         href: '/lighthouse/customers',  icon: Users },
  { name: 'Settings',          href: '/lighthouse/settings',   icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/lighthouse');

  const navItems = isAdmin ? ADMIN_NAV : BUSINESS_NAV;
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Business Owner';
  const roleLabel = isAdmin ? 'Platform Admin' : 'Business Owner';

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
        fixed lg:static top-0 left-0 z-[70] h-[100dvh] w-64 bg-black flex flex-col border-r border-white/[0.07] transition-all ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-xl lg:shadow-none
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/favicon.jpg" alt="Voxy" className="size-8 rounded-lg object-cover" />
            <span className="font-bold text-lg text-white tracking-tight">Voxy</span>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? 'bg-white/[0.07] text-white'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00D18F]' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D18F]" />
                )}
              </Link>
            );
          })}

          {/* Divider before Settings (business only) */}
          {!isAdmin && (
            <>
              <div className="my-2 border-t border-white/[0.06]" />
              <Link
                href="/business/settings"
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  pathname.startsWith('/business/settings')
                    ? 'bg-white/[0.07] text-white'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <Settings className={`w-4 h-4 shrink-0 ${pathname.startsWith('/business/settings') ? 'text-[#00D18F]' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                <span className="font-medium text-sm">Settings</span>
              </Link>
            </>
          )}
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="p-3 border-t border-white/[0.06] shrink-0 space-y-1">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] rounded-lg transition-all w-full group"
          >
            <LogOut className="w-4 h-4 group-hover:text-zinc-400" />
            <span className="font-medium text-sm">Log out</span>
          </button>

          <Link 
            href={isAdmin ? '/lighthouse/profile' : '/business/settings'}
            className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-[#00D18F]/25 transition-all group/profile mt-1"
          >
            <div className="size-8 shrink-0 rounded-full bg-[#00D18F] flex items-center justify-center text-black font-bold text-sm overflow-hidden">
              {user?.logoUrl ? (
                <img src={user.logoUrl} alt={userDisplayName} className="w-full h-full object-cover" />
              ) : (
                userDisplayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-white truncate group-hover/profile:text-[#00D18F] transition-colors">
                {userDisplayName}
              </div>
              <div className="text-[11px] text-zinc-600 mt-0.5">{roleLabel}</div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
