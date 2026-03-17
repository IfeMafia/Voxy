"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import ConversationHeader from '@/components/conversation/ConversationHeader';
import MessageList from '@/components/conversation/MessageList';
import MessageInput from '@/components/conversation/MessageInput';
import { Loader2 } from 'lucide-react';

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Conversation Details
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (convError) throw convError;
        setConversation(convData);

        // 2. Fetch Messages via API route
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        const data = await res.json();
        
        if (data.success) {
          setMessages(data.messages || []);
        } else {
          console.error('Failed to fetch messages:', data.error);
        }

      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 3. Subscribe to Realtime Updates (May not work without auth token, but leaving for future)
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => {
            // Check if we already have this message (optimistic UI)
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          
          if (payload.new.sender_type === 'ai' || payload.new.sender_type === 'customer') {
             // For customer messages, we might want to update status
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
          setConversation(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSendMessage = async (content) => {
    if (!user || !conversationId || !content.trim()) return;
    
    try {
      setSending(true);

      // Optimistic Update
      const tempId = 'temp-' + Date.now();
      const newMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_type: 'owner',
        content: content,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);

      // 1. Insert message via API
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, senderType: 'owner' })
      });
      
      const data = await res.json();

      if (data.success && data.message) {
        // Swap temp ID with actual DB ID
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        throw new Error(data.error || 'Failed to send');
      }

      // 2. Update conversation status locally (API already updates updated_at)
      // If we want status to change to owner replied, the API route currently doesn't do that,
      // but conceptually we could.
      setConversation(prev => ({ ...prev, status: 'Active' }));

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.id?.toString().startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Conversation">
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!conversation) {
    return (
      <DashboardLayout title="Error">
        <div className="flex flex-col items-center justify-center h-[70vh] text-zinc-500">
          <h2 className="text-xl font-bold text-white mb-2">Conversation not found</h2>
          <p>The conversation may have been deleted or you don't have access.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Chat with ${conversation.customer_name || 'Customer'}`}>
      <div className="flex flex-col h-[calc(100vh-140px)] bg-black rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <ConversationHeader 
          customerName={conversation.customer_name}
          status={conversation.status}
          startTime={conversation.created_at}
        />
        
        <MessageList messages={messages} />
        
        <MessageInput onSendMessage={handleSendMessage} isLoading={sending} />
      </div>
    </DashboardLayout>
  );
}
