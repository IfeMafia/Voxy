"use client";

import React, { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/components/conversation/ChatHeader';
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
        
        const convRes = await fetch(`/api/conversations`);
        const convData = await convRes.json();
        
        if (convData.success) {
          const found = convData.conversations.find(c => c.customer_slug === customerSlug);
          if (found) {
            setConversation(found);
            
            const msgRes = await fetch(`/api/conversations/${found.id}/messages`);
            const msgData = await msgRes.json();
            
            if (msgData.success) {
              setMessages(msgData.messages || []);
            }
          } else {
            setConversation(false);
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
            if (prev.find(m => m.id === payload.new.id)) return prev;

            const tempMatch = prev.find(m => 
              m.id?.toString().startsWith('temp-') && 
              m.content === payload.new.content && 
              m.sender_type === payload.new.sender_type
            );

            if (tempMatch) {
              return prev.map(m => m.id === tempMatch.id ? payload.new : m);
            }

            return [...prev, { ...payload.new, isNew: payload.new.sender_type !== 'owner' }];
          });
          if (payload.new.sender_type !== 'owner') setIsAiTyping(false);
        }
      )
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

  const handleTypeComplete = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isNew: false } : m));
  };
  
  const handleDelete = (messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleToggleAi = async (checked) => {
    if (!conversation?.id) return;
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_allowed: checked })
      });
      if (res.ok) {
        setConversation(prev => ({ ...prev, ai_allowed: checked }));
      }
    } catch (err) {
      console.error('Toggle AI error:', err);
    }
  };

  const handleClearChat = async () => {
    if (!conversation?.id || !confirm('Are you sure you want to clear this chat history?')) return;
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/clear`, {
        method: 'POST'
      });
      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Clear chat error:', err);
    }
  };

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

  const handleFileUpload = async (file) => {
    if (!conversation?.id || sending) return;

    setSending(true);
    const tempId = 'temp-' + Date.now();
    const previewUrl = URL.createObjectURL(file);

    setMessages(prev => [...prev, {
      id: tempId,
      conversation_id: conversation.id,
      sender_type: 'owner',
      content: `[img]${previewUrl}`,
      created_at: new Date().toISOString()
    }]);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `[img]${publicUrl}`,
          senderType: 'owner'
        })
      });
      const data = await res.json();

      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? {
          ...data.message,
          content: `[img]${publicUrl}`
        } : m));
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleAudioReady = async (audioBlob) => {
    if (!conversation?.id || sending) return;
    
    try {
      setSending(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('conversationId', conversation.id);
      formData.append('role', 'owner'); // Identify sender as owner to skip AI logic

      const res = await fetch('/api/voice', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        // The API already saved the 'owner' type message to DB
        // We just let the real-time subscription pick it up or push it manually
        // For better UX, we can just fetch or rely on subscription
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Business Voice Error:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Conversation">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#00D18F]/20 border-t-[#00D18F] rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (conversation === false) {
    notFound();
  }

  return (
    <DashboardLayout title={`Chat with ${conversation?.customer_name || 'Customer'}`}>
      <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100vh-64px)] bg-white dark:bg-[#0A0A0A] transition-colors duration-500">
        <ChatHeader 
          name={conversation?.customer_name}
          status={isCustomerOnline ? 'Active Now' : (conversation?.status || 'Offline')}
          aiEnabled={conversation?.ai_allowed ?? true}
          aiLabel="VOXY AI"
          onToggleAi={handleToggleAi}
          onClear={handleClearChat}
        />
        
        <MessageList 
          messages={messages} 
          typingUser={isAiTyping ? 'customer' : null}
          typingAvatar={conversation?.customer_name?.charAt(0) || 'C'}
          businessName={conversation?.business_name}
          businessLogo={conversation?.business_logo_url}
          onTypeComplete={handleTypeComplete}
          conversationId={conversation?.id}
          onDelete={handleDelete}
          isCustomerView={false}
        />
        
        <MessageInput 
          onSendMessage={handleSendMessage} 
          onAudioReady={handleAudioReady}
          onTyping={handleTyping}
          onFileUpload={handleFileUpload}
          isLoading={sending} 
        />
      </div>
    </DashboardLayout>
  );
}
