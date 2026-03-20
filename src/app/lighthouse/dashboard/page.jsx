"use client";

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Loader2,
  Calendar,
  CheckCircle2,
  Activity,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SystemHealth from '@/components/dashboard/SystemHealth';
import AuditLogs from '@/components/dashboard/AuditLogs';
import AIInsight from '@/components/dashboard/AIInsight';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

const AdminStatCard = ({ title, value, description, icon: Icon, trend, positive, loading }) => (
  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl flex flex-col h-full hover:border-white/10 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-voxy-primary transition-colors">
        <Icon size={20} />
      </div>
      <div className="text-[12px] font-semibold text-zinc-500 text-right">{title}</div>
    </div>
    
    <div>
      {loading ? (
        <div className="h-9 w-24 bg-white/5 animate-pulse rounded-lg mb-2"></div>
      ) : (
        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
      )}
      <div className="flex items-center gap-2">
         <span className={`text-[11px] font-semibold ${positive ? 'text-voxy-primary' : 'text-zinc-500'}`}>
            {trend}
         </span>
         <span className="text-[11px] text-zinc-600 font-medium">today</span>
      </div>
    </div>
  </div>
);

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();

  // Queries
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/metrics');
      const json = await res.json();
      return json.success ? json : { metrics: {}, chartData: [] };
    }
  });

  const { data: rankingData, isLoading: rankingLoading } = useQuery({
    queryKey: ['admin-ranking'],
    queryFn: async () => {
      const res = await fetch('/api/admin/businesses-ranking');
      const json = await res.json();
      return json.success ? json.businesses : [];
    }
  });

  const { data: aiData, isLoading: aiLoading } = useQuery({
    queryKey: ['admin-ai-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ai-metrics');
      const json = await res.json();
      return json.success ? json.metrics : {};
    }
  });

  const metrics = metricsData?.metrics;
  const chartData = metricsData?.chartData || [];
  const ranking = rankingData || [];
  const aiMetrics = aiData || {};

  const loading = metricsLoading || rankingLoading || aiLoading;


  return (
    <DashboardLayout title="Platform Monitoring">
      <div className="max-w-[1400px] mx-auto pt-8 pb-32 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">System Performance</h1>
            <p className="text-[15px] text-zinc-500">
              Track real-time activity, AI performance, and system health across the platform.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="h-11 px-4 bg-[#0A0A0A] border border-white/5 rounded-xl flex items-center gap-3">
                <div className="size-2 rounded-full bg-voxy-primary animate-pulse shadow-[0_0_10px_rgba(0,209,143,0.3)]"></div>
                <span className="text-[13px] font-medium text-white">System: Healthy</span>
             </div>
             <button className="h-11 px-5 bg-[#0A0A0A] text-zinc-500 font-medium text-[13px] rounded-xl hover:text-white hover:border-white/20 transition-all border border-white/5 flex items-center gap-3">
                <Calendar size={14} /> Historical data
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <AdminStatCard 
            title="Total Users" 
            value={metrics?.total_users || 0} 
            trend={`+${metrics?.recent_users_7d || 0}`} 
            positive={true} 
            icon={Users} 
            loading={metricsLoading}
          />
          <AdminStatCard 
            title="Total Conversations" 
            value={metrics?.total_conversations || 0} 
            trend="Active" 
            positive={true} 
            icon={MessageCircle} 
            loading={metricsLoading}
          />
          <AdminStatCard 
            title="AI Token Load" 
            value={aiMetrics?.total_tokens ? `${(aiMetrics.total_tokens / 1000).toFixed(0)}k` : '0k'} 
            trend={`${aiMetrics?.error_rate || 0}% errors`} 
            positive={false} 
            icon={Cpu} 
            loading={aiLoading}
          />
          <AdminStatCard 
            title="Avg Latency" 
            value={aiMetrics?.avg_latency || '0ms'} 
            trend="99.9% uptime" 
            positive={true} 
            icon={Activity} 
            loading={aiLoading}
          />
        </div>

        {/* Visualization & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <TrendingUp size={16} className="text-voxy-primary" />
                  <h2 className="text-[12px] font-semibold text-zinc-500">Growth Projection</h2>
                </div>
                <p className="text-xl font-bold text-white tracking-tight">New user registrations</p>
              </div>
            </div>
            
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D18F" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#00D18F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#404040" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#404040" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0F0F0F', 
                        borderColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'white',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
                      }}
                      itemStyle={{ color: '#00D18F' }}
                      cursor={{ stroke: '#00D18F', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="registrations" 
                      stroke="#00D18F" 
                      fillOpacity={1} 
                      fill="url(#colorArea)" 
                      strokeWidth={2}
                      animationDuration={2000}
                    />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1">
             <SystemHealth />
          </div>
        </div>

        {/* Intelligence & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
           <div className="lg:col-span-2">
              <AuditLogs />
           </div>
           <div className="lg:col-span-1">
              <AIInsight data={aiMetrics} />
           </div>
        </div>

        {/* Business Leaderboard */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
          <div className="p-8 border-b border-white/[0.03] flex items-center justify-between bg-white/[0.01]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <TrendingUp size={16} className="text-voxy-primary" />
                <h2 className="text-[12px] font-semibold text-zinc-500">Business Activity</h2>
              </div>
              <p className="text-xl font-bold text-white tracking-tight">Active platform businesses</p>
            </div>
            <Link 
              href="/lighthouse/businesses" 
              className="px-6 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[13px] font-medium text-zinc-400 hover:text-white hover:border-white/20 transition-all underline decoration-voxy-primary/30 underline-offset-4"
            >
              All businesses
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.03]">
                  <th className="py-5 px-8 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Business</th>
                  <th className="py-5 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider text-center">Engagement</th>
                  <th className="py-5 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider text-center">Owner</th>
                  <th className="py-5 px-8 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {rankingLoading ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                       <Loader2 className="w-8 h-8 animate-spin text-voxy-primary mx-auto opacity-50" />
                    </td>
                  </tr>
                ) : ranking.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-32 text-center opacity-40">
                      <div className="flex flex-col items-center">
                        <Users size={32} className="text-zinc-800 mb-4" />
                        <p className="text-[13px] font-medium text-zinc-600">No activity data available</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ranking.map((business, index) => (
                    <tr key={business.id} className="group hover:bg-white/[0.01] transition-all">
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-5">
                          <div className="size-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-voxy-primary/10 group-hover:border-voxy-primary/30 group-hover:text-voxy-primary transition-all overflow-hidden shrink-0 relative">
                            {business.logo_url ? (
                              <img src={business.logo_url} alt="" className="size-full object-cover" />
                            ) : (
                              <span className="font-bold text-sm uppercase">{business.name.substring(0, 1)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                               <Link 
                                 href={`/lighthouse/businesses/${business.id}`} 
                                 className="font-bold text-white group-hover:text-voxy-primary transition-all tracking-tight flex items-center gap-2"
                               >
                                 {business.name}
                                 <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                               </Link>
                               {business.total_conversations > 50 && (
                                 <CheckCircle2 className="w-3 h-3 text-voxy-primary" />
                               )}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-1">{business.category || 'Standard Service'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div>
                          <p className="text-lg font-bold text-white group-hover:text-voxy-primary transition-colors tabular-nums tracking-tight">{business.total_conversations}</p>
                          <p className="text-[10px] font-medium text-zinc-600 mt-0.5">chats</p>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                         <div>
                            <p className="text-[13px] font-semibold text-zinc-300 tracking-tight">{business.owner_name}</p>
                            <p className="text-[11px] font-medium text-zinc-600 lowercase">{business.owner_email}</p>
                         </div>
                      </td>
                      <td className="py-5 px-8 text-right">
                         <span className="text-[13px] font-medium text-zinc-500 tabular-nums">
                            {new Date(business.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

