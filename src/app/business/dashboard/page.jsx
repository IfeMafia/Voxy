"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import StatsCards from '@/components/dashboard/StatsCards';
import ConversationChart from '@/components/dashboard/ConversationChart';
import RecentConversations from '@/components/dashboard/RecentConversations';
import ProfileHealth from '@/components/dashboard/ProfileHealth';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    activeToday: 0,
    aiResolved: 0,
    ownerInterventions: 0
  });
  const [business, setBusiness] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchDashboardData = async (range) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/businesses/dashboard?range=${range || timeRange}`);
      const data = await res.json();

      if (data.success && data.business) {
        setBusiness(data.business);
        setStats(data.stats);
        
        setConversations((data.conversations || []).map(c => ({
          ...c,
          time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          customer_name: c.customer_name || 'Customer'
        })));
        
        setChartData(data.chartData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData(timeRange);
    }
  }, [user]);

  // Handle time range change
  useEffect(() => {
    if (business?.id && !loading && user) {
      fetchDashboardData(timeRange);
    }
  }, [timeRange]);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        <div>
          <p className="text-zinc-400">
            Welcome back, <span className="text-[#00D18F] font-semibold">{user?.name?.split(' ')[0] || 'Business Owner'}</span>. Here’s what’s happening with your business today.
          </p>
        </div>


        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ConversationChart 
              data={chartData} 
              timeRange={timeRange}
              setTimeRange={setTimeRange}
            />
            <RecentConversations conversations={conversations} />
          </div>
          <div>
            <ProfileHealth business={business} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
