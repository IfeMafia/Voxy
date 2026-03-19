"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  MessageSquare, 
  Info,
  Layers,
  Award,
  Loader2,
  Bot,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  ChevronLeft
} from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PublicBusinessProfilePage() {
  const { businessSlug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/businesses?slug=${businessSlug}`);
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

    if (businessSlug) {
      fetchBusiness();
    }
  }, [businessSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-16 h-16 animate-spin text-[#00D18F]" />
        <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8 p-6 text-center">
        <div className="size-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-2xl">
          <Bot className="w-12 h-12 text-zinc-800" />
        </div>
        <div className="space-y-2">
           <h1 className="text-3xl font-display font-black text-white tracking-tighter">Business Not Found</h1>
           <p className="text-zinc-500 max-w-xs mx-auto text-sm font-medium">The business you're looking for doesn't exist or hasn't gone live yet.</p>
        </div>
        <Link href="/">
          <Button className="bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-black uppercase tracking-widest px-10 h-14 rounded-2xl">
            Return Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-700">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-zinc-100 dark:border-white/5 h-20">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-10 flex items-center justify-center grayscale contrast-125 hover:grayscale-0 transition-all">
              <img src="/favicon.jpg" alt="Voxy Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase tracking-tighter">VOXY</span>
          </Link>
          
          <Link href={`/customer/chat/${business.slug}`}>
            <Button className="bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-black uppercase tracking-widest px-8 h-12 rounded-xl text-[10px] hidden sm:flex items-center gap-2 shadow-lg shadow-[#00D18F]/20">
              <MessageSquare className="w-4 h-4" />
              Message AI
            </Button>
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-16">
        {/* Hero Section */}
        <div className="relative h-[24rem] sm:h-[32rem] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl group border border-zinc-100 dark:border-white/5">
          <div className="w-full h-full bg-zinc-50 dark:bg-[#0a0a0a] flex items-center justify-center">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <Bot className="w-24 h-24 text-[#00D18F]/10" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          
          <div className="absolute bottom-8 left-8 right-8 sm:bottom-12 sm:left-12 sm:right-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 flex-1 min-w-0">
              <Badge className="bg-[#00D18F] text-white border-none px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl w-fit">
                {business.category === 'Other' ? business.custom_category : business.category}
              </Badge>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black text-white tracking-tighter leading-[0.85] truncate">
                {business.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center gap-2.5">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-black text-xl sm:text-2xl">4.9</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/30 hidden sm:block"></div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-[#00D18F]" />
                  <span className="font-bold text-base sm:text-lg tracking-tight">Active Presence</span>
                </div>
              </div>
            </div>
            
            <Link href={`/customer/chat/${business.slug}`} className="w-full md:w-auto">
              <Button className="w-full bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-black uppercase tracking-widest h-16 sm:h-20 px-10 sm:px-14 rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#00D18F]/20 text-xs sm:text-sm group flex items-center justify-center gap-4 transition-all active:scale-95">
                <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Text our AI
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
          <div className="lg:col-span-2 space-y-16">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00D18F]/10 rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-[#00D18F]" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tight text-zinc-900 dark:text-white">Our Story</h2>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xl leading-relaxed font-medium whitespace-pre-wrap">
                {business.description || "Welcome to our store. We are dedicated to providing the best service to our customers."}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-6 bg-zinc-50 dark:bg-white/5 p-10 rounded-[3rem] transition-all hover:translate-y-[-4px] group/card border border-zinc-100/50 dark:border-white/5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover/card:bg-amber-500 transition-colors">
                    <Award className="w-8 h-8 text-amber-500 group-hover/card:text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-1">Accreditation</h4>
                    <p className="font-display font-black text-2xl text-zinc-900 dark:text-white">Elite Merchant</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 bg-zinc-50 dark:bg-white/5 p-10 rounded-[3rem] transition-all hover:translate-y-[-4px] group/card border border-zinc-100/50 dark:border-white/5">
                  <div className="w-16 h-16 rounded-2xl bg-[#00D18F]/10 flex items-center justify-center group-hover/card:bg-[#00D18F] transition-colors">
                    <Layers className="w-8 h-8 text-[#00D18F] group-hover/card:text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-1">Response Speed</h4>
                    <p className="font-display font-black text-2xl text-zinc-900 dark:text-white">Instant AI</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00D18F]/10 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#00D18F]" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tight text-zinc-900 dark:text-white">Business Hours</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {business.business_hours && Object.keys(business.business_hours).length > 0 ? (
                  Object.entries(business.business_hours).map(([day, hours], idx) => (
                    <div key={idx} className="flex items-center justify-between p-8 bg-zinc-50 dark:bg-white/5 rounded-[2.5rem] border border-zinc-100/50 dark:border-white/5 group hover:border-[#00D18F]/20 transition-all">
                      <div className="space-y-1">
                        <span className="font-black text-[10px] uppercase tracking-[0.3em] text-zinc-400">{day}</span>
                        <p className="font-display font-bold text-2xl text-zinc-900 dark:text-white">
                          {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 font-medium italic p-12 text-center bg-zinc-50 dark:bg-white/5 rounded-[3rem] w-full col-span-2">
                    Operating hours available upon request via chat.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-16">
            <div className="bg-[#00D18F] rounded-[3rem] p-12 text-black space-y-10 shadow-3xl shadow-[#00D18F]/30 relative overflow-hidden group/cta">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -mr-40 -mt-40 transition-transform duration-[3000ms] group-hover/cta:scale-150"></div>
              
              <div className="space-y-4 relative z-10 text-black">
                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40">Ready to chat?</h3>
                <p className="text-4xl font-display font-black tracking-tighter leading-none mb-4">Our AI Expert is Online.</p>
                <p className="text-sm font-bold opacity-70 leading-relaxed">Skip the hold time and get instant answers about our services, pricing, and availability.</p>
              </div>
              
              <Link href={`/customer/chat/${business.slug}`} className="block relative z-10 pt-4">
                <Button className="w-full bg-black text-white hover:bg-zinc-900 rounded-[2rem] h-20 font-black uppercase tracking-[0.2em] text-[11px] border-none shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                  Start Conversation
                  <Bot className="w-6 h-6 text-[#00D18F]" />
                </Button>
              </Link>
            </div>

            <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-100/50 dark:border-white/5 rounded-[3rem] p-12 space-y-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Connect with us</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Twitter, label: 'X' },
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Linkedin, label: 'Linkedin' }
                ].map((social) => (
                  <div key={social.label} className="h-16 bg-white dark:bg-black/40 rounded-2xl flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-white/10 hover:text-[#00D18F] hover:border-[#00D18F]/20 cursor-pointer transition-all shadow-sm">
                    <social.icon className="w-6 h-6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-3 opacity-30 grayscale contrast-200">
             <img src="/favicon.jpg" alt="Voxy Logo" className="w-6 h-6 object-contain" />
             <span className="font-display text-base font-bold tracking-tight text-zinc-900 dark:text-white uppercase tracking-tighter">VOXY PLATFORM</span>
           </div>
           <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">© 2026 {business.name}. Powered by Voxy Intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
