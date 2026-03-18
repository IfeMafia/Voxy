"use client";

import React, { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import ConversationHeader from '@/components/conversation/ConversationHeader';
import MessageList from '@/components/conversation/MessageList';
import MessageInput from '@/components/conversation/MessageInput';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function ConversationPage({ params }) {
  const resolvedParams = use(params);
  const { customerSlug } = resolvedParams;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isCustomerOnline, setIsCustomerOnline] = useState(false);

  useEffect(() => {
    if (!customerSlug || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Conversations to find the one with this customerSlug
        const convRes = await fetch(`/api/conversations`);
        const convData = await convRes.json();
        
        if (convData.success) {
          const found = convData.conversations.find(c => c.customer_slug === customerSlug);
          if (found) {
            setConversation(found);
            
            // 2. Fetch Messages for this conversation
            const msgRes = await fetch(`/api/conversations/${found.id}/messages`);
            const msgData = await msgRes.json();
            
            if (msgData.success) {
              setMessages(msgData.messages || []);
            }
          } else {
            setConversation(false); // Trigger notFound
          }
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerSlug, user]);

  // Realtime subscription logic
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`chat:${conversation.id}`, {
        config: { broadcast: { self: false } }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          setMessages((prev) => {
            // If already exists, skip
            if (prev.find(m => m.id === payload.new.id)) return prev;

            // Check if there's a temporary message that matches this one
            const tempMatch = prev.find(m => 
              m.id?.toString().startsWith('temp-') && 
              m.content === payload.new.content && 
              m.sender_type === payload.new.sender_type
            );

            if (tempMatch) {
              // Replace it
              return prev.map(m => m.id === tempMatch.id ? payload.new : m);
            }

            return [...prev, payload.new];
          });
          if (payload.new.sender_type === 'ai') setIsAiTyping(false);
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        setIsAiTyping(payload.payload.isTyping);
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversation.id}`
        },
        (payload) => {
          setConversation(prev => ({ ...prev, ...payload.new }));
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.senderType === 'customer') {
          setIsAiTyping(payload.payload.isTyping); 
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = Object.values(state).flat().some(p => p.role === 'customer');
        setIsCustomerOnline(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), role: 'business' });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  const handleTyping = (isTyping) => {
    if (!conversation?.id) return;
    supabase.channel(`chat:${conversation.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { isTyping, senderType: 'owner' }
    });
  };

  const handleSendMessage = async (content) => {
    if (!user || !conversation?.id || !content.trim()) return;
    
    try {
      setSending(true);

      const tempId = 'temp-' + Date.now();
      const newMessage = {
        id: tempId,
        conversation_id: conversation.id,
        sender_type: 'owner',
        content: content,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);

      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, senderType: 'owner' })
      });
      
      const data = await res.json();

      if (data.success && data.message) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        throw new Error(data.error || 'Failed to send');
      }

      setConversation(prev => ({ ...prev, status: 'Active' }));

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => !m.id?.toString().startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Conversation">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-voxy-primary/20 border-t-voxy-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (conversation === false) {
    notFound();
  }

  return (
    <DashboardLayout title={`Chat with ${conversation?.customer_name || 'Customer'}`}>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0A0A0A]">
        <ConversationHeader 
          customerName={conversation?.customer_name}
          status={isCustomerOnline ? 'Active Now' : (conversation?.status || 'Offline')}
          startTime={conversation?.created_at}
        />
        
        <MessageList 
          messages={messages} 
          isTyping={isAiTyping} 
          typingAvatar={conversation?.customer_name?.charAt(0) || 'C'}
        />
        
        <MessageInput 
          onSendMessage={handleSendMessage} 
          onTyping={handleTyping}
          isLoading={sending} 
        />
      </div>
    </DashboardLayout>
  );
}
