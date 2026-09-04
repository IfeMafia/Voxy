"use client";

import { useState, useEffect } from "react";
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children, title }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isLighthouse = pathname?.startsWith('/lighthouse');

  // Total bypass for lighthouse paths
  if (isLighthouse) {
    const [summary, setSummary] = useState({ credits: 0, alerts: 0, status: 'stable' });

    useEffect(() => {
      const eventSource = new EventSource('/api/admin/live');
      eventSource.onmessage = (event) => {
        const { type } = JSON.parse(event.data);
        if (type === 'alert') setSummary(s => ({ ...s, alerts: s.alerts + 1, status: 'warning' }));
      };
      
      // Fetch initial summary
      fetch('/api/admin/health').then(r => r.json()).then(d => {
        if (d.success) setSummary({
          credits: d.health.totalCredits || 0,
          alerts: d.health.alertStats.critical + d.health.alertStats.high,
          status: d.health.status
        });
      });

      return () => eventSource.close();
    }, []);

    return (
      <div className="flex bg-white dark:bg-[#050505] min-h-screen text-zinc-900 dark:text-white transition-colors overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header 
            title={title || 'Voxy Admin'} 
            onMenuClick={() => setIsSidebarOpen(true)}
            businessLogo={user?.business?.logo_url}
            showNotifications={true}
          />
          
          {/* Admin Sticky Summary Bar (NEW) */}
          <div className="bg-[#0A0A0A] border-b border-white/5 py-3 px-8 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
             <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                   <div className="size-2 rounded-full bg-voxy-primary animate-pulse" />
                   <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Live Engine</span>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-600 font-bold uppercase">System Status</span>
                      <span className={`text-[12px] font-bold ${summary.status === 'stable' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {summary.status.toUpperCase()}
                      </span>
                   </div>
                   <div className="h-6 w-px bg-white/5" />
                   <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-600 font-bold uppercase">Active Alerts</span>
                      <span className={`text-[12px] font-bold ${summary.alerts > 0 ? 'text-orange-500' : 'text-zinc-400'}`}>
                         {summary.alerts} URGENT
                      </span>
                   </div>
                   <div className="h-6 w-px bg-white/5" />
                   <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-600 font-bold uppercase">Voxy Points</span>
                      <span className="text-[12px] font-bold text-voxy-primary tabular-nums">
                       {summary.credits.toLocaleString()} VP
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/lighthouse/settings')}
                  className="h-8 px-4 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider"
                >
                  Global Config
                </button>
                <button 
                  onClick={() => router.push('/lighthouse/alerts')}
                  className="h-8 px-4 bg-voxy-primary/10 border border-voxy-primary/20 rounded-lg text-[10px] font-bold text-voxy-primary hover:bg-voxy-primary/20 transition-all uppercase tracking-wider"
                >
                  View Feed
                </button>
             </div>
          </div>

          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 px-4 sm:px-8 py-2 sm:py-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Original logic for everything else
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex bg-white dark:bg-black min-h-screen text-zinc-900 dark:text-white transition-colors overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header 
          title={title || 'Voxy'} 
          onMenuClick={() => setIsSidebarOpen(true)}
          user={user}
          showNotifications={true}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative w-full">
          <div className="flex-1 px-4 sm:px-8 py-2 sm:py-4 relative w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
