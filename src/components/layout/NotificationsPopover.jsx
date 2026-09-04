"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, Clock, X, ChevronRight, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications').catch(() => null);
      if (!res || !res.ok) { setNotifications([]); return; }
      const data = await res.json().catch(() => ({}));
      if (data && data.success) setNotifications(data.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (!supabase) return;
    try {
      const channel = supabase
        .channel('global-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchNotifications)
        .subscribe();
      return () => { if (supabase && channel) supabase.removeChannel(channel); };
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2 bg-[#00D18F] rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0a] border border-white/[0.08] rounded-xl shadow-xl z-[100] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div>
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-zinc-500">{unreadCount} pending</span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/[0.05] rounded-lg transition-colors text-zinc-500 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="size-5 border-2 border-white/10 border-t-zinc-400 rounded-full animate-spin" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-white/[0.04]">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.link}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="size-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="size-3.5 text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {notif.customer_name || 'Guest'}
                        </span>
                        <span className="text-[11px] text-zinc-600 shrink-0">
                          {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                        {notif.message || 'No message content.'}
                      </p>
                    </div>
                    <ChevronRight className="size-3.5 text-zinc-700 shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <MessageSquare className="size-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-400">All clear</p>
                <p className="text-xs text-zinc-600 mt-1">No pending notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
