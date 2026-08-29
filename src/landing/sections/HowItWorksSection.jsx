"use client";

import React from "react";
import { HOW_IT_WORKS, SECTION_IDS } from "@/landing/landingData";

export default function HowItWorksSection() {
  return (
    <section
      id={SECTION_IDS.howItWorks}
      className="py-24 sm:py-32 px-6 relative border-t border-white/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto space-y-16">

        {/* ── Section Header — matches Verity 2-line structure ── */}
        <div className="text-center space-y-4">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#00D18F]">
            <span className="w-5 h-px bg-[#00D18F]" />
            {HOW_IT_WORKS.eyebrow}
          </div>

          {/* Two-line headline: white + muted */}
          <h2 className="font-sans font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
            <span className="text-white block">{HOW_IT_WORKS.headline}</span>
            <span className="text-[#3f3f46] block">{HOW_IT_WORKS.headlineAccent}</span>
          </h2>
        </div>

        {/* ── Staggered 3-Card Grid (Verity style) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pb-16">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <div
              key={step.id}
              className={`rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-7 flex flex-col gap-10 hover:border-white/[0.14] transition-all duration-300 ${
                i === 1 ? "md:translate-y-10" : ""
              }`}
            >
              {/* Step label at top — green, small */}
              <span className="text-xs font-semibold text-[#00D18F] tracking-wide">
                Step {i + 1}
              </span>

              {/* Title + description pushed to bottom */}
              <div className="space-y-2.5">
                <h3 className="font-sans font-medium text-[18px] text-white leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm text-[#71717a] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
