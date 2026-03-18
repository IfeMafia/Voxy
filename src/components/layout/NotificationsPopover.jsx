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
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 1. Real-time notifications for 'Needs Owner Response'
    // Listening to all changes is safer and fetchNotifications handles the filtering correctly.
    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-2xl transition-all relative group active:scale-95 border border-transparent ${
          isOpen ? 'bg-zinc-100 dark:bg-white/10 text-[#00D18F] border-white/5' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
        }`}
      >
        <Bell className="size-6 sm:size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 size-2.5 bg-[#00D18F] rounded-full border-2 border-white dark:border-black animate-pulse shadow-[0_0_8px_#00D18F]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-[320px] sm:w-[380px] bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
          {/* Popover Header */}
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight">Support Required</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#00D18F] mt-0.5">
                {unreadCount} {unreadCount === 1 ? 'Notification' : 'Notifications'}
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-400">
              <X className="size-4" />
            </button>
          </div>

          {/* List Area */}
          <div className="max-h-[420px] overflow-y-auto no-scrollbar py-2">
            {loading ? (
               <div className="p-12 flex flex-col items-center justify-center space-y-3">
                 <div className="size-8 border-2 border-[#00D18F]/20 border-t-[#00D18F] rounded-full animate-spin" />
                 <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Syncing...</span>
               </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <Link 
                  key={notif.id} 
                  href={notif.link}
                  onClick={() => setIsOpen(false)}
                  className="mx-2 px-4 py-4 rounded-2xl flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group"
                >
                  <div className="size-11 rounded-xl bg-[#00D18F]/10 flex items-center justify-center border border-[#00D18F]/10 shrink-0 shadow-sm">
                    <User className="size-5 text-[#00D18F]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate pr-2 tracking-tight">
                        {notif.customer_name || 'Guest User'}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                         <Clock className="size-3 text-zinc-500" />
                         <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                           {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                      {notif.message || 'No message content available.'}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#00D18F] opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                       Reply Now <ChevronRight className="size-3" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-16 text-center">
                <div className="bg-zinc-100 dark:bg-white/5 size-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-zinc-200 dark:border-white/10 shadow-inner">
                  <MessageSquare className="size-8 text-zinc-300 dark:text-zinc-700" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-200 tracking-tight">All clear!</h4>
                <p className="text-[10px] text-zinc-500 font-medium mt-2 max-w-[180px] mx-auto uppercase tracking-wider leading-relaxed">
                  No pending messages require your attention.
                </p>
              </div>
            )}
          </div>

          <style jsx>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      )}
    </div>
  );
}
