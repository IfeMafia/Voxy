"use client";

/**
 * CTASection.jsx
 *
 * Responsibilities:
 *   - Deliver a final, specific conversion prompt before the footer
 *
 * Design intent:
 *   - Stark, high-contrast block — different visual temperature from other sections
 *   - Emerald glow ring behind headline for focused attention
 *   - Specific CTA copy (not generic "Start for free") from landingData
 */

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTA } from "@/landing/landingData";

export default function CTASection() {
  const router = useRouter();

  return (
    <section className="py-16 sm:py-28 px-6 border-t border-voxy-border relative overflow-hidden">



      <div className="max-w-[700px] mx-auto text-center space-y-8 relative z-10">

        <h2 className="font-display text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.1] tracking-tight text-voxy-text uppercase tracking-tighter">
          {CTA.headline}
        </h2>

        <p className="text-voxy-muted text-[17px] leading-relaxed">
          {CTA.body}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            className="gap-2 bg-voxy-primary text-black font-semibold hover:bg-voxy-primary/90 shadow-[0_0_15px_rgba(16,185,129,0.25)] text-[15px]"
            onClick={() => router.push("/register")}
          >
            {CTA.primaryCTA} <ArrowRight size={16} />
          </Button>
        </div>

        <p className="text-voxy-subtle text-[13px]">
          <button
            onClick={() => router.push("/login")}
            className="underline underline-offset-2 hover:text-voxy-muted transition-colors"
          >
            {CTA.loginCTA}
          </button>
        </p>

      </div>
    </section>
  );
}
