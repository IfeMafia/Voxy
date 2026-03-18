import React from 'react';
import Link from 'next/link';
import { ChevronRight, MessageSquare } from 'lucide-react';

const RecentConversations = ({ conversations }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AI Responding':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/5 text-blue-400 border border-blue-500/10">AI responding</span>;
      case 'AI Resolved':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-voxy-primary/5 text-voxy-primary border border-voxy-primary/10">Resolved</span>;
      case 'Needs Owner Response':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-orange-500/5 text-orange-400 border border-orange-500/10">Needs review</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-900 text-zinc-600 border border-white/5">{status}</span>;
    }
  };

  const formatName = (name) => {
    if (!name) return 'New visitor';
    return name;
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-white/[0.03] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-500 tracking-tight">Recent activity</h2>
          <p className="text-[15px] text-voxy-text mt-1 font-semibold">Latest customer conversations</p>
        </div>
        <Link href="/business/conversation" className="text-xs font-semibold text-voxy-primary hover:text-[#00D18F] transition-colors">
          View all
        </Link>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {conversations && conversations.length > 0 ? (
          conversations.map((conv) => (
            <Link 
              key={conv.id} 
              href={`/business/conversation/${conv.customer_slug}`}
              className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="size-11 rounded-xl bg-[#0F0F0F] border border-white/5 flex items-center justify-center text-zinc-400 font-bold text-sm">
                    {formatName(conv.customer_name).charAt(0)}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-voxy-text font-bold text-[15px] tracking-tight truncate">{formatName(conv.customer_name)}</span>
                    {getStatusBadge(conv.status)}
                  </div>
                  <p className="text-zinc-600 text-sm truncate max-w-[200px] sm:max-w-md mt-0.5 font-medium leading-relaxed">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-[11px] text-zinc-700 font-bold hidden sm:block">
                  {conv.time}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-voxy-primary transition-all group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="size-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-5">
               <MessageSquare size={24} className="text-zinc-800" />
            </div>
            <p className="text-voxy-text font-bold text-base tracking-tight leading-none">Activity pending</p>
            <p className="text-xs text-zinc-600 mt-2.5 max-w-[220px] mx-auto font-medium leading-relaxed">System standby. Awaiting your first customer handshake.</p>
            <Link 
              href="/business/settings"
              className="mt-8 px-6 h-11 flex items-center justify-center rounded-xl bg-voxy-primary text-black text-sm font-semibold hover:bg-[#00D18F] transition-all active:scale-95 shadow-lg shadow-voxy-primary/10"
            >
              Copy link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentConversations;
