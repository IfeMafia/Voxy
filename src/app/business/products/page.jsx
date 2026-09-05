"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useBusinessData";
import { SkeletonTable, SkeletonMobileCard, RefreshIndicator } from "@/components/ui/Skeleton";
import { formatNGN } from "@/lib/api/products";
import {
  ShoppingBag,
  Plus,
  Search,
  X,
  Package,
  Edit2,
} from "lucide-react";

export default function ProductsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const searchTimeoutRef = useRef(null);
  const [deferredSearch, setDeferredSearch] = useState("");

  // React Query — client-side filter for search to avoid unnecessary requests
  const { data: allProducts = [], isLoading, isFetching } = useProducts(user?.id, { available: false });

  // Filter locally (data is cached — no network request per keystroke)
  const products = useMemo(() => {
    let list = allProducts;
    if (!showAll) list = list.filter((p) => p.isAvailable);
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      list = list.filter((p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allProducts, deferredSearch, showAll]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDeferredSearch(val), 200);
  };

  const active = allProducts.filter((p) => p.isAvailable && p.stockQuantity !== 0).length;
  const outOfStock = allProducts.filter((p) => p.stockQuantity === 0).length;

  return (
    <DashboardLayout title="Products">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Products</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLoading
                ? "Loading…"
                : `${allProducts.length} total · ${active} active${outOfStock > 0 ? ` · ${outOfStock} out of stock` : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshIndicator isFetching={!isLoading && isFetching} />
            <Link
              href="/business/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D18F] text-black text-sm font-semibold rounded-xl hover:bg-[#00D18F]/90 transition-colors"
            >
              <Plus className="size-4" /> Add product
            </Link>
          </div>
        </div>

        {/* Search & filter */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search products…"
              className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setDeferredSearch(""); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAll((v) => !v)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
              !showAll
                ? "bg-[#00D18F]/10 border-[#00D18F]/30 text-[#00D18F]"
                : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {showAll ? "All products" : "Active only"}
          </button>
        </div>

        {/* Skeleton */}
        {isLoading && (
          <>
            <div className="hidden sm:block">
              <SkeletonTable
                rows={7}
                cols={5}
                headers={["", "Product", "Price", "Stock", "Status"]}
              />
            </div>
            <div className="sm:hidden rounded-2xl border border-white/[0.07] overflow-hidden">
              {[0,1,2,3,4].map((i) => <SkeletonMobileCard key={i} />)}
            </div>
          </>
        )}

        {/* Empty states */}
        {!isLoading && allProducts.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/[0.07] rounded-2xl">
            <ShoppingBag className="size-10 text-zinc-800 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium mb-1">No products yet</p>
            <p className="text-xs text-zinc-600 mb-6">Add your first product and Voxy can start selling it.</p>
            <Link
              href="/business/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D18F] text-black text-sm font-semibold rounded-xl hover:bg-[#00D18F]/90 transition-colors"
            >
              <Plus className="size-4" /> Add product
            </Link>
          </div>
        )}
        {!isLoading && allProducts.length > 0 && products.length === 0 && (
          <div className="text-center py-14 border border-dashed border-white/[0.07] rounded-2xl">
            <p className="text-sm text-zinc-400">No products match &ldquo;{search}&rdquo;</p>
          </div>
        )}

        {/* ── Desktop table ───────────────────────────────────────── */}
        {!isLoading && products.length > 0 && (
          <>
            <div className="hidden sm:block rounded-2xl border border-white/[0.07] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="w-12 px-4 py-3" />
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">Product</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">Price</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">Stock</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">Status</th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const effective = (p.priceKobo || 0) - (p.discountKobo || 0);
                    const isOut = p.stockQuantity === 0;
                    return (
                      <tr
                        key={p.id}
                        className={`group hover:bg-white/[0.015] transition-colors ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                      >
                        {/* Thumbnail */}
                        <td className="px-4 py-3">
                          <Link href={`/business/products/${p.id}`}>
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="size-4 text-zinc-700" />
                              )}
                            </div>
                          </Link>
                        </td>
                        {/* Name */}
                        <td className="px-4 py-3">
                          <Link href={`/business/products/${p.id}`} className="block">
                            <div className="font-medium text-white">{p.name}</div>
                            {p.category && <div className="text-[11px] text-zinc-600 mt-0.5">{p.category}</div>}
                          </Link>
                        </td>
                        {/* Price */}
                        <td className="px-4 py-3">
                          <Link href={`/business/products/${p.id}`} className="block">
                            <div className="font-semibold text-white tabular-nums">{formatNGN(effective)}</div>
                            {p.discountKobo > 0 && (
                              <div className="text-[10px] text-zinc-600 line-through tabular-nums">{formatNGN(p.priceKobo)}</div>
                            )}
                          </Link>
                        </td>
                        {/* Stock */}
                        <td className="px-4 py-3 text-sm tabular-nums">
                          <Link href={`/business/products/${p.id}`} className="block">
                            {p.stockQuantity !== null && p.stockQuantity !== undefined ? (
                              isOut ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
                                  0 (Out of stock)
                                </span>
                              ) : (
                                <span className="text-zinc-300">{p.stockQuantity} left</span>
                              )
                            ) : (
                              <span className="text-zinc-600">Unlimited</span>
                            )}
                          </Link>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Link href={`/business/products/${p.id}`} className="block">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              isOut
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : p.isAvailable
                                ? "bg-[#00D18F]/10 text-[#00D18F]"
                                : "bg-white/5 text-zinc-500"
                            }`}>
                              {isOut ? "Out of Stock" : p.isAvailable ? "Active" : "Hidden"}
                            </span>
                          </Link>
                        </td>
                        {/* Edit / Replenish */}
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/business/products/${p.id}/edit`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-xs ${
                              isOut
                                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-semibold"
                                : "text-zinc-500 hover:text-white hover:bg-white/[0.06] opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <Edit2 className="size-3" /> {isOut ? "Replenish" : "Edit"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ────────────────────────────────────── */}
            <div className="sm:hidden rounded-2xl border border-white/[0.07] overflow-hidden">
              {products.map((p, i) => {
                const effective = (p.priceKobo || 0) - (p.discountKobo || 0);
                const isOut = p.stockQuantity === 0;
                return (
                  <Link
                    key={p.id}
                    href={`/business/products/${p.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/[0.03] border border-white/[0.06] shrink-0 flex items-center justify-center">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="size-4 text-zinc-700" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">{p.name}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                        <span>{formatNGN(effective)}</span>
                        {isOut && <span className="text-red-400 font-semibold">· 0 (Out of stock)</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      isOut
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : p.isAvailable
                        ? "bg-[#00D18F]/10 text-[#00D18F]"
                        : "bg-white/5 text-zinc-500"
                    }`}>
                      {isOut ? "Out of Stock" : p.isAvailable ? "Active" : "Hidden"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
