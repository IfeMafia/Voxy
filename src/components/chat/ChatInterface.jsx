"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MOCK_MESSAGES = [
  {
    id: 1,
    role: 'ai',
    content: "Welcome to Luxe Diners! I'm your AI concierge. I can help you with reservations, menu enquiries, or any other questions you may have in any language. How can I assist you today?",
    timestamp: '09:00 AM',
    status: 'read'
  }
];

const SUGGESTED_QUERIES = [
  { icon: <Calendar className="w-4 h-4" />, text: "Book a table for tonight" },
  { icon: <Utensils className="w-4 h-4" />, text: "What's on the chef's special menu?" },
  { icon: <MapPin className="w-4 h-4" />, text: "Where is the nearest parking?" },
  { icon: <Languages className="w-4 h-4" />, text: "Can you speak Spanish?" }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    
    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      let aiResponseContent = "";
      
      // Basic mock logic
      if (inputValue.toLowerCase().includes('table') || inputValue.toLowerCase().includes('reservation')) {
        aiResponseContent = "I'd be happy to check availability for you! We have a few slots open for tonight at 7:30 PM and 8:15 PM. For how many people should I make the reservation?";
      } else if (inputValue.toLowerCase().includes('hola') || inputValue.toLowerCase().includes('spanish') || inputValue.toLowerCase().includes('espanol')) {
        aiResponseContent = "¡Claro que sí! Puedo ayudarte en español. ¿En qué puedo servirle con relación a Luxe Diners oggi?";
      } else if (inputValue.toLowerCase().includes('how far') || inputValue.toLowerCase().includes('wetin') || inputValue.toLowerCase().includes('pidgin')) {
        aiResponseContent = "How far boss! I dey here to help you for anythin' you need for Luxe Diners. You wan reserve table or check wetin dey the menu?";
      } else if (inputValue.toLowerCase().includes('ekaro') || inputValue.toLowerCase().includes('yoruba') || inputValue.toLowerCase().includes('bawo')) {
        aiResponseContent = "E nle o! Mo le ran yin lowo ni ede Yoruba. Se e fe mo nipa menu wa tabi e fe se ifi pamọ fun tabili?";
      } else {
        aiResponseContent = "That's a great question about Luxe Diners. Our current specialties include the Truffle Infused Risotto and the Wagyu Beef Tartare. Would you like to see our full menu?";
      }

      const aiResponse = {
        id: messages.length + 2,
        role: 'ai',
        content: aiResponseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestedClick = (text) => {
    setInputValue(text);
  };

  return (
    <div className="flex flex-col h-full max-h-[800px] bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Bot className="w-7 h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full ring-4 ring-emerald-500/10"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Luxe AI Concierge</h2>
              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 text-[10px] py-0 px-2 font-semibold tracking-wider uppercase">Online</Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Fast response in any language
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            <RefreshCcw className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            <Info className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === 'ai' 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}>
                {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              
              <div className="group relative">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">{msg.timestamp}</span>
                  {msg.role === 'user' && (
                    <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 'read' ? 'text-blue-500' : 'text-zinc-400'}`} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries */}
      {messages.length < 3 && !isTyping && (
        <div className="px-6 py-2 overflow-x-auto no-scrollbar flex items-center gap-2 bg-transparent">
          {SUGGESTED_QUERIES.map((query, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestedClick(query.text)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              {query.icon}
              {query.text}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 bg-white dark:bg-zinc-950 transition-all duration-300">
        <form 
          onSubmit={handleSendMessage}
          className="relative group bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 transition-all duration-300 shadow-inner"
        >
          <div className="flex items-center px-4 py-2 min-h-[56px]">
            <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
              <Paperclip className="w-5 h-5" />
            </Button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything about our business..."
              className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
            
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="ghost" size="icon" className="hidden sm:inline-flex text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                <Smile className="w-5 h-5" />
              </Button>
              <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className={`transition-all duration-300 ${inputValue.trim() ? 'hidden' : 'inline-flex text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl'}`}
              >
                <Mic className="w-5 h-5" />
              </Button>
              <Button 
                type="submit" 
                disabled={!inputValue.trim()}
                className={`transition-all duration-300 rounded-xl px-4 flex items-center gap-2 group/btn ${
                  inputValue.trim() 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95' 
                    : 'hidden'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider">Send</span>
                <Send className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </form>
        <p className="mt-3 text-[10px] text-zinc-400 text-center uppercase tracking-widest font-medium opacity-60">
          Powered by Voxy AI • Multilingual Support
        </p>
      </div>
      
      <style jsx>{`
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
