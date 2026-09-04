"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  CheckCircle2,
  Users,
  MessageSquare,
  ShoppingBag,
  Mic,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Phone,
  Store
} from "lucide-react";

const CAPABILITY_LABELS = {
  browse_menu: "Browse products & menu catalogue",
  recommend_products: "Personalized product recommendations",
  place_order: "Instant order intake & checkout confirmation",
  check_order_status: "Live order tracking & status updates",
  customer_support: "24/7 business FAQs & customer care",
};

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
    products,
  } = business;

  const employeeName = aiConfig?.employeeName || aiConfig?.persona || "Voxy";
  const permittedActions = aiConfig?.permittedActions || [];
  const capabilities = permittedActions
    .map((id) => CAPABILITY_LABELS[id])
    .filter(Boolean);

  const locationStr = address
    ? typeof address === "string"
      ? address
      : [address.city, address.state].filter(Boolean).join(", ")
    : null;

  const todayStatus = getTodayStatus(hours);
  const chatUrl = slug ? `/${slug}/chat` : "#";

  const productList = (products || []).slice(0, 6);
  const hasProducts = productList.length > 0;

  return (
    <div className="min-h-screen bg-[#060709] text-zinc-100 flex flex-col font-sans selection:bg-[#00D18F]/30 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-white/[0.07] flex items-center justify-between px-6 bg-[#090A0D]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-[#00D18F]">
                {(name || "V").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">{name}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/20 text-[11px] font-medium text-[#00D18F]">
            <span className="size-1.5 rounded-full bg-[#00D18F] animate-pulse" />
            AI Employee Online
          </span>
        </div>
      </header>

      {/* Hero Storefront Surface */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-xl space-y-8">
          
          {/* Business Hero Card */}
          <div className="p-8 rounded-3xl bg-[#0E1015]/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
            {/* Subtle Gradient Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00D18F]/10 blur-3xl pointer-events-none rounded-full" />

            <div className="relative z-10 space-y-5">
              {/* Logo / Avatar */}
              <div className="mx-auto size-24 rounded-3xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-black/40">
                {logoUrl ? (
                  <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold text-white">
                    {(name || "V").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-300">
                  <ShieldCheck className="size-3.5 text-[#00D18F]" />
                  <span>Verified Storefront</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {name}
                </h1>

                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 flex-wrap">
                  {category && <span className="capitalize font-medium text-zinc-300">{category}</span>}
                  {category && locationStr && <span>•</span>}
                  {locationStr && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-zinc-500" />
                      {locationStr}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {description && (
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                  {description}
                </p>
              )}

              {/* Operating Status Badge */}
              {todayStatus && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400">
                  <span className={`size-2 rounded-full ${todayStatus.open ? "bg-[#00D18F]" : "bg-zinc-600"}`} />
                  <span>
                    {todayStatus.open ? `Open today • Closes ${todayStatus.closeTime}` : "Closed today"}
                  </span>
                </div>
              )}

              {/* Primary Call to Action */}
              <div className="pt-2 space-y-2.5">
                <Link
                  href={chatUrl + (chatUrl.includes("?") ? "&call=true" : "?call=true")}
                  className="w-full h-12 rounded-2xl bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00D18F]/25 active:scale-[0.99] transition-all"
                >
                  <Phone className="size-4 fill-black" />
                  <span>Call {employeeName} (Voice Call)</span>
                  <span className="size-1.5 rounded-full bg-black/70 animate-ping ml-1" />
                </Link>

                <Link
                  href={chatUrl}
                  className="w-full h-11 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-white font-medium text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="size-3.5 text-zinc-400" />
                  <span>Or message in text chat</span>
                </Link>

                <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3 text-[#00D18F]" /> Instant Replies
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mic className="size-3 text-[#00D18F]" /> Voice Supported
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Employee Capabilities Section */}
          <div className="p-6 rounded-2xl bg-[#0E1015]/60 border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-[#00D18F]/10 border border-[#00D18F]/20 flex items-center justify-center text-[#00D18F]">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Meet {employeeName}
                  </h3>
                  <p className="text-[11px] text-zinc-400">Official AI sales representative</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(capabilities.length > 0
                ? capabilities
                : [
                    "Browse full product catalogue & prices",
                    "Take orders and calculate delivery",
                    "Answer questions about store policies",
                    "Connect with store owner on demand",
                  ]
              ).map((cap, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-zinc-300"
                >
                  <CheckCircle2 className="size-3.5 text-[#00D18F] shrink-0 mt-0.5" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Catalogue Preview */}
          {hasProducts && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="size-3.5 text-[#00D18F]" />
                  Popular Products & Menu
                </h3>
                <Link
                  href={chatUrl}
                  className="text-xs text-[#00D18F] hover:underline font-medium"
                >
                  Ask {employeeName} &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {productList.map((product) => {
                  const price = product.priceKobo
                    ? formatPrice(product.priceKobo - (product.discountKobo || 0))
                    : product.price
                    ? `₦${Number(product.price).toLocaleString()}`
                    : null;

                  return (
                    <Link
                      key={product.id}
                      href={chatUrl + "&msg=" + encodeURIComponent(`Tell me about ${product.name}`)}
                      className="group p-3 rounded-2xl border border-white/[0.06] bg-[#0E1015]/70 hover:border-[#00D18F]/40 hover:bg-white/[0.04] transition-all flex flex-col"
                    >
                      {product.imageUrl ? (
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2.5 bg-black/40">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-2.5">
                          <ShoppingBag className="size-6 text-zinc-600" />
                        </div>
                      )}
                      <div className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                        {product.name}
                      </div>
                      {price && (
                        <div className="text-xs font-semibold text-[#00D18F] mt-1 tabular-nums">
                          {price}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Need a Human Option */}
          {(socialLinks?.whatsapp || contactPhone) && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-zinc-500" />
                <span>Prefer speaking with human staff?</span>
              </div>
              {socialLinks?.whatsapp ? (
                <a
                  href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#00D18F] hover:underline flex items-center gap-1"
                >
                  WhatsApp Team <ExternalLink className="size-3" />
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
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/[0.06] text-center text-xs text-zinc-600">
        <p>Powered by <strong className="text-zinc-400 font-semibold">Voxy</strong> • AI Business Employee Platform</p>
      </footer>
    </div>
  );
}
