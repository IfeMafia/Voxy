"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, TrendingUp, Users, Zap, Calendar, Filter, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const MetricCard = ({ title, value, change, icon: Icon, loading }) => (
  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl flex flex-col h-full hover:border-white/10 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-voxy-primary transition-colors">
        <Icon size={20} />
      </div>
      <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">{title}</div>
    </div>
    <div className="flex items-end justify-between">
      {loading ? (
        <div className="h-9 w-24 bg-white/5 animate-pulse rounded-lg"></div>
      ) : (
        <h3 className="text-3xl font-bold text-white tracking-tight tabular-nums">{value}</h3>
      )}
      <div className="text-[10px] font-bold text-voxy-primary bg-voxy-primary/10 px-2 py-0.5 rounded-full border border-voxy-primary/20">
        +{change}%
      </div>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch analytics');
      return json.analytics;
    }
  });

  const analytics = data || {
    metrics: { totalChats: 0, activeUsers: 0, aiHandover: "0", uptime: "0" },
    weeklyVolume: Array(12).fill(0)
  };

  return (
    <DashboardLayout title="Platform Analytics">
      <div className="max-w-[1400px] mx-auto pt-8 pb-32 space-y-10">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">System Analytics</h1>
            <p className="text-[15px] text-zinc-500 font-medium">
              Detailed breakdown of platform performance, user engagement, and AI performance.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="h-11 px-6 bg-[#0A0A0A] text-zinc-500 font-medium text-[13px] rounded-xl hover:text-white hover:border-white/20 transition-all border border-white/5 flex items-center gap-3">
              <Calendar className="w-4 h-4" /> Last 30 Days
            </button>
            <button className="h-11 px-5 bg-[#0A0A0A] text-zinc-500 font-medium text-[13px] rounded-xl hover:text-white hover:border-white/20 transition-all border border-white/5">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <MetricCard 
            title="Total Chats" 
            value={analytics.metrics.totalChats.toLocaleString()} 
            change="12.4" 
            icon={TrendingUp} 
            loading={isLoading}
          />
          <MetricCard 
            title="Active Users" 
            value={analytics.metrics.activeUsers.toLocaleString()} 
            change="8.2" 
            icon={Users} 
            loading={isLoading}
          />
          <MetricCard 
            title="AI Handover" 
            value={`${analytics.metrics.aiHandover}%`} 
            change="3.1" 
            icon={Zap} 
            loading={isLoading}
          />
          <MetricCard 
            title="Uptime" 
            value={`${analytics.metrics.uptime}%`} 
            change="0.1" 
            icon={BarChart3} 
            loading={isLoading}
          />
        </div>

        {/* Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 h-[400px] flex flex-col relative overflow-hidden group">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <BarChart3 size={16} className="text-voxy-primary" />
                <span className="text-[12px] font-bold text-zinc-400">Message Volume</span>
              </div>
              <p className="text-xs font-medium text-zinc-600">Weekly progression</p>
            </div>
            <div className="flex-1 flex items-end gap-2 px-4 pb-4">
              {analytics.weeklyVolume.map((h, i) => (
                <div key={i} className="flex-1 bg-white/5 rounded-t-lg group-hover:bg-voxy-primary/10 transition-all duration-500 hover:!bg-voxy-primary/40" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent pointer-events-none"></div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 h-[400px] flex flex-col relative group overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Users size={16} className="text-voxy-primary" />
                <span className="text-[12px] font-bold text-zinc-400">Engagement Hub</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
               <div className="size-48 rounded-full border-[20px] border-white/5 border-t-voxy-primary border-r-blue-500/20 relative animate-spin-slow">
                 <div className="absolute inset-0 flex items-center justify-center -rotate-90">
                    <p className="text-[11px] font-bold text-zinc-600">Peak Activity</p>
                 </div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
               <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                 <p className="text-[11px] font-bold text-zinc-500 mb-1">Top Region</p>
                 <p className="text-sm font-bold text-white tracking-tight">Lagos, Nigeria</p>
               </div>
               <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                 <p className="text-[11px] font-bold text-zinc-500 mb-1">Peak Time</p>
                 <p className="text-sm font-bold text-white tracking-tight">21:00 - 23:00</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

