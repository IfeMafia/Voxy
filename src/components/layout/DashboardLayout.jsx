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

  useEffect(() => {
    // FORCE NO REDIRECT FOR LIGHTHOUSE
    console.log("DashboardLayout DEBUG:", { pathname, isLighthouse, loading, user: !!user });
  }, [user, loading, pathname, isLighthouse]);

  // Total bypass for lighthouse paths
  if (isLighthouse) {
    return (
      <div className="flex bg-white dark:bg-black min-h-screen text-zinc-900 dark:text-white transition-colors overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header 
            title={title || 'Voxy Admin'} 
            onMenuClick={() => setIsSidebarOpen(true)}
            businessLogo={user?.business?.logo_url}
          />
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
      <div className="flex items-center justify-center min-h-screen bg-black">
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
          businessLogo={user?.business?.logo_url}
        />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 px-4 sm:px-8 py-2 sm:py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
