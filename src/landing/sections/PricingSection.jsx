"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PRICING, SECTION_IDS } from "@/landing/landingData";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingSection() {
  const router = useRouter();

  return (
    <section
      id={SECTION_IDS.pricing}
      className="py-24 sm:py-32 px-6 relative border-t border-white/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto space-y-16">

        {/* ── Section Header — two-line Verity style ── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#00D18F]">
            <span className="w-5 h-px bg-[#00D18F]" />
            {PRICING.eyebrow}
          </div>
          <h2 className="font-sans font-medium text-4xl sm:text-6xl tracking-tight leading-[1.1]">
            <span className="text-white block">{PRICING.headline}</span>
            <span className="text-[#3f3f46] block">{PRICING.headlineAccent}</span>
          </h2>
          <p className="text-[#71717a] text-base">{PRICING.body}</p>
        </div>

        {/* ── Pricing Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {PRICING.plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-8 flex flex-col gap-8 hover:border-white/[0.14] transition-all duration-300 relative"
            >
              {/* Plan name + Popular badge */}
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-medium text-[17px] text-white">
                  {plan.name}
                </h3>
                {plan.popular && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white border border-white/20 rounded-full px-2.5 py-0.5">
                    Popular
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans font-medium text-5xl text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm text-[#52525b]">{plan.period}</span>
                </div>
                <p className="text-sm text-[#71717a]">{plan.description}</p>
              </div>

              {/* CTA Button */}
              <Button
                className={`w-full h-11 rounded-xl text-sm font-medium transition-all ${
                  plan.popular
                    ? "bg-white text-black hover:bg-zinc-100"
                    : "bg-transparent border border-white/[0.12] text-white hover:border-white/25 hover:bg-white/[0.04]"
                }`}
                onClick={() => router.push("/register")}
              >
                {plan.cta}
              </Button>

              {/* Divider */}
              <div className="border-t border-white/[0.06]" />

              {/* Features list */}
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#71717a]">
                    <Check
                      size={14}
                      className={plan.popular ? "text-[#00D18F] flex-shrink-0" : "text-[#52525b] flex-shrink-0"}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
