"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Loader2, ExternalLink, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBusiness } from '@/hooks/useBusinessData';
import BusinessStorefront from '@/components/business/BusinessStorefront';

export default function BusinessProfilePreviewPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: business, isLoading } = useBusiness(user?.id);
  const loading = authLoading || isLoading;

  if (loading || authLoading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center justify-center h-60">
          <Loader2 className="size-6 animate-spin text-zinc-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Storefront preview</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              This is exactly what customers see when they visit your link.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/business/settings"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.07] text-xs font-medium transition-colors"
            >
              <Settings className="size-3.5" /> Edit settings
            </Link>
            {business?.slug && (
              <a
                href={'/business/' + business.slug}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.07] text-xs font-medium transition-colors"
              >
                <ExternalLink className="size-3.5" /> Open live link
              </a>
            )}
          </div>
        </div>

        {/* AI training notice */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-xs text-zinc-500">
            Your AI employee learns from this profile automatically. Changes to settings update its knowledge immediately.
          </span>
        </div>

        {/* Storefront */}
        <BusinessStorefront business={business} isPreview={true} />
      </div>
    </DashboardLayout>
  );
}
