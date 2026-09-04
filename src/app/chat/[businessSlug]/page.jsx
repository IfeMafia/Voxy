"use client";

import { useState, useEffect, useRef, use } from "react";
import { getBusinessBySlug } from "@/lib/api/business";
import { listProducts, formatNGN } from "@/lib/api/products";
import { createCustomer, startConversation } from "@/lib/api/customers";
import { appendMessage, getConversation } from "@/lib/api/conversations";
import {
  Bot,
  Send,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  Loader2,
  ChevronDown,
  ChevronUp,
  Store,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function PublicChatPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { businessSlug } = params;

  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chat state
  const [customer, setCustomer] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [isCustomerSet, setIsCustomerSet] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Load public business & catalog
  useEffect(() => {
    if (!businessSlug) return;
    setLoading(true);
    getBusinessBySlug(businessSlug)
      .then(async (biz) => {
        if (!biz) {
          setError("Business not found");
          return;
        }
        setBusiness(biz);
        // Load products if business ID is present
        if (biz.id) {
          try {
            const prodRes = await listProducts(biz.id, { available: true });
            setProducts(prodRes?.products || []);
          } catch (e) {
            console.warn("Could not load products for public storefront:", e);
          }
        }
      })
      .catch((err) => {
        console.error("Public chat error:", err);
        setError("Unable to load business details");
      })
      .finally(() => setLoading(false));
  }, [businessSlug]);

  // Initial greeting from Voxy
  useEffect(() => {
    if (business && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! Welcome to ${business.name}. I'm Voxy, your virtual assistant here. How can I help you today?`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [business, messages.length]);

  // 2. Initialize customer & conversation session
  const initializeSession = async (name, contact) => {
    if (!business?.id) return null;
    try {
      // Upsert customer
      const cust = await createCustomer(business.id, {
        name: name || "Guest Customer",
        phone: contact.startsWith("+") || /^\d+$/.test(contact) ? contact : undefined,
        email: contact.includes("@") ? contact : undefined,
        channel: "web_chat",
      });
      setCustomer(cust);

      // Start conversation
      const conv = await startConversation(cust.id, {
        status: "active",
        initialMessages: [
          {
            role: "assistant",
            content: `Hi! Welcome to ${business.name}. How can I help you today?`,
          },
        ],
      });
      setConversation(conv);
      return { cust, conv };
    } catch (e) {
      console.error("Session init failed:", e);
      return null;
    }
  };

  // Live polling for public conversation updates
  useEffect(() => {
    if (!conversation?.id || sending) return;
    let isMounted = true;

    const poll = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const detail = await getConversation(conversation.id, customer?.id);
        if (!isMounted || !detail?.messages) return;

        if (detail.status && detail.status !== conversation?.status) {
          setConversation((prev) => ({ ...(prev || {}), status: detail.status }));
        }

        const serverMsgs = detail.messages;
        if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
          setMessages((prev) => {
            const hasDiff =
              serverMsgs.length !== prev.length ||
              (serverMsgs.length > 0 &&
                prev.length > 0 &&
                (serverMsgs[serverMsgs.length - 1]?.createdAt !== prev[prev.length - 1]?.createdAt ||
                  serverMsgs[serverMsgs.length - 1]?.content !== prev[prev.length - 1]?.content));

            if (hasDiff) {
              setTimeout(scrollToBottom, 50);
              return serverMsgs;
            }
            return prev;
          });
        }
      } catch (e) {
        // Ignore background poll errors
      }
    };

    const interval = setInterval(poll, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [conversation?.id, customer?.id, sending]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || sending) return;

    // Optimistic user message
    const newMsg = { role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setSending(true);
    setTimeout(scrollToBottom, 50);

    // Prepare assistant message slot for streaming text
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", createdAt: new Date().toISOString() },
    ]);
    setTimeout(scrollToBottom, 20);

    try {
      let currentConv = conversation;
      if (!currentConv) {
        const res = await initializeSession(customerName, customerContact);
        currentConv = res?.conv;
      }

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business?.id,
          conversationId: currentConv?.id || undefined,
          customerId: customer?.id || undefined,
          customerName: customerName || undefined,
          contact: customerContact || undefined,
          message: text,
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to reach assistant");
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
                setMessages((prev) => {
                  if (prev.length === 0) return prev;
                  const lastIdx = prev.length - 1;
                  const last = prev[lastIdx];
                  if (last.role !== "assistant") return prev;
                  const updated = [...prev];
                  updated[lastIdx] = {
                    ...last,
                    content: last.content + data.content,
                  };
                  return updated;
                });
                if (typeof window !== "undefined") {
                  window.requestAnimationFrame(scrollToBottom);
                }
              } else if (data.type === "done" && data.conversationId && !conversation?.id) {
                setConversation((c) => ({ ...(c || {}), id: data.conversationId }));
              }
            } catch {}
          }
        }
      } else {
        const data = await res.json();
        if (data.conversationId && !conversation?.id) {
          setConversation((c) => ({ ...(c || {}), id: data.conversationId }));
        }
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const lastIdx = prev.length - 1;
          const updated = [...prev];
          if (updated[lastIdx].role === "assistant" && updated[lastIdx].content === "") {
            updated[lastIdx] = {
              role: "assistant",
              content: data.message?.content || "How else may I assist you today?",
              createdAt: new Date().toISOString(),
            };
            return updated;
          }
          return [
            ...prev,
            {
              role: "assistant",
              content: data.message?.content || "How else may I assist you today?",
              createdAt: new Date().toISOString(),
            },
          ];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const updated = [...prev];
        if (updated[lastIdx].role === "assistant" && updated[lastIdx].content === "") {
          updated[lastIdx] = {
            role: "assistant",
            content: "I'm having a brief issue reaching the store. Please try again.",
            createdAt: new Date().toISOString(),
          };
          return updated;
        }
        return prev;
      });
    } finally {
      setSending(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const sendChipMessage = (text) => {
    setInputValue(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
        <p className="text-zinc-500 text-sm">Connecting to business...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-4">
          <Store className="size-12 text-zinc-700 mx-auto" />
          <h1 className="text-xl font-bold">Business Unavailable</h1>
          <p className="text-zinc-500 text-sm">
            {error || "We couldn't find this business. Please verify the URL."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D18F] text-black font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-[#00D18F]/90 transition-colors"
          >
            Go to Voxy home
          </Link>
        </div>
      </div>
    );
  }

  const employeeName = business?.aiConfig?.employeeName || business?.aiConfig?.persona || "Voxy";
  const lastNonCustomerMsg = [...messages].reverse().find((m) => m.role !== "user");
  const isBusinessInChat =
    conversation?.status === "handed_off" ||
    messages.some((m) => m.handoff) ||
    lastNonCustomerMsg?.role === "business" ||
    lastNonCustomerMsg?.role === "staff" ||
    lastNonCustomerMsg?.sender === "business";

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-white max-w-2xl mx-auto border-x border-white/[0.07]">
      {/* ── Top Business Brand Bar ── */}
      <header className="px-5 py-4 border-b border-white/[0.07] bg-black/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0 overflow-hidden text-sm font-bold text-[#00D18F]">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              (business.name || "V").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm tracking-tight truncate">
              {business.name}
            </h1>
            {sending ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[#00D18F] font-medium">
                <span className="size-1.5 rounded-full bg-[#00D18F] animate-pulse" />
                <span>{employeeName} is typing</span>
                <span className="inline-flex">
                  <span className="animate-bounce [animation-delay:-0.3s]">.</span>
                  <span className="animate-bounce [animation-delay:-0.15s]">.</span>
                  <span className="animate-bounce">.</span>
                </span>
              </div>
            ) : isBusinessInChat ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <span className="size-1.5 rounded-full bg-[#00D18F]" />
                <span>Business active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="size-1.5 rounded-full bg-[#00D18F]" />
                <span>{employeeName} &middot; AI employee active</span>
              </div>
            )}
          </div>
        </div>

        {products.length > 0 && (
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5"
          >
            <ShoppingBag className="size-3.5 text-[#00D18F]" />
            Products ({products.length})
            {showCatalog ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        )}
      </header>

      {/* ── Collapsible Catalog Drawer ── */}
      {showCatalog && products.length > 0 && (
        <div className="border-b border-white/[0.08] bg-white/[0.02] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Available Products
            </h2>
            <span className="text-[11px] text-zinc-600">Tap to inquire</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => sendChipMessage(`I would like to know more about ${p.name}`)}
                className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#00D18F]/40 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white truncate group-hover:text-[#00D18F] transition-colors">
                  {p.name}
                </div>
                <div className="text-xs font-bold text-zinc-400 mt-1 tabular-nums">
                  {formatNGN(p.priceKobo - (p.discountKobo || 0))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages Stream ── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
        {(() => {
          const visibleMessages = messages.filter((m) => !(m.role === "assistant" && !m.content));
          const lastVisible = visibleMessages[visibleMessages.length - 1];
          const isAssistantStreaming = lastVisible?.role === "assistant" && sending;

          return (
            <>
              {visibleMessages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const isBusiness =
                  msg.role === "business" ||
                  msg.role === "staff" ||
                  msg.sender === "business";

                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && isBusiness && (
                      <div className="size-7 rounded-lg bg-white/[0.08] border border-white/[0.1] overflow-hidden flex items-center justify-center shrink-0 mr-2 self-end mb-1" title={business.name}>
                        {business.logoUrl ? (
                          <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-white">{(business.name || "B").charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                    {!isUser && !isBusiness && (
                      <div className="size-7 rounded-lg bg-[#00D18F]/10 border border-[#00D18F]/20 flex items-center justify-center shrink-0 mr-2 self-end mb-1" title={employeeName}>
                        <Bot className="size-3.5 text-[#00D18F]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? "bg-white/[0.09] text-white rounded-tr-xs border border-white/[0.08]"
                          : isBusiness
                          ? "bg-[#00D18F]/[0.08] text-zinc-100 rounded-tl-xs border border-[#00D18F]/20"
                          : "bg-white/[0.03] text-zinc-200 rounded-tl-xs border border-white/[0.06]"
                      }`}
                    >
                      {msg.content}
                      <div className="text-[10px] text-zinc-500 mt-1 text-right opacity-60">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic typing indicator: only show before tokens stream in */}
              {sending && !isAssistantStreaming && (
                <div className="flex items-center gap-2 pl-1 animate-in fade-in duration-150">
                  <div className="size-7 rounded-lg bg-[#00D18F]/10 border border-[#00D18F]/20 flex items-center justify-center shrink-0">
                    <Bot className="size-3.5 text-[#00D18F]" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-xs">
                    <span className="size-1.5 rounded-full bg-[#00D18F] animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-[#00D18F] animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-[#00D18F] animate-bounce" />
                    <span className="text-[11px] text-zinc-500 ml-1.5">{employeeName} is typing...</span>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        <div ref={messagesEndRef} />
      </main>

      {/* ── Quick Prompt Chips ── */}
      <div className="px-4 py-2 border-t border-white/[0.05] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => sendChipMessage("What are your opening hours?")}
          className="px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-xs text-zinc-400 hover:text-white transition-all whitespace-nowrap"
        >
          🕒 Opening hours
        </button>
        <button
          onClick={() => sendChipMessage("What products do you recommend?")}
          className="px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-xs text-zinc-400 hover:text-white transition-all whitespace-nowrap"
        >
          ✨ Recommendations
        </button>
        <button
          onClick={() => sendChipMessage("How does delivery work?")}
          className="px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-xs text-zinc-400 hover:text-white transition-all whitespace-nowrap"
        >
          🚚 Delivery policy
        </button>
      </div>

      {/* ── Bottom Input Form ── */}
      <footer className="p-4 border-t border-white/[0.07] bg-black/90 backdrop-blur-md">
        {inputValue.trim() && !sending && (
          <div className="pb-1.5 text-[10px] text-zinc-500 flex items-center gap-1.5 pl-1 animate-in fade-in duration-150">
            <span className="size-1 rounded-full bg-[#00D18F] animate-ping" />
            <span>Typing...</span>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isBusinessInChat ? `Message ${business.name}...` : `Message ${employeeName}...`}
            disabled={sending}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="h-11 px-5 bg-[#00D18F] hover:bg-[#00D18F]/90 disabled:opacity-30 disabled:hover:bg-[#00D18F] text-black font-bold rounded-xl transition-all flex items-center justify-center shrink-0"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-zinc-700">
            Powered by Voxy AI Workforce for Business
          </p>
        </div>
      </footer>
    </div>
  );
}
