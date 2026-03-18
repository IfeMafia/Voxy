"use client";

import { useEffect, useState } from 'react';
import { Layers, Activity, Clock, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('Fetch Logs Error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'warning': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'success': return 'text-[#00D18F] bg-[#00D18F]/10 border-[#00D18F]/20';
      case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getSeverityIcon = (severity) => {
     switch (severity) {
      case 'warning': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'error': return <AlertCircle className="w-3.5 h-3.5" />;
      default: return <Info className="w-3.5 h-3.5" />;
    }
  };

  if (loading) {
    return (
      <div className="p-10 bg-zinc-950 border border-white/5 rounded-[40px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Retrieving Audit Trails...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Access Registry</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Platform Activity Stream</p>
        </div>
        <div className="size-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500">
           <Layers className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 max-h-[400px] pr-2 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
             <Activity className="size-10 mb-4 opacity-10" />
             <span className="text-[10px] font-black uppercase tracking-widest">No Recent Registry Activity</span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="relative pl-6 border-l border-white/5 group hover:border-[#00D18F]/30 transition-all">
               <div className="absolute top-0 -left-1.5 size-3 rounded-full bg-zinc-900 border border-white/10 group-hover:bg-[#00D18F] group-hover:border-[#00D18F] transition-all"></div>
               
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                     <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getSeverityColor(log.severity)}`}>
                        {getSeverityIcon(log.severity)}
                        {log.action}
                     </span>
                     <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{log.user}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-600">
                     <Clock className="w-3 h-3" />
                     <span className="text-[9px] font-bold uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
               </div>
               
               <p className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors leading-relaxed">
                  {log.details}
               </p>
            </div>
          ))
        )}
      </div>

      <button className="mt-8 w-full py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all">
        View All Registry Data
      </button>
    </div>
  );
}
