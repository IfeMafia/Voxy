import React from 'react';
import { Bot } from 'lucide-react';

export default function BusinessStorefrontLoading() {
  return (
    <div className="min-h-screen bg-[#060709] flex flex-col items-center justify-center p-6 text-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#00D18F]/20 border-t-[#00D18F] rounded-full animate-spin"></div>
        <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#00D18F]" />
      </div>
      <p className="mt-6 text-zinc-400 font-semibold uppercase tracking-widest text-[11px]">Connecting to storefront...</p>
    </div>
  );
}
