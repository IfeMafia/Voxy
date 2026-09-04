"use client";

import React from "react";
import Link from "next/link";
import { MapPin, CheckCircle2, Users, MessageCircle, ShoppingBag } from "lucide-react";

const CAPABILITY_LABELS = {
  browse_menu: "Browse products & menu",
  recommend_products: "Recommend products for you",
  place_order: "Take and confirm your order",
  check_order_status: "Check your order status",
  customer_support: "Answer questions about the business",
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
    ? [address.city, address.state].filter(Boolean).join(", ")
    : null;

  const todayStatus = getTodayStatus(hours);
  const chatUrl = slug ? "/business/conversation?slug=" + slug : "#";

  // Products passed in from server or embedded in business object
  const productList = (products || []).slice(0, 6);
  const hasProducts = productList.length > 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">

      {/* Minimal top bar */}
      <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="size-6 rounded object-cover" />
          ) : (
            <div className="size-6 rounded bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-[10px] font-semibold text-zinc-400">
              {(name || "V").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-white">{name}</span>
        </div>
        <span className="text-[10px] text-zinc-700 font-medium">Powered by Voxy</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">

          {/* Business identity */}
          <div className="text-center space-y-4">
            <div className="mx-auto size-20 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-zinc-400">
                  {(name || "V").charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">{name}</h1>
              <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                {category && <span className="text-xs text-zinc-500">{category}</span>}
                {category && locationStr && <span className="text-zinc-700">&middot;</span>}
                {locationStr && (
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin className="size-3" /> {locationStr}
                  </span>
                )}
              </div>
            </div>

            {description && (
              <p className="text-sm text-zinc-400 leading-relaxed">
                {description}
              </p>
            )}

            {todayStatus && (
              <div className="flex items-center justify-center gap-1.5">
                <span className={"size-1.5 rounded-full " + (todayStatus.open ? "bg-[#00D18F]" : "bg-zinc-600")} />
                <span className="text-xs text-zinc-500">
                  {todayStatus.open ? "Open today · closes " + todayStatus.closeTime : "Closed today"}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* AI employee */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 text-sm font-semibold text-zinc-300">
                {employeeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{employeeName}</div>
                <div className="text-xs text-zinc-500">{name}&apos;s AI employee</div>
              </div>
            </div>

            {capabilities.length > 0 && (
              <div className="space-y-1.5 pl-1">
                {capabilities.map((label, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <CheckCircle2 className="size-3 text-[#00D18F] shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href={chatUrl}
              className="w-full flex items-center justify-center gap-2 h-11 bg-[#00D18F] text-black text-sm font-semibold rounded-xl hover:bg-[#00D18F]/90 transition-colors"
            >
              <MessageCircle className="size-4" />
              Chat with {employeeName}
            </Link>
            <p className="text-center text-xs text-zinc-600">Usually replies instantly &middot; Voice available</p>
          </div>

          {/* Trust signals */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <CheckCircle2 className="size-3 text-zinc-700 shrink-0" />
              Official {name} assistant
            </div>
            {(socialLinks?.whatsapp || contactPhone) && (
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Users className="size-3 text-zinc-700 shrink-0" />
                Need a person?&nbsp;
                {socialLinks?.whatsapp ? (
                  <a
                    href={"https://wa.me/" + socialLinks.whatsapp.replace(/\D/g, "")}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    Talk to the {name} team
                  </a>
                ) : (
                  <a
                    href={"tel:" + contactPhone}
                    className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    Call {name}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Products */}
          {hasProducts && (
            <>
              <div className="border-t border-white/[0.06]" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Products
                  </h2>
                  <Link
                    href={chatUrl}
                    className="text-xs text-[#00D18F] hover:underline underline-offset-2 transition-colors"
                  >
                    Ask {employeeName} &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {productList.map((product) => {
                    const price = product.priceKobo
                      ? formatPrice(product.priceKobo - (product.discountKobo || 0))
                      : null;
                    return (
                      <Link
                        key={product.id}
                        href={chatUrl + "&msg=Tell me about " + encodeURIComponent(product.name)}
                        className="group p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04] transition-colors"
                      >
                        {product.imageUrl && (
                          <div className="w-full aspect-square rounded-lg overflow-hidden mb-2.5 bg-white/[0.04]">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="text-xs font-medium text-zinc-200 truncate">{product.name}</div>
                        {price && (
                          <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">{price}</div>
                        )}
                        {!product.available && (
                          <div className="text-[10px] text-zinc-700 mt-0.5">Out of stock</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-5 text-center">
        <p className="text-[10px] text-zinc-800">Powered by Voxy &middot; AI Workforce for Business</p>
      </footer>
    </div>
  );
}
