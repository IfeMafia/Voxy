"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCheck,
  Bot,
  User,
  Sparkles,
  RefreshCcw,
  ChevronLeft,
  Loader2,
  Volume2,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SUGGESTED_QUERIES = [
  { text: "Help me with a booking" },
  { text: "What are your hours?" },
  { text: "Where are you located?" },
  { text: "Speak with a human" },
];

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

  useEffect(() => {
    if (!conversationId) return;

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
      const tempId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: tempId,
        role: 'customer',
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
        setMessages(prev => prev.map(m => m.id === tempId ? {
          ...m,
          id: data.message.id,
          status: 'sent'
        } : m));

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
      <div className="flex flex-col items-center justify-center h-full space-y-6 bg-black rounded-[3rem] border border-white/5">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-[#00D18F]" />
          <div className="absolute inset-0 blur-xl bg-[#00D18F]/20 animate-pulse" />
        </div>
        <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Initializing VOXY AI</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 transition-all duration-700 animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-10 py-8 border-b border-white/[0.03] bg-black/80 backdrop-blur-3xl z-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D18F]/5 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/customer/chat')}
            className="rounded-full hover:bg-white/10 -ml-2 h-12 w-12 text-zinc-500"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Link 
            href={`/customer/business/${business?.id}`}
            className="flex items-center gap-5 group cursor-pointer"
          >
            <div className="relative">
              <div className="size-16 rounded-2xl bg-[#00D18F]/10 flex items-center justify-center text-[#00D18F] font-bold text-2xl border border-[#00D18F]/10 shadow-sm transition-transform duration-500">
                <Bot className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-black rounded-lg border border-white/5">
                <ShieldCheck className="w-4 h-4 text-[#00D18F]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-2xl text-white group-hover:text-[#00D18F] transition-colors tracking-tight leading-tight">
                  {business?.name || "Merchant"}
                </h2>
                <Badge className="bg-[#00D18F]/10 text-[#00D18F] border-none text-[8px] py-1 px-2.5 font-black tracking-widest uppercase rounded-lg">Concierge</Badge>
              </div>
              <p className="text-[10px] text-zinc-500 flex items-center gap-2 font-black uppercase tracking-widest mt-1 opacity-60">
                <span className="w-2 h-2 rounded-full bg-[#00D18F] shadow-[0_0_10px_#00D18F]"></span>
                Always Active
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white/5 text-zinc-500 h-11 w-11"><Volume2 className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white/5 text-zinc-500 h-11 w-11"><MoreVertical className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-black">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-700`}
          >
            <div className={`flex gap-5 max-w-[85%] sm:max-w-[75%] ${msg.role === "customer" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`size-10 rounded-xl flex-shrink-0 flex items-center justify-center border shadow-xl ${
                msg.role === "ai" || msg.role === "owner"
                  ? "bg-[#00D18F]/5 border-[#00D18F]/20 text-[#00D18F]"
                  : "bg-white/5 border-white/5 text-zinc-500"
              }`}>
                {msg.role === "ai" ? <Sparkles size={16} /> : <User size={16} />}
              </div>

              <div className="space-y-2">
                <div className={`px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed shadow-2xl transition-all duration-700 hover:scale-[1.01] ${
                  msg.role === "customer"
                    ? "bg-[#00D18F] text-black font-bold rounded-tr-[0.5rem] shadow-sm"
                    : "bg-white/[0.03] text-zinc-100 border border-white/[0.05] rounded-tl-[0.5rem]"
                }`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-3 px-2 ${msg.role === "customer" ? "flex-row-reverse" : ""}`}>
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">{msg.timestamp}</span>
                  {msg.role === "customer" && (
                    <CheckCheck size={12} className={msg.status === "read" ? "text-[#00D18F]" : "text-zinc-700"} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-500">
            <div className="flex gap-5">
               <div className="size-10 rounded-xl bg-[#00D18F]/5 border border-[#00D18F]/20 text-[#00D18F] flex items-center justify-center shadow-2xl">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div className="bg-white/[0.03] border border-white/[0.05] px-6 py-4 rounded-[2rem] rounded-tl-[0.5rem] flex items-center gap-2">
                <span className="size-1.5 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_10px_#00D18F]"></span>
                <span className="size-1.5 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_10px_#00D18F]"></span>
                <span className="size-1.5 bg-[#00D18F] rounded-full animate-bounce shadow-[0_0_10px_#00D18F]"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      <div className="px-6 md:px-10 py-10 bg-black border-t border-white/[0.03]">
        {messages.length < 4 && !isTyping && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-8">
            {SUGGESTED_QUERIES.map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedClick(query.text)}
                className="flex-shrink-0 flex items-center gap-3 px-6 py-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-[#00D18F] hover:text-black transition-all duration-500 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group"
              >
                <span className="size-1.5 bg-zinc-800 rounded-full group-hover:bg-black/20" />
                {query.text}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="relative group max-w-5xl mx-auto flex items-end gap-3">
          <div className="flex-1 flex items-end gap-2 bg-white/[0.02] border border-white/[0.05] rounded-[1.8rem] p-2 focus-within:ring-4 focus-within:ring-[#00D18F]/5 focus-within:border-[#00D18F]/30 transition-all duration-500 shadow-2xl">
            <Button type="button" variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-12 w-12 rounded-2xl">
              <Paperclip size={20} />
            </Button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Engage with ${business?.name || "Assistant"}...`}
              className="flex-1 bg-transparent border-none outline-none py-3.5 px-3 text-[16px] text-white placeholder:text-zinc-700 font-medium"
            />

            <Button type="button" variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-12 w-12 rounded-2xl">
              <Smile size={20} />
            </Button>
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-[#00D18F] text-black size-14 rounded-2xl font-bold hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-20 disabled:grayscale disabled:scale-100 flex items-center justify-center shadow-xl shadow-[#00D18F]/20 group"
          >
            <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-500" strokeWidth={3} />
          </button>
        </form>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
