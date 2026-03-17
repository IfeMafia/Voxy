"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Filter, Languages, Volume2, ChevronRight, MessageSquare, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ConversationsPage() {
  const [conversations] = useState([]);

  return (
    <DashboardLayout title="Conversations">
      <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
        
        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-[#00D18F]" />
            <input 
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-14 pr-6 py-4 bg-[#111111] border border-white/5 rounded-[1.5rem] text-sm text-white placeholder:text-zinc-700 outline-none focus:ring-2 focus:ring-[#00D18F]/20 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-6 py-4 bg-[#111111] border border-white/5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-[#00D18F]/5 border border-[#00D18F]/10 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-[#00D18F] hover:bg-[#00D18F]/10 transition-all">
              <Languages className="w-4 h-4" />
              All Languages
            </button>
          </div>
        </div>

        {/* Conversations List Card */}
        <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/[0.03]">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <div key={conv.id} className="p-8 hover:bg-white/[0.01] transition-all cursor-pointer group flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="size-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 font-black text-xl border border-white/5">
                        {conv.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1 bg-[#111111] rounded-lg">
                        <Volume2 className="w-3.5 h-3.5 text-[#00D18F]" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-bold text-white tracking-tight">{conv.name}</h4>
                        <Badge className={`${conv.statusColor} border-none text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md`}>
                          {conv.status}
                        </Badge>
                      </div>
                      <p className="text-zinc-500 font-medium truncate max-w-2xl text-sm mt-1">
                        {conv.snippet}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <Languages className="w-3 h-3 text-[#00D18F]/60" />
                          {conv.language}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bot className="w-3 h-3 text-[#00D18F]/60" />
                          {conv.time}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment & Action */}
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Sentiment</div>
                      <div className={`text-sm font-black ${conv.sentiment === 'Positive' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {conv.sentiment}
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center space-y-4">
                <div className="size-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-zinc-700" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter">No conversations yet</h3>
                <p className="text-zinc-500 font-medium max-w-sm mx-auto">When customers reach out to your business, they'll appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
