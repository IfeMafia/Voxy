"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Mic, Square } from 'lucide-react';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from "@/lib/supabase";
import ChatHeader from "@/components/conversation/ChatHeader";
import MessageList from "@/components/conversation/MessageList";
import MessageInput from "@/components/conversation/MessageInput";

export default function ChatInterface({ business, userName }) {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBusinessOnline, setIsBusinessOnline] = useState(false);
  const [typingUser, setTypingUser] = useState(null); 
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(null); 
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [playingAiAudioId, setPlayingAiAudioId] = useState(null);
  
  // High-level Audio & Request Management
  const { play, stop, isPlaying, getNewAbortSignal } = useAudioManager();
  const { user } = useAuth();

  // Unified voice indicator state
  useEffect(() => {
    if (isPlaying) {
      setVoiceStatus('speaking');
    } else if (voiceStatus === 'speaking') {
      setVoiceStatus(null);
    }
  }, [isPlaying]);

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
            const welcome = `Hi! I'm ${business.name}'s AI assistant. I can help you with bookings, product inquiries, or support. How can I assist you today?`;
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
  }, [business?.id, user?.id]);

  const handleToggleAi = async (checked) => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_enabled: checked })
      });
      if (res.ok) setIsAiEnabled(checked);
    } catch (err) {
      console.error('Toggle AI error:', err);
    }
  };

  const handleClearChat = async () => {
    if (!conversationId || !confirm('Clear chat history?')) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/clear`, { method: 'POST' });
      if (res.ok) setMessages([]);
    } catch (err) {
      console.error('Clear chat error:', err);
    }
  };

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const msg = payload.new;
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          
          const tempMatch = prev.find(m => 
            m.id?.toString().startsWith('temp-') && 
            m.sender_type === payload.new.sender_type &&
            (m.content === payload.new.content || 
             (m.content.startsWith('[img]') && payload.new.content.startsWith('[img]')))
          );

          if (tempMatch) {
            return prev.map(m => m.id === tempMatch.id ? payload.new : m);
          }

          return [...prev, {
            id: msg.id,
            role: msg.sender_type,
            content: msg.content,
            created_at: msg.created_at,
            status: 'read',
            isNew: msg.sender_type !== 'customer'
          }];
        });
        if (msg.sender_type !== 'customer') setTypingUser(null);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        setTypingUser(payload.payload.isTyping ? payload.payload.senderType : null);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setIsBusinessOnline(Object.values(state).flat().some(p => p.role === 'business'));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), role: 'customer' });
        }
      });

    return () => { supabase.removeChannel(channel); };
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
        sender_type: 'customer',
        content: text, 
        created_at: new Date().toISOString(), 
        status: 'read' 
      }]);

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, senderType: 'customer' })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.message.id, status: 'sent' } : m));
        if (isAiEnabled) {
          setTypingUser('ai');
          await fetch('/api/assistant/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId }) });
        }
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages(prev => prev.filter(m => !m.id?.toString().startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };

  const handleAudioReady = async (audioBlob) => {
    if (!conversationId) return;
    
    // Priority Control: Stop playback and cancel any pending requests
    stop();
    const signal = getNewAbortSignal();

    setIsSending(true);
    setVoiceStatus('processing');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('conversationId', conversationId);
      formData.append('role', 'customer');

      const res = await fetch('/api/voice', { 
        method: 'POST', 
        body: formData,
        signal // Link request to abort controller
      });
      
      const data = await res.json();
      setIsSending(false);

      if (data.success) {
        // Handle Customer Transcript first
        setMessages(prev => {
          if (prev.find(m => m.content === data.text && (m.sender_type === 'customer' || m.role === 'customer'))) return prev;
          return [...prev, {
            id: 'temp-u-' + Date.now(),
            role: 'customer',
            sender_type: 'customer',
            content: data.text,
            created_at: new Date().toISOString(),
            status: 'sent'
          }];
        }); 
        
        // Optimistically add the AI response
        const aiMsgId = 'temp-ai-' + Date.now();
        const aiMsg = {
          id: aiMsgId,
          role: 'ai',
          sender_type: 'ai',
          content: data.aiText,
          isNew: true,
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => {
          const isDuplicate = prev.some(m => 
            (m.id === aiMsgId) || 
            (m.content === data.aiText && (m.role === 'ai' || m.sender_type === 'ai'))
          );
          if (isDuplicate) return prev;
          return [...prev, aiMsg];
        }); 

        if (data.audioUrl) {
          play(data.audioUrl);
          
          const cleanupAudio = async (url) => {
            try {
              await fetch('/api/voice', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
              });
            } catch (err) {
              console.warn('Silent cleanup failed:', err);
            }
          };

          // Schedule cleanup for after playback (give some margin)
          setTimeout(() => cleanupAudio(data.audioUrl), 30000); 
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[VOICE] Pending request canceled by user interaction');
      } else {
        console.error('Voice Route Error:', error);
        setIsSending(false);
        setVoiceStatus(null);
      }
    }
  };

  const handlePlayAiAudio = async (text, msgId) => {
    if (!text || playingAiAudioId === msgId) return;
    
    try {
      setPlayingAiAudioId(msgId);
      
      // Stop current playback from manager
      stop();

      const res = await fetch('/api/voice', {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          fd.append('aiResponseText', text);
          fd.append('onlyTTS', 'true');
          return fd;
        })()
      });
      
      const data = await res.json();
      if (data.success && data.audioUrl) {
        play(data.audioUrl);
        
        // Manual cleanup after estimated playback duration
        setTimeout(async () => {
          try {
            await fetch('/api/voice', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: data.audioUrl })
            });
          } catch (e) {}
        }, 30000);
      }
    } catch (error) {
      console.error('TTS Play Error:', error);
    } finally {
      setPlayingAiAudioId(null);
    }
  };

  const handleFileUpload = async (file) => {
    if (!conversationId || isSending) return;
    setIsSending(true);
    const tempId = 'temp-' + Date.now();
    const previewUrl = URL.createObjectURL(file);

    setMessages(prev => [...prev, { id: tempId, role: 'customer', content: `[img]${previewUrl}`, created_at: new Date().toISOString(), status: 'sending' }]);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `[img]${publicUrl}`, senderType: 'customer' })
      });
      const data = await res.json();

      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.message.id, content: `[img]${publicUrl}`, status: 'sent' } : m));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]/50" />
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Connecting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black md:rounded-[2rem] overflow-hidden border-x border-zinc-200 dark:border-white/5 w-full max-w-4xl mx-auto shadow-2xl relative transition-colors duration-500">
      <ChatHeader 
        name={business?.name}
        status={isBusinessOnline ? 'Online' : 'Away'}
        icon={business?.logo_url || "/favicon.jpg"}
        aiEnabled={isAiEnabled}
        onToggleAi={handleToggleAi}
        onClear={handleClearChat}
        showBack={true}
        backUrl="/customer/chat"
      />

      <div className="flex-1 overflow-hidden relative flex flex-col bg-white dark:bg-[#0A0A0A] transition-colors duration-500">
        <MessageList 
          messages={messages.map(m => ({ ...m, sender_type: m.role || m.sender_type }))} 
          typingUser={typingUser}
          businessName={business?.name}
          isCustomerView={true}
          conversationId={conversationId}
          onPlayAiAudio={handlePlayAiAudio}
          playingAiAudioId={playingAiAudioId}
        />
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        onAudioReady={handleAudioReady}
        onTyping={handleTyping}
        onFileUpload={handleFileUpload}
        isLoading={isSending}
        voiceStatus={voiceStatus}
        placeholder="Type a message..."
      />
    </div>
  );
}
