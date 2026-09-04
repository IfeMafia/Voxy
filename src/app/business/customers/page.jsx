"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { listCustomers, getCustomer } from "@/lib/api/customers";
import { Users, User2, MessageCircle, ShoppingBag, Phone, Mail, X, Loader2, ChevronRight } from "lucide-react";
import { formatNGN } from "@/lib/api/products";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function ChannelBadge({ channel }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">
      {channel || "web"}
    </span>
  );
}

function CustomerDrawer({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    getCustomer(customerId)
      .then(setCustomer)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customerId]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-[#0a0a0a] border-l border-white/[0.07] h-full overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] sticky top-0 bg-[#0a0a0a] z-10">
          <h2 className="font-semibold text-white">Customer detail</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-zinc-600" />
          </div>
        ) : !customer ? (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-600">Failed to load customer</div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/20 flex items-center justify-center text-xl font-bold text-[#00D18F]">
                {(customer.name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-bold text-white">{customer.name || "Unknown"}</div>
                <ChannelBadge channel={customer.channel} />
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Phone className="size-4 text-zinc-600" />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Mail className="size-4 text-zinc-600" />
                  {customer.email}
                </div>
              )}
            </div>

            {/* Orders */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShoppingBag className="size-3.5" /> Orders ({customer.orders?.length || 0})
              </h3>
              {(customer.orders || []).length === 0 ? (
                <p className="text-xs text-zinc-700">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {customer.orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          order.status === "paid"      ? "bg-[#00D18F]/10 text-[#00D18F]"  :
                          order.status === "confirmed" ? "bg-blue-500/10 text-blue-400"    :
                          order.status === "cancelled" ? "bg-red-500/10 text-red-400"      :
                          "bg-white/5 text-zinc-500"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {formatNGN(order.totalKobo || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversations */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageCircle className="size-3.5" /> Conversations ({customer.conversations?.length || 0})
              </h3>
              {(customer.conversations || []).length === 0 ? (
                <p className="text-xs text-zinc-700">No conversations yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {customer.conversations.map((conv) => (
                    <div key={conv.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs text-zinc-400">
                      <span className={`font-bold uppercase px-2 py-0.5 rounded-full ${
                        conv.status === "active"     ? "bg-[#00D18F]/10 text-[#00D18F]" :
                        conv.status === "handed_off" ? "bg-orange-500/10 text-orange-400" :
                        "bg-white/5 text-zinc-600"
                      }`}>{conv.status}</span>
                      <span>{timeAgo(conv.updatedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    listCustomers(user.id)
      .then((data) => setCustomers(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <DashboardLayout title="Customers">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Customers</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {customers.length} customer{customers.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-zinc-600" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl">
            <Users className="size-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium mb-1">No customers yet</p>
            <p className="text-xs text-zinc-600">
              Your customers will appear here when they start chatting with Voxy.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] text-[11px] font-bold uppercase tracking-wider text-zinc-600 px-4 py-2.5 border-b border-white/[0.05]">
              <span>Customer</span>
              <span className="px-6">Channel</span>
              <span className="px-4">Last active</span>
              <span className="w-6" />
            </div>
            {customers.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors ${
                  i > 0 ? "border-t border-white/[0.04]" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-[#00D18F]/10 flex items-center justify-center shrink-0 text-sm font-bold text-[#00D18F]">
                    {(c.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{c.name || "Unknown"}</div>
                    <div className="text-xs text-zinc-600 truncate">{c.email || c.phone || "—"}</div>
                  </div>
                </div>
                <div className="px-6">
                  <ChannelBadge channel={c.channel} />
                </div>
                <div className="px-4 text-xs text-zinc-500">{timeAgo(c.updatedAt)}</div>
                <ChevronRight className="size-3.5 text-zinc-700" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedId && (
        <CustomerDrawer customerId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </DashboardLayout>
  );
}
