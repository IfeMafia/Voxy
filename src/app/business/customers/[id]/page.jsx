"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCustomer } from "@/lib/api/customers";
import { formatNGN } from "@/lib/api/products";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  MessageCircle,
  ShoppingBag,
  Calendar,
  Globe,
  TrendingUp,
} from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${formattedDate} at ${timeStr}`;
}

function OrderStatusPill({ status }) {
  const styles = {
    paid: "bg-[#00D18F]/10 text-[#00D18F]",
    confirmed: "bg-blue-500/10 text-blue-400",
    draft: "bg-amber-500/10 text-amber-400",
    cancelled: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status] || "bg-white/5 text-zinc-500"}`}>
      {status}
    </span>
  );
}

function ConvStatusPill({ status }) {
  const styles = {
    active: "bg-[#00D18F]/10 text-[#00D18F]",
    handed_off: "bg-orange-500/10 text-orange-400",
    closed: "bg-white/5 text-zinc-500",
  };
  const labels = { active: "Active", handed_off: "Handed off", closed: "Closed" };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status] || "bg-white/5 text-zinc-500"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCustomer(id)
      .then(setCustomer)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Customer">
        <div className="flex items-center justify-center h-60">
          <Loader2 className="size-6 animate-spin text-zinc-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout title="Customer">
        <div className="flex items-center justify-center h-60 text-sm text-zinc-500">
          Customer not found.{" "}
          <Link href="/business/customers" className="text-[#00D18F] ml-2 hover:underline">Go back</Link>
        </div>
      </DashboardLayout>
    );
  }

  const totalSpend = (customer.orders || []).reduce((s, o) => s + (o.totalKobo || 0), 0);
  const paidOrders = (customer.orders || []).filter((o) => o.status === "paid");
  const firstSeen = customer.createdAt;
  const lastActive = customer.updatedAt;

  return (
    <DashboardLayout title={customer.name || "Customer"}>
      <div className="max-w-4xl mx-auto pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 py-4 mb-2">
          <Link href="/business/customers" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="size-3.5" /> Customers
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-xs text-zinc-400 truncate max-w-[200px]">{customer.name || "Customer"}</span>
        </div>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="size-16 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/15 flex items-center justify-center text-2xl font-bold text-[#00D18F] shrink-0">
            {(customer.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{customer.name || "Unknown customer"}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                  <Phone className="size-3.5 text-zinc-600" /> {customer.phone}
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                  <Mail className="size-3.5 text-zinc-600" /> {customer.email}
                </a>
              )}
              {customer.channel && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Globe className="size-3.5 text-zinc-600" /> {customer.channel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/[0.07]">
            <div className="text-[11px] text-zinc-500 mb-1">Total spend</div>
            <div className="text-lg font-bold text-[#00D18F] tabular-nums">{formatNGN(totalSpend)}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/[0.07]">
            <div className="text-[11px] text-zinc-500 mb-1">Orders</div>
            <div className="text-lg font-bold text-white tabular-nums">{(customer.orders || []).length}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/[0.07]">
            <div className="text-[11px] text-zinc-500 mb-1">Paid orders</div>
            <div className="text-lg font-bold text-white tabular-nums">{paidOrders.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/[0.07]">
            <div className="text-[11px] text-zinc-500 mb-1">Last active</div>
            <div className="text-sm font-semibold text-white">{timeAgo(lastActive)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Orders + Conversations */}
          <div className="lg:col-span-2 space-y-4">
            {/* Orders */}
            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ShoppingBag className="size-3.5" /> Orders ({(customer.orders || []).length})
              </h2>
              {(customer.orders || []).length === 0 ? (
                <p className="text-xs text-zinc-600">No orders yet from this customer.</p>
              ) : (
                <div className="space-y-2">
                  {(customer.orders || []).map((order) => {
                    const receiptItems = order.receipt?.receiptData?.order?.items || order.receipt?.receiptData?.items;
                    const itemsSummary = (order.items && order.items.length > 0)
                      ? order.items.map((it) => `${it.quantity || 1}× ${it.product?.name || it.name || "Item"}`).join(", ")
                      : (Array.isArray(receiptItems) && receiptItems.length > 0)
                      ? receiptItems.map((it) => `${it.quantity || 1}× ${it.productName || it.name || "Item"}`).join(", ")
                      : `${(order.items || []).length || 1} items`;

                    return (
                      <Link
                        key={order.id}
                        href="/business/orders"
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-colors gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-400 font-semibold">#{order.id?.slice(0, 8)}</span>
                            <span className="text-[11px] text-zinc-600">· {timeAgo(order.createdAt)}</span>
                          </div>
                          <div className="text-xs font-medium text-zinc-200 mt-1 truncate" title={itemsSummary}>
                            {itemsSummary}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <OrderStatusPill status={order.status} />
                          <div className="text-sm font-semibold text-white tabular-nums">{formatNGN(order.totalKobo || 0)}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Conversations */}
            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <MessageCircle className="size-3.5" /> Conversations ({(customer.conversations || []).length})
              </h2>
              {(customer.conversations || []).length === 0 ? (
                <p className="text-xs text-zinc-600">No conversations yet.</p>
              ) : (
                <div className="space-y-2">
                  {(customer.conversations || []).map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/business/inbox?id=${conv.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-colors"
                    >
                      <div>
                        <div className="text-xs font-mono text-zinc-500">#{conv.id?.slice(0, 8)}</div>
                        <div className="text-[11px] text-zinc-600 mt-0.5">{timeAgo(conv.updatedAt)}</div>
                      </div>
                      <ConvStatusPill status={conv.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Details</h3>
              <dl className="space-y-3.5 text-sm">
                <div>
                  <dt className="text-[11px] text-zinc-600 mb-0.5">First seen</dt>
                  <dd className="text-zinc-300">
                    {firstSeen
                      ? new Date(firstSeen).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-zinc-600 mb-0.5">Channel</dt>
                  <dd className="text-zinc-300 capitalize">{customer.channel || "Web"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-zinc-600 mb-0.5">Language</dt>
                  <dd className="text-zinc-300">{customer.preferredLanguage || "English"}</dd>
                </div>
                {totalSpend > 0 && (
                  <div>
                    <dt className="text-[11px] text-zinc-600 mb-0.5">Lifetime value</dt>
                    <dd className="text-[#00D18F] font-semibold tabular-nums">{formatNGN(totalSpend)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <Link
              href={customer.conversations?.[0]?.id ? `/business/inbox?id=${customer.conversations[0].id}` : "/business/inbox"}
              className="w-full h-10 border border-white/[0.08] text-zinc-400 text-sm font-medium rounded-xl hover:text-white hover:border-white/[0.15] transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="size-3.5" /> View in Inbox
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
