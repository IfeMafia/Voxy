import React from 'react';
import { Bot } from 'lucide-react';

export default function BusinessProfileLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-[#00D18F]/20 border-t-[#00D18F] rounded-full animate-spin"></div>
        <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#00D18F]" />
      </div>
      <p className="mt-8 text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px]">Connecting to storefront...</p>
    </div>
  );
}
