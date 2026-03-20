"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CustomerChatHistoryPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const fetchConversations = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const res = await fetch('/api/conversations');
        const data = await res.json();
        if (data.success) {
          setConversations(data.conversations);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchConversations(true);
    const intervalId = setInterval(() => fetchConversations(false), 10000);
    window.addEventListener('focus', fetchConversations);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', fetchConversations);
    };
  }, []);

  return (
    <DashboardLayout title="My Chats">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-6 sm:pb-10">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Conversations</h1>
            <p className="text-[10px] sm:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
              {conversations.length} Active chats
            </p>
          </div>
          
          <Link href="/customer/find-business">
            <Button className="bg-[#00D18F] hover:bg-emerald-400 text-black font-bold h-10 sm:h-12 px-4 sm:px-6 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#00D18F]/5">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline text-xs uppercase tracking-widest">Discover</span>
            </Button>
          </Link>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-800" />
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((chat) => (
              <div 
                key={chat.id} 
                className="group bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 rounded-3xl flex items-center gap-4 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/10 active:scale-[0.99] shadow-sm hover:shadow-xl dark:shadow-none cursor-pointer"
                onClick={() => router.push(`/customer/chat/${chat.business_slug}`)}
              >
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/customer/business/${chat.business_slug}`}>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner hover:border-[#00D18F]/50 transition-colors">
                      {chat.business_logo_url ? (
                        <img src={chat.business_logo_url} alt={chat.business_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#00D18F]/10">
                          <span className="text-[#00D18F] font-bold text-lg sm:text-2xl tracking-tighter">
                            {chat.business_name?.charAt(0).toUpperCase() || 'B'}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  {chat.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#00D18F] text-black text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-black">
                      {chat.unread_count}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#00D18F] transition-colors leading-tight">
                      {chat.business_name}
                    </h3>
                    <span className="text-[10px] text-zinc-600 font-medium whitespace-nowrap">
                      {new Date(chat.last_message_at || chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 truncate leading-relaxed">
                    {chat.last_message?.startsWith('[img]') ? '📷 Photo' : (chat.last_message || 'Continue your conversation...')}
                  </p>
                </div>

                <div className="shrink-0 text-zinc-800 group-hover:text-zinc-600 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-950/30 rounded-[3rem] border border-dashed border-zinc-200 dark:border-white/5">
              <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100 dark:border-white/5 shadow-sm">
                <MessageSquare className="w-6 h-6 text-zinc-400 dark:text-zinc-700" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">No active chats</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-[200px] mx-auto mb-8 font-medium">Ready to connect with a business? Start your first chat today.</p>
              <Link href="/customer/find-business">
                <Button className="rounded-full bg-white text-black hover:bg-zinc-200 h-11 px-8">
                  Browse Businesses
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
