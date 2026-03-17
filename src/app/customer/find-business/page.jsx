"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Star, MessageSquare, MapPin, Loader2, Bot, Bookmark, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FindBusinessPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("Lagos, Nigeria");
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
        } else {
          throw new Error(data.error || 'Failed to fetch');
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
    <DashboardLayout title="Find Businesses">
      <div className="max-w-7xl mx-auto space-y-12 p-4 md:p-8">
        
        {/* Search Header Section */}
        <div className="relative max-w-4xl mx-auto pt-4 pb-8">
          <div className="relative flex flex-col md:flex-row items-center bg-[#111111] border border-white/5 rounded-[2.5rem] p-2 pr-4 shadow-2xl transition-all duration-700">
            <div className="flex-1 flex items-center min-w-0">
              <Search className="w-6 h-6 ml-6 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search for services, businesses, or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-6 py-5 text-lg text-white placeholder:text-zinc-600 font-medium tracking-tight"
              />
            </div>
            <div className="hidden md:block w-px h-10 bg-white/10 mx-2" />
            <div className="flex items-center px-4 w-full md:w-auto">
              <MapPin className="w-5 h-5 text-[#00D18F]/60" />
              <select 
                className="bg-transparent text-white border-none outline-none px-3 font-bold text-xs uppercase tracking-widest cursor-pointer"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              >
                <option value="Lagos, Nigeria">Lagos, Nigeria</option>
                <option value="Abuja, Nigeria">Abuja, Nigeria</option>
                <option value="Enugu, Nigeria">Enugu, Nigeria</option>
              </select>
            </div>
            <Button className="bg-[#00D18F] hover:bg-[#00A370] text-black font-black uppercase tracking-widest rounded-3xl h-14 px-12 ml-2 shadow-xl shadow-[#00D18F]/20">
              Search
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <Loader2 className="w-16 h-16 animate-spin text-[#00D18F]" />
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Scanning Businesses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {filteredBusinesses.map((business, idx) => (
              <div 
                key={business.id}
                className="group relative bg-[#111111] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-[#00D18F]/20 transition-all duration-700 animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Card Top: Image Placeholder or Color */}
                <div className="h-64 relative bg-[#0a0a0a] overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-700" />
                  <div className="absolute top-6 left-6 z-10">
                    <Badge className="bg-black/60 backdrop-blur-xl text-white border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl">
                      {business.category === 'Other' ? business.custom_category : (business.category || 'Business')}
                    </Badge>
                  </div>
                  <button className="absolute top-6 right-6 z-10 p-3 bg-black/60 backdrop-blur-xl text-white rounded-xl hover:text-[#00D18F] transition-all">
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <div className="size-full flex items-center justify-center bg-zinc-900">
                    <Bot className="w-16 h-16 text-[#00D18F]/20" />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-8 pt-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-display font-bold text-white tracking-tight group-hover:text-[#00D18F] transition-colors leading-tight truncate">
                        {business.name}
                      </h3>
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#00D18F]/60" />
                        {locationQuery}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 rounded-lg">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-amber-500">4.8</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                       <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D18F]"></span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#00D18F]">Open</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="p-2.5 bg-white/[0.03] rounded-xl text-zinc-400 hover:text-white transition-all">
                        <Phone className="w-5 h-5" />
                      </button>
                      <Link href={`/customer/chat/${business.id}`}>
                        <Button className="bg-[#00D18F]/5 hover:bg-[#00D18F]/10 text-[#00D18F] border border-[#00D18F]/20 rounded-xl px-5 h-11 text-[10px] font-black uppercase tracking-widest transition-all">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && filteredBusinesses.length === 0 && (
          <div className="text-center py-32 bg-white/[0.02] rounded-[4rem] border-4 border-dashed border-white/5">
            <h3 className="text-4xl font-display font-bold text-white tracking-tight">No businesses found</h3>
            <p className="text-zinc-500 mt-4 text-xl font-medium opacity-80">Try adjusting your search criteria.</p>
            <Button 
              variant="outline" 
              className="mt-10 rounded-3xl px-12 h-14 border-2 border-white/10 font-black uppercase tracking-widest text-xs text-white hover:bg-white/5"
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

