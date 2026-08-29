"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CTA } from "@/landing/landingData";

export default function CTASection() {
  const router = useRouter();

  return (
    <section className="py-32 sm:py-40 px-6 relative border-t border-white/[0.06] overflow-hidden">

      {/* Very faint radial glow — barely perceptible */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[300px] bg-white/[0.015] rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1240px] mx-auto relative z-10 flex flex-col items-center text-center gap-8">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#00D18F]">
          <span className="w-5 h-px bg-[#00D18F]" />
          {CTA.eyebrow}
        </div>

        {/* Headline — very large, centered */}
        <h2 className="font-sans font-medium text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] max-w-2xl">
          <span className="text-white block">{CTA.headline}</span>
          <span className="text-[#3f3f46] block">{CTA.headlineAccent}</span>
        </h2>

        {/* Body */}
        <p className="text-[#71717a] text-base sm:text-lg leading-relaxed max-w-lg">
          {CTA.body}
        </p>

        {/* Single CTA */}
        <Button
          size="lg"
          className="h-13 px-10 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
          onClick={() => router.push("/register")}
        >
          {CTA.primaryCTA}
        </Button>

        {/* Login link */}
        <button
          onClick={() => router.push("/login")}
          className="text-xs text-[#3f3f46] hover:text-white transition-colors -mt-4"
        >
          {CTA.loginCTA}
        </button>

      </div>
    </section>
  );
}
