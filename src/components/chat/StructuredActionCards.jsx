"use client";

import React from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Check,
  CreditCard,
  Phone,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Package,
  Plus
} from "lucide-react";

function formatPrice(koboOrNaira) {
  if (koboOrNaira == null) return "";
  const amount = typeof koboOrNaira === "number" && koboOrNaira > 100000 
    ? koboOrNaira / 100 
    : Number(koboOrNaira);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ── 1. Product Cards Grid ──────────────────────────────────────────────────

export function ProductCardGrid({ products = [], onSelectProduct }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-2.5 my-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
        <ShoppingBag className="size-3.5" />
        <span>Recommended Items ({products.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.map((item, idx) => {
          const priceStr = formatPrice(item.priceKobo || item.price);
          return (
            <div
              key={item.id || idx}
              className="group p-3 rounded-2xl bg-[#12141C] border border-white/[0.08] hover:border-[#00D18F]/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                {item.imageUrl ? (
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/40">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                    <ShoppingBag className="size-6 text-zinc-600" />
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-white truncate">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] mt-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#00D18F] tabular-nums">
                  {priceStr || "Contact for price"}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectProduct?.(item)}
                  className="px-3 py-1.5 rounded-xl bg-[#00D18F]/15 hover:bg-[#00D18F]/25 text-[#00D18F] font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
                >
                  <Plus className="size-3" />
                  <span>Order Item</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 2. Order Breakdown Receipt Card ───────────────────────────────────────

export function OrderReceiptCard({ order, onConfirmOrder }) {
  if (!order) return null;

  const items = order.items || [];
  const totalAmount = order.totalAmount || order.total || 0;
  const priceStr = formatPrice(totalAmount);

  return (
    <div className="my-3 p-4 sm:p-5 rounded-2xl bg-[#0E1017] border border-white/[0.1] shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-[#00D18F]/10 border border-[#00D18F]/20 flex items-center justify-center text-[#00D18F]">
            <Package className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white tracking-tight">Order Summary</h4>
            <p className="text-[10px] text-zinc-400">Review items before confirmation</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Draft Order
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs text-zinc-300 py-1">
            <span className="truncate">
              {item.name || item.title} <strong className="text-white">× {item.quantity || 1}</strong>
            </span>
            <span className="font-mono text-zinc-200 tabular-nums">
              {formatPrice((item.price || item.unitPrice || 0) * (item.quantity || 1))}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/[0.08] space-y-1">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Subtotal</span>
          <span className="font-mono">{priceStr}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Estimated Delivery</span>
          <span className="text-emerald-400 font-medium">Standard</span>
        </div>
        <div className="flex items-center justify-between text-sm font-bold text-white pt-1">
          <span>Total Amount</span>
          <span className="text-[#00D18F] font-mono tabular-nums">{priceStr}</span>
        </div>
      </div>

      {onConfirmOrder && (
        <button
          type="button"
          onClick={() => onConfirmOrder(order)}
          className="w-full h-10 rounded-xl bg-[#00D18F] hover:bg-[#00D18F]/90 active:scale-98 text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00D18F]/20 transition-all mt-2"
        >
          <span>Confirm & Proceed to Checkout</span>
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}

// ── 3. Payment & Status Card ──────────────────────────────────────────────

export function PaymentCard({ payment, onPayNow }) {
  if (!payment) return null;

  const isPaid = payment.status === "paid" || payment.status === "completed";
  const amountStr = formatPrice(payment.amount);

  return (
    <div className="my-3 p-4 rounded-2xl bg-[#0E1017] border border-white/[0.1] shadow-xl space-y-3">
      {isPaid ? (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <div className="size-8 rounded-full bg-[#00D18F] text-black flex items-center justify-center shrink-0 font-bold">
            <Check className="size-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              <span>Payment Confirmed</span>
            </div>
            <p className="text-[11px] text-zinc-300">
              Order #{payment.orderId || "1042"} • <strong className="text-white font-mono">{amountStr}</strong> paid
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-[#00D18F]" />
              <span className="text-xs font-semibold text-white">Payment Required</span>
            </div>
            <span className="text-xs font-bold text-[#00D18F] font-mono tabular-nums">
              {amountStr}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Order #{payment.orderId || "1042"} is ready. Complete your payment securely via Paystack.
          </p>

          {payment.checkoutUrl ? (
            <a
              href={payment.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full h-10 rounded-xl bg-[#00D18F] hover:bg-[#00D18F]/90 active:scale-98 text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00D18F]/20 transition-all"
            >
              <CreditCard className="size-4" />
              <span>Pay Securely ({amountStr})</span>
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onPayNow?.(payment)}
              className="w-full h-10 rounded-xl bg-[#00D18F] hover:bg-[#00D18F]/90 active:scale-98 text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00D18F]/20 transition-all"
            >
              <CreditCard className="size-4" />
              <span>Generate Payment Link ({amountStr})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── 4. Human Handoff Notice Card ──────────────────────────────────────────

export function HandoffNoticeCard({ business }) {
  return (
    <div className="my-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
      <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
        <Phone className="size-4" />
        <span>Store Manager Notified</span>
      </div>
      <p className="text-xs text-amber-200/90 leading-relaxed">
        {business?.name || "Store"} management has been alerted and will respond shortly. You can also reach them directly:
      </p>

      {business?.contactPhone && (
        <a
          href={`tel:${business.contactPhone}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline"
        >
          <Phone className="size-3" />
          <span>Call {business.contactPhone}</span>
        </a>
      )}
    </div>
  );
}
