"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  Mic,
  MicOff,
  Store,
  Bot,
  User,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  Info,
  X,
  Sparkles,
  ShoppingBag,
  Plus,
  CheckCircle2,
  Package,
  Truck,
  Layers,
  ArrowUpRight,
  ArrowUp,
  Copy,
  Check,
  Flag,
} from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import MarkdownContent from "@/components/chat/MarkdownContent";
import VoxyVoiceCallModal from "@/components/voice/VoxyVoiceCallModal";
import { ProductCardGrid, OrderReceiptCard, PaymentCard, HandoffNoticeCard, PaymentReceiptCard } from "@/components/chat/StructuredActionCards";
import { setConversationTyping, reportMessage } from "@/lib/api/conversations";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import PremiumTypingIndicator from "@/components/chat/PremiumTypingIndicator";

// ── Helpers ────────────────────────────────────────────────────────────────

function getTaskLabel(intent) {
  const map = {
    browse_products: "Querying live catalogue for matching inventory...",
    browse_menu: "Consulting menu items, variants, and prices...",
    recommend_products: "Formulating personalized product recommendations...",
    place_order: "Checking product availability and order breakdown...",
    check_order_status: "Accessing live order fulfillment records...",
    customer_support: "Reviewing store policies and answers...",
    handoff: "Notifying store management team...",
  };
  return map[intent] || "Analyzing request and business records...";
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function sessionKey(slug) {
  return "voxy_session_" + (slug || "default");
}

const QUICK_ACTIONS = [
  { label: "Browse products", query: "What products or items do you have available?" },
  { label: "Delivery & hours", query: "What are your delivery options and opening hours?" },
  { label: "Popular items", query: "What are your most popular or recommended items?" },
  { label: "Talk to human", query: "Can I speak to someone from your team?" },
];

// ── Name & Session Form ───────────────────────────────────────────────────

// ── Name & Session Form ───────────────────────────────────────────────────

function WelcomeOnboarding({ business, employeeName, onStart }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto my-auto p-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
          <Bot className="size-5 text-[#00D18F]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Connect with {business?.name || "the Store"}
          </h2>
          <p className="text-xs text-zinc-400">
            {employeeName} is ready to assist you
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onStart(name.trim() || "Customer", contact.trim());
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Your name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex, Chioma"
            className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Phone or Email <span className="text-zinc-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. 08012345678 or alex@example.com"
            className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-[#00D18F] text-black text-sm font-semibold rounded-xl hover:bg-[#00D18F]/90 transition-colors flex items-center justify-center gap-2"
        >
          <span>Start Conversation</span>
          <ChevronRight className="size-4" />
        </button>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => onStart("Customer", "")}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Continue as guest
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Intent-First Starting Home State ──────────────────────────────────────

function IntentHomeState({ business, employeeName, onSelectAction }) {
  const actions = [
    {
      title: "Browse Catalogue",
      desc: "Explore items & prices",
      icon: ShoppingBag,
      query: "Can you show me all available products in your catalogue?",
    },
    {
      title: "Recommendations",
      desc: "Find popular items for you",
      icon: Layers,
      query: "What do you recommend from your store today?",
    },
    {
      title: "Delivery & Hours",
      desc: "Check opening times & fees",
      icon: Clock,
      query: "What are your opening hours, location, and delivery details?",
    },
    {
      title: "Talk to Staff",
      desc: "Direct human team connection",
      icon: User,
      query: "I would like to speak directly with a human staff member.",
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4 space-y-8 my-auto">
      {/* Central Business Logo Hero & Greeting */}
      <div className="text-center space-y-3">
        <div className="mx-auto size-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden">
          {business?.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-[#00D18F]">
              {(business?.name || "B").charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Hi, welcome to {business?.name || "the store"}
          </h2>
          <p className="text-xs text-zinc-400">
            How can I assist you right now?
          </p>
        </div>
      </div>

      {/* Structured 2x2 Action Cards (Reference UI Structure) */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectAction(act.query)}
              className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.15] text-left transition-all group flex flex-col justify-between h-32 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="size-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#00D18F]">
                  <Icon className="size-4" />
                </div>
                <ArrowUpRight className="size-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-white tracking-tight">
                  {act.title}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                  {act.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Right Context & Order Panel Component ──────────────────────────────────

// ── Right Context & Order Panel Component ──────────────────────────────────

function RightContextPanel({ business, employeeName, onStartVoiceCall, onClose }) {
  const products = business?.products || [];

  return (
    <aside className="w-full h-full overflow-y-auto bg-[#090A0D] border-l border-white/[0.07] p-5 text-zinc-300 space-y-6 select-none custom-scrollbar">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
        <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Info className="size-3.5 text-zinc-400" />
          <span>Store Context</span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Employee Identity Card */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#00D18F] font-bold text-sm">
            <Bot className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white tracking-tight">{employeeName}</h4>
            <span className="text-[11px] text-[#00D18F] font-medium">Assistant for {business?.name}</span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Assists with inventory queries, order placement, and business information.
        </p>

        <button
          type="button"
          onClick={onStartVoiceCall}
          className="w-full h-9 rounded-xl bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Phone className="size-3.5 fill-black" />
          <span>Start Voice Call</span>
        </button>
      </div>

      {/* Store Quick Info */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Store Details
        </h4>
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-2.5 text-xs text-zinc-400">
          {business?.openingHours && (
            <div className="flex items-start gap-2.5">
              <Clock className="size-4 text-zinc-500 shrink-0 mt-0.5" />
              <span>{business.openingHours}</span>
            </div>
          )}
          {business?.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="size-4 text-zinc-500 shrink-0 mt-0.5" />
              <span>{typeof business.address === "string" ? business.address : `${business.address.city || ""}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Catalogue Highlights */}
      {products.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="size-3.5 text-zinc-400" />
            Featured Items
          </h4>
          <div className="space-y-2">
            {products.slice(0, 4).map((p, idx) => (
              <div
                key={p.id || idx}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.07] flex items-center gap-2.5 text-xs"
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="size-8 rounded-lg object-cover bg-zinc-800 shrink-0" />
                ) : (
                  <div className="size-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                    <ShoppingBag className="size-3.5 text-zinc-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white truncate">{p.name}</div>
                  <div className="text-[11px] text-[#00D18F] font-semibold">
                    {p.price != null ? `₦${Number(p.price).toLocaleString()}` : "Inquire"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Left Storefront Aside Component ────────────────────────────────────────

function BusinessStorefrontSidebar({ business, employeeName, onQuickAction, onStartVoiceCall }) {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const products = business?.products || [];
  const displayProducts = showAllProducts ? products : products.slice(0, 3);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#090A0D] border-r border-white/[0.07] p-6 text-zinc-300 space-y-6 select-none custom-scrollbar">
      {/* Storefront Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="size-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden flex items-center justify-center shrink-0">
            {business?.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/[0.03] flex items-center justify-center text-xl font-bold text-[#00D18F]">
                {(business?.name || "B").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-white tracking-tight truncate">
              {business?.name || "Business Store"}
            </h1>
            <p className="text-xs text-zinc-400 capitalize truncate">
              {business?.category || business?.industry || "Retail & Services"}
              {business?.city ? ` • ${business.city}` : ""}
            </p>
          </div>
        </div>

        {business?.description && (
          <p className="text-xs text-zinc-400 leading-relaxed bg-white/[0.02] border border-white/[0.07] p-3 rounded-xl">
            {business.description}
          </p>
        )}
      </div>

      {/* AI Employee Context Card */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <Bot className="size-3.5 text-[#00D18F]" />
          </div>
          <span className="text-xs font-semibold text-white">{employeeName}</span>
          <span className="text-xs text-[#00D18F] font-medium ml-auto">Assistant</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Assists with orders, catalog inquiries, and store information.
        </p>
      </div>

      {/* Products / Highlights */}
      {products.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="size-3.5 text-zinc-400" />
              Catalogue ({products.length})
            </h3>
            {products.length > 3 && (
              <button
                onClick={() => setShowAllProducts(!showAllProducts)}
                className="text-[11px] text-[#00D18F] hover:underline font-semibold"
              >
                {showAllProducts ? "Show less" : "View all"}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {displayProducts.map((p, idx) => (
              <div
                key={p.id || idx}
                onClick={() => onQuickAction?.(`Tell me more about ${p.name}`)}
                className="group p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.07] hover:border-white/20 transition-colors cursor-pointer flex items-center gap-3"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="size-10 rounded-lg object-cover bg-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="size-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0">
                    <ShoppingBag className="size-4 text-zinc-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-[#00D18F] font-semibold">
                    {p.price != null ? `₦${Number(p.price).toLocaleString()}` : "Price on request"}
                  </p>
                </div>
                <ChevronRight className="size-3.5 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Meta Details */}
      <div className="space-y-3 pt-2 border-t border-white/[0.06] text-xs text-zinc-400">
        <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Store Information
        </h3>

        <div className="space-y-2.5">
          {business?.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="size-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <span>{typeof business.address === "string" ? business.address : `${business.address.street || ""}, ${business.address.city || ""}`}</span>
            </div>
          )}

          {business?.openingHours && (
            <div className="flex items-start gap-2.5">
              <Clock className="size-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <span>{business.openingHours}</span>
            </div>
          )}

          {business?.phone && (
            <div className="flex items-center gap-2.5">
              <Phone className="size-3.5 text-zinc-500 shrink-0" />
              <span>{business.phone}</span>
            </div>
          )}

          {business?.email && (
            <div className="flex items-center gap-2.5">
              <Mail className="size-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{business.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Trust Badge */}
      <div className="mt-auto pt-5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
        <span>Powered by Voxy</span>
        <span className="text-zinc-500">Direct Channel</span>
      </div>
    </div>
  );
}

// ── Main Customer Workspace ────────────────────────────────────────────────

export function ChatContent({ slugOverride }) {
  const searchParams = useSearchParams();
  const slug = slugOverride || searchParams.get("slug");
  const preMsg = searchParams.get("msg");

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [customerContact, setCustomerContact] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [convStatus, setConvStatus] = useState("active");
  const [sessionReady, setSessionReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [taskLabel, setTaskLabel] = useState(null);
  const [userHasSent, setUserHasSent] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showRightContext, setShowRightContext] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [isBusinessTyping, setIsBusinessTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [reportingMsg, setReportingMsg] = useState(null);
  const [reportReason, setReportReason] = useState("Inaccurate or incorrect information");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportedMsgs, setReportedMsgs] = useState(new Set());

  const handleCopy = (text, idx) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      toast.success("Message copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleReportSubmit = async (e) => {
    e?.preventDefault();
    if (!reportingMsg || submittingReport) return;
    if (!conversationId) {
      toast.error("Conversation not initialized yet");
      setReportingMsg(null);
      return;
    }
    setSubmittingReport(true);
    try {
      await reportMessage(conversationId, reportingMsg.content, reportReason || "Reported response");
      setReportedMsgs((prev) => new Set(prev).add(reportingMsg.index));
      toast.success("Report submitted to business alerts!");
      setReportingMsg(null);
    } catch (err) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setSubmittingReport(false);
    }
  };

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const businessTypingTimeoutRef = useRef(null);
  const customerTypingTimeoutRef = useRef(null);
  const handledPaymentRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const setBusinessTypingWithExpiry = useCallback((typing) => {
    if (businessTypingTimeoutRef.current) clearTimeout(businessTypingTimeoutRef.current);
    setIsBusinessTyping(typing);
    if (typing) {
      businessTypingTimeoutRef.current = setTimeout(() => {
        setIsBusinessTyping(false);
      }, 3500);
    }
  }, []);

  const sendCustomerTypingStatus = useCallback((isTyping) => {
    if (!conversationId) return;
    const convId = conversationId;

    // 1. Same-browser broadcast channel (0ms latency for dual tabs/windows)
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`voxy_typing_${convId}`);
        bc.postMessage({ isTyping, sender: "customer" });
        bc.close();
      }
    } catch {}

    // 2. Supabase broadcast (if configured)
    try {
      if (supabase) {
        supabase.channel(`chat:${convId}`).send({
          type: "broadcast",
          event: "typing",
          payload: { isTyping, senderType: "customer" },
        });
      }
    } catch {}

    // 3. API endpoint
    setConversationTyping(convId, isTyping, "customer").catch(() => {});
  }, [conversationId]);

  const handleCustomerInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";

    if (!conversationId) return;

    if (val.trim().length > 0) {
      const now = Date.now();
      if (now - lastCustomerTypingSentRef.current > 1500) {
        lastCustomerTypingSentRef.current = now;
        sendCustomerTypingStatus(true);
      }
      if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
      customerTypingTimeoutRef.current = setTimeout(() => {
        sendCustomerTypingStatus(false);
      }, 3000);
    } else {
      if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
      sendCustomerTypingStatus(false);
    }
  };

  const sendMessage = useCallback(
    async (text) => {
      const msg = text.trim();
      if (!msg || sending) return;
      if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
      sendCustomerTypingStatus(false);
      setInputValue("");
      setVoiceTranscript("");
      setUserHasSent(true);
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const userMsg = { role: "user", content: msg, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);
      setTaskLabel("Reviewing your request...");

      let activeName = customerName;
      let activeContact = customerContact;
      if (!activeName) {
        try {
          const saved = JSON.parse(localStorage.getItem(sessionKey(slug)) || "{}");
          if (saved.customerName) activeName = saved.customerName;
          if (saved.contact) activeContact = saved.contact;
        } catch {}
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", createdAt: new Date().toISOString() },
      ]);
      setTimeout(scrollToBottom, 20);

      const MAX_CLIENT_RETRIES = 4;
      let success = false;
      let lastError = null;

      try {
        for (let attempt = 1; attempt <= MAX_CLIENT_RETRIES; attempt++) {
          if (attempt > 1) {
            setTaskLabel(`Re-establishing connection... (attempt ${attempt}/${MAX_CLIENT_RETRIES})`);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);

          try {
            const res = await fetch("/api/assistant/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                businessId: business?.id,
                conversationId: conversationId || undefined,
                customerName: activeName || undefined,
                contact: activeContact || undefined,
                message: msg,
                stream: true,
              }),
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
              throw new Error(`Server status ${res.status}`);
            }

            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("text/event-stream") && res.body) {
              const reader = res.body.getReader();
              const decoder = new TextDecoder("utf-8");
              let done = false;
              let buffer = "";

              while (!done) {
                const { value, done: readerDone } = await reader.read();
                if (readerDone) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || "";

                for (const block of lines) {
                  const trimmed = block.trim();
                  if (!trimmed.startsWith("data: ")) continue;
                  const payload = trimmed.slice(6).trim();

                  if (payload === "[DONE]") {
                    done = true;
                    break;
                  }

                  try {
                    const data = JSON.parse(payload);
                    if (data.type === "token" && data.content) {
                      setTaskLabel(null);
                      setMessages((prev) => {
                        if (prev.length === 0) return prev;
                        const lastIdx = prev.length - 1;
                        const last = prev[lastIdx];
                        if (last.role !== "assistant") {
                          return [
                            ...prev,
                            { role: "assistant", content: data.content, createdAt: new Date().toISOString() },
                          ];
                        }
                        const updated = [...prev];
                        updated[lastIdx] = {
                          ...last,
                          content: (last.content || "") + data.content,
                        };
                        return updated;
                      });
                      if (typeof window !== "undefined") {
                        window.requestAnimationFrame(scrollToBottom);
                      }
                    } else if (data.type === "done") {
                      if (data.conversationId) {
                        if (!conversationId) setConversationId(data.conversationId);
                        try {
                          const saved = JSON.parse(localStorage.getItem(sessionKey(slug)) || "{}");
                          localStorage.setItem(
                            sessionKey(slug),
                            JSON.stringify({
                              ...saved,
                              conversationId: data.conversationId,
                              customerId: data.customerId || saved.customerId,
                            })
                          );
                        } catch {}
                      }
                      if (data.intent) setTaskLabel(getTaskLabel(data.intent));
                    }
                  } catch {
                    // Ignore chunk parse errors
                  }
                }
              }
            } else {
              const data = await res.json();
              if (data.conversationId) {
                if (!conversationId) setConversationId(data.conversationId);
                try {
                  const saved = JSON.parse(localStorage.getItem(sessionKey(slug)) || "{}");
                  localStorage.setItem(
                    sessionKey(slug),
                    JSON.stringify({
                      ...saved,
                      conversationId: data.conversationId,
                      customerId: data.customerId || saved.customerId,
                    })
                  );
                } catch {}
              }

              if (data.intent) setTaskLabel(getTaskLabel(data.intent));

              setMessages((prev) => {
                if (prev.length === 0) return prev;
                const lastIdx = prev.length - 1;
                const updated = [...prev];
                if (updated[lastIdx].role === "assistant" && updated[lastIdx].content === "") {
                  updated[lastIdx] = {
                    role: "assistant",
                    content: data.message?.content || "I'm experiencing a brief issue — please try again.",
                    createdAt: new Date().toISOString(),
                    intent: data.intent,
                    handoff: data.handoff,
                  };
                  return updated;
                }
                return [
                  ...prev,
                  {
                    role: "assistant",
                    content: data.message?.content || "I'm experiencing a brief issue — please try again.",
                    createdAt: new Date().toISOString(),
                    intent: data.intent,
                    handoff: data.handoff,
                  },
                ];
              });
            }

            success = true;
            break; // Exit retry loop on success
          } catch (attemptErr) {
            clearTimeout(timeoutId);
            lastError = attemptErr;
            if (attempt < MAX_CLIENT_RETRIES) {
              console.warn(`[ChatClient] Prompt attempt ${attempt} failed (${attemptErr.message}). Retrying...`);
              await new Promise((r) => setTimeout(r, Math.min(1000 * attempt, 3000)));
            }
          }
        }

        if (!success && lastError) {
          throw lastError;
        }
      } catch (err) {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          const updated = [...prev];
          if (updated[lastIdx].role === "assistant" && updated[lastIdx].content === "") {
            updated[lastIdx] = {
              role: "assistant",
              content: "I'm having a brief connection issue. Please try again.",
              createdAt: new Date().toISOString(),
            };
            return updated;
          }
          return [
            ...prev,
            {
              role: "assistant",
              content: "I'm having a brief connection issue. Please try again.",
              createdAt: new Date().toISOString(),
            },
          ];
        });
      } finally {
        setSending(false);
        setTaskLabel(null);
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setTimeout(scrollToBottom, 50);
      }
    },
    [sending, business, conversationId, slug, customerName, customerContact, scrollToBottom]
  );

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const ref = searchParams.get("reference");
    const receiptNum = searchParams.get("receipt");

    if (paymentStatus === "success" && ref && !handledPaymentRef.current && sessionReady) {
      handledPaymentRef.current = true;
      const prompt = `I've completed my payment (Reference: ${ref}${receiptNum ? `, Receipt: ${receiptNum}` : ""}). Please verify my payment status and issue my receipt.`;
      setTimeout(() => sendMessage(prompt), 500);
    }
  }, [searchParams, sessionReady, sendMessage]);

  // Voice recorder
  const voice = useVoiceRecorder({
    onAutoStop: async () => {
      if (voiceTranscript.trim()) {
        await sendMessage(voiceTranscript);
      }
    },
  });

  const handleSessionStart = useCallback(
    (name, contact) => {
      setCustomerName(name);
      setCustomerContact(contact || "");
      setSessionReady(true);
      const empName = business?.aiConfig?.employeeName || business?.aiConfig?.persona || "Voxy";
      const clean = name?.trim();
      const isGuest = !clean || clean.toLowerCase() === "customer" || clean.toLowerCase() === "guest";
      const greeting =
        business?.aiConfig?.greeting ||
        (!isGuest ? `Hi ${clean}! ` : "Hi! ") +
          `Welcome to ${business?.name || "our store"}. I'm ${empName}, your AI sales assistant. How can I help you today?`;
      setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
      try {
        localStorage.setItem(sessionKey(slug), JSON.stringify({ customerName: name, contact }));
      } catch {}
      if (preMsg) {
        setTimeout(() => sendMessage(decodeURIComponent(preMsg)), 300);
      }
      if (searchParams.get("call") === "true") {
        setTimeout(() => setIsVoiceCallActive(true), 350);
      }
    },
    [business, slug, preMsg, searchParams, sendMessage]
  );

  // Load business
  useEffect(() => {
    let isMounted = true;

    async function loadBusiness() {
      let targetSlug = (slug || "").trim();

      if (!targetSlug) {
        try {
          const meRes = await fetch("/api/v1/auth/me", { credentials: "include" });
          const meData = await meRes.json();
          if (meData.success && meData.data?.slug) {
            targetSlug = meData.data.slug;
          }
        } catch {}
      }

      if (!targetSlug) {
        if (isMounted) {
          setError("No business specified.");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/v1/businesses/by-slug/" + encodeURIComponent(targetSlug));
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && data.data) {
          const biz = data.data;
          setBusiness(biz);

          // Restore session
          try {
            const saved = JSON.parse(localStorage.getItem(sessionKey(biz.slug || targetSlug)) || "null");
            if (saved?.customerName || searchParams.get("payment") === "success") {
              setCustomerName(saved?.customerName || "Customer");
              if (saved?.contact) setCustomerContact(saved.contact);
              setConversationId(saved?.conversationId || null);
              setSessionReady(true);

              const empName = biz.aiConfig?.employeeName || biz.aiConfig?.persona || "Voxy";
              const clean = saved.customerName?.trim();
              const isGuest = !clean || clean.toLowerCase() === "customer" || clean.toLowerCase() === "guest";
              const greeting =
                biz.aiConfig?.greeting ||
                (!isGuest ? `Hi ${clean}! ` : "Hi! ") +
                  `Welcome to ${biz.name || "our store"}. I'm ${empName}, your AI sales assistant. How can I help you today?`;

              if (saved.conversationId) {
                const qs = saved.customerId ? `?customerId=${saved.customerId}` : "";
                fetch(`/api/v1/conversations/${saved.conversationId}${qs}`)
                  .then((r) => r.json())
                  .then((convData) => {
                    if (!isMounted) return;
                    if (convData.success && convData.data) {
                      if (convData.data.status) setConvStatus(convData.data.status);
                      if (Array.isArray(convData.data.messages) && convData.data.messages.length > 0) {
                        setMessages(convData.data.messages);
                        setTimeout(scrollToBottom, 50);
                      } else {
                        setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
                      }
                    } else {
                      setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
                    }
                  })
                  .catch(() => {
                    if (isMounted) {
                      setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
                    }
                  });
              } else {
                setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
              }
              if (searchParams.get("call") === "true") {
                setTimeout(() => setIsVoiceCallActive(true), 400);
              }
            }
          } catch (e) {
            console.warn("Session restore error:", e);
          }
        } else {
          setError(data.error?.message || "Business not found.");
        }
      } catch (err) {
        if (isMounted) {
          setError("Could not load this business.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBusiness();

    return () => {
      isMounted = false;
    };
  }, [slug, searchParams, scrollToBottom]);

  // Polling for updates
  useEffect(() => {
    if (!conversationId || sending) return;
    let isMounted = true;

    const pollConversation = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        let custId = null;
        try {
          const saved = JSON.parse(localStorage.getItem(sessionKey(slug)) || "{}");
          custId = saved.customerId;
        } catch {}

        const qs = custId ? `?customerId=${custId}` : "";
        const res = await fetch(`/api/v1/conversations/${conversationId}${qs}`);
        const data = await res.json();
        if (!isMounted || !data.success || !data.data) return;

        if (data.data.status) {
          setConvStatus(data.data.status);
        }

        if (data.data.isBusinessTyping !== undefined) {
          if (data.data.isBusinessTyping) {
            setBusinessTypingWithExpiry(true);
          }
        }

        const serverMsgs = data.data.messages;
        if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
          setMessages((prev) => {
            const hasDiff =
              serverMsgs.length !== prev.length ||
              (serverMsgs.length > 0 &&
                prev.length > 0 &&
                (serverMsgs[serverMsgs.length - 1]?.createdAt !== prev[prev.length - 1]?.createdAt ||
                  serverMsgs[serverMsgs.length - 1]?.content !== prev[prev.length - 1]?.content));

            if (hasDiff) {
              setBusinessTypingWithExpiry(false);
              setTimeout(scrollToBottom, 50);
              return serverMsgs;
            }
            return prev;
          });
        }
      } catch (err) {
        // Ignore background poll errors
      }
    };

    const interval = setInterval(pollConversation, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [conversationId, sending, slug, scrollToBottom, setBusinessTypingWithExpiry]);

  // Live listener for business typing via BroadcastChannel and Supabase
  useEffect(() => {
    if (!conversationId) {
      setIsBusinessTyping(false);
      return;
    }

    let bc = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel(`voxy_typing_${conversationId}`);
        bc.onmessage = (event) => {
          if (event.data?.sender === "business") {
            setBusinessTypingWithExpiry(Boolean(event.data.isTyping));
          }
        };
      }
    } catch {}

    let sbChannel = null;
    try {
      if (supabase) {
        sbChannel = supabase
          .channel(`chat:${conversationId}`)
          .on("broadcast", { event: "typing" }, (payload) => {
            if (payload.payload?.senderType === "owner" || payload.payload?.sender === "business") {
              setBusinessTypingWithExpiry(Boolean(payload.payload?.isTyping));
            }
          })
          .subscribe();
      }
    } catch {}

    return () => {
      if (bc) bc.close();
      if (supabase && sbChannel) supabase.removeChannel(sbChannel);
      if (businessTypingTimeoutRef.current) clearTimeout(businessTypingTimeoutRef.current);
    };
  }, [conversationId, setBusinessTypingWithExpiry]);

  useEffect(() => {
    scrollToBottom();
    if (sessionReady && !sending) {
      const isMobile = typeof window !== "undefined" && (window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
      if (!isMobile) {
        textareaRef.current?.focus();
      }
    }
  }, [messages, taskLabel, isBusinessTyping, sessionReady, sending, scrollToBottom]);

  const handleSend = useCallback(() => {
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = useCallback(() => {
    if (voice.isRecording) {
      voice.stopRecording().then(async () => {
        if (voiceTranscript.trim()) {
          await sendMessage(voiceTranscript);
        }
      });
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-NG";
      recognition.onresult = (e) => {
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        setInputValue(transcript);
      };
      recognition.onend = () => {
        voice.stopRecording().then(async () => {
          if (voiceTranscript.trim()) await sendMessage(voiceTranscript);
        });
      };
      recognition.start();
    }

    voice.startRecording();
  }, [voice, voiceTranscript, sendMessage]);

  const employeeName = business?.aiConfig?.employeeName || business?.aiConfig?.persona || "Voxy";
  const hasHandoff = messages.some((m) => m.handoff);
  const lastNonCustomerMsg = [...messages].reverse().find((m) => m.role !== "user");
  const isBusinessInChat =
    convStatus === "handed_off" ||
    hasHandoff ||
    lastNonCustomerMsg?.role === "business" ||
    lastNonCustomerMsg?.role === "staff" ||
    lastNonCustomerMsg?.sender === "business";

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060709] flex flex-col items-center justify-center gap-3">
        <div className="size-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center animate-pulse">
          <Loader2 className="size-5 animate-spin text-[#00D18F]" />
        </div>
        <p className="text-xs text-zinc-500 font-medium">Opening Storefront...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !business) {
    return (
      <div className="min-h-screen bg-[#060709] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm p-6 rounded-2xl bg-[#0E1015] border border-white/[0.08] shadow-2xl">
          <div className="size-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-base font-semibold text-white">Storefront Unavailable</h2>
          <p className="text-xs text-zinc-400">{error || "Could not find the requested business storefront."}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 text-xs font-semibold text-black bg-[#00D18F] rounded-xl hover:bg-[#00D18F]/90 transition-all"
          >
            Explore Voxy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#060709] text-zinc-100 flex overflow-hidden font-sans">
      {/* ── Left Pane: Desktop Storefront Sidebar (Hidden on Mobile) ── */}
      <aside className="hidden md:flex md:w-[380px] lg:w-[420px] shrink-0 h-full">
        <BusinessStorefrontSidebar
          business={business}
          employeeName={employeeName}
          onStartVoiceCall={() => setIsVoiceCallActive(true)}
          onQuickAction={(query) => {
            if (sessionReady) sendMessage(query);
            else setInputValue(query);
          }}
        />
      </aside>

      {/* ── Mobile Storefront Drawer Overlay ── */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-4/5 max-w-sm h-full bg-[#090A0D] z-10 shadow-2xl border-r border-white/[0.08] flex flex-col">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Business Details</span>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <BusinessStorefrontSidebar
                business={business}
                employeeName={employeeName}
                onStartVoiceCall={() => {
                  setShowMobileSidebar(false);
                  setIsVoiceCallActive(true);
                }}
                onQuickAction={(query) => {
                  setShowMobileSidebar(false);
                  if (sessionReady) sendMessage(query);
                  else setInputValue(query);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Right Pane: Conversation & Action Workspace ── */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#060709] relative">
        {/* Workspace Top Bar */}
        <header className="h-16 border-b border-white/[0.07] px-4 md:px-6 flex items-center justify-between gap-3 shrink-0 bg-[#090A0D]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={slug ? "/business/" + slug : "/"}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              title="Return to Business Profile"
            >
              <ArrowLeft className="size-4" />
            </Link>

            {/* Mobile Storefront Trigger */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left min-w-0"
            >
              <div className="size-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-[#00D18F]">
                    {(business.name || "V").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                  <span>{business.name}</span>
                  <Info className="size-3 text-zinc-500" />
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {employeeName} (AI Employee)
                </div>
              </div>
            </button>

            {/* Desktop Active AI Agent Indicator */}
            <div className="hidden md:flex items-center gap-3">
              <div className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#00D18F] shrink-0">
                <Bot className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    {isBusinessInChat ? `${business.name} (Human Staff)` : business.name}
                  </h2>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {sending
                    ? taskLabel || `${employeeName} is replying...`
                    : isBusinessInChat
                    ? "Store staff joined the conversation"
                    : `Assistant for ${business.name}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsVoiceCallActive(true)}
              className="h-9 px-3.5 rounded-xl bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Phone className="size-3.5 fill-black" />
              <span>Call {employeeName}</span>
            </button>
          </div>
        </header>

        {/* Handoff Notice Banner */}
        {hasHandoff && (
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300 animate-in slide-in-from-top duration-200">
            <AlertCircle className="size-4 shrink-0 text-amber-400" />
            <p className="leading-tight">
              <strong>Human Staff Notified:</strong> {employeeName} has requested assistance from the {business.name} management team.
            </p>
          </div>
        )}

        {/* Voice Error Banner */}
        {voice.error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="size-3.5 shrink-0 text-red-400" />
            <span>{voice.error}</span>
          </div>
        )}

        {/* ── Conversation Scroll Area ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 custom-scrollbar">
          {!sessionReady ? (
            <WelcomeOnboarding
              business={business}
              employeeName={employeeName}
              onStart={handleSessionStart}
            />
          ) : !userHasSent && messages.length <= 1 ? (
            <IntentHomeState
              business={business}
              employeeName={employeeName}
              onSelectAction={(query) => sendMessage(query)}
              onStartVoiceCall={() => setIsVoiceCallActive(true)}
            />
          ) : !userHasSent && messages.length <= 1 ? (
            <IntentHomeState
              business={business}
              employeeName={employeeName}
              onSelectAction={(query) => sendMessage(query)}
              onStartVoiceCall={() => setIsVoiceCallActive(true)}
            />
          ) : (
            <div className="max-w-4xl xl:max-w-5xl mx-auto space-y-6">
              {/* Message Feed */}
              {(() => {
                const visibleMessages = messages.filter((m) => !(m.role === "assistant" && !m.content));
                const lastVisible = visibleMessages[visibleMessages.length - 1];
                const isAssistantStreaming = lastVisible?.role === "assistant" && sending;

                return (
                  <>
                    {visibleMessages.map((msg, i) => {
                      const isUser = msg.role === "user";
                      const isBusinessStaff =
                        msg.role === "business" || msg.sender === "business" || msg.role === "staff";
                      const isAI = !isUser && !isBusinessStaff;
                      const isLatestAssistant = !isUser && i === visibleMessages.length - 1 && !sending;
                      const isReported = reportedMsgs.has(i) || msg.isReported;

                      return (
                        <div
                          key={i}
                          className={`group relative flex items-start gap-3.5 ${
                            isUser ? "flex-row-reverse" : "flex-row"
                          } animate-in fade-in duration-200`}
                        >
                          {/* Role Avatar */}
                          <div
                            className={`size-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 shadow-sm overflow-hidden ${
                              isUser
                                ? "bg-zinc-800 border-white/[0.08] text-zinc-300"
                                : isBusinessStaff
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-[#00D18F]/10 border-[#00D18F]/25 text-[#00D18F]"
                            }`}
                          >
                            {isUser ? (
                              <User className="size-4" />
                            ) : isBusinessStaff ? (
                              business?.logoUrl ? (
                                <img
                                  src={business.logoUrl}
                                  alt={business.name || "Business"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-amber-400">
                                  {(business?.name || "B").charAt(0).toUpperCase()}
                                </span>
                              )
                            ) : (
                              <Bot className="size-4" />
                            )}
                          </div>

                          {/* Message Content Body */}
                          <div className={`relative flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? "items-end text-right ml-auto" : "items-start text-left mr-auto"}`}>
                            {/* Hover Actions Toolbar - Side Bottom */}
                            <div
                              className={
                                "absolute bottom-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 bg-[#0f1117]/95 backdrop-blur-md border border-white/10 rounded-lg p-1 z-20 shadow-xl " +
                                (isUser ? "-left-14" : "-right-14")
                              }
                            >
                              <button
                                onClick={() => handleCopy(msg.content, i)}
                                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Copy message"
                              >
                                {copiedIndex === i ? <Check className="size-3 text-[#00D18F]" /> : <Copy className="size-3" />}
                              </button>
                              {isAI && (
                                <button
                                  onClick={() => setReportingMsg({ content: msg.content, index: i })}
                                  className={
                                    "p-1 rounded transition-colors " +
                                    (isReported ? "text-rose-400 bg-rose-500/10" : "text-zinc-400 hover:text-amber-400 hover:bg-white/10")
                                  }
                                  title={isReported ? "Reported to business" : "Report AI response"}
                                >
                                  <Flag className="size-3" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-zinc-200">
                                {isUser
                                  ? customerName || "You"
                                  : isBusinessStaff
                                  ? `${business?.name || "Store"} Staff`
                                  : employeeName}
                              </span>
                              {!isUser && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  isBusinessStaff
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-[#00D18F]/10 text-[#00D18F] border border-[#00D18F]/20"
                                }`}>
                                  {isBusinessStaff ? "Human Staff" : "AI Representative"}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-500">
                                {formatTime(msg.createdAt)}
                              </span>
                              {isReported && (
                                <span className="text-[9px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full border border-rose-500/20">
                                  Reported
                                </span>
                              )}
                            </div>

                            <div
                              className={`p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed border shadow-sm ${
                                isUser
                                  ? "bg-white/[0.06] border-white/[0.08] text-zinc-100 rounded-tr-sm whitespace-pre-wrap text-left inline-block w-fit max-w-full"
                                  : isBusinessStaff
                                  ? "bg-amber-500/[0.03] border-amber-500/20 text-zinc-100 rounded-tl-sm space-y-3 w-full"
                                  : "bg-white/[0.02] border-white/[0.07] text-zinc-200 rounded-tl-sm space-y-3 w-full"
                              }`}
                            >
                              {/* Agentic Intent / Action Step Badge for Assistant */}
                              {!isUser && msg.intent && (
                                <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.06] text-[11px] text-zinc-400">
                                  <span className="size-1.5 rounded-full bg-[#00D18F]" />
                                  <span className="uppercase tracking-wider font-semibold text-zinc-300">
                                    {msg.intent === "browse_products" && "Agent Action • Catalogue Search & Inventory Lookup"}
                                    {msg.intent === "recommend_products" && "Agent Action • Personalized Recommendations"}
                                    {msg.intent === "place_order" && "Agent Action • Order Intake & Checkout Preparation"}
                                    {msg.intent === "check_order_status" && "Agent Action • Live Order Fulfillment Tracking"}
                                    {msg.intent === "customer_support" && "Agent Action • Policy & Store Operations FAQ"}
                                    {msg.intent === "handoff" && "Status • Forwarded to Store Management"}
                                    {!["browse_products", "recommend_products", "place_order", "check_order_status", "customer_support", "handoff"].includes(msg.intent) && "Agent Action • Store Assistance"}
                                  </span>
                                </div>
                              )}

                              {isUser ? msg.content : <MarkdownContent content={msg.content} />}

                              {/* Structured In-Feed Action Cards */}
                              {!isUser && (
                                <>
                                  {(msg.intent === "browse_products" || msg.intent === "recommend_products") && business?.products?.length > 0 && (
                                    <ProductCardGrid
                                      products={msg.products || business.products.slice(0, 4)}
                                      onSelectProduct={(p) => sendMessage(`I would like to order ${p.name}`)}
                                    />
                                  )}

                                  {msg.intent === "place_order" && (
                                    <OrderReceiptCard
                                      order={msg.order || {
                                        items: business?.products?.slice(0, 2).map((p) => ({ name: p.name, quantity: 1, price: p.price })) || [
                                          { name: "Selected Item", quantity: 1, price: 5000 },
                                        ],
                                        totalAmount: business?.products?.[0]?.price || 5000,
                                      }}
                                      onConfirmOrder={() => sendMessage("Please generate a payment link for this order.")}
                                    />
                                  )}

                                  {(msg.intent === "payment" || (msg.intent === "place_order" && (msg.content?.toLowerCase().includes("paystack") || msg.content?.toLowerCase().includes("payment")))) && (
                                    <PaymentCard
                                      payment={msg.payment || {
                                        orderId: conversationId?.slice(-4) || "1042",
                                        amount: business?.products?.[0]?.price || 5000,
                                        status: "pending",
                                        checkoutUrl: msg.content?.match(/https:\/\/(?:checkout\.paystack\.com|api\.paystack\.co)[^\s)]+/i)?.[0] || business?.paystackLink || "https://checkout.paystack.com",
                                      }}
                                    />
                                  )}

                                  {msg.intent === "handoff" && (
                                    <HandoffNoticeCard business={business} />
                                  )}
                                </>
                              )}

                              {/* Interactive Follow-up Action Chips */}
                              {isLatestAssistant && (
                                <div className="pt-2 border-t border-white/[0.05] flex flex-wrap gap-2">
                                  {business?.products?.length > 0 && (
                                    <button
                                      onClick={() => sendMessage("Can you show me your popular items and pricing?")}
                                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                                    >
                                      <ShoppingBag className="size-3 text-[#00D18F]" />
                                      <span>Browse catalogue</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => sendMessage("What are your opening hours and delivery options?")}
                                    className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                                  >
                                    <Clock className="size-3 text-[#00D18F]" />
                                    <span>Hours & delivery</span>
                                  </button>
                                  <button
                                    onClick={() => sendMessage("I would like to speak directly with a human staff member.")}
                                    className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                                  >
                                    <User className="size-3 text-amber-400" />
                                    <span>Talk to human</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Agent Activity / Typing State Indicator */}
                    {sending && !isAssistantStreaming && (
                      <PremiumTypingIndicator
                        label={employeeName}
                        type="ai"
                      />
                    )}

                    {/* Live Voice Recording Preview */}
                    {voice.isRecording && (
                      <div className="flex items-start gap-3.5 flex-row-reverse animate-in fade-in duration-150">
                        <div className="size-8 rounded-xl bg-[#00D18F]/20 border border-[#00D18F]/40 flex items-center justify-center text-[#00D18F] shrink-0 mt-0.5 animate-pulse">
                          <Mic className="size-4" />
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-xs font-semibold text-zinc-400">{customerName || "You"} (Voice)</div>
                          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tr-sm bg-[#00D18F]/10 border border-[#00D18F]/30 text-xs text-white">
                            <span className="size-2 rounded-full bg-[#00D18F] animate-ping" />
                            <span>{voiceTranscript || "Listening to your voice..."}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Live Business Staff Typing Bubble */}
                    {isBusinessTyping && (
                      <PremiumTypingIndicator
                        label={`${business?.name || "Store"} Staff`}
                        type="business"
                        avatar={business?.logoUrl}
                        isImage={Boolean(business?.logoUrl)}
                      />
                    )}
                  </>
                );
              })()}

              {/* Quick Action Chips */}
              {!userHasSent && !sending && (
                <div className="pt-4 border-t border-white/[0.05] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                    <Sparkles className="size-3 text-[#00D18F]" />
                    <span>Suggested inquiries:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(action.query)}
                        className="p-3 text-left rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[#00D18F]/30 transition-all flex items-center justify-between group"
                      >
                        <span className="text-xs text-zinc-300 group-hover:text-white font-medium">
                          {action.label}
                        </span>
                        <ChevronRight className="size-3.5 text-zinc-600 group-hover:text-[#00D18F] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Workspace Composer Footer ── */}
        {sessionReady && (
          <footer className="p-4 md:px-8 border-t border-white/[0.07] bg-[#090A0D]/90 backdrop-blur-md shrink-0 relative">
            {/* Quick Action Drawer Menu */}
            {showQuickMenu && (
              <div className="max-w-4xl xl:max-w-5xl mx-auto mb-3 animate-in slide-in-from-bottom-2 fade-in duration-150">
                <div className="p-3 bg-[#12141A] border border-white/[0.1] rounded-2xl shadow-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      setIsVoiceCallActive(true);
                    }}
                    className="p-2.5 rounded-xl bg-[#00D18F]/10 hover:bg-[#00D18F]/20 border border-[#00D18F]/30 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#00D18F]">
                      <Phone className="size-3.5 fill-[#00D18F]" />
                      <span>Start Voice Call</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">Talk out loud with {employeeName}</p>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      sendMessage("Can you show me all available products in your catalogue?");
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white group-hover:text-[#00D18F]">
                      <ShoppingBag className="size-3.5 text-[#00D18F]" />
                      <span>Browse Catalogue</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">Explore all items and pricing</p>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      sendMessage("What are your opening hours, location, and contact information?");
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white group-hover:text-[#00D18F]">
                      <Clock className="size-3.5 text-[#00D18F]" />
                      <span>Hours & Location</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">Address, phone, and hours</p>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      sendMessage("How do delivery and payments work?");
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white group-hover:text-[#00D18F]">
                      <Truck className="size-3.5 text-[#00D18F]" />
                      <span>Delivery & Payment</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">Options, pickup, and payment</p>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      sendMessage("I would like to speak directly with a human staff member.");
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white group-hover:text-amber-400">
                      <User className="size-3.5 text-amber-400" />
                      <span>Talk to Human</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">Connect with store staff</p>
                  </button>
                </div>
              </div>
            )}

            <div className="max-w-4xl xl:max-w-5xl mx-auto space-y-2">
              <div className="flex items-end gap-2.5">
                {/* [ + ] Action Menu Button */}
                <button
                  type="button"
                  onClick={() => setShowQuickMenu(!showQuickMenu)}
                  title={showQuickMenu ? "Close menu" : "Quick store actions"}
                  className={`size-9 rounded-full flex items-center justify-center transition-all shrink-0 border ${
                    showQuickMenu
                      ? "bg-white/[0.12] border-white/[0.2] text-white"
                      : "bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <Plus className={`size-4 transition-transform duration-200 ${showQuickMenu ? "rotate-45" : ""}`} />
                </button>

                {/* Message Text Input */}
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    autoFocus
                    rows={1}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isBusinessInChat
                        ? `Message ${business?.name || "our"} team...`
                        : `Message ${business?.name || employeeName}...`
                    }
                    disabled={sending || voice.isRecording}
                    className="w-full min-h-[38px] max-h-[120px] bg-transparent px-2 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-none disabled:opacity-50"
                  />
                </div>

                {/* Controls (Voice & Send) */}
                <div className="flex items-center gap-1.5 shrink-0 pr-1">
                  {/* Voice Record Toggle */}
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    disabled={sending}
                    title={voice.isRecording ? "Stop recording" : "Click to speak"}
                    className={`size-9 rounded-full flex items-center justify-center transition-all shrink-0 border ${
                      voice.isRecording
                        ? "bg-[#00D18F] border-[#00D18F] text-black shadow-md shadow-[#00D18F]/20"
                        : "bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {voice.isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      handleSend();
                    }}
                    disabled={!inputValue.trim() || sending || voice.isRecording}
                    className="size-9 rounded-full bg-[#00D18F] text-black flex items-center justify-center hover:bg-[#00D18F]/90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUp className="size-4" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 px-2">
                <span>Shift + Enter for new line</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#00D18F]" />
                  <span>Verified line for <strong className="text-zinc-400 font-medium">{business?.name || "this business"}</strong></span>
                </span>
              </div>
            </div>
          </footer>
        )}

        {/* Voxy Voice Interactive Real-time Call Modal */}
        <VoxyVoiceCallModal
          isOpen={isVoiceCallActive}
          onClose={() => setIsVoiceCallActive(false)}
          business={business}
          employeeName={employeeName}
          customerName={customerName || "Customer"}
          conversationId={conversationId}
          onNewMessage={(newMsg) => {
            setMessages((prev) => [
              ...prev,
              {
                ...newMsg,
                createdAt: new Date().toISOString(),
              },
            ]);
          }}
        />

        {/* Report AI Response Modal */}
        {reportingMsg && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0e1015] border border-white/[0.12] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Flag className="size-4" />
                  <span>Report AI Response</span>
                </div>
                <button onClick={() => setReportingMsg(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg">
                  <X className="size-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                This report will be logged directly to the business dashboard alerts for review.
              </p>

              <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-zinc-300 italic line-clamp-3">
                "{reportingMsg.content}"
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-300">Reason for report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50"
                >
                  <option value="Inaccurate or incorrect information" className="bg-zinc-900">Inaccurate or incorrect information</option>
                  <option value="Hallucinated or made-up details" className="bg-zinc-900">Hallucinated or made-up details</option>
                  <option value="Unhelpful or repetitive response" className="bg-zinc-900">Unhelpful or repetitive response</option>
                  <option value="Inappropriate response" className="bg-zinc-900">Inappropriate response</option>
                  <option value="Other / Staff review required" className="bg-zinc-900">Other / Staff review required</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingMsg(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReportSubmit}
                  disabled={submittingReport}
                  className="px-4 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {submittingReport ? <Loader2 className="size-3.5 animate-spin" /> : <Flag className="size-3.5" />}
                  <span>Submit Report</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Right Pane: Context & Cart Panel (Desktop XL) ── */}
      <aside className="hidden xl:flex xl:w-[320px] shrink-0 h-full">
        <RightContextPanel
          business={business}
          employeeName={employeeName}
          onStartVoiceCall={() => setIsVoiceCallActive(true)}
        />
      </aside>

      {/* ── Mobile/Tablet Right Context Overlay Drawer ── */}
      {showRightContext && (
        <div className="fixed inset-0 z-50 xl:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setShowRightContext(false)}
          />
          <div className="relative w-4/5 max-w-sm h-full bg-[#090A0D] z-10 shadow-2xl border-l border-white/[0.08] flex flex-col">
            <RightContextPanel
              business={business}
              employeeName={employeeName}
              onStartVoiceCall={() => {
                setShowRightContext(false);
                setIsVoiceCallActive(true);
              }}
              onClose={() => setShowRightContext(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060709] flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-[#00D18F]" />
          <p className="text-xs text-zinc-500 font-medium">Connecting to Storefront...</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
