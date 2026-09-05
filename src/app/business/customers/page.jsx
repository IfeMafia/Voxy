"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useBusinessData";
import { SkeletonTable, SkeletonMobileCard, RefreshIndicator } from "@/components/ui/Skeleton";
import {
  Users,
  Search,
  X,
  ChevronRight,
  Globe,
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

export default function CustomersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading, isFetching } = useCustomers(user?.id);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <DashboardLayout title="Customers">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Customers</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLoading ? "Loading…" : `${customers.length} customer${customers.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <RefreshIndicator isFetching={!isLoading && isFetching} />
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Skeleton while loading */}
        {isLoading && (
          <>
            <div className="hidden sm:block">
              <SkeletonTable
                rows={7}
                cols={4}
                headers={["Customer", "Channel", "Last active", ""]}
              />
            </div>
            <div className="sm:hidden rounded-2xl border border-white/[0.07] overflow-hidden">
              {[0,1,2,3,4,5].map((i) => <SkeletonMobileCard key={i} />)}
            </div>
          </>
        )}

        {/* Empty states */}
        {!isLoading && customers.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/[0.07] rounded-2xl">
            <Users className="size-10 text-zinc-800 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium mb-1">No customers yet</p>
            <p className="text-xs text-zinc-600">Customers will appear here once they chat with Voxy.</p>
          </div>
        )}
        {!isLoading && customers.length > 0 && filtered.length === 0 && (
          <div className="text-center py-14 border border-dashed border-white/[0.07] rounded-2xl">
            <p className="text-sm text-zinc-400">No customers match &ldquo;{search}&rdquo;</p>
          </div>
        )}

        {/* ── Desktop table ───────────────────────────────────────────────── */}
        {!isLoading && filtered.length > 0 && (
          <>
            <div className="hidden sm:block rounded-2xl border border-white/[0.07] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">Customer</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">Contact</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">Channel</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">Last active</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`group hover:bg-white/[0.015] transition-colors cursor-pointer ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <Link href={`/business/customers/${c.id}`} className="flex items-center gap-3">
                          <div className="size-7 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#00D18F]">
                            {(c.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{c.name || "Unknown"}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        <Link href={`/business/customers/${c.id}`} className="block">
                          {c.email || c.phone || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/business/customers/${c.id}`} className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Globe className="size-3.5 text-zinc-700" />
                          <span className="capitalize">{c.channel || "web"}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        <Link href={`/business/customers/${c.id}`} className="block">
                          {timeAgo(c.updatedAt)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/business/customers/${c.id}`}>
                          <ChevronRight className="size-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ──────────────────────────────────────────── */}
            <div className="sm:hidden rounded-2xl border border-white/[0.07] overflow-hidden">
              {filtered.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/business/customers/${c.id}`}
                  className={`flex items-center px-4 py-3.5 hover:bg-white/[0.02] transition-colors gap-3 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                >
                  <div className="size-8 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/10 flex items-center justify-center shrink-0 text-sm font-bold text-[#00D18F]">
                    {(c.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{c.name || "Unknown"}</div>
                    <div className="text-[11px] text-zinc-600 truncate">{c.email || c.phone || "—"}</div>
                  </div>
                  <div className="text-xs text-zinc-600 shrink-0">{timeAgo(c.updatedAt)}</div>
                  <ChevronRight className="size-4 text-zinc-700 shrink-0" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
