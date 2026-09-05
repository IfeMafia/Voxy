"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HERO } from "@/landing/landingData";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-[100vh] flex flex-col overflow-hidden">

      {/* ── Hero Content — pushed to upper portion ── */}
      <div className="relative z-10 flex flex-col items-center text-center gap-6 pt-32 pb-10 px-6">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#00D18F]">
          <span className="w-5 h-px bg-[#00D18F]" />
          AI Employee for Your Business
        </div>

        {/* Headline */}
        <h1 className="font-sans font-medium text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] max-w-2xl">
          <span className="text-white block">{HERO.headline}</span>
          <span className="text-[#3f3f46] block">{HERO.headlineAccent}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#71717a] text-sm sm:text-base leading-relaxed max-w-lg">
          {HERO.body}
        </p>

        {/* Buttons */}
        <div className="flex flex-row items-center justify-center gap-3 flex-wrap pt-1">
          <Button
            size="lg"
            className="h-11 px-8 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => router.push("/register")}
          >
            {HERO.primaryCTA}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-11 px-8 rounded-full border-white/[0.12] text-white bg-transparent hover:bg-white/[0.06] font-medium text-sm transition-all"
            onClick={() => {
              const el = document.getElementById("how-it-works");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {HERO.secondaryCTA}
          </Button>
        </div>
      </div>

      {/* ── Equalizer Beams — fills the empty space below content ── */}
      <div className="relative flex-1 w-full overflow-hidden pointer-events-none" style={{ minHeight: '160px', maxHeight: '240px' }}>
        {/* Gradient fade — blends top of beams into the page */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black to-transparent z-10" />

        {/* Beams */}
        <div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-center gap-1 sm:gap-1.5 px-4 opacity-60 mix-blend-screen">
          {Array.from({ length: 60 }).map((_, i) => {
            const distance = Math.abs(i - 30);
            const heightFactor = Math.max(0.1, 1 - distance / 30);
            const randomVariance = (Math.sin(i * 0.9) + 1) * 0.2;
            const finalHeight = `${Math.min(98, (heightFactor + randomVariance) * 100)}%`;
            const opacity = Math.max(0.2, 1 - distance / 35);
            return (
              <div
                key={i}
                className="w-[3px] sm:w-1 rounded-full bg-gradient-to-t from-transparent via-[#00D18F]/70 to-[#00D18F]"
                style={{
                  height: finalHeight,
                  opacity,
                  animation: `equalizer ${2 + (i % 6) * 0.35}s ease-in-out infinite alternate`,
                  animationDelay: `${(i % 12) * 0.1}s`,
                }}
              />
            );
          })}
        </div>

        {/* Bottom fade — blends into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent z-10" />
      </div>

    </section>
  );
}
