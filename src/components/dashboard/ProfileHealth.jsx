import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const ProfileHealth = ({ business }) => {
  const fields = [
    { label: 'Business name', key: 'name' },
    { label: 'Description', key: 'description' },
    { label: 'Business type', key: 'category' },
    { label: 'Working hours', key: 'business_hours' },
    { label: 'Assistant tone', key: 'assistant_tone' },
    { label: 'Business logo', key: 'logo_url' },
    { label: 'State', key: 'state' },
    { label: 'LGA', key: 'lga' },
    { label: 'Street Address', key: 'street_address' },
    { label: 'Phone Number', key: 'phone' }
  ];

  const completedFields = fields.filter(f => {
    const val = business?.[f.key];
    if (f.key === 'business_hours') {
      return val && Object.keys(val).length > 0;
    }
    return !!val && (typeof val === 'string' ? val.trim().length > 0 : true);
  }).length;
  
  const completionPercentage = Math.round((completedFields / fields.length) * 100);

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#1A1A1A] p-6 rounded-2xl flex flex-col h-full shadow-sm dark:shadow-none transition-colors duration-500">
      <div className="mb-10 text-right">
        <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 tracking-tight uppercase tracking-[0.2em] mb-1">Profile status</h2>
        <p className="text-[15px] text-zinc-900 dark:text-voxy-text mt-1.5 font-semibold">Track your setup progress</p>
      </div>
      
      <div className="space-y-5 flex-1">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center justify-between pb-5 border-b border-zinc-100 dark:border-white/[0.03] last:border-0 last:pb-0">
            <span className={`text-xs font-semibold ${business?.[field.key] ? 'text-zinc-900 dark:text-voxy-text' : 'text-zinc-400'}`}>{field.label}</span>
            {business?.[field.key] ? (
              <CheckCircle2 size={16} strokeWidth={3} className="text-voxy-primary" />
            ) : (
              <div className="size-3.5 rounded-full border-2 border-zinc-200 dark:border-zinc-800 transition-colors"></div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-white/[0.03]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Completion</span>
          <span className="text-xs font-bold text-voxy-primary">{completionPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden mb-8 shadow-inner">
          <div 
            className="h-full bg-voxy-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,209,143,0.3)]"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <Link 
          href="/business/settings"
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-voxy-primary text-black text-[13px] font-bold uppercase tracking-widest hover:bg-[#00D18F] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-voxy-primary/10"
        >
          {completionPercentage === 100 ? 'Update settings' : 'Finish setup'}
        </Link>
      </div>
    </div>
  );
};

export default ProfileHealth;
