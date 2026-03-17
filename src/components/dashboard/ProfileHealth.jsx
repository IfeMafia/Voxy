import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ProfileHealth = ({ business }) => {
  const fields = [
    { label: 'Business Name', key: 'name' },
    { label: 'Description', key: 'description' },
    { label: 'Category', key: 'category' },
    { label: 'Business Hours', key: 'business_hours' },
  ];

  const completedFields = fields.filter(f => !!business?.[f.key]).length;
  const completionPercentage = Math.round((completedFields / fields.length) * 100);

  return (
    <div className="bg-[#111111] border border-white/5 p-8 rounded-2xl sticky top-6 overflow-hidden group">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-xl font-display font-bold text-white tracking-tight">Profile Health</h2>
      </div>
      
      <div className="space-y-4 mb-8">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
            <span className="text-zinc-400 text-sm font-medium">{field.label}</span>
            {business?.[field.key] ? (
              <div className="bg-emerald-500/10 p-1 rounded-full text-emerald-500">
                <Check size={12} strokeWidth={3} />
              </div>
            ) : (
              <div className="bg-red-500/10 p-1 rounded-full text-red-500">
                <X size={12} strokeWidth={3} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-500">Profile Completion</span>
          <span className={`text-sm font-bold ${completionPercentage === 100 ? 'text-[#00D18F]' : 'text-zinc-400'}`}>
            {completionPercentage}%
          </span>
        </div>
        
        <div className="w-full bg-[#0a0a0a] rounded-full h-1.5 mb-6 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 bg-[#00D18F]"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <Link 
          href="/business/settings"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-[#00D18F] transition-all duration-300 active:scale-95"
        >
          Complete Profile
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default ProfileHealth;

