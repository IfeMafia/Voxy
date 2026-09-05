"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, useInvalidators } from "@/hooks/useBusinessData";
import { getOrder, updateOrderStatus, cancelOrder } from "@/lib/api/orders";
import { formatNGN } from "@/lib/api/products";
import { SkeletonTable, SkeletonCard, RefreshIndicator } from "@/components/ui/Skeleton";
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
  MapPin,
  MessageSquare,
  CreditCard,
  Receipt,
  ExternalLink,
  PackageCheck,
  Bot,
  Sparkles,
  Truck,
  BrainCircuit,
} from "lucide-react";
import Link from "next/link";
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

function extractDeliveryInfo(order) {
  const msgs = order?.conversation?.messages;
  let detectedAddress = null;
  let lastCustomerNote = null;

  if (Array.isArray(msgs) && msgs.length > 0) {
    const userMsgs = msgs.filter((m) => m.role === "user" || m.sender === "customer");
    for (const msg of userMsgs) {
      const text = typeof msg.content === "string" ? msg.content : "";
      
      const addrMatch = text.match(/(?:deliver(?:y| to)?|address is|location is|i am at|bring it to|send it to|house address is|live at)\s*[:\-]?\s*([^.,\n]{5,100})/i);
      if (addrMatch && !detectedAddress) {
        detectedAddress = addrMatch[1].trim();
      }

      const streetMatch = text.match(/\b(?:\d+[\w\s,]+(?:street|st|road|rd|avenue|ave|close|cl|crescent|cres|estate|way|lane|drive|dr|phase\s*\d|plot\s*\d|flat\s*\d|abuja|lagos|lekki|ikeja|yaba|surulere|vi|victoria island|ikoyi|garki|wuse|maitama)[\w\s,]*)/i);
      if (streetMatch && !detectedAddress) {
        detectedAddress = streetMatch[0].trim();
      }
    }
    if (userMsgs.length > 0) {
      lastCustomerNote = userMsgs[userMsgs.length - 1].content;
    }
  }

  return {
    address: detectedAddress || order?.receipt?.receiptData?.deliveryAddress || null,
    lastNote: lastCustomerNote,
  };
}

function getOrderItemsList(order) {
  if (Array.isArray(order?.items) && order.items.length > 0) {
    return order.items.map((item) => ({
      id: item.id,
      name: item.product?.name || item.name || `Product (${item.productId?.slice(0, 6) || 'Item'})`,
      quantity: item.quantity || 1,
      unitPriceKobo: item.unitPriceKobo || (item.product?.priceKobo ?? 0),
      imageUrl: item.product?.imageUrl || null,
      stockQuantity: item.product?.stockQuantity,
    }));
  }
  const receiptItems = order?.receipt?.receiptData?.order?.items || order?.receipt?.receiptData?.items;
  if (Array.isArray(receiptItems) && receiptItems.length > 0) {
    return receiptItems.map((item, idx) => ({
      id: `receipt_item_${idx}`,
      name: item.productName || item.name || 'Product',
      quantity: item.quantity || 1,
      unitPriceKobo: item.unitPriceKobo || (item.unitPrice ? Math.round(item.unitPrice * 100) : 0),
      imageUrl: item.imageUrl || null,
      stockQuantity: null,
    }));
  }
  return [];
}

