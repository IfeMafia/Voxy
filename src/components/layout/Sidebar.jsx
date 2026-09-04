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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { usePrefetch } from '@/hooks/useBusinessData';

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
  const { collapsed, toggleCollapsed } = useSidebar();
  const pathname = usePathname();
  const { prefetchCustomers, prefetchOrders, prefetchProducts } = usePrefetch();
  const isAdmin = pathname.startsWith('/lighthouse');

  const navItems = isAdmin ? ADMIN_NAV : BUSINESS_NAV;
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Business Owner';
  const roleLabel = isAdmin ? 'Platform Admin' : 'Business Owner';

  // Prefetch on nav item hover (only when user is authenticated)
  const handleHover = (href) => {
    if (!user?.id) return;
    if (href === '/business/customers') prefetchCustomers(user.id);
    if (href === '/business/orders') prefetchOrders(user.id);
    if (href === '/business/products') prefetchProducts(user.id);
  };

  const sidebarWidth = collapsed ? 'lg:w-14' : 'lg:w-56';

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
        fixed lg:static top-0 left-0 z-[70] h-[100dvh] w-56 bg-black flex flex-col border-r border-white/[0.07]
        transition-all duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarWidth}
        shadow-xl lg:shadow-none shrink-0
      `}>
        {/* Logo */}
        <div className={`p-4 flex items-center shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {collapsed ? (
            <Link href="/" className="flex items-center justify-center">
              <img src="/favicon.jpg" alt="Voxy" className="size-7 rounded-lg object-cover" />
            </Link>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-2.5">
                <img src="/favicon.jpg" alt="Voxy" className="size-7 rounded-lg object-cover" />
                <span className="font-bold text-base text-white tracking-tight">Voxy</span>
              </Link>
              <button 
                onClick={onClose}
                className="lg:hidden p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 pt-1 space-y-0.5 overflow-y-auto min-h-0 ${collapsed ? 'px-2' : 'px-2.5'}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose?.()}
                onMouseEnter={() => handleHover(item.href)}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 rounded-lg transition-all duration-150 group relative
                  ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
                  ${isActive
                    ? 'bg-white/[0.07] text-white'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
              >
                <item.icon className={`shrink-0 ${collapsed ? 'size-4.5' : 'w-4 h-4'} ${isActive ? 'text-[#00D18F]' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                {!collapsed && (
                  <span className="font-medium text-sm truncate">{item.name}</span>
                )}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D18F] shrink-0" />
                )}
                {isActive && collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00D18F] rounded-r" />
                )}
              </Link>
            );
          })}

          {/* Settings (business only) */}
          {!isAdmin && (
            <>
              <div className="my-2 border-t border-white/[0.06]" />
              <Link
                href="/business/settings"
                onClick={() => onClose?.()}
                title={collapsed ? 'Settings' : undefined}
                className={`flex items-center gap-3 rounded-lg transition-all duration-150 group relative
                  ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
                  ${pathname.startsWith('/business/settings')
                    ? 'bg-white/[0.07] text-white'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
              >
                <Settings className={`w-4 h-4 shrink-0 ${pathname.startsWith('/business/settings') ? 'text-[#00D18F]' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                {!collapsed && <span className="font-medium text-sm">Settings</span>}
                {pathname.startsWith('/business/settings') && collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00D18F] rounded-r" />
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Bottom: Collapse toggle + Profile + Logout */}
        <div className={`border-t border-white/[0.06] shrink-0 ${collapsed ? 'p-2 space-y-1' : 'p-2.5 space-y-1'}`}>
          {/* Logout */}
          <button
            onClick={logout}
            title={collapsed ? 'Log out' : undefined}
            className={`flex items-center gap-3 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] rounded-lg transition-all w-full group
              ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
          >
            <LogOut className="w-4 h-4 group-hover:text-zinc-400 shrink-0" />
            {!collapsed && <span className="font-medium text-sm">Log out</span>}
          </button>

          {/* Profile card */}
          {collapsed ? (
            <Link
              href={isAdmin ? '/lighthouse/profile' : '/business/settings'}
              title={userDisplayName}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-white/[0.04] transition-all mt-1"
            >
              <div className="size-7 rounded-full bg-[#00D18F] flex items-center justify-center text-black font-bold text-xs overflow-hidden shrink-0">
                {user?.logoUrl ? (
                  <img src={user.logoUrl} alt={userDisplayName} className="w-full h-full object-cover" />
                ) : (
                  userDisplayName.charAt(0).toUpperCase()
                )}
              </div>
            </Link>
          ) : (
            <Link 
              href={isAdmin ? '/lighthouse/profile' : '/business/settings'}
              className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-[#00D18F]/25 transition-all group/profile mt-1"
            >
              <div className="size-7 shrink-0 rounded-full bg-[#00D18F] flex items-center justify-center text-black font-bold text-xs overflow-hidden">
                {user?.logoUrl ? (
                  <img src={user.logoUrl} alt={userDisplayName} className="w-full h-full object-cover" />
                ) : (
                  userDisplayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-white truncate group-hover/profile:text-[#00D18F] transition-colors">
                  {userDisplayName}
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{roleLabel}</div>
              </div>
            </Link>
          )}

          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-full p-2 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.04] transition-all mt-1"
          >
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </div>
      </div>
    </>
  );
}
