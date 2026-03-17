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
  const [isBusinessOnline, setIsBusinessOnline] = useState(false);
  const [typingUser, setTypingUser] = useState(null); // 'ai' or 'owner' or null
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
            const welcome = `Welcome to ${business.name}! I'm VOXY AI. I can help you with bookings, product inquiries, or general support in any language. How can I assist you today?`;
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
      .channel(`chat:${conversationId}`, {
        config: {
          broadcast: { self: false }
        }
      })
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
            
            const tempMatch = prev.find(m => 
              m.id?.toString().startsWith('temp-') && 
              m.content === newMessage.content && 
              m.role === newMessage.sender_type
            );

            if (tempMatch) {
              return prev.map(m => m.id === tempMatch.id ? {
                id: newMessage.id,
                role: newMessage.sender_type,
                content: newMessage.content,
                timestamp: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
              } : m);
            }

            return [...prev, {
              id: newMessage.id,
              role: newMessage.sender_type,
              content: newMessage.content,
              timestamp: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read'
            }];
          });
          if (newMessage.sender_type !== 'customer') {
            setTypingUser(null);
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.isTyping) {
          setTypingUser(payload.payload.senderType);
        } else {
          setTypingUser(null);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = Object.values(state).flat().some(p => p.role === 'business');
        setIsBusinessOnline(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), role: 'customer' });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleTyping = (isTyping) => {
    if (!conversationId) return;
    supabase.channel(`chat:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { isTyping, senderType: 'customer' }
    });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !conversationId) return;

    const text = inputValue;
    setInputValue("");
    handleTyping(false);

    // Get the channel to broadcast
    const channel = supabase.channel(`chat:${conversationId}`);

    try {
      const tempId = 'temp-' + Date.now();
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

        setTypingUser('ai');
        // Broadcast AI is typing
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { isTyping: true, senderType: 'customer' } // Broadcast to others that AI (triggered by customer) might be processing
        });

        try {
          const aiRes = await fetch('/api/assistant/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId })
          });
          const aiData = await aiRes.json();
          
          if (aiData.success && aiData.message) {
            // Add the AI message directly if it's not already there from Realtime
            const aiMsg = aiData.message;
            setMessages(prev => {
              if (prev.find(m => m.id === aiMsg.id)) return prev;
              
              // Remove temp AI typing if any
              setTypingUser(null);

              return [...prev, {
                id: aiMsg.id,
                role: aiMsg.sender_type,
                content: aiMsg.content,
                timestamp: new Date(aiMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
              }];
            });
          }
        } catch (err) {
          console.error('AI error:', err);
        } finally {
          setTypingUser(null);
          // Broadcast AI stopped typing
          channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { isTyping: false, senderType: 'customer' }
          });
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
    <div className="flex flex-col h-full bg-black rounded-3xl md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 transition-all duration-700 animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-10 py-4 sm:py-8 border-b border-white/[0.03] bg-black/80 backdrop-blur-3xl z-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D18F]/5 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-3 sm:gap-6 relative z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/customer/chat')}
            className="rounded-full hover:bg-white/10 -ml-2 h-10 w-10 sm:h-12 sm:w-12 text-zinc-500"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>

          <Link 
            href={`/customer/business/${business?.id}`}
            className="flex items-center gap-3 sm:gap-5 group cursor-pointer"
          >
            <div className="relative">
              <div className="size-12 sm:size-16 rounded-xl sm:rounded-2xl bg-[#00D18F]/10 flex items-center justify-center border border-[#00D18F]/10 shadow-sm transition-transform duration-500 overflow-hidden">
                <img src={business?.logo_url || "/favicon.jpg"} alt={business?.name || "Voxy AI"} className="size-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 bg-black rounded-lg border border-white/5">
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-[#00D18F]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg sm:text-2xl text-white group-hover:text-[#00D18F] transition-colors tracking-tight leading-tight truncate max-w-[120px] sm:max-w-none">
                  {business?.name || "Merchant"}
                </h2>
              </div>
              <p className="text-[8px] sm:text-[10px] text-zinc-500 flex items-center gap-1.5 sm:gap-2 font-black uppercase tracking-widest mt-0.5 sm:mt-1 opacity-60">
                <span className={`w-1.5 h-1.5 rounded-full ${isBusinessOnline ? 'bg-[#00D18F] shadow-[0_0_8px_#00D18F]' : 'bg-zinc-700'}`}></span>
                {isBusinessOnline ? 'Online' : 'Away'}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 relative z-10">
          <Button variant="ghost" size="icon" className="rounded-xl sm:rounded-2xl hover:bg-white/5 text-zinc-500 h-9 w-9 sm:h-11 sm:w-11"><Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-xl sm:rounded-2xl hover:bg-white/5 text-zinc-500 h-9 w-9 sm:h-11 sm:w-11"><MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 bg-black">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-700`}
          >
            <div className={`flex gap-3 sm:gap-5 max-w-[90%] sm:max-w-[75%] ${msg.role === "customer" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`size-8 sm:size-10 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center border shadow-xl overflow-hidden ${
                msg.role === "ai" || msg.role === "owner"
                  ? "bg-[#00D18F]/5 border-[#00D18F]/20 text-[#00D18F]"
                  : "bg-white/5 border-white/5 text-zinc-500"
              }`}>
                {msg.role === "ai" ? (
                  <img src="/favicon.jpg" alt="Voxy AI" className="size-full object-cover" />
                ) : msg.role === "owner" ? (
                  <img src={business?.logo_url || "/favicon.jpg"} alt={business?.name || "Merchant"} className="size-full object-cover" />
                ) : (
                  <User className="size-3.5 sm:size-4" />
                )}
              </div>

              <div className={`flex flex-col space-y-1 ${msg.role === "customer" ? "items-end" : "items-start"}`}>
                <div className={`flex items-center gap-3 px-1 mb-0.5 ${msg.role === "customer" ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    {msg.role === 'customer' ? (userName || 'You') : msg.role === 'owner' ? business?.name || 'Owner' : 'VOXY AI'}
                  </span>
                </div>
                <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-[2rem] text-[14px] sm:text-[15px] leading-relaxed shadow-2xl transition-all duration-700 hover:scale-[1.01] ${
                  msg.role === "customer"
                    ? "bg-[#00D18F] text-black font-bold rounded-tr-[0.4rem] sm:rounded-tr-[0.5rem] shadow-sm"
                    : msg.role === "owner"
                      ? "bg-[#00D18F]/10 text-white border border-[#00D18F]/30 rounded-tl-[0.4rem] sm:rounded-tl-[0.5rem]"
                      : "bg-white/[0.03] text-zinc-100 border border-white/[0.05] rounded-tl-[0.4rem] sm:rounded-tl-[0.5rem]"
                }`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-2 px-1 ${msg.role === "customer" ? "flex-row-reverse" : ""}`}>
                  <span className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">{msg.timestamp}</span>
                  {msg.role === "customer" && (
                    <CheckCheck size={10} className={msg.status === "read" ? "text-[#00D18F]" : "text-zinc-700"} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {typingUser && (
          <div className="flex justify-start animate-in fade-in duration-500">
            <div className="flex gap-3 sm:gap-5">
               <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-[#00D18F]/5 border border-[#00D18F]/20 text-[#00D18F] flex items-center justify-center shadow-2xl overflow-hidden">
                {typingUser === 'ai' ? (
                  <img src="/favicon.jpg" alt="Voxy AI" className="size-full object-cover" />
                ) : typingUser === 'owner' ? (
                  <img src={business?.logo_url || "/favicon.jpg"} alt={business?.name || "Merchant"} className="size-full object-cover" />
                ) : (
                  <User className="size-3.5 sm:size-4" />
                )}
              </div>
              <div className="bg-white/[0.03] border border-white/[0.05] px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-[2rem] rounded-tl-[0.4rem] sm:rounded-tl-[0.5rem] flex items-center gap-1.5 sm:gap-2">
                <span className="size-1 sm:size-1.5 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_8px_#00D18F]"></span>
                <span className="size-1 sm:size-1.5 bg-[#00D18F] rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_8px_#00D18F]"></span>
                <span className="size-1 sm:size-1.5 bg-[#00D18F] rounded-full animate-bounce shadow-[0_0_8px_#00D18F]"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-10 py-6 sm:py-10 bg-black border-t border-white/[0.03]">
        {messages.length < 5 && !isTyping && (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-6 sm:pb-8 -mx-2 px-2">
            {SUGGESTED_QUERIES.map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedClick(query.text)}
                className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-[#00D18F] hover:text-black transition-all duration-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-zinc-500 group"
              >
                <span className="size-1 sm:size-1.5 bg-zinc-800 rounded-full group-hover:bg-black/20" />
                {query.text}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="relative group max-w-5xl mx-auto flex items-end gap-2 sm:gap-3">
          <div className="flex-1 flex items-end gap-1 sm:gap-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl sm:rounded-[1.8rem] p-1.5 sm:p-2 focus-within:ring-4 focus-within:ring-[#00D18F]/5 focus-within:border-[#00D18F]/30 transition-all duration-500 shadow-2xl">
            <Button type="button" variant="ghost" size="icon" className="hidden sm:flex text-zinc-500 hover:text-white h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl">
              <Paperclip className="size-[18px] sm:size-[20px]" />
            </Button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                handleTyping(e.target.value.length > 0);
              }}
              onBlur={() => handleTyping(false)}
              placeholder={window?.innerWidth < 640 ? "Message..." : `Engage with ${business?.name || "Assistant"}...`}
              className="flex-1 bg-transparent border-none outline-none py-2.5 sm:py-3.5 px-3 text-[15px] sm:text-[16px] text-white placeholder:text-zinc-700 font-medium"
            />

            <Button type="button" variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl">
              <Smile className="size-[18px] sm:size-[20px]" />
            </Button>
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-[#00D18F] text-black size-12 sm:size-14 rounded-2xl font-bold hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-20 disabled:grayscale disabled:scale-100 flex items-center justify-center shadow-xl shadow-[#00D18F]/20 group"
          >
            <Send className="size-[18px] sm:size-[20px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-500" strokeWidth={3} />
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
