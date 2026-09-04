"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Inbox,
  ShoppingBag,
  Bot,
  ArrowRight,
  FileQuestion
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  const navLinks = [
    { label: "Overview", href: "/business/dashboard", icon: LayoutDashboard, sub: "Business metrics & setup" },
    { label: "Inbox", href: "/business/inbox", icon: Inbox, sub: "Customer conversations" },
    { label: "Products", href: "/business/products", icon: ShoppingBag, sub: "Product catalogue" },
    { label: "AI Employee", href: "/business/ai", icon: Bot, sub: "Configure AI agent" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-[#00D18F]/20 selection:text-[#00D18F]">
      
      {/* Central Card Container matching Voxy Dashboard Section style */}
      <div className="max-w-md w-full bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6">
        
        {/* Top Header & Status */}
        <div className="text-center space-y-3">
          <div className="size-12 rounded-2xl bg-[#00D18F]/10 border border-[#00D18F]/20 flex items-center justify-center mx-auto text-[#00D18F]">
            <FileQuestion className="size-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-[#00D18F]" />
            Error 404
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">
            Page not found
          </h1>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            The page you are looking for doesn't exist, has been removed, or the link may be broken.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => router.back()}
            className="flex-1 h-9 px-4 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.04] text-xs font-medium transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="size-3.5 text-zinc-500" />
            <span>Go back</span>
          </button>

          <Link
            href="/business/dashboard"
            className="flex-1 h-9 px-4 rounded-xl bg-[#00D18F] hover:bg-[#00D18F]/90 text-black text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="size-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Navigation Shortcuts */}
        <div className="pt-4 border-t border-white/[0.06] space-y-2">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Quick Navigation
          </div>

          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#00D18F]/10 group-hover:text-[#00D18F] text-zinc-400 transition-colors">
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-zinc-600 group-hover:text-[#00D18F] transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

      </div>

      {/* Voxy Brand Footer */}
      <div className="mt-8 flex items-center gap-2 text-zinc-600">
        <img
          src="/logo.jpg"
          alt="Voxy Logo"
          className="size-4 rounded object-cover grayscale opacity-50"
        />
        <span className="text-[11px] font-medium tracking-widest uppercase text-zinc-600">
          Voxy
        </span>
      </div>

    </div>
  );
}
