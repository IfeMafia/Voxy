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
  const { businessSlug } = resolvedParams;
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [initialConversationId, setInitialConversationId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessAndConversation = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch business by slug
        const busRes = await fetch('/api/businesses?public=true');
        const busData = await busRes.json();
        
        if (busData.success) {
          const foundBusiness = busData.businesses.find(b => b.slug === businessSlug);
          if (foundBusiness) {
            setBusiness(foundBusiness);
            
            // 2. Fetch existing conversation for this business and logged-in user
            if (user) {
              const convRes = await fetch(`/api/conversations?businessId=${foundBusiness.id}`);
              const convData = await convRes.json();
              if (convData.success && convData.conversations?.length > 0) {
                setInitialConversationId(convData.conversations[0].id);
              }
            }
          } else {
            setBusiness(false); // Trigger notFound
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Failed to load business details');
      } finally {
        setLoading(false);
      }
    };

    if (businessSlug) {
      fetchBusinessAndConversation();
    }
  }, [businessSlug, user]);

  if (loading) {
    return (
      <DashboardLayout title="Loading Assistant...">
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
      <div className="h-[calc(100dvh-64px)] flex flex-col max-w-5xl mx-auto w-full -mx-4 -my-2 sm:-mx-8 sm:-my-4">
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatInterface
            business={business}
            userName={user?.name}
            initialConversationId={initialConversationId}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
