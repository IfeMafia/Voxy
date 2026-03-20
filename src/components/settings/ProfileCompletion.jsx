import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ProfileCompletion = ({ completionPercentage }) => {
  const isComplete = completionPercentage >= 80;

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-2xl p-6 shadow-sm transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1.5 flex items-center gap-3">
            Profile status
          </h2>
          <p className="text-zinc-500 dark:text-zinc-500 text-[15px] font-medium leading-relaxed">
            Fill out your profile so customers can find you.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-4xl font-bold text-[#00D18F] tracking-tighter">{completionPercentage}%</span>
          {isComplete ? (
            <Badge className="bg-[#00D18F]/5 text-[#00D18F] border-[#00D18F]/10 px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold text-[10px]">
              <CheckCircle2 size={14} strokeWidth={3} />
              Live on gateway
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-[#222222] text-zinc-500 px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold text-[10px]">
              <AlertCircle size={14} />
              Setup incomplete
            </Badge>
          )}
        </div>
      </div>

      <div className="relative h-2.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner flex items-center">
        <div 
          className="absolute top-0 left-0 h-full bg-[#00D18F] transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {!isComplete && (
        <div className="mt-8 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
          <AlertCircle size={16} className="text-orange-500/80" />
          <p className="text-xs font-semibold text-orange-500/80">
            Reach 80% completion to make your business live.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;
