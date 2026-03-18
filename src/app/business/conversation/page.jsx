"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Filter, Languages, Volume2, ChevronRight, MessageSquare, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/conversations');
        const data = await res.json();
        if (data.success) {
          setConversations(data.conversations.map(c => ({
            ...c,
            name: c.customer_name || 'Guest',
            snippet: c.last_message || 'No messages yet',
            time: c.last_message_at 
              ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            language: 'English',
            sentiment: 'Neutral'
          })));
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AI Responding':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400">AI Active</span>;
      case 'AI Resolved':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">Resolved</span>;
      case 'Needs Owner Response':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400">Needs Review</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-zinc-500">{status}</span>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Conversations">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-voxy-primary/20 border-t-voxy-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Conversations">
      <div className="max-w-[1400px] mx-auto space-y-8 py-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-voxy-text tracking-tight">Conversations</h1>
            <p className="text-sm text-voxy-muted">Manage and monitor customer interactions across all channels.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-voxy-primary transition-colors" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl text-sm text-voxy-text placeholder:text-zinc-700 outline-none focus:border-voxy-primary/30 transition-all shadow-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl text-[11px] font-bold uppercase tracking-wider text-voxy-muted hover:text-voxy-text hover:border-[#333333] transition-all">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
          </div>
        </div>

        {/* List Card */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl overflow-hidden">
          <div className="divide-y divide-[#1A1A1A]">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <Link 
                  key={conv.id} 
                  href={`/business/conversation/${conv.customer_slug}`}
                  className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group"
                >
                  <div className="flex items-center gap-5 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="size-11 rounded-xl bg-voxy-primary/10 flex items-center justify-center text-voxy-primary font-bold text-lg border border-voxy-primary/10">
                        {conv.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1 bg-[#0A0A0A] rounded-md border border-[#1A1A1A]">
                        <Volume2 className="w-2.5 h-2.5 text-voxy-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-voxy-text font-semibold text-sm tracking-tight truncate">{conv.name}</span>
                        {getStatusBadge(conv.status)}
                      </div>
                      <p className="text-voxy-muted text-xs truncate max-w-xl">
                        {conv.snippet}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                          <Languages className="size-3 text-voxy-primary/40" />
                          {conv.language}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                          <Bot className="size-3 text-voxy-primary/40" />
                          {conv.time}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-0.5">Sentiment</p>
                      <p className={`text-xs font-bold ${conv.sentiment === 'Positive' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {conv.sentiment}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-voxy-text group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-16 text-center">
                <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#1A1A1A]">
                  <MessageSquare className="w-8 h-8 text-zinc-700" />
                </div>
                <h3 className="text-lg font-bold text-voxy-text tracking-tight">No conversations found</h3>
                <p className="text-sm text-voxy-muted mt-1 max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
