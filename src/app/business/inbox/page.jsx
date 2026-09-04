"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { listCustomers } from "@/lib/api/customers";
import { getCustomerConversations, getConversation, updateConversationStatus, appendMessage } from "@/lib/api/conversations";
import { MessageCircle, Users, ArrowRight, User2, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "react-hot-toast";

const STATUS_TABS = ["all", "active", "handed_off", "closed"];
const STATUS_LABELS = { all: "All", active: "Active", handed_off: "Handed Off", closed: "Closed" };

function StatusBadge({ status }) {
  const styles = {
    active:      "bg-[#00D18F]/10 text-[#00D18F]",
    handed_off:  "bg-orange-500/10 text-orange-400",
    closed:      "bg-white/5 text-zinc-500",
  };
  const labels = { active: "Active", handed_off: "Handed off", closed: "Closed" };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status] || "bg-white/5 text-zinc-500"}`}>
      {labels[status] || status}
    </span>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function InboxPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* Load all conversations by fetching customers then their convos.
   * MISSING BACKEND: No GET /businesses/:id/conversations endpoint.
   * This is a workaround — iterating customers is inefficient.
   * Flag for backend team to add aggregate endpoint. */
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoadingList(true);
    try {
      const customers = await listCustomers(user.id);
      const all = [];
      await Promise.allSettled(
        (customers || []).slice(0, 25).map(async (c) => {
          const convos = await getCustomerConversations(c.id);
          (convos || []).forEach((conv) => all.push({ ...conv, customer: c }));
        })
      );
      all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setConversations(all);
    } catch (e) {
      console.error("Inbox load error:", e);
    } finally {
      setLoadingList(false);
    }
  }, [user?.id]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  /* Load selected conversation detail */
  const selectConversation = async (conv) => {
    setSelected(conv);
    setLoadingDetail(true);
    try {
      const detail = await getConversation(conv.id);
      setSelected({ ...detail, customer: conv.customer });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  /* Status update */
  const changeStatus = async (status) => {
    if (!selected?.id || updating) return;
    setUpdating(true);
    try {
      await updateConversationStatus(selected.id, status);
      setSelected((s) => ({ ...s, status }));
      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, status } : c))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = replyText.trim();
    if (!text || !selected?.id || sending) return;
    setSending(true);
    try {
      const res = await appendMessage(selected.id, "assistant", text);
      const updatedMessages = res?.messages || [
        ...(selected.messages || []),
        { role: "assistant", content: text, createdAt: new Date().toISOString() },
      ];
      setSelected((s) => ({ ...s, messages: updatedMessages }));
      setReplyText("");
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter(
    (c) => tab === "all" || c.status === tab
  );

  const lastMessage = (conv) => {
    const msgs = conv.messages || [];
    return msgs[msgs.length - 1]?.content || "No messages yet";
  };

  return (
    <DashboardLayout title="Inbox">
      {/* ⚠️ MISSING BACKEND NOTE (dev-only, remove in prod) */}
      <div className="mb-4 px-3 py-2 rounded-lg bg-orange-500/8 border border-orange-500/20 text-xs text-orange-300 flex items-center gap-2">
        <AlertCircle className="size-3.5 shrink-0" />
        <span>
          <strong>MISSING BACKEND:</strong> No <code>/businesses/:id/conversations</code> endpoint — conversations are loaded by iterating customers (max 25). Backend team to add aggregate endpoint.
        </span>
      </div>

      <div className="flex h-[calc(100vh-140px)] border border-white/[0.07] rounded-2xl overflow-hidden bg-black">
        {/* Left panel — conversation list */}
        <div className="w-80 shrink-0 border-r border-white/[0.07] flex flex-col bg-white/[0.01]">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2 pt-2 gap-0.5 overflow-x-auto">
            {STATUS_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  tab === t ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {STATUS_LABELS[t]}
              </button>
            ))}
            <button
              onClick={loadConversations}
              className="ml-auto p-2 text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
              title="Refresh"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center h-32 text-zinc-600">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                <MessageCircle className="size-8 text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-600">No conversations yet.</p>
                <p className="text-xs text-zinc-700 mt-0.5">They'll appear here when customers reach out.</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors ${
                    selected?.id === conv.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-[#00D18F]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#00D18F]">
                        {(conv.customer?.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium text-white truncate">
                          {conv.customer?.name || "Customer"}
                        </span>
                        <span className="text-[10px] text-zinc-600 shrink-0">
                          {timeAgo(conv.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {lastMessage(conv)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel — conversation detail */}
        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="size-12 text-zinc-800 mb-3" />
              <p className="text-sm text-zinc-500">Select a conversation to view it</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-[#00D18F]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#00D18F]">
                      {(selected.customer?.name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {selected.customer?.name || "Customer"}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={selected.status} />
                      {selected.customer?.phone && (
                        <span className="text-[10px] text-zinc-600">{selected.customer.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {selected.status === "active" && (
                    <button
                      onClick={() => changeStatus("handed_off")}
                      disabled={updating}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
                    >
                      Take over
                    </button>
                  )}
                  {selected.status !== "closed" && (
                    <button
                      onClick={() => changeStatus("closed")}
                      disabled={updating}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
                    >
                      Close
                    </button>
                  )}
                  {selected.status === "handed_off" && (
                    <button
                      onClick={() => changeStatus("active")}
                      disabled={updating}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#00D18F]/30 text-[#00D18F] hover:bg-[#00D18F]/10 transition-colors disabled:opacity-50"
                    >
                      Hand back to Voxy
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingDetail ? (
                  <div className="flex justify-center pt-10">
                    <Loader2 className="size-5 animate-spin text-zinc-600" />
                  </div>
                ) : (selected.messages || []).length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center pt-10">No messages in this conversation.</p>
                ) : (
                  (selected.messages || []).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-white/[0.06] text-zinc-200 rounded-tl-sm"
                          : "bg-[#00D18F]/10 text-[#00D18F] rounded-tr-sm border border-[#00D18F]/20"
                      }`}>
                        {msg.content}
                        <div className="text-[10px] mt-1 opacity-40">
                          {timeAgo(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Handed-off notice */}
              {selected.status === "handed_off" && (
                <div className="px-5 py-2.5 border-t border-white/[0.06] bg-orange-500/5 text-xs text-orange-300 flex items-center gap-2">
                  <AlertCircle className="size-3.5 shrink-0" />
                  You've taken over this conversation. Voxy is paused so you can reply directly.
                </div>
              )}

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.06] flex items-center gap-2 bg-white/[0.01]">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={selected.status === "closed" ? "Conversation closed" : "Type a message to customer..."}
                  disabled={selected.status === "closed" || sending}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/50 transition-colors disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending || selected.status === "closed"}
                  className="h-10 px-4 bg-[#00D18F] hover:bg-[#00D18F]/90 disabled:opacity-30 disabled:hover:bg-[#00D18F] text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
