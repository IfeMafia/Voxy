"use client";

import React, { useState } from 'react';
import { 
  Languages, 
  MessageSquare, 
  Mic, 
  ShieldCheck, 
  Building2, 
  User,
  Leaf,
  Zap,
  History,
  Lock
} from 'lucide-react';

export const SIGNUP_CONTENT = {
  business: {
    badge: "Built for multilingual customer conversations",
    heading: (
      <>Understand every<br />voice note. Reply<br />faster with<br />confidence.</>
    ),
    subheading: "VOXY helps businesses turn customer voice messages into clear text, understand requests across English, Pidgin, Yoruba, and more, and generate smart replies your team can send in seconds.",
    features: [
      { icon: <Languages size={20} className="text-voxy-primary mb-3" />, title: "Local language understanding", desc: "Designed for real customer conversations, mixed phrasing, and informal voice notes." },
      { icon: <MessageSquare size={20} className="text-voxy-primary mb-3" />, title: "Reply suggestions", desc: "Generate clear responses your team can review and send without starting from scratch." },
      { icon: <Mic size={20} className="text-voxy-primary mb-3" />, title: "Voice-to-text pipeline", desc: "Move from customer voice note to transcription to suggested reply in one workflow." },
      { icon: <ShieldCheck size={20} className="text-voxy-primary mb-3" />, title: "Business-ready control", desc: "Review messages, edit replies, and manage conversations from one dashboard." }
    ],
    stats: [
      { value: "<1s", label: "Fast response workflow" },
      { value: "3-step", label: "Voice note to reply flow" },
      { value: "24/7", label: "Customer message coverage" }
    ],
    formSubheading: "Start managing multilingual customer messages from one workspace.",
    privacyNotice: "Your account setup is secure and takes less than 1 minute."
  },
  customer: {
    badge: "Built for seamless customer experiences",
    heading: (
      <>Connect with<br />businesses<br />effortlessly.</>
    ),
    subheading: "Send voice notes in your preferred language and let VOXY translate and deliver them clearly to your favorite services, so you get answers faster.",
    features: [
      { icon: <Leaf size={20} className="text-voxy-primary mb-3" />, title: "Speak your language", desc: "Send voice notes naturally in English, Pidgin, Yoruba, and more." },
      { icon: <Zap size={20} className="text-voxy-primary mb-3" />, title: "Quick responses", desc: "Businesses understand you perfectly, meaning you get help faster." },
      { icon: <History size={20} className="text-voxy-primary mb-3" />, title: "Track inquiries", desc: "Keep a history of your questions and business responses in one place." },
      { icon: <Lock size={20} className="text-voxy-primary mb-3" />, title: "Private & secure", desc: "Your messages are securely processed and delivered safely." }
    ],
    stats: [
      { value: "Free", label: "For all customers" },
      { value: "10+", label: "Languages supported" },
      { value: "Instant", label: "Message delivery" }
    ],
    formSubheading: "Start connecting with businesses using your voice.",
    privacyNotice: "Your privacy is our priority. Setup takes seconds."
  }
};

export const VERIFY_CONTENT = {
  badge: "Security Verification",
  heading: "You're almost there.",
  subheading: "Verify your email address to complete your account setup and start connecting with businesses using your voice.",
  features: [
    { icon: <Mic size={20} className="text-voxy-primary mb-3" />, title: "Local language support", desc: "Support for English, Pidgin, Yoruba, and more for every message." },
    { icon: <Zap size={20} className="text-voxy-primary mb-3" />, title: "Faster resolutions", desc: "AI-powered processing that delivers clear results in seconds." },
    { icon: <History size={20} className="text-voxy-primary mb-3" />, title: "Centrally managed", desc: "Keep a complete history of all your communications in one secure dashboard." },
    { icon: <Lock size={20} className="text-voxy-primary mb-3" />, title: "Private & secure", desc: "All conversations are encrypted and securely processed for your privacy." }
  ],
  stats: [
    { value: "Free", label: "For all accounts" },
    { value: "10+", label: "Languages supported" },
    { value: "Instant", label: "Message delivery" }
  ]
};
