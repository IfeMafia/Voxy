import React from "react";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00D18F]/30 selection:text-[#00D18F] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      
      <div className="space-y-8 max-w-lg z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00D18F]/20 bg-[#00D18F]/5 px-4 py-1.5 text-xs font-semibold text-[#00D18F] backdrop-blur-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D18F] opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-[#00D18F]"></span>
          </span>
          Error 404
        </div>

        <h1 className="text-8xl font-extrabold tracking-tight sm:text-9xl">
          <span className="text-[#00D18F]">
            404
          </span>
        </h1>
        
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-zinc-100">
          Lost in translation?
        </h2>
        
        <p className="text-base text-zinc-400 sm:text-lg leading-relaxed px-4">
          The page you're looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        
        <div className="pt-4 flex justify-center">
          <Link 
            href="/"
            className="group relative inline-flex items-center justify-center rounded-full bg-[#00D18F] px-8 py-4 text-sm font-bold text-black transition-all hover:brightness-110 active:scale-95"
          >
            Return Home
          </Link>
        </div>
      </div>
      
      {/* Footer / Branding line */}
      <div className="absolute bottom-12 flex items-center gap-2 text-zinc-600">
        <img src="/logo.jpg" alt="Voxy Logo" className="size-4 rounded object-cover grayscale opacity-50" />
        <span className="text-xs font-medium tracking-widest uppercase">
          Voxy
        </span>
      </div>
    </div>
  );
};

export default NotFound;
