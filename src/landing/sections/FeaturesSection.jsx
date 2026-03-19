/**
 * FeaturesSection.jsx
 *
 * Responsibilities:
 *   - Present Voxy's key product capabilities
 *
 * Design intent:
 *   - Two-column layout: feature list with icons on left, description on right
 *   - Active feature expands description — avoids the static 3-card grid trap
 *   - All feature data sourced from landingData FEATURES constant
 *   - Uses "client" directive only because of useState for active feature
 */

"use client";

import React, { useState } from "react";
import SectionHeader from "@/landing/shared/SectionHeader";
import { FEATURES, SECTION_IDS } from "@/landing/landingData";

export default function FeaturesSection() {
  const [activeId, setActiveId] = useState(FEATURES.items[0].id);

  const activeFeature = FEATURES.items.find((f) => f.id === activeId);

  return (
    <section
      id={SECTION_IDS.features}
      className="py-16 sm:py-28 px-6 border-t border-voxy-border"
    >
      <div className="max-w-[1200px] mx-auto space-y-16">

        <SectionHeader
          eyebrow={FEATURES.eyebrow}
          headline={FEATURES.headline}
          align="left"
        />

        {/* Two-column feature explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-voxy-border rounded-xl overflow-hidden">

          {/* Left: Feature list */}
          <div className="voxy-card rounded-none p-2">
            {FEATURES.items.map((feature) => {
              const Icon = feature.icon;
              const isActive = feature.id === activeId;

              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveId(feature.id)}
                  className={`
                    w-full text-left flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? "bg-voxy-primary/10 text-voxy-text"
                      : "text-voxy-muted hover:text-voxy-text hover:bg-zinc-100 dark:hover:bg-white/[0.03]"
                    }
                  `}
                  aria-pressed={isActive}
                >
                  <span
                    className={`
                      w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all
                      ${isActive
                        ? "bg-voxy-primary/10 border-voxy-primary/30"
                        : "bg-voxy-surface border-voxy-border"
                      }
                    `}
                  >
                    <Icon
                      size={16}
                      className={isActive ? "text-voxy-primary" : "text-voxy-muted"}
                    />
                  </span>
                  <span className="text-[14px] font-medium">{feature.title}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Active feature detail */}
          <div className="voxy-card rounded-none p-8 flex flex-col justify-center gap-5">
            {activeFeature && (
              <div key={activeFeature.id} className="animate-fade-in space-y-5">
                <div className="w-12 h-12 rounded-xl bg-voxy-primary/10 border border-voxy-primary/30 flex items-center justify-center">
                  <activeFeature.icon size={22} className="text-voxy-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[20px] font-semibold text-voxy-text">
                    {activeFeature.title}
                  </h3>
                  <p className="text-[15px] text-voxy-muted leading-relaxed">
                    {activeFeature.description}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
