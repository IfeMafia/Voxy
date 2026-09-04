"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness, useCustomers, useOrders, useProducts } from "@/hooks/useBusinessData";
import { SkeletonCard, RefreshIndicator } from "@/components/ui/Skeleton";
import {
  MessageCircle,
  Users,
  ShoppingBag,
  ClipboardList,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Bot,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatNGN(kobo) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format((kobo || 0) / 100);
}

// ── KPI Strip — compact, desktop-dense ───────────────────────────────────────
function KpiStrip({ customers, orders, products, loading, isFetching }) {
  const revenue = (orders || []).reduce((s, o) => s + (o.totalKobo || 0), 0);
  const paidCount = (orders || []).filter((o) => o.status === "paid").length;

  const items = [
    { label: "Revenue", value: loading ? null : formatNGN(revenue), sub: `${paidCount} paid`, href: "/business/orders", color: "text-[#00D18F]" },
    { label: "Orders", value: loading ? null : (orders || []).length, sub: "total orders", href: "/business/orders" },
    { label: "Customers", value: loading ? null : (customers || []).length, sub: "total customers", href: "/business/customers" },
    { label: "Products", value: loading ? null : (products || []).length, sub: "in catalogue", href: "/business/products" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="group flex flex-col p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
        >
          <div className={`text-xl font-bold tabular-nums mb-0.5 ${item.color || "text-white"}`}>
            {item.value ?? "—"}
          </div>
          <div className="text-xs text-zinc-500">{item.label}</div>
          <div className="text-[10px] text-zinc-700 mt-0.5">{item.sub}</div>
        </Link>
      ))}
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const s = {
    paid:      "bg-[#00D18F]/10 text-[#00D18F]",
    confirmed: "bg-blue-500/10 text-blue-400",
    draft:     "bg-amber-500/10 text-amber-300",
    cancelled: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s[status] || "bg-white/5 text-zinc-400"}`}>
      {status}
    </span>
  );
}

function SetupItem({ label, done, href }) {
  return (
    <Link
      href={done ? "#" : href}
      className={`flex items-center gap-3 py-2.5 group transition-opacity ${done ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className={`size-5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
        done ? "border-[#00D18F] bg-[#00D18F]" : "border-white/20 group-hover:border-[#00D18F]/50"
      }`}>
        {done && <Check className="size-3 text-black" />}
      </div>
      <span className={`text-sm font-medium ${done ? "line-through text-zinc-600" : "text-zinc-300 group-hover:text-white transition-colors"}`}>
        {label}
      </span>
      {!done && <ArrowRight className="size-3 text-zinc-600 group-hover:text-zinc-400 ml-auto transition-colors" />}
    </Link>
  );
}

