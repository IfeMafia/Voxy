"use client";

import React from "react";
import { Sparkles, Bot, Store, User } from "lucide-react";

export default function PremiumTypingIndicator({
  label = "Voxy",
  avatar,
  isImage,
  initial = "V",
  type = "ai", // "ai" | "business" | "customer"
  showAvatar = true,
  statusText,
}) {
  const isAI = type === "ai";
  const isBusiness = type === "business";

  const glowColor = isAI
    ? "shadow-[0_0_25px_rgba(0,209,143,0.18)] border-[#00D18F]/30 bg-gradient-to-r from-[#07130e]/95 via-[#0c1f17]/95 to-[#07130e]/95 text-[#00D18F]"
    : isBusiness
    ? "shadow-[0_0_25px_rgba(245,158,11,0.15)] border-amber-500/30 bg-gradient-to-r from-[#17120a]/95 via-[#231b0f]/95 to-[#17120a]/95 text-amber-400"
    : "shadow-[0_0_25px_rgba(255,255,255,0.08)] border-white/15 bg-gradient-to-r from-[#121316]/95 via-[#1a1c23]/95 to-[#121316]/95 text-zinc-300";

  const dotGlow = isAI
    ? "bg-[#00D18F] shadow-[0_0_10px_#00D18F]"
    : isBusiness
    ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]"
    : "bg-zinc-300 shadow-[0_0_10px_rgba(255,255,255,0.7)]";

  return (
    <div className="flex items-start gap-3 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out select-none my-1">
      {showAvatar && (
        <div
          className={`size-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 shadow-md overflow-hidden transition-all duration-300 ${
            isAI
              ? "bg-[#00D18F]/10 border-[#00D18F]/30 text-[#00D18F]"
              : isBusiness
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-zinc-800 border-white/10 text-zinc-300"
          }`}
        >
          {isImage && avatar ? (
            <img src={avatar} alt={label || "Typing"} className="w-full h-full object-cover" />
          ) : isAI ? (
            <Bot className="size-4 animate-pulse" />
          ) : isBusiness ? (
            <Store className="size-4" />
          ) : (
            <User className="size-4" />
          )}
        </div>
      )}

      <div className="space-y-1">
        {label && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>{label}</span>
            {isAI && <Sparkles className="size-2.5 text-[#00D18F] animate-spin-slow" />}
          </div>
        )}

        <div
          className={`relative overflow-hidden inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl rounded-tl-xs border backdrop-blur-xl ${glowColor}`}
        >
          {/* Shimmer background bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />

          {/* 3 Glowing Swelling Liquid Dots */}
          <div className="flex items-center gap-1.5 py-0.5 z-10">
            <span
              className={`size-2 rounded-full transition-all duration-300 animate-[voxyPulse_1.4s_infinite_ease-in-out_-0.32s] ${dotGlow}`}
            />
            <span
              className={`size-2 rounded-full transition-all duration-300 animate-[voxyPulse_1.4s_infinite_ease-in-out_-0.16s] ${dotGlow}`}
            />
            <span
              className={`size-2 rounded-full transition-all duration-300 animate-[voxyPulse_1.4s_infinite_ease-in-out] ${dotGlow}`}
            />
          </div>

          {statusText && (
            <span className="text-xs font-medium text-zinc-300 z-10 pl-0.5">
              {statusText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
