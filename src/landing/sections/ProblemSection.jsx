/**
 * ProblemSection.jsx
 *
 * Responsibilities:
 *   - Communicate the specific pain point Voxy solves for African SMBs
 *   - Present three key stats as pull-quotes, not generic icon cards
 *
 * Design intent:
 *   - Full-width section with left-aligned header and a stat grid below
 *   - Each stat uses a large, high-contrast number as the visual anchor
 *   - Stats sourced from landingData — this component is a pure renderer
 */

import React from "react";
import SectionHeader from "@/landing/shared/SectionHeader";
import { PROBLEM, SECTION_IDS } from "@/landing/landingData";

export default function ProblemSection() {
  return (
    <section
      id={SECTION_IDS.problem}
      className="py-16 sm:py-28 px-6 border-t border-voxy-border"
    >
      <div className="max-w-[1200px] mx-auto space-y-16">

        {/* Header — left-aligned, matches B2B reading pattern */}
        <SectionHeader
          eyebrow={PROBLEM.eyebrow}
          headline={PROBLEM.headline}
          body={PROBLEM.body}
          align="left"
        />

        {/* Stats grid — numbers are the visual anchor, not icons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-voxy-border rounded-xl overflow-hidden">
          {PROBLEM.stats.map((stat) => (
            <div
              key={stat.id}
              className="voxy-card rounded-none p-8 flex flex-col gap-3 hover:border-voxy-primary/30 hover:-translate-y-1 hover:bg-white/[0.015]"
            >
              <span
                className="font-sans text-[42px] sm:text-[52px] font-bold leading-none text-voxy-primary"
                aria-label={stat.value}
              >
                {stat.value}
              </span>
              <p className="text-[14px] text-voxy-muted leading-relaxed max-w-[220px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
