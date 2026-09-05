"use client";

import React, { useState } from "react";
import { FAQ, SECTION_IDS } from "@/landing/landingData";
import { Plus, Minus } from "lucide-react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id={SECTION_IDS.faq}
      className="py-24 sm:py-32 px-6 relative border-t border-white/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto space-y-16">

        {/* ── Section Header ── */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#00D18F]">
            <span className="w-5 h-px bg-[#00D18F]" />
            {FAQ.eyebrow}
          </div>
          <h2 className="font-sans font-medium text-4xl sm:text-5xl text-white tracking-tight leading-[1.1] max-w-xl">
            {FAQ.headline}{" "}
            <span className="text-[#3f3f46]">{FAQ.headlineAccent}</span>
          </h2>
        </div>

        {/* ── 2-Column FAQ Accordion ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FAQ.items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border bg-[#0a0a0a] p-6 cursor-pointer transition-all duration-200 ${
                  isOpen ? "border-white/[0.14]" : "border-white/[0.07] hover:border-white/[0.14]"
                }`}
                onClick={() => toggleIndex(index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-sans font-medium text-[15px] text-white leading-snug">
                    {item.question}
                  </h3>
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#71717a] flex-shrink-0">
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="pt-4 mt-4 border-t border-white/[0.06] text-sm text-[#71717a] leading-relaxed animate-fade-in">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
