"use client";

import { useEffect, useState } from 'react';
import { Shield, Server, Database, Globe, RefreshCcw, Loader2 } from 'lucide-react';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system');
      const data = await res.json();
      if (data.success) {
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Fetch Health Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Refresh every 5 minutes
    const interval = setInterval(fetchHealth, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="p-10 bg-zinc-950 border border-white/5 rounded-[40px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Scanning Systems...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8 shadow-2xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">System Status</h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Live Status Monitoring</p>
          </div>
          <button 
            onClick={fetchHealth} 
            className="size-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-[#00D18F] transition-all group"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* DB Status */}
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-[10px] uppercase">Database Cache</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Latency: {health?.database?.latency}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D18F] animate-pulse"></span>
              <span className="text-[9px] font-black text-[#00D18F] uppercase">Online</span>
            </div>
          </div>

          {/* AI Status */}
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-[10px] uppercase">AI Engine</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Provider: {health?.services?.llm_processor?.provider}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D18F]"></span>
              <span className="text-[9px] font-black text-[#00D18F] uppercase">Active</span>
            </div>
          </div>

          {/* Connectivity */}
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-[10px] uppercase">Partner Connections</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase">WhatsApp Gateway</span>
              </div>
            </div>
             <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D18F]"></span>
              <span className="text-[9px] font-black text-[#00D18F] uppercase">Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
         <div className="flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-zinc-600 uppercase">Uptime Monitoring</span>
               <span className="text-white font-bold text-xs">{health?.platform?.uptime}</span>
            </div>
            <div className="flex flex-col text-right">
               <span className="text-[9px] font-black text-zinc-600 uppercase">Mode</span>
               <span className="text-[#00D18F] font-bold text-xs uppercase">{health?.platform?.environment}</span>
            </div>
         </div>
      </div>
    </div>
  );
}
