"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, AlertCircle, Mic, MicOff, CheckCircle2 } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

// ── Helpers ────────────────────────────────────────────────────────────────

function getTaskLabel(intent) {
  const map = {
    browse_products: "Looking through the catalogue...",
    browse_menu: "Looking through the catalogue...",
    recommend_products: "Finding the right options...",
    place_order: "Checking availability...",
    check_order_status: "Finding your order...",
    customer_support: "Looking that up...",
    handoff: "Connecting you with the team...",
  };
  return map[intent] || "Working on your request...";
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function sessionKey(slug) {
  return "voxy_session_" + slug;
}

const QUICK_CHIPS = [
  "What can you help me with?",
  "Browse products",
  "How does delivery work?",
  "What are your opening hours?",
];

// ── Customer name gate ─────────────────────────────────────────────────────

function NameForm({ employeeName, onStart }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onStart(name.trim() || "Customer", contact.trim()); }}
      className="flex flex-col gap-3 px-1"
    >
      <p className="text-sm text-zinc-400">Before we start — what should {employeeName} call you?</p>
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.18] transition-colors"
      />
      <input
        type="text"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Phone or email (optional)"
        className="h-10 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.18] transition-colors"
      />
      <button type="submit" className="h-10 bg-[#00D18F] text-black text-sm font-semibold rounded-lg hover:bg-[#00D18F]/90 transition-colors">
        Start chatting
      </button>
      <button type="button" onClick={() => onStart("Customer", "")} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
        Continue as guest
      </button>
    </form>
  );
}

// ── Chat content ───────────────────────────────────────────────────────────

function ChatContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const preMsg = searchParams.get("msg");

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [customerContact, setCustomerContact] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [taskLabel, setTaskLabel] = useState(null);
  const [userHasSent, setUserHasSent] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Voice recorder
  const voice = useVoiceRecorder({
    onAutoStop: async (blob) => {
      await transcribeAndSend(blob);
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load business
  useEffect(() => {
    if (!slug) { setError("No business specified."); setLoading(false); return; }
    fetch("/api/v1/businesses/by-slug/" + slug)
      .then((r) => r.json())
      .then(async (data) => {
        if (data.success && data.data) {
          const biz = data.data;
          setBusiness(biz);
          // Restore session
          try {
            const saved = JSON.parse(localStorage.getItem(sessionKey(slug)) || "null");
            if (saved?.customerName) {
              setCustomerName(saved.customerName);
              if (saved.contact) setCustomerContact(saved.contact);
              setConversationId(saved.conversationId || null);
              setSessionReady(true);
              const empName = biz.aiConfig?.employeeName || biz.aiConfig?.persona || "Voxy";
              const clean = saved.customerName?.trim();
              const isGuest = !clean || clean.toLowerCase() === "customer" || clean.toLowerCase() === "guest";
              // Restore message history or initial greeting
              if (saved.conversationId) {
                const qs = saved.customerId ? `?customerId=${saved.customerId}` : '';
                fetch(`/api/v1/conversations/${saved.conversationId}${qs}`)
                  .then((r) => r.json())
                  .then((convData) => {
                    if (convData.success && Array.isArray(convData.data?.messages) && convData.data.messages.length > 0) {
                      setMessages(convData.data.messages);
                      setTimeout(scrollToBottom, 50);
                    } else {
                      setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
                    }
                  })
                  .catch(() => {
                    setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
                  });
              } else {
                setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
              }
            }
          } catch {}
        } else {
          setError("Business not found.");
        }
      })
      .catch(() => setError("Could not load this business."))
      .finally(() => setLoading(false));
  }, [slug, scrollToBottom]);

  // Live polling for customer conversation
  useEffect(() => {
    if (!conversationId) return;
    let isMounted = true;

    const pollConversation = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        let custId = null;
        try {
          const saved = JSON.parse(localStorage.getItem(sessionKey(slug)) || "{}");
          custId = saved.customerId;
        } catch {}

        const qs = custId ? `?customerId=${custId}` : '';
        const res = await fetch(`/api/v1/conversations/${conversationId}${qs}`);
        const data = await res.json();
        if (!isMounted || !data.success || !data.data) return;

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

    const interval = setInterval(pollConversation, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [conversationId, slug, scrollToBottom]);

  // Pre-populate message from product link
  useEffect(() => {
    if (preMsg && sessionReady) {
      setInputValue(decodeURIComponent(preMsg));
    }
  }, [preMsg, sessionReady]);

  useEffect(() => { scrollToBottom(); }, [messages, taskLabel, scrollToBottom]);

  const handleSessionStart = useCallback((name, contact) => {
    setCustomerName(name);
    setCustomerContact(contact || "");
    setSessionReady(true);
    const empName = business?.aiConfig?.employeeName || business?.aiConfig?.persona || "Voxy";
    const clean = name?.trim();
    const isGuest = !clean || clean.toLowerCase() === "customer" || clean.toLowerCase() === "guest";
    const greeting = business?.aiConfig?.greeting ||
      (!isGuest ? ("Hi " + clean + "! ") : "Hi! ") + "Welcome to " + (business?.name || "our store") + ". I'm " + empName + ". How can I help you today?";
    setMessages([{ role: "assistant", content: greeting, createdAt: new Date().toISOString() }]);
    try {
      localStorage.setItem(sessionKey(slug), JSON.stringify({ customerName: name, contact }));
    } catch {}
    // Auto-send pre-populated message
    if (preMsg) {
      setTimeout(() => sendMessage(decodeURIComponent(preMsg)), 300);
    }
  }, [business, slug, preMsg]);

  const sendMessage = useCallback(async (text) => {
    const msg = text.trim();
    if (!msg || sending) return;
    setInputValue("");
    setVoiceTranscript("");
    setUserHasSent(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { role: "user", content: msg, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setTaskLabel("Working on your request...");

    let activeName = customerName;
    let activeContact = customerContact;
    if (!activeName) {
      try {
        const saved = JSON.parse(localStorage.getItem(sessionKey(slug)) || "{}");
        if (saved.customerName) activeName = saved.customerName;
        if (saved.contact) activeContact = saved.contact;
      } catch {}
    }

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business?.id,
          conversationId: conversationId || undefined,
          customerName: activeName || undefined,
          contact: activeContact || undefined,
          message: msg,
        }),
      });
      const data = await res.json();

      if (data.conversationId) {
        if (!conversationId) setConversationId(data.conversationId);
        try {
          const saved = JSON.parse(localStorage.getItem(sessionKey(slug)) || "{}");
          localStorage.setItem(sessionKey(slug), JSON.stringify({
            ...saved,
            conversationId: data.conversationId,
            customerId: data.customerId || saved.customerId
          }));
        } catch {}
      }

      if (data.intent) setTaskLabel(getTaskLabel(data.intent));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message?.content || "I'm having a brief issue — please try again.",
          createdAt: new Date().toISOString(),
          intent: data.intent,
          handoff: data.handoff,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having a brief issue reaching the store. Please try again.", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
      setTaskLabel(null);
    }
  }, [sending, business, conversationId, slug, customerName, customerContact]);

  const handleSend = useCallback(() => {
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Voice: transcribe audio blob via Web Speech API fallback or send raw audio
  const transcribeAndSend = useCallback(async (blob) => {
    // Use Web Speech API for live transcription (already captured via recognition)
    // blob is available for future server-side STT if needed
    if (voiceTranscript.trim()) {
      await sendMessage(voiceTranscript);
    }
  }, [voiceTranscript, sendMessage]);

  // Web Speech API live transcript
  const recognitionRef = useRef(null);

  const handleVoiceToggle = useCallback(() => {
    if (voice.isRecording) {
      // Stop recording
      voice.stopRecording().then(async (blob) => {
        if (voiceTranscript.trim()) {
          await sendMessage(voiceTranscript);
        }
      });
      recognitionRef.current?.stop();
      return;
    }

    // Start Web Speech API recognition for live transcript
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
        voice.stopRecording().then(async (blob) => {
          if (voiceTranscript.trim()) await sendMessage(voiceTranscript);
        });
      };
      recognition.start();
    }

    voice.startRecording();
  }, [voice, voiceTranscript, sendMessage]);

  const employeeName = business?.aiConfig?.employeeName || business?.aiConfig?.persona || "Voxy";
  const hasHandoff = messages.some((m) => m.handoff);

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-sm font-medium text-zinc-300">Business not found</p>
          <p className="text-xs text-zinc-600">{error}</p>
          <Link href="/" className="inline-block text-xs text-zinc-500 hover:text-white underline underline-offset-2">
            Go to Voxy home
          </Link>
        </div>
      </div>
    );
  }

  // ── Main shell ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col max-w-2xl mx-auto">

      {/* Header */}
      <header className="h-14 border-b border-white/[0.06] flex items-center gap-3 px-4 shrink-0 sticky top-0 bg-[#050505] z-20">
        <Link
          href={slug ? "/business/" + slug : "/"}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="size-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center overflow-hidden shrink-0">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-zinc-400">
              {(business.name || "V").charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white leading-tight truncate">{business.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="size-1.5 rounded-full bg-[#00D18F]" />
            <span className="text-[11px] text-zinc-500">{employeeName} &middot; AI employee</span>
          </div>
        </div>

        <span className="text-[10px] text-zinc-700 shrink-0 hidden sm:block">Powered by Voxy</span>
      </header>

      {/* Handoff banner */}
      {hasHandoff && (
        <div className="px-4 py-2 border-b border-white/[0.05] bg-amber-500/[0.04] flex items-center gap-2">
          <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300 flex-1">
            {employeeName} is connecting you with the {business.name} team.
          </p>
        </div>
      )}

      {/* Voice error */}
      {voice.error && (
        <div className="px-4 py-2 border-b border-white/[0.05] bg-red-500/[0.04] flex items-center gap-2">
          <AlertCircle className="size-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{voice.error}</p>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        {!sessionReady && (
          <div className="pt-4">
            <NameForm employeeName={employeeName} onStart={handleSessionStart} />
          </div>
        )}

        {sessionReady && (
          <>
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isFirst = i === 0 || messages[i - 1]?.role !== msg.role;
              return (
                <div key={i} className={"flex flex-col " + (isUser ? "items-end" : "items-start")}>
                  {isFirst && !isUser && (
                    <span className="text-[11px] font-medium text-zinc-500 mb-1 ml-0.5">{employeeName}</span>
                  )}
                  {isFirst && isUser && (
                    <span className="text-[11px] font-medium text-zinc-500 mb-1 mr-0.5">{customerName || "You"}</span>
                  )}
                  <div className="max-w-[78%] sm:max-w-[68%]">
                    <div className={
                      "px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap " +
                      (isUser
                        ? "bg-white/[0.07] text-zinc-100 border border-white/[0.08] rounded-xl rounded-tr-sm"
                        : "bg-white/[0.04] text-zinc-200 border border-white/[0.06] rounded-xl rounded-tl-sm")
                    }>
                      {msg.content}
                    </div>
                    <p className={"text-[10px] text-zinc-700 mt-1 " + (isUser ? "text-right" : "text-left")}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Task state */}
            {sending && taskLabel && (
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-medium text-zinc-500 mb-1 ml-0.5">{employeeName}</span>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl rounded-tl-sm">
                  <Loader2 className="size-3.5 text-zinc-600 animate-spin shrink-0" />
                  <span className="text-sm text-zinc-500">{taskLabel}</span>
                </div>
              </div>
            )}

            {/* Voice recording state */}
            {voice.isRecording && (
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-medium text-zinc-500 mb-1 mr-0.5">{customerName || "You"}</span>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.04] border border-[#00D18F]/20 rounded-xl rounded-tr-sm">
                  <span className="size-2 rounded-full bg-[#00D18F] animate-pulse" />
                  <span className="text-sm text-zinc-400">
                    {voiceTranscript || "Listening..."}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick chips */}
        {sessionReady && !userHasSent && !sending && (
          <div className="flex flex-wrap gap-2 pt-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="px-3.5 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Composer */}
      {sessionReady && (
        <footer className="px-4 py-3 border-t border-white/[0.06] shrink-0">
          <div className="flex items-end gap-2">
            {/* Voice button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={sending}
              title={voice.isRecording ? "Stop recording" : "Voice message"}
              className={
                "size-10 rounded-xl flex items-center justify-center transition-colors shrink-0 border " +
                (voice.isRecording
                  ? "bg-[#00D18F]/10 border-[#00D18F]/30 text-[#00D18F]"
                  : "bg-white/[0.04] border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.07]")
              }
            >
              {voice.isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder={"Message " + employeeName + "..."}
              disabled={sending || voice.isRecording}
              className="flex-1 min-h-[40px] max-h-[120px] bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.16] transition-colors resize-none disabled:opacity-40"
            />

            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending || voice.isRecording}
              className="size-10 rounded-xl bg-[#00D18F] text-black flex items-center justify-center hover:bg-[#00D18F]/90 disabled:opacity-30 transition-colors shrink-0"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-800 mt-2">Powered by Voxy</p>
        </footer>
      )}
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-zinc-600" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
