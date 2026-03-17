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
  Loader2,
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

export default function ChatInterface({ business, userName }) {
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

  useEffect(() => {
    if (!business?.id) return;

    const initChat = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: business.id, customerName: userName })
        });
        const data = await res.json();
        
        if (data.success && data.id) {
          setConversationId(data.id);
          
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
            const welcome = `Welcome to ${business.name}! I'm your AI concierge. I can help you with bookings, product inquiries, or general support in any language. How can I assist you today?`;
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

    try {
      // Optimistic update for immediate feedback
      const tempId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: tempId,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      }]);

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, senderType: 'customer' })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, {
            id: data.message.id,
            role: 'customer',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
          }];
        });

        // Get Real AI Response
        setIsTyping(true);
        try {
          await fetch('/api/assistant/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId })
          });
        } catch (err) {
          console.error('AI error:', err);
        } finally {
          setIsTyping(false);
        }
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleSuggestedClick = (text) => {
    setInputValue(text);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 bg-white dark:bg-[#09090b] rounded-[3rem]">
        <Loader2 className="w-12 h-12 animate-spin text-[#00D18F]" />
        <p className="text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px]">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090b] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_48px_96px_-12px_rgba(0,0,0,0.12)] border border-zinc-100 dark:border-white/5 transition-all duration-700 animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-zinc-100 dark:border-white/5 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-3xl z-20">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/customer/chat')}
            className="rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 -ml-2 h-12 w-12"
          >
            <ChevronLeft className="w-6 h-6 text-zinc-400" />
          </Button>

          <Link 
            href={`/customer/business/${business?.id}`}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-all duration-500 ring-4 ring-zinc-50 dark:ring-white/5 group-hover:ring-[#00D18F]/20 flex items-center justify-center bg-gradient-to-tr from-[#00D18F]/20 to-[#00A370]/20">
                <Bot className="w-8 h-8 text-[#00D18F]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-[#00D18F] border-4 border-white dark:border-[#09090b] rounded-full shadow-lg"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl text-zinc-900 dark:text-white group-hover:text-[#00D18F] transition-colors tracking-tight italic">
                  {business?.name || "Merchant"}
                </h2>
                <Badge className="bg-[#00D18F]/10 text-[#00D18F] border-none text-[8px] py-0.5 px-2 font-black tracking-widest uppercase rounded-full">Live</Badge>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D18F] animate-pulse"></span>
                AI Assistant
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 h-11 w-11"><RefreshCcw className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 h-11 w-11"><MoreVertical className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-hide bg-[#fcfcfd] dark:bg-[#09090b] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px]">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`flex ${msg.role === "user" || msg.role === "customer" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
          >
            <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" || msg.role === "customer" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                msg.role === "ai"
                  ? "bg-[#00D18F] text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-white/5"
              }`}>
                {msg.role === "ai" ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <div className="group relative">
                <div className={`px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed shadow-sm transition-all duration-300 ${
                  msg.role === "user" || msg.role === "customer"
                    ? "bg-[#00D18F] text-white rounded-tr-none hover:shadow-xl hover:shadow-[#00D18F]/20"
                    : "bg-white dark:bg-[#18181b] border border-zinc-100 dark:border-white/5 text-zinc-800 dark:text-zinc-100 rounded-tl-none hover:shadow-xl hover:shadow-zinc-200/50"
                }`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-2 mt-2 px-2 ${msg.role === "user" || msg.role === "customer" ? "justify-end" : "justify-start"}`}>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{msg.timestamp}</span>
                  {(msg.role === "user" || msg.role === "customer") && (
                    <CheckCheck className={`w-3.5 h-3.5 ${msg.status === "read" ? "text-[#00D18F]" : "text-zinc-300"}`} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-4 max-w-[80%]">
              <div className="w-10 h-10 rounded-2xl bg-[#00D18F] text-white flex items-center justify-center shadow-lg shadow-[#00D18F]/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-white dark:bg-[#18181b] border border-zinc-100 dark:border-white/5 px-6 py-4 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-[#00D18F] rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      <div className="px-6 md:px-10 py-6 bg-white dark:bg-[#09090b] border-t border-zinc-100 dark:border-white/5">
        {messages.length < 3 && !isTyping && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
            {SUGGESTED_QUERIES.map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedClick(query.text)}
                className="flex-shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 hover:bg-[#00D18F] hover:text-white transition-all duration-300 text-[10px] font-black uppercase tracking-widest text-zinc-500"
              >
                {query.icon}
                {query.text}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="relative group">
          <div className="flex items-center gap-3 bg-[#f8f9fa] dark:bg-[#18181b] border border-zinc-200 dark:border-white/5 rounded-[2rem] p-2 focus-within:ring-8 focus-within:ring-[#00D18F]/5 focus-within:border-[#00D18F]/30 transition-all duration-500 shadow-inner">
            <Button type="button" variant="ghost" size="icon" className="hidden sm:flex text-zinc-400 hover:text-[#00D18F] h-12 w-12 rounded-2xl">
              <Paperclip className="w-6 h-6" />
            </Button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Communicate with ${business?.name || "AI"}...`}
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-[16px] text-zinc-900 dark:text-white placeholder:text-zinc-400 font-medium"
            />

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="hidden sm:flex text-zinc-400 hover:text-[#00D18F] h-12 w-12 rounded-2xl">
                <Smile className="w-6 h-6" />
              </Button>
              <div className="w-[1px] h-8 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>
              
              {!inputValue.trim() ? (
                <Button type="button" variant="ghost" size="icon" className="bg-[#00D18F]/10 text-[#00D18F] hover:bg-[#00D18F]/20 rounded-2xl h-12 w-12 shadow-sm">
                  <Mic className="w-6 h-6" />
                </Button>
              ) : (
                <Button type="submit" className="bg-[#00D18F] hover:bg-[#00A370] text-white rounded-2xl h-12 px-6 flex items-center justify-center shadow-xl shadow-[#00D18F]/30 active:scale-95 transition-all group/btn">
                  <span className="text-[10px] font-black uppercase tracking-widest mr-2 sm:block hidden">Send</span>
                  <Send className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
