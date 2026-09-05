"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness, useCustomers, useOrders, useProducts } from "@/hooks/useBusinessData";
import { getBusinessConversations } from "@/lib/api/conversations";
import { SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";
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
  AlertCircle,
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
function KpiStrip({ customers, orders, products, ordersLoading, custsLoading, prodsLoading }) {
  const revenue = (orders || []).reduce((s, o) => s + (o.totalKobo || 0), 0);
  const paidCount = (orders || []).filter((o) => o.status === "paid").length;

  const items = [
    { label: "Revenue", value: ordersLoading ? null : formatNGN(revenue), sub: `${paidCount} paid`, href: "/business/orders", color: "text-[#00D18F]", loading: ordersLoading },
    { label: "Orders", value: ordersLoading ? null : (orders || []).length, sub: "total orders", href: "/business/orders", loading: ordersLoading },
    { label: "Customers", value: custsLoading ? null : (customers || []).length, sub: "total customers", href: "/business/customers", loading: custsLoading },
    { label: "Products", value: prodsLoading ? null : (products || []).length, sub: "in catalogue", href: "/business/products", loading: prodsLoading },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, idx) => {
        if (item.loading) {
          return <SkeletonCard key={item.label || idx} />;
        }
        return (
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
        );
      })}
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

  const getSummary = (order) => {
    if (Array.isArray(order?.items) && order.items.length > 0) {
      return order.items.map((it) => `${it.quantity || 1}× ${it.product?.name || it.name || "Item"}`).join(", ");
    }
    const receiptItems = order?.receipt?.receiptData?.order?.items || order?.receipt?.receiptData?.items;
    if (Array.isArray(receiptItems) && receiptItems.length > 0) {
      return receiptItems.map((it) => `${it.quantity || 1}× ${it.productName || it.name || "Item"}`).join(", ");
    }
    return "Custom order";
  };

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
              {["Customer", "Purchased Items", "Total", "Status"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((order, i) => {
              const summary = getSummary(order);
              const itemCount = order.items?.length || 1;

              return (
                <tr key={order.id} className={`hover:bg-white/[0.015] transition-colors ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{order.customer?.name || "Customer"}</div>
                    <div className="text-[10px] text-zinc-600 font-mono">#{order.id?.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="text-xs font-medium text-zinc-200 truncate" title={summary}>
                      {summary}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {itemCount} {itemCount === 1 ? "product" : "products"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white tabular-nums">
                    {formatNGN(order.totalKobo || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden rounded-2xl border border-white/[0.07] overflow-hidden">
        {recent.map((order, i) => {
          const summary = getSummary(order);

          return (
            <div key={order.id} className={`flex items-center justify-between px-4 py-3 gap-3 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white font-medium truncate">{order.customer?.name || "Customer"}</div>
                <div className="text-xs text-zinc-400 mt-0.5 truncate">{summary}</div>
              </div>
              <div className="text-right space-y-1 shrink-0">
                <div className="text-sm font-semibold text-white tabular-nums">{formatNGN(order.totalKobo || 0)}</div>
                <StatusPill status={order.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Urgent Handoff & Customer Attention Alerts Component ──────────────────────
function AttentionAlerts({ businessId }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchHandoffs = async () => {
      const activeBizId = businessId || user?.id || user?.businessId || user?.business?.id;
      if (!activeBizId) return;

      try {
        const res = await getBusinessConversations(activeBizId);
        if (isMounted && Array.isArray(res)) {
          const attentionRequired = res.filter((c) => {
            const s = (c.status || "").toLowerCase();
            return (
              s === "handed_off" ||
              s === "needs owner response" ||
              s === "needs_attention" ||
              s === "escalated" ||
              s === "pending"
            );
          });
          setConversations(attentionRequired);
        }
      } catch (err) {
        console.warn("[AttentionAlerts] Fetch warning:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHandoffs();
    const interval = setInterval(fetchHandoffs, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [businessId, user?.id, user?.businessId, user?.business?.id]);

  if (conversations.length === 0) return null;

  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-300">
              🚨 {conversations.length} Customer Handoff{conversations.length !== 1 ? "s" : ""} Require Your Attention Right Now!
            </h2>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Customer(s) requested human assistance or the AI transferred the line.
            </p>
          </div>
        </div>
        <Link
          href={conversations[0]?.id ? `/business/inbox?id=${conversations[0].id}` : "/business/inbox"}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold text-xs transition-all shadow-md shrink-0"
        >
          <span>Open Inbox ({conversations.length})</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="space-y-2 pt-1">
        {conversations.slice(0, 3).map((conv) => {
          const lastMsg = conv.messages?.[conv.messages?.length - 1];
          const custName = conv.customer?.name || "Customer";
          return (
            <div
              key={conv.id}
              className="p-3.5 rounded-xl bg-black/50 border border-amber-500/20 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white text-xs">{custName}</span>
                  {conv.customer?.phone && (
                    <span className="text-[10px] text-zinc-400 font-mono">({conv.customer.phone})</span>
                  )}
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 ml-auto sm:ml-0">
                    Needs Attention
                  </span>
                </div>
                <p className="text-zinc-300 truncate">
                  &ldquo;{lastMsg?.content || "Customer requested human support."}&rdquo;
                </p>
              </div>
              <Link
                href={`/business/inbox?id=${conv.id}`}
                className="shrink-0 px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] border border-amber-500/30 transition-colors"
              >
                Respond
              </Link>
            </div>
          );
        })}
      </div>

      <div className="sm:hidden pt-1">
        <Link
          href="/business/inbox"
          className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <span>Open Inbox ({conversations.length})</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: business, isLoading: bizLoading } = useBusiness(user?.id, {
    initialData: user?.business || (user?.name ? user : undefined),
  });
  const { data: customers, isLoading: custsLoading } = useCustomers(user?.id);
  const { data: orders, isLoading: ordersLoading } = useOrders(user?.id, { limit: 10 });
  const { data: products, isLoading: prodsLoading } = useProducts(user?.id, { available: false });

  const businessName = business?.name || user?.name || "there";
  const slug = business?.slug || user?.slug;
  const voxyUrl = slug && typeof window !== "undefined" ? `${window.location.origin}/${slug}` : "";

  const copyLink = () => {
    if (!voxyUrl) return;
    navigator.clipboard.writeText(voxyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Don't compute done-states until data has arrived — avoids false "not done" flicker
  const setupReady = !bizLoading && !prodsLoading;
  const hasDescription = setupReady ? !!(business?.description) : null;
  const hasAiConfig    = setupReady ? !!(business?.aiConfig?.greeting) : null;
  const hasProducts    = setupReady ? (products || []).length > 0 : null;
  const setupItems = [
    { label: "Business information", done: hasDescription, href: "/business/settings" },
    { label: "Configure AI Employee", done: hasAiConfig, href: "/business/ai" },
    { label: "Add your first product", done: hasProducts, href: "/business/products" },
    { label: "Share your Voxy link", done: false, href: "#share" },
  ];
  const setupDone = setupReady ? setupItems.filter((i) => i.done).length : 0;
  const allDone   = setupReady && setupDone === setupItems.length;

  return (
    <DashboardLayout title="Overview">
      <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 py-6">

        {/* Greeting row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {greeting()}, {businessName}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {!setupReady ? "Loading your workspace…" : allDone ? "Your AI Employee is active and ready." : "Let's finish setting up your AI Employee."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={slug ? `/${slug}` : "#"}
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            >
              <ExternalLink className="size-3.5" />
              Test Voxy
            </Link>
          </div>
        </div>

        {/* Urgent Customer Handoff Alerts Banner */}
        <AttentionAlerts businessId={user?.id} />

        {/* KPI strip */}
        <KpiStrip
          customers={customers}
          orders={orders}
          products={products}
          ordersLoading={ordersLoading && !orders}
          custsLoading={custsLoading && !customers}
          prodsLoading={prodsLoading && !products}
        />

        {/* Two-column: Setup checklist + Share link */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Setup checklist */}
          {/* Setup checklist — only show once data has loaded, hide when all done */}
          {!allDone && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-white text-sm">Get Voxy ready</h2>
                <span className="text-xs text-zinc-500">
                  {setupReady ? `${setupDone}/${setupItems.length} done` : "…"}
                </span>
              </div>
              <div className="w-full h-0.5 bg-white/5 rounded-full mb-4">
                <div
                  className="h-full bg-[#00D18F] rounded-full transition-all duration-500"
                  style={{ width: setupReady ? `${(setupDone / setupItems.length) * 100}%` : "0%" }}
                />
              </div>
              {!setupReady ? (
                <div className="space-y-3 py-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <SkeletonText className="size-5 rounded-full" />
                      <SkeletonText className="w-40" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {setupItems.map((item) => (
                    <SetupItem key={item.label} {...item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Share Voxy link */}
          <div id="share" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-[#00D18F]/10 flex items-center justify-center shrink-0">
                  <Bot className="size-4 text-[#00D18F]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-white text-sm truncate">
                    {business?.name ? `${business.name} Link` : "Your Voxy link"}
                  </h2>
                  <p className="text-xs text-zinc-500">Share this with your customers to start chatting</p>
                </div>
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
        {!custsLoading && !ordersLoading && (!customers || customers.length === 0) && (!orders || orders.length === 0) && (
          <div className="text-center py-10 border border-dashed border-white/[0.08] rounded-2xl">
            <Bot className="size-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-4">Your Voxy is ready — no customer activity yet.</p>
            <Link
              href={slug ? `/${slug}` : "/business/settings"}
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
