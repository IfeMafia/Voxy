"use client";

/**
 * Hero.jsx
 *
 * Responsibilities:
 *   - Communicate Voxy's core value proposition above the fold
 *   - Render the three-step workflow visual (Voice → AI → Reply)
 *   - Drive visitors to sign up or log in
 *
 * Design intent:
 *   - Left-aligned text on desktop for B2B reading pattern
 *   - DM Serif Display headline for brand differentiation
 *   - Workflow flow uses the HERO.workflow data array — not hardcoded icons
 *   - No decorative glow blobs — only purposeful visual depth via border + surface
 */

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HERO, SECTION_IDS } from "@/landing/landingData";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative pt-36 pb-28 px-6 overflow-hidden">



      <div className="max-w-[1200px] mx-auto">

        {/* Two-column on desktop: text left, workflow visual right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center animate-fade-in-up">

          {/* ── Left: Copy ── */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-7">

            <Badge
              variant="outline"
              className="gap-2 border-voxy-border bg-voxy-surface text-voxy-muted py-1 px-4"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-voxy-primary animate-pulse flex-shrink-0" />
              <span className="text-[12px] font-medium">{HERO.badge}</span>
            </Badge>

            <div className="space-y-4">
              <h1 className="font-display text-[40px] sm:text-[58px] leading-[1.1] tracking-tight text-voxy-text">
                {HERO.headline}
                <br />
                <span className="text-voxy-muted">{HERO.accent}</span>
              </h1>
              <p className="text-[16px] sm:text-[17px] text-voxy-muted leading-[1.7] max-w-[520px] mx-auto lg:mx-0">
                {HERO.body}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 bg-voxy-primary text-black font-semibold hover:bg-voxy-primary/90 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                onClick={() => router.push("/register")}
              >
                {HERO.primaryCTA} <ArrowRight size={16} />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-voxy-muted hover:text-voxy-text"
                onClick={() => router.push("/login")}
              >
                {HERO.secondaryCTA}
              </Button>
            </div>

          </div>

          {/* ── Right: Workflow Visual ── */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="voxy-card p-8 w-full max-w-sm space-y-6">

              {/* Section label */}
              <p className="eyebrow text-voxy-subtle">How Voxy works</p>

              {/* Step flow */}
              <div className="flex flex-col gap-0">
                {HERO.workflow.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === HERO.workflow.length - 1;

                  return (
                    <div key={step.label} className="flex gap-4">
                      {/* Icon + connector line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`
                            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                            ${index === 1
                              ? "bg-voxy-primary/10 border border-voxy-primary/30"
                              : "bg-voxy-surface border border-voxy-border"
                            }
                          `}
                        >
                          <Icon
                            size={18}
                            className={index === 1 ? "text-voxy-primary" : "text-voxy-muted"}
                          />
                        </div>
                        {!isLast && (
                          <div className="w-px h-6 bg-voxy-border mt-1 mb-1" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="pt-2 pb-2">
                        <span
                          className={`text-[13px] font-medium ${
                            index === 1 ? "text-voxy-primary" : "text-voxy-muted"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Language support tags */}
              <div className="pt-2 border-t border-voxy-border">
                <p className="eyebrow text-voxy-subtle mb-3">Supported languages</p>
                <div className="flex flex-wrap gap-2">
                  {["English", "Pidgin", "Yoruba"].map((lang) => (
                    <span
                      key={lang}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-voxy-primary/10 text-voxy-primary border border-voxy-primary/20"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
