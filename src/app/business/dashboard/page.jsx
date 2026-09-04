"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { getBusiness } from "@/lib/api/business";
import { listCustomers } from "@/lib/api/customers";
import { listOrders } from "@/lib/api/orders";
import { listProducts } from "@/lib/api/products";
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
} from "lucide-react";
import Link from "next/link";

/* ── Helpers ─────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({ icon: Icon, label, value, href }) {
  const inner = (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] transition-all">
      <div className="size-9 rounded-lg bg-[#00D18F]/10 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-[#00D18F]" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-white tabular-nums">{value}</div>
        <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
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

/* ── Page ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [biz, custs, ords, prods] = await Promise.allSettled([
          getBusiness(user.id),
          listCustomers(user.id),
          listOrders(user.id, { limit: 5 }),
          listProducts(user.id, { available: false }),
        ]);
        if (biz.status === "fulfilled") setBusiness(biz.value);
        if (custs.status === "fulfilled") setCustomers(custs.value || []);
        if (ords.status === "fulfilled") setOrders(ords.value?.orders || []);
        if (prods.status === "fulfilled") setProducts(prods.value?.products || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const slug = business?.slug || user?.slug;
  const voxyUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/chat/${slug}` : "";

  const copyLink = () => {
    if (!voxyUrl) return;
    navigator.clipboard.writeText(voxyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Setup checklist */
  const hasDescription = !!(business?.description);
  const hasAiConfig = !!(business?.aiConfig?.greeting);
  const hasProducts = products.length > 0;
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
      <div className="max-w-4xl mx-auto space-y-8 py-2">

        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {greeting()}, {firstName}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {allDone
                ? "Your AI Employee is active and ready."
                : "Let's finish setting up your AI Employee."}
            </p>
          </div>
          <Link
            href={slug ? `/chat/${slug}` : "#"}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-all"
          >
            <ExternalLink className="size-3.5" />
            Test Voxy
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Customers" value={loading ? "—" : customers.length} href="/business/customers" />
          <StatCard icon={ClipboardList} label="Orders" value={loading ? "—" : orders.length} href="/business/orders" />
          <StatCard icon={MessageCircle} label="Conversations" value={loading ? "—" : customers.length} href="/business/inbox" />
          <StatCard icon={ShoppingBag} label="Products" value={loading ? "—" : products.length} href="/business/products" />
        </div>

        {/* Two-column: Setup + Share */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Setup checklist */}
          {!allDone && (
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

        {/* Recent orders (if any) */}
        {orders.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">Recent orders</h2>
              <Link href="/business/orders" className="text-xs text-zinc-500 hover:text-[#00D18F] transition-colors">
                View all →
              </Link>
            </div>
            <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
              {orders.slice(0, 4).map((order, i) => (
                <div key={order.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
                  <div>
                    <div className="text-sm text-white font-medium">
                      {order.customer?.name || "Customer"}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white tabular-nums">
                      ₦{((order.totalKobo || 0) / 100).toLocaleString("en-NG")}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      order.status === "paid"      ? "bg-[#00D18F]/10 text-[#00D18F]"  :
                      order.status === "confirmed" ? "bg-blue-500/10 text-blue-400"    :
                      order.status === "cancelled" ? "bg-red-500/10 text-red-400"      :
                      "bg-white/5 text-zinc-400"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty-state when absolutely nothing */}
        {!loading && customers.length === 0 && orders.length === 0 && (
          <div className="text-center py-10 border border-dashed border-white/[0.08] rounded-2xl">
            <Bot className="size-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-4">
              Your Voxy is ready — no customer activity yet.
            </p>
            <Link
              href={slug ? `/chat/${slug}` : "/business/settings"}
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
