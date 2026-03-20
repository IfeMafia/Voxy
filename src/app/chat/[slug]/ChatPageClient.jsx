"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import Navbar from '@/landing/sections/Navbar';

export default function ChatPageClient({ business }) {
  const [initialConversationId, setInitialConversationId] = useState(null);

  useEffect(() => {
    if (business && business.id) {
      const storedId = localStorage.getItem(`voxy_guest_conv_${business.id}`);
      if (storedId) {
        setInitialConversationId(storedId);
      }
    }
  }, [business]);

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans selection:bg-voxy-primary/30 selection:text-white overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col pt-24 pb-8 px-4 md:px-8 max-w-5xl mx-auto w-full overflow-hidden">
        {/* Chat Interface Container */}
        <div className="flex-1 min-h-0 bg-[#0F0F0F] border border-white/[0.05] rounded-[2rem] shadow-2xl overflow-hidden relative group">
           <ChatInterface 
             business={business} 
             userName="Guest" 
             isGuest={true}
             initialConversationId={initialConversationId}
             backUrl="/"
           />
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
           <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black">
              Session is temporary and not stored.
           </p>
           <p className="text-[11px] text-zinc-400 font-medium">
              Want to save this chat?{' '}
              <a href="/login" className="text-voxy-primary hover:underline font-bold transition-all">Log in</a>
              {' '}or{' '}
              <a href="/register" className="text-voxy-primary hover:underline font-bold transition-all">Sign up</a>
           </p>
        </div>
      </main>
    </div>
  );
}
