import Link from 'next/link';
import { Menu, CircleUser } from 'lucide-react';
import NotificationsPopover from './NotificationsPopover';

export default function Header({ title, onMenuClick, user, showNotifications = true }) {
  return (
    <header className="h-14 border-b border-white/[0.07] bg-black flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-white/[0.05] rounded-lg transition-colors text-zinc-500 hover:text-white"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="text-sm font-semibold text-white tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {showNotifications && <NotificationsPopover />}
        {user?.role === 'customer' ? (
          <div className="size-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center ml-1">
            <span className="text-white font-semibold text-xs">
              {(user?.full_name || user?.name || user?.email || 'V')?.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <Link
            href="/business/profile"
            className="size-8 rounded-lg bg-white/[0.05] border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center hover:border-white/20 transition-colors ml-1"
          >
            {user?.business?.logo_url ? (
              <img src={user.business.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <CircleUser className="size-4 text-zinc-500" />
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
