"use client";

import React from "react";
import { Bot, Store, User } from "lucide-react";

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

  const bubbleStyle = isAI
    ? "bg-[#090b0e] border border-[#00D18F]/20 shadow-sm"
    : isBusiness
    ? "bg-[#0f0e0b] border border-amber-500/20 shadow-sm"
    : "bg-[#0f1117] border border-white/[0.08] shadow-sm";

  const dotColor = isAI
    ? "bg-[#00D18F]"
    : isBusiness
    ? "bg-amber-400"
    : "bg-zinc-300";

  return (
    <div className="flex items-start gap-3 animate-in fade-in-0 zoom-in-95 duration-200 select-none my-1">
      {showAvatar && (
        <div
          className={`size-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 shadow-sm overflow-hidden ${
            isAI
              ? "bg-[#00D18F]/10 border-[#00D18F]/20 text-[#00D18F]"
              : isBusiness
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-zinc-800 border-white/10 text-zinc-300"
          }`}
        >
          {isImage && avatar ? (
            <img src={avatar} alt={label || "Typing"} className="w-full h-full object-cover" />
          ) : isAI ? (
            <Bot className="size-4" />
          ) : isBusiness ? (
            <Store className="size-4" />
          ) : (
            <User className="size-4" />
          )}
        </div>
      )}

      <div className="space-y-1">
        {label && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {label}
          </div>
        )}

        <div
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-xs ${bubbleStyle}`}
        >
          {/* 3 Clean Wave Dots */}
          <div className="flex items-center gap-1.5 py-0.5">
            <span
              className={`size-2 rounded-full animate-[voxyPulse_1.4s_infinite_ease-in-out_-0.32s] ${dotColor}`}
            />
            <span
              className={`size-2 rounded-full animate-[voxyPulse_1.4s_infinite_ease-in-out_-0.16s] ${dotColor}`}
            />
            <span
              className={`size-2 rounded-full animate-[voxyPulse_1.4s_infinite_ease-in-out] ${dotColor}`}
            />
          </div>

          {statusText && (
            <span className="text-xs font-medium text-zinc-300 pl-1">
              {statusText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
