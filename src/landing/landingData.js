/**
 * landingData.js
 *
 * Single source of truth for all Voxy AI landing page copy and data.
 * Components import from here and never hardcode user-facing strings.
 *
 * Structure mirrors the page section hierarchy:
 *   nav → hero → features → howItWorks → pricing → faq → cta → footer
 */

import {
  Bot,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  CreditCard,
  PhoneCall,
  Globe,
  LayoutDashboard,
} from "lucide-react";

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: "Problem", href: "/#problem" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
];

// Anchor IDs — defined once, referenced by both nav links and section elements
export const SECTION_IDS = {
  problem: "problem",
  features: "features",
  howItWorks: "how-it-works",
  pricing: "pricing",
  faq: "faq",
};

// ─── Hero ─────────────────────────────────────────────────────────────────────

export const HERO = {
  badge: "AI Employee Now Available",
  badgeLink: "/#features",
  headline: "Your business deserves",
  headlineAccent: "an AI employee.",
  body:
    "Voxy is an Agentic AI employee that talks to your customers, sells your products, takes orders and helps run your business.",
  primaryCTA: "Start Free Trial",
  secondaryCTA: "See how it works",
};

// ─── Problem ──────────────────────────────────────────────────────────────────

export const PROBLEM = {
  eyebrow: "The Challenge",
  headline: "The problem isn't finding customers.",
  headlineAccent: "It's being available when they reach out.",
  body: "Customers expect instant replies on digital channels. When responses are delayed by even an hour, buyers lose interest and purchase elsewhere.",
  closing:
    "When a buyer messages late at night to order or ask questions, waiting until morning often means losing that sale.",
  stats: [
    {
      id: "stat-1",
      value: "96.5%",
      label: "of consumers consider fast customer response critical to making a purchase.",
      source: "Customer Experience Survey",
    },
    {
      id: "stat-2",
      value: "7 in 10",
      label: "buyers expect a helpful answer within sixty minutes of reaching out.",
      source: "2025 Consumer Study",
    },
    {
      id: "stat-3",
      value: "54%",
      label: "of Nigerian businesses rely directly on digital channels for daily sales.",
      source: "PwC MSME Survey 2024",
    },
  ],
};

// ─── Features (Capabilities) ──────────────────────────────────────────────────

export const FEATURES = {
  eyebrow: "Capabilities",
  headline: "Built to execute real business tasks.",
  headlineAccent: "Grounded in your actual catalogue.",
  body: "Not a generic chatbot. Voxy works strictly from your approved products, prices, and policies.",
  
  // Spotlight Tall Card
  spotlight: {
    title: "Always available. Always accurate.",
    description:
      "Configure your business once. Your AI employee works 24/7 without missing an order, providing wrong prices, or leaving a buyer waiting.",
    cta: "Start Free Trial",
  },

  // 8 Core Bento Feature Grid Items
  items: [
    {
      id: "feat-ai-employee",
      icon: Bot,
      title: "AI Business Employee",
      description: "Represents your brand with verified facts, pricing, and operating rules.",
    },
    {
      id: "feat-conversations",
      icon: MessageSquare,
      title: "Customer Support",
      description: "Answers product queries, hours, and policies with zero delay.",
    },
    {
      id: "feat-sales",
      icon: Sparkles,
      title: "Product Recommendations",
      description: "Understands buyer preferences and recommends suitable items within their budget.",
    },
    {
      id: "feat-orders",
      icon: ShoppingBag,
      title: "Order Processing",
      description: "Collects item choices, variants, and delivery details into structured orders.",
    },
    {
      id: "feat-payments",
      icon: CreditCard,
      title: "Paystack Payments",
      description: "Generates secure payment links and verifies receipts automatically.",
    },
    {
      id: "feat-voice",
      icon: PhoneCall,
      title: "Voxy Voice Calling",
      description: "Allows customers to call and speak with your AI employee naturally.",
    },
    {
      id: "feat-languages",
      icon: Globe,
      title: "Multilingual Support",
      description: "Communicates fluently in English, Nigerian Pidgin, Yoruba, Hausa, and Igbo.",
    },
    {
      id: "feat-dashboard",
      icon: LayoutDashboard,
      title: "Operations Workspace",
      description: "Track live conversations, confirmed orders, and revenue from one unified dashboard.",
    },
  ],
};

