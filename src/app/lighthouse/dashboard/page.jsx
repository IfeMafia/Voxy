"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, 
  Building2, 
  MessageCircle, 
  TrendingUp, 
  Settings, 
  Plus, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Calendar,
  Layers,
  CheckCircle2,
  Shield,
  Activity,
  Cpu,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SystemHealth from '@/components/dashboard/SystemHealth';
import AuditLogs from '@/components/dashboard/AuditLogs';
import AIInsight from '@/components/dashboard/AIInsight';

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [aiMetrics, setAiMetrics] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = true; // BYPASS FOR TESTING

  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsRes, rankingRes, aiRes] = await Promise.all([
          fetch('/api/admin/metrics'),
          fetch('/api/admin/businesses-ranking'),
          fetch('/api/admin/ai-metrics')
        ]);

        const metricsData = await metricsRes.json();
        const rankingData = await rankingRes.json();
        const aiData = await aiRes.json();

        if (metricsData.success) {
          setMetrics(metricsData.metrics);
          setChartData(metricsData.chartData || []);
        }
        if (rankingData.success) {
          setRanking(rankingData.businesses);
        }
        if (aiData.success) {
          setAiMetrics(aiData.metrics);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (!isAdmin && !loading) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center p-20 bg-zinc-950 rounded-3xl border border-white/5">
          <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
            <Settings className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Admin Only</h2>
          <p className="text-zinc-500 max-w-sm text-center">
            This section is restricted to platform administrators. Please contact support if you believe this is an error.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
// ... existing loading state ...
    return (
      <DashboardLayout title="Analytics & Metrics">
        <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-zinc-500 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
          <p className="font-bold uppercase tracking-widest text-xs">Calibrating Platform Data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { 
      label: 'Total Users', 
      value: metrics?.total_users || 0, 
      icon: Users,
      trend: { value: metrics?.recent_users_7d || 0, label: 'New last 7 days', positive: true }
    },
    { 
      label: 'Total Conversations', 
      value: metrics?.total_conversations || 0, 
      icon: MessageCircle,
      trend: { value: metrics?.total_messages || 0, label: 'Messages Sent', positive: true }
    },
    { 
      label: 'AI Processor Load', 
      value: `${(aiMetrics?.total_tokens / 1000).toFixed(0)}k`, 
      icon: Cpu,
      trend: { value: aiMetrics?.error_rate, label: 'Error Rate', positive: true }
    },
    { 
      label: 'Average Latency', 
      value: aiMetrics?.avg_latency || '...', 
      icon: Activity,
      trend: { value: '99.9%', label: 'Uptime', positive: true }
    },
  ];

  return (
    <DashboardLayout title="Admin Analytics">
      <div className="space-y-10 pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 bg-[#00D18F]/10 text-[#00D18F] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#00D18F]/20">
                LIVE Monitoring
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D18F] animate-pulse"></span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Admin Dashboard</h1>
          </div>
          <div className="flex gap-4">
            <button className="px-5 py-2.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-[#00D18F] transition-all group">
              <Calendar className="w-4 h-4" />
              This Month
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <div 
              key={i} 
              className="relative overflow-hidden p-8 bg-zinc-900 border border-white/5 rounded-3xl group hover:border-[#00D18F]/30 transition-all shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <stat.icon size={100} />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest leading-none">{stat.label}</h3>
                  <div className="text-4xl font-black text-white mt-4 tracking-tight group-hover:text-[#00D18F] transition-colors">{stat.value}</div>
                </div>
                <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-[#00D18F] transition-colors">
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2">
                {stat.trend.positive ? (
                  <ArrowUpRight className="w-4 h-4 text-[#00D18F]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-black ${stat.trend.positive ? "text-[#00D18F]" : "text-red-500"}`}>
                  {stat.trend.value}
                </span>
                <span className="text-zinc-500 text-xs font-bold">{stat.trend.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts & System Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#050505] border border-white/5 rounded-[40px] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">User Growth</h2>
                <p className="text-zinc-500 text-sm font-bold mt-1 uppercase tracking-wider">Registration trends over time</p>
              </div>
              <div className="size-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#00D18F]">
                 <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D18F" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00D18F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#52525b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#09090b', 
                        borderColor: '#27272a',
                        borderRadius: '16px',
                        borderWidth: '1px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}
                      itemStyle={{ color: '#00D18F' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="registrations" 
                      stroke="#00D18F" 
                      fillOpacity={1} 
                      fill="url(#colorRegistrations)" 
                      strokeWidth={3}
                    />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1">
             <SystemHealth />
          </div>
        </div>

        {/* Audit Logs & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
           <div className="lg:col-span-2">
              <AuditLogs />
           </div>
           
           <div className="lg:col-span-1">
              <AIInsight data={aiMetrics} />
           </div>
        </div>

        {/* Ranking List */}
        <div className="bg-[#050505] border border-white/5 rounded-[40px] p-10 shadow-2xl mt-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Active Businesses</h2>
              <p className="text-zinc-500 text-sm font-bold mt-1 uppercase tracking-wider">Ranked by overall platform engagement</p>
            </div>
            <div className="flex gap-2">
              <div className="size-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white/40">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4">Business</th>
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 text-center">Activity</th>
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 text-center">Owner</th>
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                      No active businesses found
                    </td>
                  </tr>
                ) : (
                  ranking.map((business, index) => (
                    <tr key={business.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white/50 group-hover:border-[#00D18F]/50 group-hover:bg-[#00D18F]/10 group-hover:text-[#00D18F] transition-all overflow-hidden shrink-0">
                            {business.logo_url ? (
                              <img src={business.logo_url} alt="" className="size-full object-cover" />
                            ) : (
                              <span className="font-black text-sm uppercase">{business.name.substring(0, 2)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                               <div className="font-black text-white group-hover:text-[#00D18F] transition-colors truncate">{business.name}</div>
                               {business.total_conversations > 50 && (
                                 <CheckCircle2 className="w-3.5 h-3.5 text-[#00D18F]" title="Verified Business" />
                               )}
                            </div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-0.5">{business.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-lg font-black text-white group-hover:text-[#00D18F] transition-colors">{business.total_conversations}</span>
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Inquiries</span>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold text-white/80">{business.owner_name}</span>
                          <span className="text-[9px] font-medium text-zinc-500">{business.owner_email}</span>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <button className="p-3 text-zinc-500 hover:text-white transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
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