function generateAiOrderReport(order, itemsList, deliveryInfo) {
  if (!order) return null;
  const customerName = order.customer?.name || "Customer";
  const channel = order.customer?.channel === "voice" ? "Voice AI Call" : "Web Chat AI";
  const status = order.status;
  const totalStr = formatNGN(order.totalKobo || 0);

  const itemsSummary = itemsList.length > 0 
    ? itemsList.map((i) => `${i.quantity || 1}× ${i.name}`).join(", ") 
    : "Items ordered";

  let debriefText = "";
  if (status === "paid") {
    debriefText = `${customerName} successfully completed checkout via ${channel} for ${itemsSummary} (${totalStr}). Payment was verified on Paystack and catalogue inventory counts have been deducted.`;
  } else if (status === "confirmed") {
    debriefText = `${customerName} confirmed their order for ${itemsSummary} (${totalStr}) via ${channel}. Awaiting final payment confirmation.`;
  } else if (status === "cancelled") {
    debriefText = `Order for ${itemsSummary} (${totalStr}) by ${customerName} was cancelled. Reserved catalogue stock was restored.`;
  } else {
    debriefText = `${customerName} initiated a draft order for ${itemsSummary} (${totalStr}) via ${channel}.`;
  }

  let nextAction = "";
  if (status === "paid") {
    if (deliveryInfo?.address) {
      nextAction = `Package ${itemsList.length || 1} item(s) and dispatch to "${deliveryInfo.address}". Contact: ${order.customer?.phone || order.customer?.email || "Customer Chat"}.`;
    } else {
      nextAction = `Contact customer to confirm exact delivery destination address prior to courier dispatch.`;
    }
  } else if (status === "confirmed" || status === "draft") {
    nextAction = `Payment pending. Follow up via Inbox or share the payment link.`;
  } else {
    nextAction = `No action needed (Order cancelled).`;
  }

  return {
    headline: debriefText,
    itemsSummary,
    delivery: deliveryInfo?.address || "Standard Delivery / Pending confirmation",
    nextAction,
    lastNote: deliveryInfo?.lastNote,
  };
}

