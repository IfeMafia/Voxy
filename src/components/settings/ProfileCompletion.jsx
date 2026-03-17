import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

const ProfileCompletion = ({ completion }) => {
  const isLive = completion >= 80;

  return (
    <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D18F]/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#00D18F]/10 text-[#00D18F]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white italic tracking-tight">Profile <span className="text-[#00D18F]">Integrity</span></h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Visibility calibration</p>
          </div>
        </div>
        <span className={`text-4xl font-display font-black italic tracking-tighter ${isLive ? 'text-[#00D18F]' : 'text-zinc-600'}`}>
          {completion}%
        </span>
      </div>

      <div className="w-full bg-white/[0.03] rounded-full h-4 mb-8 relative overflow-hidden p-1">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,209,143,0.3)] ${
            isLive ? 'bg-gradient-to-r from-emerald-500 to-[#00D18F]' : 'bg-gradient-to-r from-zinc-800 to-zinc-600'
          }`}
          style={{ width: `${completion}%` }}
        >
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
        </div>
      </div>

      <div className="relative z-10">
        {isLive ? (
          <div className="flex items-center gap-5 p-6 bg-[#00D18F]/5 border border-[#00D18F]/10 rounded-2xl text-[#00D18F]">
            <div className="size-12 rounded-xl bg-[#00D18F]/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-bold tracking-tight">Active & Optimized</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Your business is now visible in main search</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5 p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-zinc-500">
            <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-bold tracking-tight text-white">Baseline Pending</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Reach 80% to list your business publicly</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletion;
