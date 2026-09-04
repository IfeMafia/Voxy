"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  getBusinessConversations,
  getConversation,
  updateConversationStatus,
  appendMessage,
  setConversationTyping,
} from "@/lib/api/conversations";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Loader2,
  Send,
  Bot,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Phone,
  User,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import MarkdownContent from "@/components/chat/MarkdownContent";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "handed_off", label: "Needs attention" },
  { id: "closed", label: "Closed" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h";
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + "d";
  return new Date(dateStr).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getCustomerDisplayName(customer) {
  const name = customer?.name?.trim();
  if (!name || name.toLowerCase() === "customer" || name.toLowerCase() === "guest") {
    return "Customer";
  }
  return name;
}

function StatusPill({ status }) {
  const map = {
    active: "bg-[#00D18F]/10 text-[#00D18F] border-[#00D18F]/20",
    handed_off: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    closed: "bg-white/5 text-zinc-500 border-white/10",
  };
  const labels = { active: "Active", handed_off: "Needs attention", closed: "Closed" };
  return (
    <span className={"inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border " + (map[status] || "bg-white/5 text-zinc-500 border-white/10")}>
      {labels[status] || status}
    </span>
  );
}

export default function InboxPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const customerTypingTimeoutRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const setCustomerTypingWithExpiry = useCallback((typing) => {
    if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
    setIsCustomerTyping(typing);
    if (typing) {
      customerTypingTimeoutRef.current = setTimeout(() => {
        setIsCustomerTyping(false);
      }, 3500);
    }
  }, []);

  const sendTypingStatus = useCallback((isTyping) => {
    if (!selected?.id) return;
    const convId = selected.id;

    // 1. Same-browser broadcast channel (0ms latency for dual tabs/windows)
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`voxy_typing_${convId}`);
        bc.postMessage({ isTyping, sender: "business" });
        bc.close();
      }
    } catch {}

    // 2. Supabase broadcast (if configured)
    try {
      if (supabase) {
        supabase.channel(`chat:${convId}`).send({
          type: "broadcast",
          event: "typing",
          payload: { isTyping, senderType: "owner" },
        });
      }
    } catch {}

    // 3. API endpoint for cross-device / server state
    setConversationTyping(convId, isTyping, "business").catch(() => {});
  }, [selected?.id]);

  const handleReplyChange = (e) => {
    const val = e.target.value;
    setReply(val);

    if (!selected?.id) return;

    if (val.trim().length > 0) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 1500) {
        lastTypingSentRef.current = now;
        sendTypingStatus(true);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 3000);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    }
  };

  const loadConversations = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoadingList(true);
    try {
      const all = (await getBusinessConversations(user.id)) || [];
      all.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      setConversations((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(all)) return prev;
        return all;
      });
    } catch (e) {
      if (!silent) {
        console.error("Inbox load error:", e);
        toast.error("Failed to load conversations");
      }
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations(false);
    const listInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      loadConversations(true);
    }, 4000);
    return () => clearInterval(listInterval);
  }, [loadConversations]);

  // Live polling for selected conversation thread
  useEffect(() => {
    if (!selected?.id) return;
    let isMounted = true;

    const pollSelected = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const detail = await getConversation(selected.id);
        if (!isMounted || !detail) return;

        setSelected((current) => {
          if (!current || current.id !== detail.id) return current;
          const currentMsgs = current.messages || [];
          const newMsgs = detail.messages || [];

          const hasMessageDiff =
            newMsgs.length !== currentMsgs.length ||
            (newMsgs.length > 0 &&
              currentMsgs.length > 0 &&
              (newMsgs[newMsgs.length - 1]?.createdAt !== currentMsgs[currentMsgs.length - 1]?.createdAt ||
                newMsgs[newMsgs.length - 1]?.content !== currentMsgs[currentMsgs.length - 1]?.content));
          const hasStatusDiff = current.status !== detail.status;

          if (hasMessageDiff || hasStatusDiff) {
            if (hasMessageDiff) {
              setTimeout(scrollToBottom, 50);
            }
            return {
              ...detail,
              customer: detail.customer || current.customer,
              business: detail.business || current.business,
            };
          }
          if (detail.isCustomerTyping !== undefined) {
            if (detail.isCustomerTyping) {
              setCustomerTypingWithExpiry(true);
            }
          }
          return current;
        });
      } catch (err) {
        // Ignore transient poll error
      }
    };

    const threadInterval = setInterval(pollSelected, 2000);
    return () => {
      isMounted = false;
      clearInterval(threadInterval);
    };
  }, [selected?.id, setCustomerTypingWithExpiry]);

  // Live listener for customer typing via BroadcastChannel & Supabase
  useEffect(() => {
    if (!selected?.id) {
      setIsCustomerTyping(false);
      return;
    }

    const convId = selected.id;
    let bc = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel(`voxy_typing_${convId}`);
        bc.onmessage = (event) => {
          if (event.data?.sender === "customer") {
            setCustomerTypingWithExpiry(Boolean(event.data.isTyping));
          }
        };
      }
    } catch {}

    let sbChannel = null;
    try {
      if (supabase) {
        sbChannel = supabase
          .channel(`chat:${convId}`)
          .on("broadcast", { event: "typing" }, (payload) => {
            if (payload.payload?.senderType === "customer" || payload.payload?.sender === "customer") {
              setCustomerTypingWithExpiry(Boolean(payload.payload?.isTyping));
            }
          })
          .subscribe();
      }
    } catch {}

    return () => {
      if (bc) bc.close();
      if (supabase && sbChannel) supabase.removeChannel(sbChannel);
      if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
    };
  }, [selected?.id, setCustomerTypingWithExpiry]);

  const selectConversation = async (conv) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(false);
    setIsCustomerTyping(false);
    setSelected(conv);
    setLoadingDetail(true);
    try {
      const detail = await getConversation(conv.id);
      setSelected({
        ...detail,
        customer: detail?.customer || conv.customer,
        business: detail?.business || conv.business,
      });
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const changeStatus = async (status) => {
    if (!selected?.id || updating) return;
    setUpdating(true);
    try {
      await updateConversationStatus(selected.id, status);
      setSelected((s) => ({ ...s, status }));
      setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, status } : c));
      toast.success(
        status === "handed_off" ? "You are now handling this conversation." :
        status === "active" ? "Handed back to Voxy AI." :
        "Conversation closed."
      );
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = reply.trim();
    if (!text || !selected?.id || sending) return;

    // 1. Instant optimistic UI update (0ms perceived latency)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(false);
    setReply("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    const optimisticMsg = {
      role: "business",
      sender: "business",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...(selected.messages || []), optimisticMsg];
    setSelected((s) => (s ? { ...s, messages: updatedMessages } : s));
    setConversations((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, messages: updatedMessages, updatedAt: new Date().toISOString() } : c))
    );
    setTimeout(scrollToBottom, 20);

    // 2. Background network persistence
    setSending(true);
    try {
      const res = await appendMessage(selected.id, "business", text, "business");
      if (res?.messages) {
        setSelected((s) => (s && s.id === selected.id ? { ...s, messages: res.messages } : s));
      }
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = conversations.filter((c) => {
    if (tab !== "all" && c.status !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const cName = getCustomerDisplayName(c.customer).toLowerCase();
    return (
      cName.includes(q) ||
      (c.customer?.phone || "").toLowerCase().includes(q) ||
      (c.customer?.email || "").toLowerCase().includes(q) ||
      (c.messages?.[c.messages.length - 1]?.content || "").toLowerCase().includes(q)
    );
  });

  const counts = {
    all: conversations.length,
    active: conversations.filter((c) => c.status === "active").length,
    handed_off: conversations.filter((c) => c.status === "handed_off").length,
    closed: conversations.filter((c) => c.status === "closed").length,
  };

  return (
    <DashboardLayout title="Inbox">
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">

        {/* Page toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h1 className="text-base font-semibold text-white">Inbox</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {loadingList ? "Loading..." : `${counts.all} conversation${counts.all !== 1 ? "s" : ""}`}
              {counts.handed_off > 0 && (
                <span className="ml-2 text-amber-400">{counts.handed_off} {counts.handed_off !== 1 ? "need" : "needs"} attention</span>
              )}
            </p>
          </div>
        </div>

        {/* Split pane */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left: Conversation list ── */}
          <div className={"w-full md:w-80 lg:w-96 shrink-0 border-r border-white/[0.07] flex flex-col " + (selected ? "hidden md:flex" : "flex")}>

            {/* Status tabs */}
            <div className="flex border-b border-white/[0.06] shrink-0 overflow-x-auto">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={"flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap " +
                    (tab === t.id ? "border-[#00D18F] text-white" : "border-transparent text-zinc-500 hover:text-zinc-300")}
                >
                  {t.label}
                  {counts[t.id] > 0 && (
                    <span className={"text-[10px] px-1.5 py-px rounded-full font-semibold " +
                      (t.id === "handed_off" && counts[t.id] > 0 ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.06] text-zinc-500")}>
                      {counts[t.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-3 py-2.5 border-b border-white/[0.05] shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Search by name, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-7 pr-7 bg-white/[0.03] border border-white/[0.07] rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="divide-y divide-white/[0.04]">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex gap-3 px-4 py-3.5 animate-pulse">
                      <div className="size-9 rounded-lg bg-white/[0.05] shrink-0" />
                      <div className="flex-1 space-y-2 py-0.5">
                        <div className="h-3 bg-white/[0.05] rounded w-2/5" />
                        <div className="h-2.5 bg-white/[0.03] rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                  <MessageSquare className="size-8 text-zinc-700 mb-3" />
                  <p className="text-sm font-medium text-zinc-500">{search ? "No results" : "No conversations"}</p>
                  <p className="text-xs text-zinc-700 mt-1">{search ? "Try a different search term." : "Customer messages will appear here."}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {filtered.map((conv) => {
                    const isSelected = selected?.id === conv.id;
                    const msgs = conv.messages || [];
                    const lastMsg = msgs[msgs.length - 1];
                    const name = getCustomerDisplayName(conv.customer);
                    const initial = name === "Customer" ? "C" : name.charAt(0).toUpperCase();
                    const needsAttention = conv.status === "handed_off";
                    const isLastMsgBiz = lastMsg?.role === "business" || lastMsg?.sender === "business";
                    const isLastMsgAI = lastMsg?.role === "assistant" && !isLastMsgBiz;
                    const lastMsgPrefix = isLastMsgBiz ? `${user?.name || "You"}: ` : isLastMsgAI ? "Voxy: " : "";

                    return (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={"w-full text-left px-4 py-3.5 transition-colors flex gap-3 items-start " +
                          (isSelected ? "bg-white/[0.05]" : "hover:bg-white/[0.025]") +
                          (needsAttention && !isSelected ? " border-l-2 border-l-amber-500/60" : "")}
                      >
                        {/* Avatar */}
                        <div className={"size-9 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0 " +
                          (isSelected ? "bg-[#00D18F] text-black" : needsAttention ? "bg-amber-500/15 text-amber-400" : "bg-white/[0.07] text-zinc-300")}>
                          {initial}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-sm font-medium text-white truncate">{name}</span>
                            <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(conv.updatedAt || conv.createdAt)}</span>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">
                            {lastMsg ? lastMsgPrefix + lastMsg.content : "No messages yet"}
                          </p>
                          {conv.customer?.phone && (
                            <p className="text-[10px] text-zinc-700 mt-0.5">{conv.customer.phone}</p>
                          )}
                        </div>

                        {needsAttention && !isSelected && (
                          <div className="size-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Conversation detail ── */}
          <div className={"flex-1 flex flex-col min-w-0 " + (selected ? "flex" : "hidden md:flex")}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="size-9 text-zinc-700 mb-3" />
                <p className="text-sm font-medium text-zinc-400">No conversation selected</p>
                <p className="text-xs text-zinc-600 mt-1">Choose a thread from the list to view and respond.</p>
              </div>
            ) : (() => {
              const headerName = getCustomerDisplayName(selected.customer);
              const headerInitial = headerName === "Customer" ? "C" : headerName.charAt(0).toUpperCase();
              const bizLogo = user?.logoUrl || selected.business?.logoUrl;
              const bizName = user?.name || selected.business?.name || "Business";
              const bizInitial = (bizName || "B").charAt(0).toUpperCase();

              return (
                <>
                  {/* Thread header */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.07] shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setSelected(null)}
                        className="md:hidden p-1 -ml-1 text-zinc-500 hover:text-white rounded-lg transition-colors"
                      >
                        <ArrowLeft className="size-4" />
                      </button>

                      <div className="size-8 rounded-lg bg-white/[0.07] flex items-center justify-center font-semibold text-sm text-white shrink-0">
                        {headerInitial}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{headerName}</span>
                          <StatusPill status={selected.status} />
                          {selected.status === "handed_off" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <span className="size-1.5 rounded-full bg-[#00D18F]" />
                              Business active
                            </span>
                          ) : selected.status === "active" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full">
                              <span className="size-1.5 rounded-full bg-[#00D18F]" />
                              AI employee active
                            </span>
                          ) : null}
                        </div>
                        {selected.customer?.phone && (
                          <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Phone className="size-3" /> {selected.customer.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {selected.customer?.id && (
                        <Link
                          href={"/business/customers/" + selected.customer.id}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
                        >
                          <User className="size-3" /> Profile
                        </Link>
                      )}
                      {selected.status === "active" && (
                        <button
                          onClick={() => changeStatus("handed_off")}
                          disabled={updating}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                        >
                          Take over
                        </button>
                      )}
                      {selected.status === "handed_off" && (
                        <button
                          onClick={() => changeStatus("active")}
                          disabled={updating}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-[#00D18F]/30 text-[#00D18F] hover:bg-[#00D18F]/10 transition-colors disabled:opacity-40"
                        >
                          Hand back to AI
                        </button>
                      )}
                      {selected.status !== "closed" ? (
                        <button
                          onClick={() => changeStatus("closed")}
                          disabled={updating}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                        >
                          Close
                        </button>
                      ) : (
                        <button
                          onClick={() => changeStatus("active")}
                          disabled={updating}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status banners */}
                  {selected.status === "handed_off" && (
                    <div className="px-5 py-2 border-b border-white/[0.05] bg-amber-500/[0.04] flex items-center gap-2">
                      <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-300 flex-1">You are handling this conversation. Voxy AI is paused.</p>
                      <button onClick={() => changeStatus("active")} className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                        Resume AI
                      </button>
                    </div>
                  )}
                  {selected.status === "closed" && (
                    <div className="px-5 py-2 border-b border-white/[0.05] flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-zinc-600 shrink-0" />
                      <p className="text-xs text-zinc-500 flex-1">This conversation is closed.</p>
                      <button onClick={() => changeStatus("active")} className="text-xs text-[#00D18F] hover:underline font-medium">
                        Reopen
                      </button>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
                    {loadingDetail ? (
                      <div className="flex justify-center pt-10">
                        <Loader2 className="size-5 animate-spin text-zinc-600" />
                      </div>
                    ) : (selected.messages || []).length === 0 ? (
                      <p className="text-xs text-zinc-600 text-center pt-10">No messages in this conversation yet.</p>
                    ) : (
                      (selected.messages || []).map((msg, i) => {
                        const isUser = msg.role === "user";
                        const isBusiness =
                          msg.role === "business" ||
                          msg.sender === "business" ||
                          msg.role === "staff" ||
                          (!isUser && !msg.intent && selected.status === "handed_off");
                        const isAI = !isUser && !isBusiness;
                        return (
                          <div key={i} className={"flex gap-2.5 " + (isUser ? "justify-start" : "justify-end")}>
                            {isUser && (
                              <div className="size-6 rounded-lg bg-white/[0.07] flex items-center justify-center text-[10px] font-semibold text-zinc-400 shrink-0 mt-1">
                                {headerInitial}
                              </div>
                            )}
                            <div className="max-w-[72%] sm:max-w-[60%]">
                              <div className={"px-3.5 py-2.5 text-sm leading-relaxed " +
                                (isUser
                                  ? "bg-white/[0.05] text-zinc-200 border border-white/[0.07] rounded-xl rounded-tl-sm whitespace-pre-wrap"
                                  : "bg-white/[0.04] text-zinc-100 border border-white/[0.08] rounded-xl rounded-tr-sm"
                                )}>
                                {isUser ? msg.content : <MarkdownContent content={msg.content} />}
                              </div>
                              <p className={"text-[10px] text-zinc-700 mt-1 " + (isUser ? "text-left" : "text-right")}>
                                {isAI ? "Voxy · " : isBusiness ? `${bizName} · ` : ""}{formatTime(msg.createdAt)}
                              </p>
                            </div>
                            {!isUser && (
                              isBusiness ? (
                                bizLogo ? (
                                  <img
                                    src={bizLogo}
                                    alt={bizName}
                                    className="size-6 rounded-lg object-cover border border-white/[0.1] shrink-0 mt-1"
                                  />
                                ) : (
                                  <div className="size-6 rounded-lg bg-[#00D18F] text-black font-bold text-[10px] flex items-center justify-center shrink-0 mt-1">
                                    {bizInitial}
                                  </div>
                                )
                              ) : (
                                <div className="size-6 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0 mt-1">
                                  <Bot className="size-3.5 text-zinc-400" />
                                </div>
                              )
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply composer */}
                  <div className="px-4 sm:px-5 py-3 border-t border-white/[0.07] shrink-0">
                    {isCustomerTyping && (
                      <div className="pb-1.5 text-[10px] text-[#00D18F] flex items-center gap-1.5 animate-in fade-in duration-150">
                        <span className="size-1 rounded-full bg-[#00D18F] animate-ping" />
                        <span>{selected.customer?.name || "Customer"} is typing...</span>
                      </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-2 items-end">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={reply}
                        onChange={handleReplyChange}
                        onKeyDown={handleKeyDown}
                        placeholder={selected.status === "closed" ? "Conversation is closed" : `Reply as ${user?.name || "Business"}... (Enter to send, Shift+Enter for newline)`}
                        disabled={selected.status === "closed" || sending}
                        className="flex-1 min-h-[36px] max-h-32 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] transition-colors resize-none disabled:opacity-40"
                        style={{ height: "auto" }}
                        onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px"; }}
                      />
                      <button
                        type="submit"
                        disabled={!reply.trim() || sending || selected.status === "closed"}
                        className="h-9 px-4 bg-[#00D18F] text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-[#00D18F]/90 disabled:opacity-30 transition-colors shrink-0"
                      >
                        {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </form>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
