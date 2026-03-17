import React from 'react';
import Link from 'next/link';
import { ChevronRight, MessageSquare, Volume2 } from 'lucide-react';

const RecentConversations = ({ conversations }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AI Responding':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400">AI Active</span>;
      case 'AI Resolved':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">Resolved</span>;
      case 'Needs Owner Response':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400">Needs Review</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-500">{status}</span>;
    }
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/[0.03] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Recent Activity</h2>
          <p className="text-zinc-500 text-[10px] mt-1">Live customer interactions</p>
        </div>
        <Link href="/business/conversation" className="text-xs font-bold text-[#00D18F] hover:text-white transition-colors">
          View All
        </Link>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {conversations && conversations.length > 0 ? (
          conversations.map((conv) => (
            <Link 
              key={conv.id} 
              href={`/business/conversation/${conv.id}`}
              className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="size-12 rounded-xl bg-[#00D18F]/10 flex items-center justify-center text-[#00D18F] font-bold text-lg border border-[#00D18F]/10">
                    {conv.customer_name?.charAt(0) || 'C'}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold text-sm tracking-tight truncate">{conv.customer_name || 'Anonymous'}</span>
                    {getStatusBadge(conv.status)}
                  </div>
                  <p className="text-zinc-500 text-xs truncate max-w-[200px] sm:max-w-md mt-1">
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] text-zinc-600 font-medium hidden sm:block">
                  {conv.time}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="size-12 bg-[#0a0a0a] rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/5">
              <MessageSquare className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">No recent activity detected.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentConversations;

