import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ProfileCompletion = ({ completionPercentage }) => {
  const isComplete = completionPercentage >= 80;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 sm:p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Business Profile Completion</h2>
          <p className="text-zinc-400 text-sm">
            Complete your profile to become visible to potential customers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-[#00D18F]">{completionPercentage}%</span>
          {isComplete ? (
            <Badge className="bg-[#00D18F]/20 text-[#00D18F] border-[#00D18F]/30 px-3 py-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Visible to customers
            </Badge>
          ) : (
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 px-3 py-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Not yet visible
            </Badge>
          )}
        </div>
      </div>

      <div className="relative h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00D18F] to-[#00f7aa] transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {!isComplete && (
        <p className="mt-4 text-sm text-zinc-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Complete at least 80% of your profile to appear in search results.
        </p>
      )}
    </div>
  );
};

export default ProfileCompletion;
