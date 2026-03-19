"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  MessageSquare, 
  ChevronLeft,
  Info,
  Loader2,
  Bot,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Edit,
  ExternalLink,
  Mail
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function BusinessProfilePreviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await fetch('/api/businesses');
        const data = await res.json();
        if (data.success && data.business) {
          setBusiness(data.business);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchBusiness();
    }
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <DashboardLayout title="Presence">
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading presence...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Presence">
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 py-6 px-4">
        
        {/* Top Navigation & Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard">
              <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A] hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                <ChevronLeft className="w-5 h-5 text-zinc-500" />
              </Button>
            </Link>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Business Presence</h1>
              <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-600">This is how your storefront appears to customers.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/business/settings" className="flex-1 sm:flex-none">
              <Button className="w-full bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#00D18F]/10">
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            </Link>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
              Live Preview
            </Badge>
          </div>
        </div>

        {/* Brand Card / Hero */}
        <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A] shadow-sm transition-colors duration-500">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00D18F]/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-colors duration-500"></div>
          
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            {/* Logo Container */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-white/5 shadow-inner transition-transform duration-500 hover:scale-[1.02]">
              {business?.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-12 h-12 text-[#00D18F]/30" />
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-2">
                <Badge className="bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">
                  {business?.category === 'Other' ? business?.custom_category : business?.category || 'Business'}
                </Badge>
                <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter transition-colors duration-500">
                  {business?.name}
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-white/[0.03] rounded-xl border border-zinc-100 dark:border-white/5 transition-colors duration-500">
                  <MapPin className="w-4 h-4 text-[#00D18F]" />
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 tracking-tight transition-colors duration-500">
                    {business?.address || 'Lagos, Nigeria'}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-white/[0.03] rounded-xl border border-zinc-100 dark:border-white/5 transition-colors duration-500">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-white transition-colors duration-500">4.9/5.0</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Preview */}
            <div className="flex flex-col gap-3 w-full md:w-auto justify-end">
              <Button disabled className="w-full md:w-56 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-xl h-14 font-bold border-none transition-all cursor-not-allowed opacity-50">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="uppercase tracking-widest text-[10px]">Chat Now</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[2rem] p-8 md:p-10 transition-colors duration-500 group shadow-sm dark:shadow-none">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#00D18F]/10 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-[#00D18F]" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white transition-colors duration-500">About {business?.name || 'Business'}</h3>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[16px] leading-relaxed font-medium transition-colors duration-500 whitespace-pre-wrap">
                {business?.description || "A dedicated business focused on delivering quality services to the community. Visit our settings to update this profile info."}
              </p>
            </div>

            {/* Operating Hours */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[2rem] p-8 md:p-10 transition-colors duration-500 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#00D18F]/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#00D18F]" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white transition-colors duration-500">Business Hours</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {business?.business_hours && Object.keys(business.business_hours).length > 0 ? (
                  Object.entries(business.business_hours).map(([day, hours], idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-white/[0.03] rounded-2xl border border-zinc-100 dark:border-white/5 transition-colors duration-500">
                      <span className="font-bold text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{day}</span>
                      <span className={`font-bold text-sm ${hours.closed ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-white'}`}>
                        {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="col-span-2 text-zinc-400 font-medium italic p-8 text-center bg-zinc-50 dark:bg-white/[0.03] rounded-2xl border border-dashed border-zinc-200 dark:border-white/5">
                    No operating hours configured yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Quick Connect */}
          <div className="space-y-8">
            <div className="bg-[#00D18F] rounded-[2rem] p-8 text-black space-y-8 shadow-xl shadow-[#00D18F]/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-[2000ms] group-hover:scale-125"></div>
              
              <div className="space-y-1 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Contact Info</h3>
                <p className="text-2xl font-black tracking-tight">Get in Touch</p>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4 group/item">
                  <div className="w-11 h-11 bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform group-hover/item:scale-110">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">Phone</h4>
                    <p className="font-bold text-lg tracking-tight">{business?.phone || '+234 800 VOXY'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group/item">
                  <div className="w-11 h-11 bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform group-hover/item:scale-110">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">Web</h4>
                    <p className="font-bold text-lg tracking-tight">voxy.app/{business?.slug || 'merchant'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group/item">
                  <div className="w-11 h-11 bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform group-hover/item:scale-110">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">Support Email</h4>
                    <p className="font-bold text-lg tracking-tight">support@voxy.app</p>
                  </div>
                </div>
              </div>
              
              <Button disabled className="w-full bg-black/10 hover:bg-black/20 text-black border-2 border-black/10 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] relative z-10 cursor-not-allowed">
                View Website
              </Button>
            </div>

            {/* Social presence */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[2rem] p-8 transition-colors duration-500 shadow-sm dark:shadow-none">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-600 mb-6">Social Pulse</h4>
              <div className="grid grid-cols-4 gap-3">
                {[Instagram, Twitter, Facebook, Linkedin].map((Icon, idx) => (
                  <div 
                    key={idx} 
                    className="h-12 bg-zinc-50 dark:bg-white/[0.03] rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-white/5 hover:text-[#00D18F] hover:border-[#00D18F]/30 transition-all cursor-pointer"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
