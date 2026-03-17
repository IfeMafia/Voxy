"use client";

import { useState, useEffect } from "react";
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children, title }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Role-based layout guard
      const pathname = window.location.pathname;
      const userRole = user.role === 'business_owner' ? 'business' : user.role;
      
      const roleDashboards = {
        customer: '/customer',
        business: '/business',
        admin: '/lighthouse'
      };

      const correctPath = roleDashboards[userRole];
      
      // If user is on a dashboard path that doesn't belong to their role, redirect them
      if (correctPath) {
        if (pathname.startsWith('/customer') && userRole !== 'customer') {
          router.replace(roleDashboards[userRole] + (userRole === 'customer' ? '/chat' : '/dashboard'));
        } else if (pathname.startsWith('/business') && userRole !== 'business') {
          router.replace(roleDashboards[userRole] + (userRole === 'customer' ? '/chat' : '/dashboard'));
        } else if (pathname.startsWith('/lighthouse') && userRole !== 'admin') {
          router.replace(roleDashboards[userRole] + (userRole === 'customer' ? '/chat' : '/dashboard'));
        }
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
      </div>
    );
  }

  // Double check role mismatch before rendering to prevent flash
  const userRole = user?.role === 'business_owner' ? 'business' : user?.role;
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  if (
    (pathname.startsWith('/customer') && userRole !== 'customer') ||
    (pathname.startsWith('/business') && userRole !== 'business') ||
    (pathname.startsWith('/lighthouse') && userRole !== 'admin')
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
      </div>
    );
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
