import React from 'react';
import { Clock, User, ShieldCheck } from 'lucide-react';

const ConversationHeader = ({ customerName, status, startTime }) => {
  const getStatusStyles = (status) => {
    switch (status) {
      case 'AI Responding':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'AI Resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Needs Owner Response':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-white/5 text-zinc-500 border-white/5';
    }
  };

  return (
    <div className="bg-[#111111] border-b border-white/[0.03] p-6 sm:px-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#00D18F]/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-6 relative z-10">
        <div className="relative">
          <div className="size-16 rounded-2xl bg-[#00D18F]/10 flex items-center justify-center text-[#00D18F] font-bold text-2xl border border-[#00D18F]/10">
            {customerName?.charAt(0) || 'C'}
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-black rounded-lg border border-white/5">
            <ShieldCheck className="w-4 h-4 text-[#00D18F]" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight leading-tight uppercase tracking-tighter">
            {customerName || 'Anonymous Customer'}
          </h1>
          <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-1">
            <Clock size={12} className="text-[#00D18F]/60" />
            Started {startTime ? new Date(startTime).toLocaleTimeString() : 'Recently'}
          </div>
        </div>
      </div>

      <div className="flex items-center relative z-10">
        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(status)} transition-all`}>
          {status}
        </span>
      </div>
    </div>
  );
};

export default ConversationHeader;
