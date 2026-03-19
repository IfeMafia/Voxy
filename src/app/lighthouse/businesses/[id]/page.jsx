import { getBusinessDetails } from '@/lib/supabase/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Building2, Activity, DollarSign, Cpu, Settings } from 'lucide-react';
import Link from 'next/link';

export default async function BusinessDetailsPage({ params }) {
  const business = await getBusinessDetails(params.id);

  if (!business) {
    return (
      <DashboardLayout title="Business Not Found">
        <div className="p-10 text-center">
          <h2 className="text-2xl font-black text-white">Business not found</h2>
          <Link href="/lighthouse/businesses" className="text-[#00D18F] mt-4 inline-block hover:underline">
            &larr; Back to list
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { stats } = business;

  const cards = [
    { label: 'LLM Tokens', value: stats.totalLlmTokens.toLocaleString(), icon: Cpu, cost: `$${stats.llmCost.toFixed(2)}` },
    { label: 'STT Duration (s)', value: stats.totalSttDuration.toFixed(1), icon: Activity, cost: `$${stats.sttCost.toFixed(2)}` },
    { label: 'TTS Usage', value: stats.totalTtsUsage.toLocaleString(), icon: Activity, cost: `$${stats.ttsCost.toFixed(2)}` },
    { label: 'Total Requests', value: stats.requestsCount, icon: Settings, cost: `$${stats.totalCost.toFixed(2)}` },
  ];

  return (
    <DashboardLayout title="Business Details">
      <div className="space-y-10 pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/lighthouse/businesses" className="text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
              &larr; Businesses
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tight">{business.name}</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-wider text-sm flex gap-4">
              <span>{business.owner_email}</span>
              <span className={`inline-block px-3 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                  business.status === 'active' ? 'bg-[#00D18F]/10 text-[#00D18F] border-[#00D18F]/20' :
                  business.status === 'suspended' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }`}>
                {business.status}
              </span>
            </p>
          </div>
          
          <div className="flex gap-4">
             {/* Admin actions (client form would be better, but server actions works too) */}
             <form action={async () => {
                'use server';
                const { updateBusinessStatus } = await import('@/lib/supabase/admin');
                await updateBusinessStatus(business.id, business.status === 'suspended' ? 'active' : 'suspended');
             }}>
                <button type="submit" className={`px-5 py-2.5 font-black text-xs uppercase tracking-widest rounded-xl transition-all border ${
                  business.status === 'suspended' ? 'bg-[#00D18F]/20 text-[#00D18F] border-[#00D18F]/50 hover:bg-[#00D18F]/30' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                }`}>
                  {business.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                </button>
             </form>

             {business.status !== 'flagged' && (
               <form action={async () => {
                  'use server';
                  const { updateBusinessStatus } = await import('@/lib/supabase/admin');
                  await updateBusinessStatus(business.id, 'flagged');
               }}>
                  <button type="submit" className="px-5 py-2.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-500/20 transition-all">
                    Flag
                  </button>
               </form>
             )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((stat, i) => (
            <div 
              key={i} 
              className="relative overflow-hidden p-8 bg-zinc-900 border border-white/5 rounded-3xl group shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest leading-none">
                    {stat.label}
                  </h3>
                  <div className="text-3xl font-black text-white mt-4 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="mt-4 text-[#00D18F] font-bold text-sm">
                    Cost: {stat.cost}
                  </div>
                </div>
                <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50">
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Cost card separated */}
        <div className="p-10 bg-[#050505] border border-white/5 rounded-[40px] shadow-2xl flex items-center justify-between">
           <div>
             <h2 className="text-zinc-500 uppercase tracking-widest font-bold text-sm mb-2">Total Platform Cost</h2>
             <div className="text-5xl font-black text-white">${stats.totalCost.toFixed(2)}</div>
           </div>
           <div className="size-16 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#00D18F]">
               <DollarSign className="w-8 h-8" />
           </div>
        </div>

        {/* Usage Breakdown Log (basic simulated chart format) */}
        <div className="bg-[#050505] border border-white/5 rounded-[40px] p-10 shadow-2xl">
          <h2 className="text-2xl font-black text-white tracking-tight mb-8">Daily Usage Log</h2>
          
          <div className="space-y-4">
            {business.charts.length === 0 ? (
              <p className="text-zinc-500 font-bold text-center">No daily logs</p>
            ) : (
              business.charts.map(day => (
                <div key={day.date} className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                  <div className="text-white font-bold">{day.date}</div>
                  <div className="flex items-center gap-8">
                    <div className="text-zinc-400 font-bold text-sm">{day.count} requests</div>
                    <div className="text-[#00D18F] font-black">${day.cost.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
