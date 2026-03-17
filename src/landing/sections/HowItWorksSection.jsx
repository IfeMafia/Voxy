/**
 * HowItWorksSection.jsx
 *
 * Responsibilities:
 *   - Explain the Voxy system pipeline in three ordered steps
 *   - Render steps as a numbered timeline, not floating icon cards
 *
 * Design intent:
 *   - Step numbers (01, 02, 03) are the visual anchor — large, DM Serif
 *   - Horizontal timeline on desktop with divider lines between steps
 *   - Stacked vertically on mobile
 *   - All content sourced from landingData HOW_IT_WORKS constant
 */

import React from "react";
import SectionHeader from "@/landing/shared/SectionHeader";
import { HOW_IT_WORKS, SECTION_IDS } from "@/landing/landingData";

export default function HowItWorksSection() {
  return (
    <section
      id={SECTION_IDS.howItWorks}
      className="py-28 px-6 border-t border-voxy-border"
    >
      <div className="max-w-[1200px] mx-auto space-y-16">

        <SectionHeader
          eyebrow={HOW_IT_WORKS.eyebrow}
          headline={HOW_IT_WORKS.headline}
          align="center"
        />

        {/* Timeline grid - ensure cards are centered and their content too */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-px bg-voxy-border rounded-xl overflow-hidden">
          {HOW_IT_WORKS.steps.map((step) => (
            <div
              key={step.id}
              className="voxy-card rounded-none p-8 flex flex-col items-center text-center gap-6"
            >
              {/* Step number — intentionally large, typographic, centered */}
              <span className="font-display text-[40px] sm:text-[48px] leading-none text-voxy-primary select-none">
                {step.number}
              </span>

              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-voxy-text tracking-tight uppercase">
                  {step.title}
                </h3>
                <p className="text-[14px] text-voxy-muted leading-relaxed max-w-[280px] mx-auto">
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

