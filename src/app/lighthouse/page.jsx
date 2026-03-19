import { getDashboardStats } from '@/lib/admin_queries/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Building2, Activity, DollarSign, Trophy } from 'lucide-react';
import Link from 'next/link';

export default async function LighthouseOverviewPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: 'Total Businesses', value: stats.totalBusinesses, icon: Building2 },
    { label: 'Active (7d)', value: stats.activeBusinesses, icon: Activity },
    { label: 'Total Platform Cost', value: `$${stats.totalCost.toFixed(2)}`, icon: DollarSign },
  ];

  return (
    <DashboardLayout title="Admin Overview">
      <div className="space-y-10 pb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white tracking-tight">Platform Overview</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-wider text-sm">
            High-level metrics across all businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, i) => (
            <div 
              key={i} 
              className="relative overflow-hidden p-8 bg-zinc-900 border border-white/5 rounded-3xl group shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest leading-none">
                    {stat.label}
                  </h3>
                  <div className="text-4xl font-black text-white mt-4 tracking-tight">
                    {stat.value}
                  </div>
                </div>
                <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50">
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#050505] border border-white/5 rounded-[40px] p-10 shadow-2xl mt-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Top 5 by Cost</h2>
              <p className="text-zinc-500 text-sm font-bold mt-1 uppercase tracking-wider">
                Highest resource consumers
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#00D18F]">
               <Trophy className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            {stats.topBusinesses.length === 0 ? (
              <p className="text-zinc-500 font-bold uppercase text-xs text-center py-10">No usage data found.</p>
            ) : (
              stats.topBusinesses.map((b, i) => (
                <div key={b.id} className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="font-black text-xl text-zinc-600">#{i + 1}</div>
                    <Link href={`/lighthouse/businesses/${b.id}`} className="font-bold text-white hover:text-[#00D18F] transition-colors">
                      {b.name}
                    </Link>
                  </div>
                  <div className="font-black text-lg text-white">
                    ${b.cost.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Link 
              href="/lighthouse/businesses" 
              className="text-[#00D18F] font-bold text-sm uppercase hover:underline"
            >
              View All Businesses &rarr;
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
