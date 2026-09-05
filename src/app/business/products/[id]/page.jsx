"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getProduct, deleteProduct, formatNGN } from "@/lib/api/products";
import { listOrders } from "@/lib/api/orders";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Loader2,
  Edit2,
  Trash2,
  ShoppingBag,
  Package,
  Tag,
  ClipboardList,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";

function StatusBadge({ available }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
        available
          ? "bg-[#00D18F]/10 text-[#00D18F]"
          : "bg-white/[0.05] text-zinc-500"
      }`}
    >
      <span className={`size-1.5 rounded-full ${available ? "bg-[#00D18F]" : "bg-zinc-600"}`} />
      {available ? "Active" : "Hidden"}
    </span>
  );
}

function OrderStatusBadge({ status }) {
  const map = {
    paid:      "bg-[#00D18F]/10 text-[#00D18F]",
    confirmed: "bg-blue-500/10 text-blue-400",
    draft:     "bg-amber-500/10 text-amber-400",
    cancelled: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${map[status] || "bg-white/5 text-zinc-500"}`}>
      {status}
    </span>
  );
}

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded-lg ${className}`} />;
}

function ProductDetailSkeleton() {
  return (
    <DashboardLayout title="Product">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="flex items-start gap-5 mb-8">
          <Skeleton className="size-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getProduct(id),
      user?.id ? listOrders(user.id, {}) : Promise.resolve({ orders: [] }),
    ])
      .then(([p, ordersRes]) => {
        setProduct(p);
        const related = (ordersRes?.orders || [])
          .filter((o) => (o.items || []).some((item) => item.productId === id))
          .slice(0, 5);
        setRecentOrders(related);
      })
      .catch(() => toast.error("Failed to load product."))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(id);
      toast.success("Product removed");
      router.push("/business/products");
    } catch (err) {
      toast.error(err.message || "Failed to remove product.");
      setDeleting(false);
    }
  };

  if (loading) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <DashboardLayout title="Product">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <ShoppingBag className="size-12 text-zinc-700" />
            <p className="text-sm text-zinc-500">Product not found.</p>
            <Link href="/business/products" className="text-sm text-[#00D18F] hover:underline flex items-center gap-1">
              <ArrowLeft className="size-3.5" /> Back to products
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const effectivePrice = (product.priceKobo || 0) - (product.discountKobo || 0);
  const hasDiscount = (product.discountKobo || 0) > 0;
  const discountPct = hasDiscount
    ? Math.round((product.discountKobo / product.priceKobo) * 100)
    : 0;
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= 5;

  return (
    <DashboardLayout title={product.name}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-zinc-600 mb-6">
          <Link href="/business/products" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="size-3" /> Products
          </Link>
          <span>/</span>
          <span className="text-zinc-400 truncate max-w-[180px]">{product.name}</span>
        </nav>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="size-20 rounded-2xl object-cover border border-white/[0.07] shrink-0" />
            ) : (
              <div className="size-20 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center shrink-0">
                <ShoppingBag className="size-8 text-zinc-700" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">{product.name}</h1>
              {product.category && (
                <p className="text-xs text-zinc-500 mt-0.5">{product.category}</p>
              )}
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <StatusBadge available={product.isAvailable} />
                {isOutOfStock && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                    <XCircle className="size-3" /> Out of stock
                  </span>
                )}
                {isLowStock && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    <AlertTriangle className="size-3" /> Low stock
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/business/products/${id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D18F] text-black text-sm font-semibold rounded-xl hover:bg-[#00D18F]/90 transition-colors active:scale-[0.98]"
            >
              <Edit2 className="size-3.5" /> Edit product
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/[0.06] hover:border-red-500/30 disabled:opacity-50 transition-colors"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </button>
          </div>
        </div>

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-400">Delete "{product.name}"?</p>
              <p className="text-xs text-zinc-500 mt-0.5">This action cannot be undone. Orders referencing this product remain unaffected.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3.5 py-2 text-xs font-semibold border border-white/10 text-zinc-400 rounded-xl hover:text-white hover:border-white/20 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-xs font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {deleting ? <Loader2 className="size-3 animate-spin" /> : null} Delete
              </button>
            </div>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">

          {/* Left — primary content */}
          <div className="space-y-4">

            {/* Description */}
            {product.description && (
              <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
                <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Description</h2>
                <p className="text-sm text-zinc-300 leading-relaxed">{product.description}</p>
              </section>
            )}

            {/* Pricing */}
            <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="size-3.5 text-zinc-500" />
                <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Pricing</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] text-zinc-600 mb-1">List price</p>
                  <p className={`text-xl font-bold tabular-nums ${hasDiscount ? "text-zinc-500 line-through" : "text-white"}`}>
                    {formatNGN(product.priceKobo || 0)}
                  </p>
                </div>
                {hasDiscount && (
                  <div>
                    <p className="text-[11px] text-zinc-600 mb-1">Discount ({discountPct}%)</p>
                    <p className="text-xl font-bold text-red-400 tabular-nums">−{formatNGN(product.discountKobo)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-zinc-600 mb-1">Customer pays</p>
                  <p className="text-xl font-bold text-[#00D18F] tabular-nums">{formatNGN(effectivePrice)}</p>
                </div>
              </div>
            </section>

            {/* Inventory */}
            <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="size-3.5 text-zinc-500" />
                <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Inventory</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-zinc-600 mb-1">Stock quantity</p>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {product.stockQuantity !== null && product.stockQuantity !== undefined
                      ? product.stockQuantity.toLocaleString()
                      : "∞"}
                  </p>
                  {product.stockQuantity === null || product.stockQuantity === undefined ? (
                    <p className="text-[11px] text-zinc-600 mt-0.5">Unlimited / not tracked</p>
                  ) : null}
                </div>
                <div>
                  <p className="text-[11px] text-zinc-600 mb-1">Stock status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {isOutOfStock ? (
                      <><XCircle className="size-5 text-red-400" /><span className="text-sm font-semibold text-red-400">Out of stock</span></>
                    ) : isLowStock ? (
                      <><AlertTriangle className="size-5 text-amber-400" /><span className="text-sm font-semibold text-amber-400">Low stock</span></>
                    ) : (
                      <><CheckCircle2 className="size-5 text-[#00D18F]" /><span className="text-sm font-semibold text-[#00D18F]">In stock</span></>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Recent orders */}
            <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-3.5 text-zinc-500" />
                  <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Orders with this product</h2>
                </div>
                {recentOrders.length > 0 && (
                  <Link href="/business/orders" className="text-[11px] text-zinc-500 hover:text-[#00D18F] transition-colors flex items-center gap-0.5">
                    View all <ChevronRight className="size-3" />
                  </Link>
                )}
              </div>
              {recentOrders.length === 0 ? (
                <div className="py-8 text-center">
                  <TrendingUp className="size-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600">No orders include this product yet.</p>
                  <p className="text-[11px] text-zinc-700 mt-0.5">Orders placed through Voxy will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href="/business/orders"
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all group"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{order.customer?.name || "Customer"}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">#{order.id?.slice(0, 8)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-sm font-bold text-white tabular-nums">{formatNGN(order.totalKobo || 0)}</span>
                        <ChevronRight className="size-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right — sidebar metadata */}
          <div className="space-y-4">
            <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-[11px] text-zinc-600 mb-1">Status</dt>
                  <dd><StatusBadge available={product.isAvailable} /></dd>
                </div>
                {product.category && (
                  <div>
                    <dt className="text-[11px] text-zinc-600 mb-1">Category</dt>
                    <dd className="text-sm text-zinc-300">{product.category}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] text-zinc-600 mb-1">Created</dt>
                  <dd className="text-sm text-zinc-300">
                    {product.createdAt
                      ? new Date(product.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-zinc-600 mb-1">Last updated</dt>
                  <dd className="text-sm text-zinc-300">
                    {product.updatedAt
                      ? new Date(product.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </dd>
                </div>
                {product.tags?.length > 0 && (
                  <div>
                    <dt className="text-[11px] text-zinc-600 mb-2">Tags</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {product.tags.map((tag) => (
                        <span key={tag} className="text-[11px] text-zinc-400 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href={`/business/products/${id}/edit`}
                className="w-full h-11 bg-[#00D18F] text-black text-sm font-semibold rounded-xl hover:bg-[#00D18F]/90 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Edit2 className="size-4" /> Edit product
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                disabled={deleting}
                className="w-full h-11 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/[0.06] hover:border-red-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete product
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
