"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, MessageSquare, ShoppingBag, CreditCard, X, ChevronRight, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

const CLEARED_AT_KEY = 'voxy_notifications_cleared_at';

export default function NotificationsPopover({ user: propUser }) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const businessId = user?.businessId || user?.business?.id || user?.id || '';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef(null);
  const prevCountRef = useRef(0);

  // ── Local "cleared at" timestamp ───────────────────────────────────────────
  // Persists across re-renders; cleared on markAllAsRead.
  // Filters out order-based notifs that the API keeps returning after "Clear All".
  const getClearedAt = () => {
    try {
      const v = localStorage.getItem(CLEARED_AT_KEY);
      return v ? new Date(v) : null;
    } catch { return null; }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const qs = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const res = await fetch(`/api/notifications${qs}`, { headers }).catch(() => null);
      if (!res || !res.ok) return;

      const data = await res.json().catch(() => ({}));
      if (data && data.success) {
        let notifs = data.notifications || [];

        // Filter out anything created before our local "cleared at" timestamp
        const clearedAt = getClearedAt();
        if (clearedAt) {
          notifs = notifs.filter((n) => new Date(n.time) > clearedAt);
        }

        setNotifications(notifs);

        // Sound chime if unread notifications increased
        if (notifs.length > prevCountRef.current && prevCountRef.current > 0) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 587.33; // D5 note
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch {}
        }
        prevCountRef.current = notifs.length;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const markAllAsRead = async () => {
    try {
      // 1. Store a local cleared timestamp so order-based notifs stay gone
      try {
        localStorage.setItem(CLEARED_AT_KEY, new Date().toISOString());
      } catch {}

      // 2. Immediately clear visible list
      setNotifications([]);
      prevCountRef.current = 0;

      // 3. Tell server to mark DB alerts as read
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const qs = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      await fetch(`/api/notifications${qs}`, { method: 'POST', headers });
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();

    // 4-second polling for real-time alerts
    const interval = setInterval(fetchNotifications, 4000);

    if (supabase) {
      try {
        const channel = supabase
          .channel('global-notifications')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, fetchNotifications)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchNotifications)
          .subscribe();

        return () => {
          clearInterval(interval);
          if (supabase && channel) supabase.removeChannel(channel);
        };
      } catch {}
    }

    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
        title="Notifications"
      >
        <Bell className={`size-4 transition-transform ${unreadCount > 0 ? "text-[#00D18F] animate-pulse" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D18F] opacity-75"></span>
            <span className="relative inline-flex size-3.5 rounded-full bg-[#00D18F] text-[9px] font-extrabold text-black items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-black border border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Alerts &amp; Activity</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D18F]/15 text-[#00D18F] border border-[#00D18F]/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-[#00D18F] hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="size-3" />
                  <span>Clear all</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/[0.05] rounded-lg transition-colors text-zinc-500 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="size-5 border-2 border-white/10 border-t-[#00D18F] rounded-full animate-spin" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const isOrder = notif.type?.includes('ORDER');
                const isPayment = notif.type?.includes('PAYMENT');
                const Icon = isOrder ? ShoppingBag : isPayment ? CreditCard : MessageSquare;
                const iconColor = isPayment ? 'text-emerald-400 bg-emerald-500/10' : isOrder ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10';

                return (
                  <Link
                    key={notif.id}
                    href={notif.link || '/business/orders'}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-white/10 ${iconColor}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate group-hover:text-[#00D18F] transition-colors">
                          {notif.customer_name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    <ChevronRight className="size-3.5 text-zinc-600 group-hover:text-white shrink-0 mt-1 transition-colors" />
                  </Link>
                );
              })
            ) : (
              <div className="py-10 text-center px-4">
                <Bell className="size-7 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-300">All caught up!</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">New order, payment, and message alerts will ring here live.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