// ─── How It Works ─────────────────────────────────────────────────────────────

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  headline: "Simple to launch.",
  headlineAccent: "Effortless to run.",
  body: "Get your AI employee set up in three straightforward steps.",
  steps: [
    {
      id: "step-setup",
      number: "01",
      title: "Add your business info",
      description:
        "Input your product catalogue, prices, delivery zones, and FAQs. Voxy learns your exact inventory and never invents unapproved details.",
    },
    {
      id: "step-interact",
      number: "02",
      title: "Share your business link",
      description:
        "Direct customers from your social media bio, WhatsApp, or website to your Voxy link. Voxy engages them immediately in natural conversation.",
    },
    {
      id: "step-confirm",
      number: "03",
      title: "Confirm orders and get paid",
      description:
        "Voxy summarizes the order for the customer, sends a Paystack checkout link, and logs the confirmed sale to your dashboard the second payment arrives.",
    },
  ],
};

// ─── Pricing ──────────────────────────────────────────────────────────────────

export const PRICING = {
  eyebrow: "Pricing",
  headline: "Transparent plans,",
  headlineAccent: "built for real growth.",
  body: "Start with a 3-day free trial. No credit card required, cancel anytime.",
  plans: [
    {
      id: "starter",
      name: "Starter",
      price: "₦15,000",
      period: "/ month after trial",
      description: "Ideal for small businesses launching their first AI employee.",
      features: [
        "3-day free trial included",
        "24/7 AI employee for your business",
        "Unlimited text conversations",
        "Product catalogue and price management",
        "Automated order processing",
        "Basic analytics and customer logs",
        "5 language text support",
      ],
      cta: "Start 3-Day Free Trial",
      popular: false,
    },
    {
      id: "business",
      name: "Business",
      price: "₦45,000",
      period: "/ month after trial",
      description: "For growing businesses looking to scale sales and voice calls.",
      features: [
        "3-day free trial included",
        "Everything in Starter",
        "Smart sales recommendations",
        "Paystack payments and instant receipts",
        "Voxy Voice for incoming customer calls",
        "Comprehensive operational analytics",
        "Priority conversation routing",
        "Human escalation and staff handoff",
      ],
      cta: "Start 3-Day Free Trial",
      popular: true,
      badge: "Recommended",
    },
  ],
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const FAQ = {
  eyebrow: "FAQ",
  headline: "Frequently asked questions",
  headlineAccent: "about Voxy.",
  body: "Everything you need to know about how Voxy operates for your business.",
  items: [
    {
      question: "How is Voxy different from a standard chatbot?",
      answer:
        "Standard chatbots only provide canned responses to pre-written FAQs. Voxy is an agentic AI employee that reads your actual product catalogue, prices, and stock. It recommends items, confirms order details with the buyer, and creates real Paystack payment requests.",
    },
    {
      question: "Will Voxy invent prices or fake discounts?",
      answer:
        "No. Voxy is strictly grounded in the catalogue and rules you provide. It will never guess stock, invent discounts, or promise delivery timelines that you have not configured.",
    },
    {
      question: "What happens if a customer has a complex request?",
      answer:
        "When a situation requires human judgment (such as custom quotes or refund inquiries), Voxy escalates the conversation and alerts your team with full conversation history.",
    },
    {
      question: "How does Voxy Voice work for phone inquiries?",
      answer:
        "Customers can call and talk directly to your AI employee. Using low-latency speech processing, Voxy listens, answers concisely, and guides the caller through orders and inquiries in real time.",
    },
    {
      question: "Is our business data secure and confidential?",
      answer:
        "Yes. Your customer records, pricing, and conversations are encrypted in transit and at rest. Your proprietary data is never shared with other businesses.",
    },
    {
      question: "Can I cancel or change my plan at any time?",
      answer:
        "Yes. You can upgrade, downgrade, or cancel your subscription directly from your dashboard whenever you wish.",
    },
  ],
};

// ─── CTA ──────────────────────────────────────────────────────────────────────

export const CTA = {
  eyebrow: "Get Started",
  headline: "Put your sales and customer care",
  headlineAccent: "on autopilot today.",
  body: "Start your 3-day free trial. Add your products, share your link, and let Voxy handle the rest.",
  primaryCTA: "Start Free Trial",
  loginCTA: "Already have an account? Sign in",
};

// ─── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER = {
  brand: "Voxy",
  tagline: "The AI employee that chats, takes orders, and collects payments for your business.",
  links: [
    { label: "Problem", href: "/#problem" },
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  copyright: `© ${new Date().getFullYear()} Voxy. All rights reserved.`,
};
