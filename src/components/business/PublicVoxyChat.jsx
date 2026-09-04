"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  MessageSquare,
  ShoppingBag,
  Clock,
  Phone,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function getTodayStatus(hours) {
  if (!hours) return null;
  const jsDay = new Date().getDay();
  const dayKey = DAYS[jsDay === 0 ? 6 : jsDay - 1];
  const today = hours[dayKey];
  if (!today) return null;
  if (today.closed) return { open: false };
  return { open: true, closeTime: today.close };
}

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return "";
  const amount = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PublicVoxyChat({ business }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  if (!business) return null;

  const {
    name,
    slug,
    logoUrl,
    description,
    category,
    address,
    hours,
    aiConfig,
    contactPhone,
    socialLinks,
    products = [],
  } = business;

  const employeeName = aiConfig?.employeeName || aiConfig?.persona || "Assistant";

  const locationStr = address
    ? typeof address === "string"
      ? address
      : [address.city, address.state].filter(Boolean).join(", ")
    : null;

  const todayStatus = getTodayStatus(hours);
  const baseChatUrl = slug ? `/business/conversation?slug=${encodeURIComponent(slug)}` : "#";

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`${baseChatUrl}&msg=${encodeURIComponent(searchQuery.trim())}`);
  };

  const SUGGESTED_INTENTS = [
    { label: "Order food", query: "I would like to place an order." },
    { label: "View menu & prices", query: "Can I see your menu and prices?" },
    { label: "Delivery & hours", query: "What are your delivery options and opening hours?" },
    { label: "Talk to human staff", query: "Can I speak directly with your team?" },
  ];

  const productList = (products || []).slice(0, 6);
  const hasProducts = productList.length > 0;

  return (
    <div className="min-h-screen bg-[#060709] text-zinc-100 flex flex-col font-sans selection:bg-[#00D18F]/20 selection:text-white">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-white/[0.07] flex items-center justify-between px-4 sm:px-8 bg-[#08090C] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-[#00D18F]">
                {(name || "B").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-tight">{name}</span>
            {category && (
              <span className="text-xs text-zinc-400 capitalize hidden sm:inline">
                • {category}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>Powered by <span className="text-zinc-300 font-medium">Voxy</span></span>
        </div>
      </header>

      {/* Main Storefront Workspace — Wide desktop grid matching Dashboard layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Business Profile & Context Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] space-y-5">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#00D18F]">
                      {(name || "B").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white tracking-tight truncate">
                    {name}
                  </h1>
                  <p className="text-xs text-[#00D18F] font-medium">
                    {employeeName} · Assistant
                  </p>
                </div>
              </div>

              {description && (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {description}
                </p>
              )}

              <div className="space-y-2.5 pt-2 border-t border-white/[0.06] text-xs text-zinc-400">
                {locationStr && (
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-zinc-500 shrink-0 mt-0.5" />
                    <span>{locationStr}</span>
                  </div>
                )}
                {todayStatus && (
                  <div className="flex items-start gap-2">
                    <Clock className="size-4 text-zinc-500 shrink-0 mt-0.5" />
                    <span>
                      {todayStatus.open ? `Open today • Closes ${todayStatus.closeTime}` : "Closed today"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Human Staff Contact */}
            {(socialLinks?.whatsapp || contactPhone) && (
              <div className="p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex items-center justify-between text-xs text-zinc-400">
                <span>Prefer human staff?</span>
                {socialLinks?.whatsapp ? (
                  <a
                    href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#00D18F] hover:underline flex items-center gap-1"
                  >
                    WhatsApp <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-xs font-semibold text-[#00D18F] hover:underline flex items-center gap-1"
                  >
                    Call Store <Phone className="size-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Instant Action & Storefront Area */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Primary Actions & Input Launcher Box */}
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] space-y-5">
              <div>
                <h2 className="text-base font-semibold text-white">How can we help you?</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Select a topic or type your question below to start chatting with {employeeName}.</p>
              </div>

              {/* Suggested Intent Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_INTENTS.map((intent, idx) => (
                  <Link
                    key={idx}
                    href={`${baseChatUrl}&msg=${encodeURIComponent(intent.query)}`}
                    className="p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15] text-xs text-zinc-200 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <span>{intent.label}</span>
                    <ArrowRight className="size-3.5 text-zinc-400" />
                  </Link>
                ))}
              </div>

              {/* Input Launcher */}
              <form onSubmit={handleCustomSubmit} className="pt-1">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Ask ${employeeName} anything...`}
                    className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl pl-4 pr-24 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 h-8 px-3 rounded-lg bg-[#00D18F] text-black font-semibold text-xs flex items-center justify-center hover:bg-[#00D18F]/90 transition-colors"
                  >
                    Start
                  </button>
                </div>
              </form>

              {/* Primary Chat Launcher Button */}
              <Link
                href={baseChatUrl}
                className="w-full h-11 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors"
              >
                <MessageSquare className="size-4" />
                <span>Start Conversation Workspace</span>
              </Link>
            </div>

            {/* Catalogue Highlights */}
            {hasProducts && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="size-3.5 text-zinc-400" />
                    Catalogue Highlights ({productList.length})
                  </h3>
                  <Link
                    href={baseChatUrl}
                    className="text-xs text-[#00D18F] hover:underline font-semibold"
                  >
                    Browse all &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {productList.map((product) => {
                    const price = product.priceKobo
                      ? formatPrice(product.priceKobo - (product.discountKobo || 0))
                      : product.price
                      ? `₦${Number(product.price).toLocaleString()}`
                      : null;

                    const targetUrl = `${baseChatUrl}&msg=${encodeURIComponent(`Tell me about ${product.name}`)}`;

                    return (
                      <Link
                        key={product.id}
                        href={targetUrl}
                        className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04] transition-colors flex flex-col justify-between"
                      >
                        <div>
                          {product.imageUrl ? (
                            <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-black/40">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full aspect-square rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-2">
                              <ShoppingBag className="size-5 text-zinc-500" />
                            </div>
                          )}
                          <div className="text-xs font-medium text-zinc-200 truncate">
                            {product.name}
                          </div>
                        </div>
                        {price && (
                          <div className="text-xs font-semibold text-[#00D18F] mt-1.5 tabular-nums">
                            {price}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="py-4 border-t border-white/[0.06] text-center text-xs text-zinc-400">
        <p>Verified business powered by <strong className="text-zinc-300 font-medium">Voxy</strong></p>
      </footer>
    </div>
  );
}


