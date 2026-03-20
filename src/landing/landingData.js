/**
 * landingData.js
 *
 * Single source of truth for all Voxy AI landing page copy and data.
 * Components import from here and never hardcode user-facing strings.
 *
 * Structure mirrors the page section hierarchy:
 *   nav → hero → problem → howItWorks → features → cta → footer
 */

import { Mic, Bot, MessageSquare, Globe, Clock, ShieldCheck, Zap } from "lucide-react";

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_LINKS = [
    { label: "The Problem", href: "/#problem" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
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
        "A multilingual AI voice assistant that understands English, Nigerian Pidgin, Yoruba, Hausa, and Igbo. It converts voice notes and informal text into professional, ready-to-send replies for your business.",
    primaryCTA: "Start for free",
    secondaryCTA: "Log in to Dashboard",
    // The three-step flow rendered in the hero visual
    workflow: [
        { icon: Mic, label: "Voice or Text" },
        { icon: Bot, label: "Voxy AI" },
        { icon: MessageSquare, label: "Smart Reply" },
    ],
};

// ─── Problem ──────────────────────────────────────────────────────────────────

export const PROBLEM = {
    eyebrow: "The Problem",
    headline: "Informal inquiries shouldn't slow you down.",
    body:
        "Whether it's a long voice note in Yoruba or a paragraph in Nigerian Pidgin, your customers expect an instant response. Small businesses often struggle to process these diverse inquiries quickly, leading to missed opportunities and lost sales.",
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
                "Your customer sends an inquiry via voice note or text in English, Pidgin, Yoruba, Hausa, or Igbo.",
        },
        {
            id: "step-process",
            number: "02",
            title: "Voxy Understands Everything",
            description:
                "Our AI automatically transcribes audio, identifies the language, and interprets the customer's intent across multiple Nigerian languages.",
        },
        {
            id: "step-reply",
            number: "03",
            title: "Send an AI-Drafted Reply",
            description:
                "Voxy generates a professional response that you can review and send instantly, keeping the conversation fluid.",
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
            title: "Native Support",
            description: "Automatically translates and responds to English, Nigerian Pidgin, Yoruba, Hausa, and Igbo messages.",
        },
        {
            id: "feat-speed",
            icon: Zap,
            title: "Instant Transcription",
            description: "Convert long voice notes to readable text instantly. Keep customers engaged without the manual effort.",
        },
        {
            id: "feat-replies",
            icon: MessageSquare,
            title: "Smart Drafted Replies",
            description: "Automated, context-aware reply suggestions that preserve your business tone and context.",
        },
        {
            id: "feat-privacy",
            icon: ShieldCheck,
            title: "Security & Privacy",
            description: "Voice data is processed securely and discarded. We only keep transcripts for your business records and logs.",
        },
        {
            id: "feat-clock",
            icon: Clock,
            title: "Automated Workflows",
            description: "Voxy handles incoming inquiries automatically so no message falls through the cracks, even after hours.",
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
    brand: "Voxy",
    tagline: "Multilingual AI for small businesses.",
    links: [
        { label: "Pricing", href: "/pricing" },
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
        { label: "Contact", href: "/contact" },
    ],
    copyright: `© ${new Date().getFullYear()} Voxy AI. All rights reserved.`,
};

