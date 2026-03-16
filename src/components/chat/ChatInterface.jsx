"use client";

import React, { useState, useEffect, useRef } from "react";

import {
  Send,
  Mic,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCheck,
  Clock,
  Bot,
  User,
  Sparkles,
  RefreshCcw,
  Languages,
  Calendar,
  Utensils,
  MapPin,
  Info,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SUGGESTED_QUERIES = [
  { icon: <Calendar className="w-4 h-4" />, text: "Book a table for tonight" },
  {
    icon: <Utensils className="w-4 h-4" />,
    text: "What's on the chef's special menu?",
  },
  {
    icon: <MapPin className="w-4 h-4" />,
    text: "Where is the nearest parking?",
  },
  { icon: <Languages className="w-4 h-4" />, text: "Can you speak Spanish?" },
];

import { supabase } from "@/lib/supabase";

export default function ChatInterface({ business }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 1. Initial Data Fetching & Conversation Setup
  useEffect(() => {
    if (!business?.id) return;

    const initChat = async () => {
      try {
        setLoading(true);
        // Try to find or create conversation
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: business.id })
        });
        const data = await res.json();
        
        if (data.success && data.id) {
          setConversationId(data.id);
          
          // Fetch existing messages
          const msgRes = await fetch(`/api/conversations/${data.id}/messages`);
          const msgData = await msgRes.json();
          if (msgData.success && msgData.messages.length > 0) {
            setMessages(msgData.messages.map(m => ({
              id: m.id,
              role: m.sender_type,
              content: m.content,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read'
            })));
          } else {
            // Send initial welcome message if new
            const welcome = `Welcome to ${business.name}! I'm your AI concierge. How can I assist you today?`;
            setMessages([{
              id: 'welcome',
              role: 'ai',
              content: welcome,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read'
            }]);
          }
        }
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [business?.id]);

  // 1.5 Realtime Subscription
  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to new messages for this conversation
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new;
          
          // Check if message is already in state to avoid duplicates (e.g. from own optimistic update)
          setMessages(prev => {
            if (prev.find(m => m.id === newMessage.id)) return prev;
            
            return [...prev, {
              id: newMessage.id,
              role: newMessage.sender_type,
              content: newMessage.content,
              timestamp: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read'
            }];
          });
          
          // Stop typing indicator if AI/Owner replied
          if (newMessage.sender_type !== 'customer') {
            setIsTyping(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !conversationId) return;

    const text = inputValue;
    setInputValue("");

    // 2. Save Customer Message
    try {
      // Optimistic update (optional, but good for UX)
      // Actually, Realtime will catch it, but if we want instant we can do it locally too.
      // But the Realtime payload will contain the DB-generated ID.

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, senderType: 'customer' })
      });
      const data = await res.json();
      
      // Note: Realtime handles updating the state for this message as well!
      // So we don't strictly need setMessages here if subscription works.
      
      // 3. Simulate AI Response (Should be real later)
      setIsTyping(true);
      setTimeout(async () => {
        const aiText = `I've received your inquiry about ${business.name}. I'll help you with that right away! (This is a live AI response)`;
        
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: aiText, senderType: 'ai' })
        });
        // Realtime handles state update
      }, 1000);

    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleSuggestedClick = (text) => {
    setInputValue(text);
  };

  return (
    <div className="flex flex-col h-full max-h-[850px] bg-white dark:bg-[#09090b] rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-zinc-200 dark:border-white/5 transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 dark:border-white/5 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-2xl z-20">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/customer/chat')}
            className="rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 -ml-2"
          >
            <ChevronLeft className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
          </Button>

          <Link 
            href={`/customer/business/${business?.id}`}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-all duration-500 ring-4 ring-zinc-50 dark:ring-white/5 group-hover:ring-[#00D18F]/20">
                {business?.image ? (
                  <img src={business.image} alt={business.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#00D18F] to-[#00A370] flex items-center justify-center text-white">
                    <Bot className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-[#00D18F] border-4 border-white dark:border-[#09090b] rounded-full shadow-lg"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl text-zinc-900 dark:text-white group-hover:text-[#00D18F] transition-colors tracking-tight">
                  {business?.name || "Luxe AI"}
                </h2>
                <Badge
                  className="bg-[#00D18F]/10 text-[#00D18F] border-none text-[10px] py-0.5 px-2.5 font-black tracking-widest uppercase rounded-full"
                >
                  Live
                </Badge>
              </div>
              <p className="text-[xs] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00D18F] animate-pulse"></span>
                AI Assistant • {business?.category || "Concierge"}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-[1.25rem] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
          >
            <RefreshCcw className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-[1.25rem] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[#fcfcfd] dark:bg-[#09090b] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:32px_32px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out`}
          >
            <div
              className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-11 h-11 rounded-[1.25rem] flex-shrink-0 flex items-center justify-center shadow-xl ${
                  msg.role === "ai"
                    ? "bg-[#00D18F] text-white shadow-[#00D18F]/20"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-white/5 shadow-zinc-200/50"
                }`}
              >
                {msg.role === "ai" ? (
                  <Sparkles className="w-5 h-5 fill-white/20" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>

              <div className="group relative">
                <div
                  className={`px-6 py-4 rounded-[2rem] text-[16px] leading-[1.6] shadow-xl transition-all duration-500 ${
                    msg.role === "user"
                      ? "bg-[#00D18F] text-white rounded-tr-none shadow-[#00D18F]/20 hover:shadow-[#00D18F]/30"
                      : "bg-white dark:bg-[#18181b] border border-zinc-100 dark:border-white/5 text-zinc-800 dark:text-zinc-100 rounded-tl-none hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-black/40"
                  }`}
                >
                  {msg.content}
                </div>
                <div
                  className={`flex items-center gap-2 mt-2.5 px-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                    {msg.timestamp}
                  </span>
                  {msg.role === "user" && (
                    <CheckCheck
                      className={`w-4 h-4 ${msg.status === "read" ? "text-[#00D18F]" : "text-zinc-300 dark:text-zinc-700"}`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-500">
            <div className="flex gap-4 max-w-[80%]">
              <div className="w-11 h-11 rounded-[1.25rem] bg-[#00D18F] text-white flex items-center justify-center shadow-xl shadow-[#00D18F]/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-white dark:bg-[#18181b] border border-zinc-100 dark:border-white/5 px-6 py-4 rounded-[2rem] rounded-tl-none shadow-xl flex items-center gap-2.5">
                <span className="w-2 h-2 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-[#00D18F] rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries */}
      {messages.length < 3 && !isTyping && (
        <div className="px-8 py-5 overflow-x-auto no-scrollbar flex items-center gap-3 bg-transparent">
          {SUGGESTED_QUERIES.map((query, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestedClick(query.text)}
              className="flex-shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-full border border-zinc-200 dark:border-white/5 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl hover:bg-[#00D18F] hover:text-white dark:hover:bg-[#00D18F] hover:border-[#00D18F] transition-all duration-300 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 shadow-sm"
            >
              <span className="opacity-70 group-hover:opacity-100">{query.icon}</span>
              {query.text}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-8 pb-10 bg-white dark:bg-[#09090b] border-t border-zinc-100 dark:border-white/5 transition-all duration-500">
        <form
          onSubmit={handleSendMessage}
          className="relative group bg-[#f8f9fa] dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-[2.5rem] focus-within:ring-[8px] focus-within:ring-[#00D18F]/5 focus-within:border-[#00D18F]/30 focus-within:bg-white dark:focus-within:bg-[#18181b] transition-all duration-500 shadow-inner"
        >
          <div className="flex items-center px-5 py-4 min-h-[72px]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-[#00D18F] dark:hover:text-[#00D18F] transition-all rounded-[1.25rem] hover:bg-white dark:hover:bg-zinc-800"
            >
              <Paperclip className="w-6 h-6" />
            </Button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message ${business?.name || "AI"}...`}
              className="flex-1 bg-transparent border-none outline-none px-6 py-2 text-[17px] text-zinc-900 dark:text-white placeholder:text-zinc-400 font-medium"
            />

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex text-zinc-400 hover:text-[#00D18F] dark:hover:text-[#00D18F] transition-all rounded-[1.25rem] hover:bg-white dark:hover:bg-zinc-800"
              >
                <Smile className="w-6 h-6" />
              </Button>
              <div className="w-[1.5px] h-8 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>
              
              {!inputValue.trim() ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="bg-[#00D18F]/10 text-[#00D18F] hover:bg-[#00D18F]/20 rounded-[1.25rem] size-12 shadow-sm animate-in zoom-in-50 duration-300"
                >
                  <Mic className="w-6 h-6" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-[#00D18F] hover:bg-[#00A370] text-white rounded-[1.25rem] size-12 flex items-center justify-center shadow-2xl shadow-[#00D18F]/40 active:scale-90 transition-all duration-300 animate-in slide-in-from-right-2"
                >
                  <Send className="w-5 h-5 fill-white" />
                </Button>
              )}
            </div>
          </div>
        </form>
        
        <div className="mt-6 flex items-center justify-between px-4">
          <div className="flex items-center gap-3 opacity-30 group-hover:opacity-50 transition-opacity">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em]">
              Voxy Intelligence Agent
            </p>
          </div>
          <div className="flex items-center gap-2 opacity-20">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em]">
              E2E Encrypted
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
