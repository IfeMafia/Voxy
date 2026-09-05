"use client";

import React from "react";
import { PROBLEM, SECTION_IDS } from "@/landing/landingData";

export default function ProblemSection() {
  return (
    <section
      id={SECTION_IDS.problem}
      className="py-24 sm:py-32 px-6 border-t border-white/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto space-y-16">

        {/* ── Top: Eyebrow + Big Headline ── */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#00D18F]">
            <span className="w-5 h-px bg-[#00D18F]" />
            {PROBLEM.eyebrow}
          </div>
          <h2 className="font-sans font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
            <span className="text-white block">{PROBLEM.headline}</span>
            <span className="text-[#3f3f46] block">{PROBLEM.headlineAccent}</span>
          </h2>
        </div>

        {/* ── Split Layout: Narrative Left + Stats Right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Left: Narrative column */}
          <div className="space-y-6 lg:pr-8">
            <p className="text-[#71717a] text-base sm:text-lg leading-relaxed">
              {PROBLEM.body}
            </p>

            {/* Closing quote card */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-6">
              <p className="text-white text-base sm:text-lg leading-relaxed font-medium">
                &ldquo;{PROBLEM.closing}&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Stats stacked */}
          <div className="flex flex-col gap-3">
            {PROBLEM.stats.map((stat) => (
              <div
                key={stat.id}
                className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-6 flex items-start gap-5 hover:border-white/[0.14] transition-all duration-300"
              >
                {/* Big stat value */}
                <div className="flex-shrink-0">
                  <span className="font-sans font-medium text-3xl sm:text-4xl text-white tracking-tight leading-none">
                    {stat.value}
                  </span>
                </div>

                {/* Label + source */}
                <div className="space-y-1 pt-1">
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    {stat.label}
                  </p>
                  <p className="text-[11px] font-medium text-[#3f3f46]">
                    {stat.source}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