function OrderDetailModal({ orderId, onClose, onStatusChange }) {
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

  const itemsList = useMemo(() => getOrderItemsList(order), [order]);
  const deliveryInfo = useMemo(() => extractDeliveryInfo(order), [order]);
  const aiReport = useMemo(() => generateAiOrderReport(order, itemsList, deliveryInfo), [order, itemsList, deliveryInfo]);
  const latestPayment = order?.payments?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-white text-sm">Order #{orderId?.slice(0, 8)}</h2>
            {order?.status && <StatusPill status={order.status} />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <Loader2 className="size-6 animate-spin text-[#00D18F]" />
            <span className="text-xs">Loading order...</span>
          </div>
        ) : !order ? (
          <div className="p-16 flex items-center justify-center text-xs text-zinc-500">
            Order not found
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Order Meta bar */}
              <div className="flex items-center justify-between text-xs text-zinc-500 px-0.5">
                <span>
                  {order?.createdAt ? new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : ""}
                </span>
                {order.receipt?.receiptNumber && (
                  <span className="font-mono text-[#00D18F]">Receipt: {order.receipt.receiptNumber}</span>
                )}
              </div>

              {/* AI Sales Summary */}
              {aiReport && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Bot className="size-3.5 text-[#00D18F]" />
                    <span>AI Sales Debrief</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {aiReport.headline}
                  </p>
                  <div className="pt-2 border-t border-white/[0.04] space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-zinc-500 w-28 shrink-0">Delivery Location:</span>
                      <span className="text-zinc-200 font-medium">{aiReport.delivery}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-zinc-500 w-28 shrink-0">Recommended:</span>
                      <span className="text-zinc-300">{aiReport.nextAction}</span>
                    </div>
                    {aiReport.lastNote && (
                      <div className="flex items-start gap-2">
                        <span className="text-zinc-500 w-28 shrink-0">Customer Note:</span>
                        <span className="text-zinc-400 italic">&ldquo;{aiReport.lastNote}&rdquo;</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer & Channel Details */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Customer
                  </span>
                  {order.conversationId && (
                    <Link
                      href="/business/inbox"
                      className="text-xs text-[#00D18F] hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="size-3" /> View Chat
                    </Link>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-white">{order.customer?.name || "Anonymous Customer"}</div>
                    <div className="text-zinc-500 capitalize text-[11px] mt-0.5">
                      Channel: {order.customer?.channel || "Web Chat"}
                    </div>
                  </div>
                  <div className="text-right text-zinc-400 space-y-0.5">
                    {order.customer?.phone && <div>{order.customer.phone}</div>}
                    {order.customer?.email && <div>{order.customer.email}</div>}
                  </div>
                </div>
              </div>

              {/* Purchased Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Items ({itemsList.length})
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {itemsList.reduce((acc, item) => acc + (item.quantity || 1), 0)} units total
                  </span>
                </div>

                {itemsList.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-500 text-center">
                    No itemized product lines attached to this order.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04] rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                    {itemsList.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="size-9 rounded-lg object-cover bg-white/5 shrink-0 border border-white/10"
                            />
                          ) : (
                            <div className="size-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-zinc-500">
                              <ShoppingBag className="size-3.5 text-zinc-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate" title={item.name}>
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                              <span>{item.quantity} × {formatNGN(item.unitPriceKobo || 0)}</span>
                              {typeof item.stockQuantity === "number" && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded ${item.stockQuantity > 0 ? "bg-white/[0.06] text-zinc-400" : "bg-red-500/10 text-red-400 font-medium"}`}>
                                  {item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : "Out of stock"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-white tabular-nums shrink-0">
                          {formatNGN((item.quantity || 1) * (item.unitPriceKobo || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment & Total Breakdown */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-zinc-300">{formatNGN(order.totalKobo || 0)}</span>
                </div>
                {latestPayment && (
                  <div className="flex items-center justify-between text-zinc-400 pt-1.5 border-t border-white/[0.04]">
                    <span>Payment ({latestPayment.channel || "card"})</span>
                    <span className="font-mono text-[11px] text-zinc-300">{latestPayment.reference || "Verified"}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-semibold text-white pt-2 border-t border-white/[0.06]">
                  <span>Total Amount</span>
                  <span className="text-[#00D18F] tabular-nums">{formatNGN(order.totalKobo || 0)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3.5 px-5 bg-[#0a0a0a] border-t border-white/[0.06] flex items-center justify-between gap-3">
              {order.status === "draft" && (
                <div className="flex items-center gap-2 w-full justify-end">
                  <button
                    onClick={() => handleTransition("cancelled")}
                    disabled={actionLoading}
                    className="h-8 px-3 border border-red-500/20 text-red-400 font-medium text-xs rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Cancel order
                  </button>
                  <button
                    onClick={() => handleTransition("confirmed")}
                    disabled={actionLoading}
                    className="h-8 px-4 bg-blue-500 text-white font-medium text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm order"}
                  </button>
                </div>
              )}

              {order.status === "confirmed" && (
                <div className="flex items-center gap-2 w-full justify-end">
                  <button
                    onClick={() => handleTransition("cancelled")}
                    disabled={actionLoading}
                    className="h-8 px-3 border border-red-500/20 text-red-400 font-medium text-xs rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Cancel order
                  </button>
                  <button
                    onClick={() => handleTransition("paid")}
                    disabled={actionLoading}
                    className="h-8 px-4 bg-[#00D18F] text-black font-semibold text-xs rounded-lg hover:bg-[#00D18F]/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Mark as paid"}
                  </button>
                </div>
              )}

              {order.status === "paid" && (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 text-xs text-[#00D18F] font-medium">
                    <CheckCircle2 className="size-3.5" /> Payment verified via Paystack
                  </div>
                  <button
                    onClick={onClose}
                    className="h-8 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                    <XCircle className="size-3.5" /> Order cancelled
                  </div>
                  <button
                    onClick={onClose}
                    className="h-8 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { invalidateOrders } = useInvalidators();

  // React Query — live background revalidation
  const queryParams = activeTab === "all" ? {} : { status: activeTab };
  const { data: orders = [], isLoading, isFetching, refetch } = useOrders(user?.id, queryParams, { refetchInterval: 3000 });

  const handleStatusChange = (orderId, newStatus) => {
    // Invalidate cache so next refetch gets fresh data
    invalidateOrders(user?.id);
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter((order) => {
      const customerName = order.customer?.name?.toLowerCase() || "";
      const customerPhone = order.customer?.phone?.toLowerCase() || "";
      const orderId = order.id?.toLowerCase() || "";
      return customerName.includes(q) || customerPhone.includes(q) || orderId.includes(q);
    });
  }, [orders, searchQuery]);

  const totalValueKobo = orders.reduce((sum, ord) => sum + (ord.totalKobo || 0), 0);
  const paidOrders = orders.filter((o) => o.status === "paid");
  const paidValueKobo = paidOrders.reduce((sum, ord) => sum + (ord.totalKobo || 0), 0);
  const avgOrderKobo = orders.length > 0 ? Math.round(totalValueKobo / orders.length) : 0;

  return (
    <DashboardLayout title="Orders">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Orders</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLoading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <RefreshIndicator isFetching={!isLoading && isFetching} />
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Total Revenue
            </span>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              {formatNGN(totalValueKobo)}
            </div>
            <span className="text-[10px] text-zinc-600 mt-0.5 block">Across all orders</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Collected (Paid)
            </span>
            <div className="text-xl font-bold text-[#00D18F] mt-1 tabular-nums">
              {formatNGN(paidValueKobo)}
            </div>
            <span className="text-[10px] text-zinc-600 mt-0.5 block">{paidOrders.length} paid orders</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Total Orders
            </span>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              {orders.length}
            </div>
            <span className="text-[10px] text-zinc-600 mt-0.5 block">Recorded by Voxy</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Average Order
            </span>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              {formatNGN(avgOrderKobo)}
            </div>
            <span className="text-[10px] text-zinc-600 mt-0.5 block">Per order value</span>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by customer or #ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 bg-white/[0.03] border border-white/[0.08] focus:border-[#00D18F]/50 focus:outline-none rounded-lg px-3 text-xs text-white placeholder:text-zinc-600 transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <>
            <div className="hidden sm:block">
              <SkeletonTable rows={7} cols={5} headers={["Order", "Customer", "Items", "Total", "Status"]} />
            </div>
            <div className="sm:hidden space-y-2">
              {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl">
            <ClipboardList className="size-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium mb-1">
              {searchQuery ? "No matching orders found" : activeTab === "all" ? "No orders yet" : `No ${activeTab} orders`}
            </p>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              {searchQuery ? "Try searching with a different name, phone number, or order ID." : "When customers place orders through Voxy chats, they will appear here automatically."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block rounded-2xl border border-white/[0.07] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Order #", "Customer & Channel", "Purchased Items", "Total", "Status", "AI Debrief", ""].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, i) => {
                    const items = getOrderItemsList(order);
                    const delivery = extractDeliveryInfo(order);
                    const itemsSummary = items.length > 0
                      ? items.map((it) => `${it.quantity}× ${it.name}`).join(", ")
                      : "—";

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`group cursor-pointer hover:bg-white/[0.015] transition-colors ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">#{order.id?.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">{order.customer?.name || "Anonymous Customer"}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.06] capitalize">
                              {order.customer?.channel || "chat"}
                            </span>
                          </div>
                          {delivery.address ? (
                            <div className="text-[11px] text-zinc-500 truncate max-w-[180px] flex items-center gap-1 mt-0.5">
                              <MapPin className="size-3 text-amber-400 shrink-0" />
                              <span className="truncate">{delivery.address}</span>
                            </div>
                          ) : order.customer?.phone ? (
                            <div className="text-[11px] text-zinc-600">{order.customer.phone}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 max-w-[280px]">
                          {items.length > 0 ? (
                            <div className="space-y-0.5">
                              <div className="text-xs font-medium text-zinc-200 truncate" title={itemsSummary}>
                                {itemsSummary}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {items.length} {items.length === 1 ? "product" : "products"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500 italic">Custom order</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white tabular-nums">
                          {formatNGN(order.totalKobo || 0)}
                        </td>
                        <td className="px-4 py-3"><StatusPill status={order.status} /></td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00D18F] bg-[#00D18F]/10 border border-[#00D18F]/20 px-2 py-0.5 rounded-full group-hover:bg-[#00D18F]/20 transition-colors">
                            <Bot className="size-3" /> Debrief
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="size-4 text-zinc-700 group-hover:text-zinc-400 transition-colors inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden rounded-2xl border border-white/[0.07] overflow-hidden">
              {filteredOrders.map((order, i) => {
                const items = getOrderItemsList(order);
                const delivery = extractDeliveryInfo(order);
                const itemsSummary = items.length > 0
                  ? items.map((it) => `${it.quantity}× ${it.name}`).join(", ")
                  : "Custom order";

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full flex flex-col px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors gap-2 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{order.customer?.name || "Anonymous Customer"}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-400 capitalize">
                          {order.customer?.channel || "chat"}
                        </span>
                      </div>
                      <StatusPill status={order.status} />
                    </div>
                    <div className="text-xs text-zinc-300 font-medium line-clamp-1">
                      {itemsSummary}
                    </div>
                    {delivery.address && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 truncate">
                        <MapPin className="size-3 text-amber-400 shrink-0" />
                        <span className="truncate">{delivery.address}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-0.5 border-t border-white/[0.04]">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#00D18F]">
                        <Bot className="size-3" /> View AI Debrief
                      </span>
                      <span className="text-sm font-bold text-[#00D18F] tabular-nums">{formatNGN(order.totalKobo || 0)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </DashboardLayout>
  );
}
