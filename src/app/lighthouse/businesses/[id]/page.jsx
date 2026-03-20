"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Building2, 
  Activity, 
  DollarSign, 
  Cpu, 
  Settings, 
  ShieldAlert, 
  ArrowLeft,
  Power,
  Zap,
  Gauge,
  Loader2,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export default function BusinessDetailsPage({ params }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [controls, setControls] = useState({
    is_ai_enabled: true,
    rate_limit_per_min: 60,
    forced_model: ''
  });

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/admin/businesses/${id}`);
      const data = await res.json();
      
      if (data.success) {
        setBusiness(data.business);
        setControls({
          is_ai_enabled: data.business.is_ai_enabled ?? true,
          rate_limit_per_min: data.business.rate_limit_per_min ?? 60,
          forced_model: data.business.forced_model ?? ''
        });
      } else {
        toast.error(data.error || 'Failed to fetch details');
      }
    } catch (e) {
      console.error(e);
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveControls = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/business-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: id, controls }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Controls updated successfully');
      } else {
        toast.error('Failed to update controls');
      }
    } catch (e) {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-zinc-500">
          <Loader2 className="w-10 h-10 animate-spin text-voxy-primary mb-4" />
          <p className="text-[13px] font-medium">Retrieving business forensics...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout title="Not Found">
        <div className="p-20 text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-white mb-4">Business record not found</h2>
          <Link href="/lighthouse/businesses" className="text-voxy-primary font-medium hover:underline flex items-center gap-2">
            <ArrowLeft size={16} /> Back to directory
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { stats } = business;

  const statCards = [
    { label: 'LLM Tokens', value: stats.totalLlmTokens.toLocaleString(), icon: Cpu, cost: `$${stats.llmCost.toFixed(2)}` },
    { label: 'STT Duration', value: `${stats.totalSttDuration.toFixed(1)}s`, icon: Activity, cost: `$${stats.sttCost.toFixed(2)}` },
    { label: 'TTS Usage', value: stats.totalTtsUsage.toLocaleString(), icon: Activity, cost: `$${stats.ttsCost.toFixed(2)}` },
    { label: 'Total Requests', value: stats.requestsCount, icon: Settings, cost: `$${stats.totalCost.toFixed(2)}` },
  ];

  return (
    <DashboardLayout title={`${business.name} Control`}>
      <div className="max-w-[1400px] mx-auto pt-8 pb-32 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link href="/lighthouse/businesses" className="text-[13px] font-medium text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={14} /> Back to Businesses
            </Link>
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-white tracking-tight">{business.name}</h1>
                  <Badge variant="outline" className={`
                    text-[10px] font-bold px-3 py-0.5 border-0 uppercase tracking-widest
                    ${business.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                      business.status === 'suspended' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'}
                  `}>
                    {business.status}
                  </Badge>
               </div>
               <p className="text-[15px] text-zinc-500 font-medium">{business.owner_email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={handleSaveControls}
                disabled={saving}
                className="h-11 px-8 bg-voxy-primary text-black font-bold text-[13px] rounded-xl hover:bg-voxy-primary/90 transition-all flex items-center gap-3 shadow-xl shadow-voxy-primary/10 disabled:opacity-50"
             >
               {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
               Save Configuration
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {statCards.map((stat, i) => (
                <div key={i} className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl flex flex-col h-full hover:border-white/10 transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-voxy-primary transition-colors">
                      <stat.icon size={18} />
                    </div>
                  </div>
                  <div className="mt-auto">
                    <h3 className="text-3xl font-bold text-white mb-2 tracking-tight tabular-nums">{stat.value}</h3>
                    <p className="text-[13px] font-medium text-voxy-primary/80">Consumption Cost: {stat.cost}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Usage History */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Activity size={18} className="text-voxy-primary" />
                <h2 className="text-xl font-bold text-white tracking-tight">Recent Activity Log</h2>
              </div>
              
              <div className="space-y-3">
                {business.charts?.length === 0 ? (
                  <div className="py-10 text-center text-zinc-600">
                     <p className="text-[14px] font-medium">No usage records found for this period</p>
                  </div>
                ) : (
                  business.charts?.map(day => (
                    <div key={day.date} className="flex items-center justify-between p-5 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all group">
                      <div className="text-[15px] font-semibold text-zinc-300">{day.date}</div>
                      <div className="flex items-center gap-8">
                        <div className="text-zinc-500 font-medium text-[13px]">{day.count} requests</div>
                        <div className="text-voxy-primary font-bold tabular-nums">${day.cost.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Intervention Panel */}
          <div className="space-y-8">
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8 sticky top-8">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-voxy-primary/10 flex items-center justify-center text-voxy-primary">
                    <Zap size={16} />
                 </div>
                 <h3 className="text-base font-bold text-white tracking-tight">Intervention Center</h3>
              </div>

              <div className="space-y-6">
                 {/* AI Kill Switch */}
                 <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="space-y-0.5">
                       <p className="text-sm font-bold text-white">AI Status</p>
                       <p className="text-[11px] text-zinc-500 font-medium">Kill-switch for all bot responses</p>
                    </div>
                    <button 
                      onClick={() => setControls({...controls, is_ai_enabled: !controls.is_ai_enabled})}
                      className={`size-10 rounded-full flex items-center justify-center transition-all ${controls.is_ai_enabled ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white'}`}
                    >
                      <Power size={18} />
                    </button>
                 </div>

                 {/* Rate Limiting */}
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <p className="text-sm font-bold text-white">Rate Limit</p>
                       <Badge variant="outline" className="text-voxy-primary border-voxy-primary/20">{controls.rate_limit_per_min} rpm</Badge>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="300" 
                      value={controls.rate_limit_per_min}
                      onChange={(e) => setControls({...controls, rate_limit_per_min: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-voxy-primary"
                    />
                    <p className="text-[11px] text-zinc-500 font-medium">Requests allowed per minute for this business.</p>
                 </div>

                 {/* Model Override */}
                 <div className="space-y-3">
                    <p className="text-sm font-bold text-white">Model Force Override</p>
                    <div className="relative">
                      <select 
                        value={controls.forced_model}
                        onChange={(e) => setControls({...controls, forced_model: e.target.value})}
                        className="w-full bg-[#0F0F0F] border border-white/5 rounded-xl px-5 h-12 text-[13px] font-bold text-white outline-none focus:border-voxy-primary/40 appearance-none cursor-pointer transition-all"
                      >
                        <option value="">Use Global Default</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="gpt-4o">GPT-4o</option>
                      </select>
                      <Gauge className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-zinc-600 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">Overrides the platform settings for this specific business instance.</p>
                 </div>

                 <div className="pt-4 border-t border-white/5">
                    <button className="w-full h-12 bg-red-500/5 border border-red-500/10 rounded-xl text-[11px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-3">
                       <ShieldAlert size={14} /> Global Ban Account
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
