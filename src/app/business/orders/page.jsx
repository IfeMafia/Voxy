"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { listOrders, getOrder, updateOrderStatus, cancelOrder } from "@/lib/api/orders";
import { formatNGN } from "@/lib/api/products";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  X,
  User,
  Phone,
  Mail,
  ShoppingBag,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

const STATUS_TABS = [
  { key: "all", label: "All Orders" },
  { key: "draft", label: "Draft" },
  { key: "confirmed", label: "Confirmed" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
];

function StatusPill({ status }) {
  const styles = {
    paid: "bg-[#00D18F]/10 text-[#00D18F] border-[#00D18F]/20",
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    draft: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
        styles[status] || "bg-white/5 text-zinc-400 border-white/10"
      }`}
    >
      {status}
    </span>
  );
}

function OrderDetailDrawer({ orderId, onClose, onStatusChange }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(orderId)
      .then(setOrder)
      .catch((err) => {
        console.error("Order load error:", err);
        toast.error("Failed to load order details");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleTransition = async (newStatus) => {
    if (!order?.id || actionLoading) return;
    setActionLoading(true);
    try {
      if (newStatus === "cancelled") {
        await cancelOrder(order.id);
      } else {
        await updateOrderStatus(order.id, newStatus);
      }
      toast.success(`Order marked as ${newStatus}`);
      setOrder((o) => ({ ...o, status: newStatus }));
      onStatusChange?.(order.id, newStatus);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-[#0a0a0a] border-l border-white/[0.07] h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] sticky top-0 bg-[#0a0a0a] z-10">
          <div>
            <h2 className="font-semibold text-white text-sm">Order #{orderId?.slice(0, 8)}</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {order?.createdAt ? new Date(order.createdAt).toLocaleString("en-NG") : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-zinc-600" />
          </div>
        ) : !order ? (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-600">
            Order not found
          </div>
        ) : (
          <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-zinc-400">Current Status</span>
                <StatusPill status={order.status} />
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="size-3.5" /> Customer details
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="text-sm font-semibold text-white">
                    {order.customer?.name || "Anonymous customer"}
                  </div>
                  {order.customer?.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Phone className="size-3 text-zinc-500" />
                      {order.customer.phone}
                    </div>
                  )}
                  {order.customer?.email && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Mail className="size-3 text-zinc-500" />
                      {order.customer.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="size-3.5" /> Ordered items ({(order.items || []).length})
                </h3>
                <div className="divide-y divide-white/[0.05] rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                  {(order.items || []).map((item, idx) => (
                    <div key={item.id || idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">
                          {item.product?.name || `Product (${item.productId?.slice(0, 6)})`}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {item.quantity} × {formatNGN(item.unitPriceKobo || 0)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-white tabular-nums">
                        {formatNGN((item.quantity || 1) * (item.unitPriceKobo || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total Summary */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatNGN(order.totalKobo || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-white pt-2 border-t border-white/[0.06]">
                  <span>Total amount</span>
                  <span className="text-[#00D18F] tabular-nums">{formatNGN(order.totalKobo || 0)}</span>
                </div>
              </div>
            </div>

            {/* Status Machine Actions */}
            <div className="pt-4 border-t border-white/[0.06] space-y-2">
              {order.status === "draft" && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleTransition("confirmed")}
                    disabled={actionLoading}
                    className="w-full h-11 bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="size-4 animate-spin" /> : "Confirm order"}
                  </button>
                  <button
                    onClick={() => handleTransition("cancelled")}
                    disabled={actionLoading}
                    className="w-full h-10 border border-red-500/20 text-red-400 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    Cancel order
                  </button>
                </div>
              )}

              {order.status === "confirmed" && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleTransition("paid")}
                    disabled={actionLoading}
                    className="w-full h-11 bg-[#00D18F] text-black font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-[#00D18F]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="size-4 animate-spin" /> : "Mark as paid"}
                  </button>
                  <button
                    onClick={() => handleTransition("cancelled")}
                    disabled={actionLoading}
                    className="w-full h-10 border border-red-500/20 text-red-400 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    Cancel order
                  </button>
                </div>
              )}

              {order.status === "paid" && (
                <div className="p-3 rounded-xl bg-[#00D18F]/10 border border-[#00D18F]/20 text-center text-xs text-[#00D18F] font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="size-4" /> This order has been paid in full.
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-xs text-red-400 font-medium flex items-center justify-center gap-2">
                  <XCircle className="size-4" /> This order was cancelled.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = activeTab === "all" ? {} : { status: activeTab };
      const res = await listOrders(user.id, params);
      setOrders(res?.orders || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  const totalValueKobo = orders.reduce((sum, ord) => sum + (ord.totalKobo || 0), 0);

  return (
    <DashboardLayout title="Orders">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Orders</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Track customer orders taken by Voxy and manage fulfillment.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors self-start sm:self-auto"
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] pb-3 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-zinc-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl">
            <ClipboardList className="size-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium mb-1">
              {activeTab === "all" ? "No orders yet" : `No ${activeTab} orders`}
            </p>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              When customers place orders through Voxy chats, they will automatically appear here with full line items and totals.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.01]">
            <div className="grid grid-cols-[1fr_auto_auto_auto] text-[11px] font-bold uppercase tracking-wider text-zinc-600 px-5 py-3 border-b border-white/[0.05]">
              <span>Order / Customer</span>
              <span className="px-6">Status</span>
              <span className="px-4 text-right">Total</span>
              <span className="w-6" />
            </div>

            {orders.map((order, i) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`w-full grid grid-cols-[1fr_auto_auto_auto] items-center px-5 py-4 text-left hover:bg-white/[0.03] transition-colors ${
                  i > 0 ? "border-t border-white/[0.04]" : ""
                }`}
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {order.customer?.name || "Customer"}
                    </span>
                    <span className="text-[11px] text-zinc-600 font-mono">
                      #{order.id?.slice(0, 6)}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {(order.items || []).length} item{(order.items || []).length !== 1 ? "s" : ""} •{" "}
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : ""}
                  </div>
                </div>

                <div className="px-6">
                  <StatusPill status={order.status} />
                </div>

                <div className="px-4 text-right">
                  <div className="text-sm font-bold text-white tabular-nums">
                    {formatNGN(order.totalKobo || 0)}
                  </div>
                </div>

                <ChevronRight className="size-4 text-zinc-700" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedOrderId && (
        <OrderDetailDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </DashboardLayout>
  );
}
