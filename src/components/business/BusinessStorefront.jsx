"use client";

import React from 'react';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  MessageSquare, 
  Info,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Bot,
  Mail,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const BusinessStorefront = ({ business, isPreview = false }) => {
  if (!business) return null;

  const socialIcons = {
    instagram: Instagram,
    twitter: Twitter,
    facebook: Facebook,
    linkedin: Linkedin
  };

  // Filter out empty social links
  const activeSocials = business.social_links ? Object.entries(business.social_links).filter(([_, url]) => !!url) : [];

  return (
    <div className="space-y-10">
      {/* Brand Hero Section */}
      <div className="relative overflow-hidden rounded-[3.5rem] border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#050505] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none transition-all duration-700 hover:border-[#00D18F]/20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#00D18F]/20 to-transparent rounded-full blur-[120px] -mr-80 -mt-80 opacity-50 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#00D18F]/10 to-transparent rounded-full blur-[100px] -ml-40 -mb-40 opacity-50 dark:opacity-10"></div>
        
        <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
          {/* Logo with interactive ring */}
          <div className="relative shrink-0 group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#00D18F]/20 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-[2.5rem] bg-zinc-50 dark:bg-white/[0.02] flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-white/5 shadow-2xl relative z-10">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="text-4xl font-black italic text-[#00D18F]/20 select-none tracking-tighter">VOXY</div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-[#0A0A0A] border border-zinc-100 dark:border-white/5 rounded-2xl flex items-center justify-center shadow-xl z-20 transition-transform group-hover:rotate-12">
              <Bot className="w-6 h-6 text-[#00D18F]" />
            </div>
          </div>

          {/* Brand Identity */}
          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="space-y-3">
              <Badge className="bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                {business.category === 'Other' ? business.custom_category : business.category || 'Business'}
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.9] transition-colors">
                {business.name}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-zinc-50 dark:bg-white/[0.03] rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm transition-all hover:border-[#00D18F]/30 hover:shadow-lg hover:shadow-[#00D18F]/5">
                <MapPin className="w-4 h-4 text-[#00D18F]" />
                <span className="text-[13px] font-bold text-zinc-600 dark:text-zinc-400 tracking-tight">
                  {business.state ? `${business.lga ? business.lga + ', ' : ''}${business.state}` : 'Global Service'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-zinc-50 dark:bg-white/[0.03] rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="w-2.5 h-2.5 rounded-full bg-[#00D18F] opacity-20"></div>
                  ))}
                </div>
                <span className="text-[13px] font-black text-zinc-900 dark:text-white">PREMIUM MERCHANT</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              {isPreview ? (
                <Button disabled className="h-16 px-12 rounded-[2rem] bg-[#00D18F] text-black font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-[#00D18F]/20 opacity-70 cursor-not-allowed border-none">
                  <Bot className="w-5 h-5 mr-3 animate-bounce" />
                  Preview Mode
                </Button>
              ) : (
                <Link href={`/chat/${business.slug}`} className="w-full sm:w-auto">
                  <Button className="group/btn w-full h-16 px-12 rounded-[2rem] bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00D18F] to-emerald-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 mr-3 group-hover/btn:rotate-12 transition-transform" />
                      Open Secure Chat
                    </span>
                  </Button>
                </Link>
              )}
              
              <div className="flex items-center gap-4 text-zinc-400 ml-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-4 border-white dark:border-[#0A0A0A] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                      {i === 3 ? '+' : ''}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest">Active Presence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: About & Content */}
        <div className="lg:col-span-8 space-y-10">
          <section className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden group shadow-xl dark:shadow-none transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
              <Info size={120} strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-5 mb-12">
              <div className="w-14 h-14 bg-gradient-to-br from-[#00D18F]/20 to-emerald-500/10 rounded-[1.2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Info className="w-7 h-7 text-[#00D18F]" />
              </div>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Our Story</h3>
            </div>
            
            <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl leading-relaxed font-medium whitespace-pre-wrap relative z-10 transition-colors">
              {business.description || "Every business has a story waiting to be told. This business owner is yet to provide a detailed description of their unique value and services."}
            </p>
          </section>

          {/* Social Connect Tile - Re-designed */}
          {activeSocials.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeSocials.map(([platform, url]) => {
                const Icon = socialIcons[platform];
                return (
                  <a 
                    key={platform}
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-8 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[2rem] hover:border-[#00D18F]/50 transition-all group shadow-lg dark:shadow-none"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-zinc-50 dark:bg-white/[0.03] rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-[#00D18F] transition-all">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">{platform}</h4>
                        <p className="font-bold text-lg dark:text-white transition-colors">Follow Us</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-[#00D18F] group-hover:translate-x-1 transition-all" />
                  </a>
                );
              })}
            </section>
          )}
        </div>

        {/* Right Column: Contact & Hours */}
        <div className="lg:col-span-4 space-y-10">
          {/* Action Card */}
          <div className="bg-[#00D18F] rounded-[2.5rem] p-10 text-black shadow-2xl shadow-[#00D18F]/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-125"></div>
            
            <div className="relative z-10 space-y-10">
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Contact Point</h3>
                <p className="text-3xl font-black tracking-tighter leading-none">Connect Directly</p>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center gap-5 group/item cursor-pointer">
                  <div className="w-14 h-14 bg-white/30 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner transition-transform group-hover/item:scale-110">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Direct Line</h4>
                    <p className="font-bold text-xl tracking-tight">{business.phone || 'Contact not set'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group/item cursor-pointer">
                  <div className="w-14 h-14 bg-white/30 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner transition-transform group-hover/item:scale-110">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="max-w-[200px]">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Location</h4>
                    <p className="font-bold text-sm tracking-tight leading-snug">
                      {business.street_address ? `${business.street_address}, ` : ''}
                      {business.lga ? `${business.lga}, ` : ''}
                      {business.state || 'Address not set'}
                    </p>
                  </div>
                </div>
              </div>

              <Link href={isPreview ? "#" : `/chat/${business.slug}`}>
                <Button className="group/secure w-full bg-black text-white hover:bg-zinc-900 dark:hover:bg-zinc-800 rounded-3xl h-16 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl transition-all active:scale-[0.98] border border-white/10">
                  <span className="flex items-center justify-center gap-3">
                    Start Voice Interaction
                    <ChevronRight className="w-4 h-4 group-hover/secure:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Business Hours Sidebar */}
          <section className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[2.5rem] p-10 shadow-xl dark:shadow-none">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-[#00D18F]/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#00D18F]" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Availability</h3>
            </div>
            
            <div className="space-y-4">
              {business.business_hours && Object.keys(business.business_hours).length > 0 ? (
                Object.entries(business.business_hours).map(([day, hours], idx) => (
                  <div key={idx} className="flex items-center justify-between py-4 border-b border-zinc-50 dark:border-white/[0.03] last:border-0 group">
                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors">{day}</span>
                    <span className={`font-bold text-[13px] ${hours.closed ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {hours.closed ? 'OFF-PEAK' : `${hours.open} — ${hours.close}`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 px-6 bg-zinc-50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-zinc-200 dark:border-white/10">
                   <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest leading-relaxed">Schedule not available</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BusinessStorefront;
