import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const ProfileHealth = ({ business }) => {
  const fields = [
    { label: 'Business name', key: 'name' },
    { label: 'Description', key: 'description' },
    { label: 'Business type', key: 'category' },
    { label: 'Working hours', key: 'business_hours' },
    { label: 'Location', key: 'address' },
  ];

  const completedFields = fields.filter(f => !!business?.[f.key]).length;
  const completionPercentage = Math.round((completedFields / fields.length) * 100);

  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded-2xl flex flex-col h-full shadow-sm">
      <div className="mb-10">
        <h2 className="text-sm font-bold text-zinc-500 tracking-tight">Profile status</h2>
        <p className="text-[15px] text-voxy-text mt-1.5 font-semibold">Track your setup progress</p>
      </div>
      
      <div className="space-y-5 flex-1">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between pb-5 border-b border-white/[0.03] last:border-0 last:pb-0">
            <span className={`text-xs font-semibold ${business?.[field.key] ? 'text-voxy-text' : 'text-zinc-700'}`}>{field.label}</span>
            {business?.[field.key] ? (
              <CheckCircle2 size={16} strokeWidth={3} className="text-voxy-primary" />
            ) : (
              <div className="size-3.5 rounded-full border border-zinc-800 transition-colors"></div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-white/[0.03]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-zinc-600">Completion</span>
          <span className="text-xs font-bold text-voxy-primary">{completionPercentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-8 shadow-inner">
          <div 
            className="h-full bg-voxy-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <Link 
          href="/business/settings"
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-voxy-primary text-black text-[13px] font-semibold hover:bg-[#00D18F] transition-all active:scale-95 shadow-lg shadow-voxy-primary/10"
        >
          {completionPercentage === 100 ? 'Update settings' : 'Finish setup'}
        </Link>
      </div>
    </div>
  );
};

export default ProfileHealth;
