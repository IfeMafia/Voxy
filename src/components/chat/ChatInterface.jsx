"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Mic, Square } from 'lucide-react';
import { useAudioManager } from '@/hooks/useAudioManager';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from "@/lib/supabase";
import ChatHeader from "@/components/conversation/ChatHeader";
import MessageList from "@/components/conversation/MessageList";
import MessageInput from "@/components/conversation/MessageInput";
import { toast } from "react-hot-toast";

export default function ChatInterface({ business, userName, isGuest = false, initialConversationId = null, backUrl = "/customer/chat" }) {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [loading, setLoading] = useState(!initialConversationId);
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
    
    // If we already have a conversationId (e.g. from public page localStorage), 
    // we just need to fetch messages
    const initChat = async () => {
      try {
        setLoading(true);
        let currentId = conversationId;

        if (!currentId) {
          // No ID yet, create one
          const endpoint = isGuest ? '/api/public/conversations' : '/api/conversations';
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId: business.id, customerName: userName })
          });
          const data = await res.json();
          if (data.success && data.id) {
            currentId = data.id;
            setConversationId(data.id);
            setIsAiEnabled(data.ai_enabled ?? true);
            
            // Persist for guest sessions
            if (isGuest) {
              localStorage.setItem(`voxy_guest_conv_${business.id}`, data.id);
            }
          }
        }

        if (currentId) {
          const msgRes = await fetch(`/api/conversations/${currentId}/messages`);
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
  }, [business?.id, user?.id, isGuest]);

  const handleToggleAi = async (checked) => {
    if (!conversationId) return;
    
    // Prevent turning on if no credits
    if (checked && (business?.credit_balance <= 0 || business?.creditBalance <= 0)) {
      toast.error('Cannot enable AI: Business has 0 credits. Please recharge.');
      return;
    }

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

  const handleDelete = (messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
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
          
          try {
            const aiRes = await fetch('/api/assistant/chat', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ conversationId }) 
            });
            const aiData = await aiRes.json();
            
            if (aiRes.status === 403 && aiData.error === 'NO_CREDITS') {
               setTypingUser(null);
               setIsAiEnabled(false);
               
               // Sync with DB
               fetch(`/api/conversations/${conversationId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ai_enabled: false }) }).catch(e => console.error(e));

               const isOwner = user?.id === business?.owner_id;
               if (!isOwner) {
                 toast.error('AI credits exhausted. Please contact support.');
               } else {
                 toast.error('AI Credits Exhausted. Toggle disabled until recharge.');
               }
            } else if (!aiRes.ok) {
               setTypingUser(null);
               console.error('AI Chat Error:', aiData.error);
            }
          } catch (err) {
            setTypingUser(null);
            console.error('AI Fetch error:', err);
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

  const handleAudioReady = async (audioBlob) => {
    if (!conversationId) return;
    
    // Priority Control: Stop playback and cancel any pending requests
    stop();
    const signal = getNewAbortSignal();

    setIsSending(true);
    setVoiceStatus('processing');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
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
        
        // Handle No Credits during voice flow
        if (error.message?.includes('NO_CREDITS') || error.message?.includes('recharge')) {
           setIsAiEnabled(false);
           
           // Sync with DB
           fetch(`/api/conversations/${conversationId}`, { 
             method: 'PATCH', 
             headers: { 'Content-Type': 'application/json' }, 
             body: JSON.stringify({ ai_enabled: false }) 
           }).catch(e => console.error(e));

           const isOwner = user?.id === business?.owner_id;
           if (!isOwner) {
             toast.error('AI credits exhausted. Please contact support.');
           } else {
             toast.error('AI Credits Exhausted. Toggle disabled until recharge.');
           }
        } else {
           toast.error('Assistant is currently unavailable.');
        }

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

    setMessages(prev => [...prev, { id: tempId, role: 'customer', sender_type: 'customer', content: `[img]${previewUrl}`, created_at: new Date().toISOString(), status: 'sending' }]);

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
        <p className="text-zinc-400 dark:text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Connecting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden w-full relative transition-all">
      <ChatHeader 
        name={business?.name}
        status={isBusinessOnline ? 'Online' : 'Away'}
        icon={business?.logo_url || "/favicon.jpg"}
        aiEnabled={isAiEnabled}
        onToggleAi={handleToggleAi}
        onClear={handleClearChat}
        showBack={true}
        backUrl={backUrl}
        businessSlug={business?.slug}
      />

      <div className="flex-1 overflow-hidden relative flex flex-col bg-transparent transition-all">
        <MessageList 
          messages={messages.map(m => ({ ...m, sender_type: m.role || m.sender_type }))} 
          typingUser={typingUser}
          businessName={business?.name}
          businessLogo={business?.logo_url}
          isCustomerView={true}
          conversationId={conversationId}
          onPlayAiAudio={handlePlayAiAudio}
          playingAiAudioId={playingAiAudioId}
          onDelete={handleDelete}
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
