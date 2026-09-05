"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FEATURES, SECTION_IDS } from "@/landing/landingData";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export default function FeaturesSection() {
  const router = useRouter();

  return (
    <section
      id={SECTION_IDS.features}
      className="py-24 sm:py-32 px-6 relative border-t border-white/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto space-y-16">

        {/* ── Section Header — two-line Verity style ── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#00D18F]">
            <span className="w-5 h-px bg-[#00D18F]" />
            {FEATURES.eyebrow}
          </div>
          <h2 className="font-sans font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
            <span className="text-white block">{FEATURES.headline}</span>
            <span className="text-[#3f3f46] block">{FEATURES.headlineAccent || FEATURES.body}</span>
          </h2>
          {FEATURES.headlineAccent && FEATURES.body && (
            <p className="text-[#71717a] text-base leading-relaxed max-w-lg mx-auto">
              {FEATURES.body}
            </p>
          )}
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

          {/* Left/Center: 2-col feature cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-6 flex flex-col gap-4 hover:border-white/[0.14] transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#71717a]">
                    <Icon size={17} />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-medium text-[16px] text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#71717a] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Tall Spotlight Card — clean, no beams */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-8 flex flex-col justify-between hover:border-white/[0.14] transition-all duration-300">
            {/* Top badge */}
            <span className="text-[11px] font-semibold text-[#52525b]">
              All-in-one
            </span>

            {/* Bottom content */}
            <div className="space-y-5 pt-8">
              <div className="space-y-2">
                <h3 className="font-sans font-medium text-2xl text-white tracking-tight leading-snug">
                  {FEATURES.spotlight.title}
                </h3>
                <p className="text-sm text-[#71717a] leading-relaxed">
                  {FEATURES.spotlight.description}
                </p>
              </div>

              <Button
                className="w-full h-11 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                onClick={() => router.push("/register")}
              >
                {FEATURES.spotlight.cta}
                <ArrowUpRight size={15} />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
