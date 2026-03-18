"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ChatHeader from "@/components/conversation/ChatHeader";
import MessageList from "@/components/conversation/MessageList";
import MessageInput from "@/components/conversation/MessageInput";

export default function ChatInterface({ business, userName }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBusinessOnline, setIsBusinessOnline] = useState(false);
  const [typingUser, setTypingUser] = useState(null); // 'ai' or 'owner' or null
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isAiAllowed, setIsAiAllowed] = useState(true);
  const [isSending, setIsSending] = useState(false);

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
          setIsAiEnabled(data.ai_enabled ?? true);
          setIsAiAllowed(data.ai_allowed ?? true);
          
          const msgRes = await fetch(`/api/conversations/${data.id}/messages`);
          const msgData = await msgRes.json();
          if (msgData.success && msgData.messages.length > 0) {
            setMessages(msgData.messages.map(m => ({
              id: m.id,
              role: m.sender_type,
              content: m.content,
              created_at: m.created_at,
              status: 'read'
            })));
          } else {
            const welcome = `Welcome to ${business.name}! I'm VOXY AI. I can help you with bookings, product inquiries, or general support in any language. How can I assist you today?`;
            setMessages([{
              id: 'welcome',
              role: 'ai',
              content: welcome,
              created_at: new Date().toISOString(),
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
  }, [business?.id, userName]);

  const handleToggleAi = async (checked) => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_enabled: checked })
      });
      if (res.ok) {
        setIsAiEnabled(checked);
      }
    } catch (err) {
      console.error('Toggle AI error:', err);
    }
  };

  const handleClearChat = async () => {
    if (!conversationId || !confirm('Are you sure you want to clear your chat history?')) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/clear`, {
        method: 'POST'
      });
      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Clear chat error:', err);
    }
  };

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
                created_at: newMessage.created_at,
                status: 'read'
              } : m);
            }

            return [...prev, {
              id: newMessage.id,
              role: newMessage.sender_type,
              content: newMessage.content,
              created_at: newMessage.created_at,
              status: 'read',
              isNew: newMessage.sender_type !== 'customer'
            }];
          });
          if (newMessage.sender_type !== 'customer') {
            setTypingUser(null);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.new.ai_enabled !== undefined) {
            setIsAiEnabled(payload.new.ai_enabled);
          }
          if (payload.new.ai_allowed !== undefined) {
            setIsAiAllowed(payload.new.ai_allowed);
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

  const handleSendMessage = async (text) => {
    if (!text || !conversationId || isSending) return;
    
    setIsSending(true);
    handleTyping(false);

    try {
      const tempId = 'temp-' + Date.now();
      setMessages(prev => [...prev, {
        id: tempId,
        role: 'customer',
        content: text,
        created_at: new Date().toISOString(),
        status: 'read'
      }]);

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: text, 
          senderType: 'customer',
          setStatus: business?.use_ai_reply === false ? 'Needs Owner Response' : undefined
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? {
          ...m,
          id: data.message.id,
          status: 'sent'
        } : m));

        if (isAiEnabled) {
          setTypingUser('ai');
          try {
            await fetch('/api/assistant/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId })
            });
          } catch (aiErr) {
            console.error('[AI-TRIGGER] Error:', aiErr);
            setTypingUser(null);
          }
        }
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages(prev => prev.filter(m => !m.id?.toString().startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
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
      <ChatHeader 
        name={business?.name}
        status={isBusinessOnline ? 'Online' : 'Away'}
        icon={business?.logo_url || "/favicon.jpg"}
        aiEnabled={isAiEnabled}
        aiLabel="VOXY AI"
        onToggleAi={handleToggleAi}
        onClear={handleClearChat}
        showBack={true}
        backUrl="/customer/chat"
      />

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <MessageList 
          messages={messages.map(m => ({
            ...m,
            sender_type: m.role
          }))} 
          typingUser={typingUser}
          businessName={business?.name}
          isCustomerView={true}
          conversationId={conversationId}
        />

      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        isLoading={isSending}
        placeholder={`Engage with ${business?.name || "Assistant"}...`}
      />
    </div>
  );
}
