/**
 * landingData.js
 *
 * Single source of truth for all Voxy AI landing page copy and data.
 * Components import from here and never hardcode user-facing strings.
 *
 * Structure mirrors the page section hierarchy:
 *   nav → hero → problem → howItWorks → features → cta → footer
 */

import { Mic, Sparkles, MessageSquare, Globe, Clock, ShieldCheck, Zap } from "lucide-react";

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_LINKS = [
    { label: "The Problem", href: "/#problem" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
];

// Anchor IDs — defined once, referenced by both nav links and section elements
export const SECTION_IDS = {
    problem: "problem",
    howItWorks: "how-it-works",
    features: "features",
};

// ─── Hero ─────────────────────────────────────────────────────────────────────

export const HERO = {
    badge: "Voxy AI is now in beta",
    headline: "Respond to customer inquiries automatically.",
    accent: "Instantly.",
    body:
        "A multilingual AI voice assistant that converts English, Pidgin, and Yoruba voice notes — or informal text — into text, and generates ready-to-send replies for your business.",
    primaryCTA: "Start for free",
    secondaryCTA: "Log in to Dashboard",
    // The three-step flow rendered in the hero visual
    workflow: [
        { icon: Mic, label: "Voice or Text" },
        { icon: Sparkles, label: "Voxy AI" },
        { icon: MessageSquare, label: "Smart Reply" },
    ],
};

// ─── Problem ──────────────────────────────────────────────────────────────────

export const PROBLEM = {
    eyebrow: "The Problem",
    headline: "Informal inquiries are killing your response time.",
    body:
        "Your customer sent a 3-minute Yoruba voice note and a paragraph of broken Pidgin. You haven't listened. Your competitor — who can reply in seconds — already has.",
    stats: [
        {
            id: "stat-volume",
            value: "67%",
            label: "of Nigerian SMB inquiries arrive as WhatsApp voice notes",
        },
        {
            id: "stat-delay",
            value: "4 hrs",
            label: "average response delay when messages are in local languages",
        },
        {
            id: "stat-churn",
            value: "3×",
            label: "more likely to lose a sale when response takes over an hour",
        },
    ],
};

// ─── How It Works ─────────────────────────────────────────────────────────────

export const HOW_IT_WORKS = {
    eyebrow: "How It Works",
    headline: "Three steps. Seconds, not hours.",
    steps: [
        {
            id: "step-receive",
            number: "01",
            title: "Receive Voice or Text",
            description:
                "Your customer safely sends an inquiry via voice note or informal text in English, Pidgin, or Yoruba.",
        },
        {
            id: "step-process",
            number: "02",
            title: "Voxy Transcribes & Understands",
            description:
                "Our AI model automatically transcribes audio, processes the text, detects the language, and interprets your customer's intent.",
        },
        {
            id: "step-reply",
            number: "03",
            title: "Send an AI-Drafted Reply",
            description:
                "Voxy instantly generates a clear, professional response you can immediately send back to the customer.",
        },
    ],
};

// ─── Features ─────────────────────────────────────────────────────────────────

export const FEATURES = {
    eyebrow: "Features",
    headline: "Built for how African businesses actually work.",
    items: [
        {
            id: "feat-multilingual",
            icon: Globe,
            title: "Multilingual by Default",
            description: "Automatically translates and responds to English, Nigerian Pidgin, and Yoruba informal messages.",
        },
        {
            id: "feat-speed",
            icon: Zap,
            title: "Sub-second Transcription",
            description: "Convert 3-minute voice notes to readable text instantly. Keep customers engaged without the wait.",
        },
        {
            id: "feat-replies",
            icon: MessageSquare,
            title: "AI-Drafted Replies",
            description: "Automated, context-aware reply suggestions your team can send instantly — no more typing everything from scratch.",
        },
        {
            id: "feat-privacy",
            icon: ShieldCheck,
            title: "Privacy First",
            description: "Customer voice data is processed and discarded. Nothing is stored without explicit consent.",
        },
        {
            id: "feat-clock",
            icon: Clock,
            title: "Automatic Processing",
            description: "Voxy pipelines and queues incoming inquiries automatically so no message falls through the cracks.",
        },
    ],
};

// ─── CTA ──────────────────────────────────────────────────────────────────────

export const CTA = {
    headline: "Stop missing inquiries. Start responding.",
    body: "Join small businesses already using Voxy to respond faster and convert more customers.",
    primaryCTA: "Start for free — no credit card required",
    loginCTA: "Already have an account? Log in",
};

// ─── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER = {
    brand: "VOXY",
    tagline: "Multilingual AI for small businesses.",
    links: [
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
        { label: "Contact", href: "/contact" },
    ],
    copyright: `© ${new Date().getFullYear()} Voxy AI. All rights reserved.`,
};
