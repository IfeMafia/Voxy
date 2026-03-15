import React from "react";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 selection:text-emerald-400 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 -z-10 h-[400px] w-full max-w-3xl bg-[radial-gradient(circle_farthest-side_at_50%_50%,rgba(16,185,129,0.15),transparent)] mix-blend-screen" />
      
      <div className="space-y-8 max-w-lg z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
          </span>
          Error 404
        </div>

        <h1 className="text-8xl font-extrabold tracking-tight sm:text-9xl">
          <span className="bg-gradient-to-br from-emerald-400 to-teal-600 bg-clip-text text-transparent">
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
            className="group relative inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-4 text-sm font-bold text-black transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95"
          >
            Return Home
            <span className="absolute inset-0 rounded-full bg-emerald-400 blur transition-all group-hover:blur-lg opacity-20 -z-10"></span>
          </Link>
        </div>
      </div>
      
      {/* Footer / Branding line */}
      <div className="absolute bottom-12 flex items-center gap-2 text-zinc-600">
        <div className="size-4 rounded bg-emerald-500/20 flex items-center justify-center">
          <div className="size-2 rounded bg-emerald-500/50" />
        </div>
        <span className="text-xs font-medium tracking-widest uppercase">
          LocalVoice AI
        </span>
      </div>
    </div>
  );
};

export default NotFound;
