"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, MessageSquare, Star } from 'lucide-react';

export default function FindBusinessPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/businesses?public=true');
        const data = await res.json();
        if (data.success) {
          setBusinesses(data.businesses);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.custom_category && b.custom_category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout title="Discover">
      <div className="max-w-6xl mx-auto p-4 sm:p-10 space-y-10 animate-in fade-in duration-500">
        
        {/* Minimal Search Bar */}
        <div className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl sm:rounded-[2rem] p-1.5 flex items-center gap-2 focus-within:border-[#00D18F]/30 transition-all shadow-xl dark:shadow-2xl">
          <div className="flex-1 flex items-center px-4">
            <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500 mr-3" />
            <input 
              type="text"
              placeholder="Search local services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
            />
          </div>
          <Button className="hidden sm:flex bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 rounded-full h-11 px-8 text-xs font-bold uppercase tracking-widest shrink-0 shadow-lg transition-transform active:scale-95">
            Search
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-800" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <div 
                key={business.id}
                className="group bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden hover:border-[#00D18F]/30 transition-all flex flex-col shadow-sm hover:shadow-xl dark:shadow-none"
              >
                <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border-b border-zinc-200 dark:border-white/5 overflow-hidden relative">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-black border border-zinc-200 dark:border-white/5 flex items-center justify-center text-[#00D18F]/20 text-2xl font-black italic shadow-inner">VOXY</div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#00D18F] transition-colors">
                        {business.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin size={12} className="text-[#00D18F]" />
                        <span className="text-[10px] text-zinc-500 font-medium truncate">Lagos, Nigeria</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-lg text-amber-500 shrink-0">
                      <Star size={10} fill="currentColor" />
                      <span className="text-[10px] font-bold">4.8</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex items-center justify-between border-t border-zinc-200 dark:border-white/5">
                    <span className="text-[9px] font-bold text-[#00D18F] uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00D18F] animate-pulse" />
                      Active Now
                    </span>

                    <Link href={`/customer/chat/${business.slug}`}>
                      <Button className="bg-[#00D18F]/10 hover:bg-[#00D18F]/20 text-[#00D18F] border border-[#00D18F]/20 rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest transition-all">
                        <MessageSquare className="w-3.5 h-3.5 mr-2" />
                        Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && filteredBusinesses.length === 0 && (
          <div className="text-center py-32 rounded-[3.5rem] border border-dashed border-zinc-200 dark:border-white/5">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">No businesses found</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-600 mb-8 font-medium">Try adjusting your search criteria.</p>
            <Button 
              variant="outline" 
              className="rounded-full border-white/10 text-zinc-400 hover:text-white"
              onClick={() => setSearchQuery("")}
            >
              Reset Search
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
