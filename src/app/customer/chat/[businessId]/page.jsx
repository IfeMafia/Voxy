"use client";

import React, { use, useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ChatInterface from '@/components/chat/ChatInterface';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function BusinessChatPage({ params }) {
  const resolvedParams = use(params);
  const { businessId } = resolvedParams;
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        // We can reuse /api/businesses?public=true and filter locally or add a specific endpoint
        // For simplicity and since public businesses are few, we fetch all and find
        const res = await fetch('/api/businesses?public=true');
        const data = await res.json();
        if (data.success) {
          const found = data.businesses.find(b => b.id === businessId);
          if (found) {
            setBusiness(found);
          } else {
            setBusiness(false); // Trigger not found
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Failed to load business details');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId]);

  if (loading) {
    return (
      <DashboardLayout title="Loading Concierge...">
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="w-12 h-12 animate-spin text-[#00D18F]" />
        </div>
      </DashboardLayout>
    );
  }

  if (business === false) {
    notFound();
  }

  return (
    <DashboardLayout title={`Chat with ${business?.name}`}>
      <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col max-w-5xl mx-auto">
        <div className="flex-1 overflow-hidden">
          <ChatInterface business={business} userName={user?.name} />
        </div>
      </div>
    </DashboardLayout>
  );
}