// ── Recent orders table (desktop) / cards (mobile) ───────────────────────────
function RecentOrders({ orders }) {
  if (!orders || orders.length === 0) return null;
  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white text-sm">Recent orders</h2>
        <Link href="/business/orders" className="text-xs text-zinc-500 hover:text-[#00D18F] transition-colors">
          View all →
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-2xl border border-white/[0.07] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Customer", "Items", "Total", "Status"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((order, i) => (
              <tr key={order.id} className={`hover:bg-white/[0.015] transition-colors ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{order.customer?.name || "Customer"}</div>
                  <div className="text-[10px] text-zinc-600 font-mono">#{order.id?.slice(0, 8)}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3 font-semibold text-white tabular-nums">
                  {formatNGN(order.totalKobo || 0)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden rounded-2xl border border-white/[0.07] overflow-hidden">
        {recent.map((order, i) => (
          <div key={order.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
            <div>
              <div className="text-sm text-white font-medium">{order.customer?.name || "Customer"}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm font-semibold text-white tabular-nums">{formatNGN(order.totalKobo || 0)}</div>
              <StatusPill status={order.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: business, isLoading: bizLoading } = useBusiness(user?.id);
  const { data: customers, isLoading: custsLoading, isFetching: custsFetching } = useCustomers(user?.id);
  const { data: orders, isLoading: ordersLoading, isFetching: ordersFetching } = useOrders(user?.id, { limit: 10 });
  const { data: products, isLoading: prodsLoading } = useProducts(user?.id, { available: false });

  const isLoading = bizLoading || custsLoading || ordersLoading || prodsLoading;
  const isFetching = custsFetching || ordersFetching;

  const firstName = user?.name?.split(" ")[0] || "there";
  const slug = business?.slug || user?.slug;
  const voxyUrl = slug && typeof window !== "undefined" ? `${window.location.origin}/business/${slug}` : "";

  const copyLink = () => {
    if (!voxyUrl) return;
    navigator.clipboard.writeText(voxyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasDescription = !!(business?.description);
  const hasAiConfig = !!(business?.aiConfig?.greeting);
  const hasProducts = (products || []).length > 0;
  const setupItems = [
    { label: "Business information", done: hasDescription, href: "/business/settings" },
    { label: "Configure AI Employee", done: hasAiConfig, href: "/business/ai" },
    { label: "Add your first product", done: hasProducts, href: "/business/products" },
    { label: "Share your Voxy link", done: false, href: "#share" },
  ];
  const setupDone = setupItems.filter((i) => i.done).length;
  const allDone = setupDone === setupItems.length;

  return (
    <DashboardLayout title="Overview">
      <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 py-6">

        {/* Greeting row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {greeting()}, {firstName}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {allDone ? "Your AI Employee is active and ready." : "Let's finish setting up your AI Employee."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshIndicator isFetching={!isLoading && isFetching} />
            <Link
              href={slug ? `/business/${slug}` : "#"}
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            >
              <ExternalLink className="size-3.5" />
              Test Voxy
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <KpiStrip
          customers={customers}
          orders={orders}
          products={products}
          loading={isLoading}
          isFetching={isFetching}
        />

        {/* Two-column: Setup checklist + Share link */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Setup checklist */}
          {!allDone && !isLoading && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-white text-sm">Get Voxy ready</h2>
                <span className="text-xs text-zinc-500">{setupDone}/{setupItems.length} done</span>
              </div>
              <div className="w-full h-0.5 bg-white/5 rounded-full mb-4">
                <div
                  className="h-full bg-[#00D18F] rounded-full transition-all duration-500"
                  style={{ width: `${(setupDone / setupItems.length) * 100}%` }}
                />
              </div>
              <div className="divide-y divide-white/[0.05]">
                {setupItems.map((item) => (
                  <SetupItem key={item.label} {...item} />
                ))}
              </div>
            </div>
          )}

          {/* Share Voxy link */}
          <div id="share" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-[#00D18F]/10 flex items-center justify-center">
                <Bot className="size-4 text-[#00D18F]" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">Your Voxy link</h2>
                <p className="text-xs text-zinc-500">Share this with your customers</p>
              </div>
            </div>
            {slug ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-xs text-zinc-400 font-mono truncate">
                  {voxyUrl}
                </div>
                <button
                  onClick={copyLink}
                  className="shrink-0 h-9 px-3 rounded-lg border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="size-3.5 text-[#00D18F]" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">Complete setup to get your link.</p>
            )}
            <p className="text-xs text-zinc-600 leading-relaxed">
              Customers can chat with your AI Employee directly through this link — no app required.
            </p>
          </div>
        </div>

        {/* Recent orders */}
        <RecentOrders orders={orders} />

        {/* Empty state */}
        {!isLoading && (!customers || customers.length === 0) && (!orders || orders.length === 0) && (
          <div className="text-center py-10 border border-dashed border-white/[0.08] rounded-2xl">
            <Bot className="size-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-4">Your Voxy is ready — no customer activity yet.</p>
            <Link
              href={slug ? `/business/${slug}` : "/business/settings"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D18F] text-black text-sm font-semibold rounded-lg hover:bg-[#00D18F]/90 transition-colors"
            >
              Test Voxy
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
