"use client";

import React from "react";
import {
  ShoppingBag,
  CreditCard,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Receipt,
  Package,
  Sparkles
} from "lucide-react";

/**
 * Format currency with Naira symbol default
 */
const formatPrice = (price) => {
  if (typeof price !== "number") return price || "₦0";
  return `₦${price.toLocaleString()}`;
};

/**
 * Product Card Grid component for displaying product recommendations/catalog items in chat feed.
 */
export function ProductCardGrid({ products = [], onSelectProduct }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Featured Products</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {products.map((product, idx) => (
          <div
            key={product.id || idx}
            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-500/40 rounded-xl p-3 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {product.image && (
                <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-black/40">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-semibold text-white/90 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                  {product.name}
                </h4>
                <span className="text-xs font-bold text-emerald-400 whitespace-nowrap bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {formatPrice(product.price)}
                </span>
              </div>
              {product.description && (
                <p className="text-xs text-white/50 mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>

            <button
              onClick={() => onSelectProduct && onSelectProduct(product)}
              className="mt-3 w-full py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Select Product</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Order Receipt Card component for displaying generated order summaries in chat.
 */
export function OrderReceiptCard({ order, onConfirmOrder }) {
  if (!order) return null;

  const items = order.items || [];
  const total = order.totalAmount || items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <div className="mt-3 bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Receipt className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Order Summary</span>
        </div>
        <span className="text-[10px] text-white/40 font-mono">
          #{order.id || Math.floor(1000 + Math.random() * 9000)}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-white/80">
              <Package className="w-3.5 h-3.5 text-white/40" />
              <span>{item.name}</span>
              {item.quantity > 1 && (
                <span className="text-white/40">x{item.quantity}</span>
              )}
            </div>
            <span className="font-medium text-white/90">
              {formatPrice(item.price * (item.quantity || 1))}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-2.5 flex justify-between items-center mb-3">
        <span className="text-xs text-white/60">Total Amount</span>
        <span className="text-sm font-bold text-emerald-400">{formatPrice(total)}</span>
      </div>

      {onConfirmOrder && (
        <button
          onClick={onConfirmOrder}
          className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <span>Confirm & Proceed to Payment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Payment Card component with checkout url button.
 */
export function PaymentCard({ payment }) {
  if (!payment) return null;

  return (
    <div className="mt-3 bg-gradient-to-r from-emerald-950/40 to-slate-900/80 border border-emerald-500/40 rounded-xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <CreditCard className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wider uppercase">Payment Required</span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {payment.status || "Pending"}
        </span>
      </div>

      <div className="mb-4">
        <div className="text-xs text-white/50 mb-1">Order #{payment.orderId || "1042"}</div>
        <div className="text-xl font-bold text-white flex items-baseline gap-1">
          {formatPrice(payment.amount)}
        </div>
      </div>

      {payment.checkoutUrl && (
        <a
          href={payment.checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
        >
          <span>Pay Now via Paystack</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

/**
 * Human Handoff Notice Card component.
 */
export function HandoffNoticeCard({ business }) {
  return (
    <div className="mt-3 bg-blue-950/30 border border-blue-500/30 rounded-xl p-3.5 flex items-start gap-3 text-left">
      <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400 shrink-0">
        <UserCheck className="w-4 h-4" />
      </div>
      <div>
        <h5 className="text-xs font-semibold text-blue-300">
          Handed over to Human Agent
        </h5>
        <p className="text-xs text-white/60 mt-0.5">
          A support representative from <span className="text-white font-medium">{business?.name || "our team"}</span> has taken over this conversation to assist you directly.
        </p>
      </div>
    </div>
  );
}

/**
 * Official Payment Receipt Card component generated automatically after payment verification.
 */
export function PaymentReceiptCard({ receipt }) {
  if (!receipt) return null;

  const receiptNumber = receipt.receiptNumber || receipt.receipt_number || `#RCP-${Math.floor(10000 + Math.random() * 90000)}`;
  const items = receipt.items || receipt.order?.items || [];
  const amount = receipt.amount || (receipt.amountKobo ? receipt.amountKobo / 100 : 0);
  const paidAt = receipt.paidAt || receipt.paymentDate || new Date().toISOString();

  return (
    <div className="mt-3 bg-gradient-to-b from-[#0E1512] to-slate-900/90 border border-[#00D18F]/40 rounded-xl p-4 shadow-xl backdrop-blur-md text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2 text-[#00D18F]">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Official Payment Receipt</span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D18F]/15 text-[#00D18F] border border-[#00D18F]/30">
          PAID • VERIFIED
        </span>
      </div>

      {/* Receipt Info */}
      <div className="flex justify-between items-center mb-3 text-xs">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Receipt No.</div>
          <div className="font-mono text-zinc-300 font-semibold">{receiptNumber}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Date</div>
          <div className="text-zinc-300 text-[11px]">
            {new Date(paidAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Items breakdown if present */}
      {items.length > 0 && (
        <div className="space-y-1.5 my-3 pt-2 border-t border-white/[0.06]">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Purchased Items</div>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">
                {item.productName || item.name} {item.quantity > 1 ? `x${item.quantity}` : ""}
              </span>
              <span className="font-medium text-zinc-200">
                {formatPrice(item.subtotalKobo ? item.subtotalKobo / 100 : (item.price || item.unitPriceKobo ? item.unitPriceKobo / 100 : amount))}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total Amount Paid */}
      <div className="border-t border-white/10 pt-3 flex justify-between items-center">
        <div>
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total Amount Paid</div>
          <div className="text-[10px] text-emerald-400/80">Payment processed via Paystack</div>
        </div>
        <div className="text-base font-extrabold text-[#00D18F]">
          {formatPrice(amount)}
        </div>
      </div>
    </div>
  );
}
