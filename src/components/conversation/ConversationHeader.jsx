import React from 'react';
import { Clock, User, ShieldCheck } from 'lucide-react';

const ConversationHeader = ({ customerName, status, startTime }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AI Responding':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400">AI Active</span>;
      case 'AI Resolved':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">Resolved</span>;
      case 'Needs Owner Response':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400">Needs Review</span>;
      case 'Active Now':
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">Active</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-zinc-500">{status}</span>;
    }
  };

  return (
    <div className="bg-[#0A0A0A] border-b border-[#1A1A1A] px-4 py-3 sm:px-6 flex items-center justify-between gap-4 relative z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="size-10 rounded-lg bg-voxy-primary/10 flex items-center justify-center text-voxy-primary font-bold text-base border border-voxy-primary/10">
            {customerName?.charAt(0) || 'C'}
          </div>
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-[#0A0A0A] rounded-md border border-[#1A1A1A]">
            <ShieldCheck className="w-2.5 h-2.5 text-voxy-primary" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-voxy-text tracking-tight truncate">
              {customerName || 'Anonymous Customer'}
            </h1>
            {getStatusBadge(status)}
          </div>
          <div className="flex items-center gap-2 text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-0.5">
            <Clock className="size-2.5 text-voxy-primary/40" />
            Started {startTime ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
          </div>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2">
         <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-[#1A1A1A] rounded-lg text-[9px] font-bold text-voxy-muted uppercase tracking-widest">
            <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
            Encrypted
         </div>
      </div>
    </div>
  );
};

export default ConversationHeader;
