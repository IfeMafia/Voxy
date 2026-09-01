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
    "Voxy handles your customer chats, answers questions, takes orders, and collects payments — so you can focus on running your business, not your inbox.",
  primaryCTA: "Get Started Free",
  secondaryCTA: "See how it works",
};

// ─── Problem ──────────────────────────────────────────────────────────────────

export const PROBLEM = {
  eyebrow: "The Problem",
  headline: "The problem isn't finding customers.",
  headlineAccent: "It's being there when they show up.",
  body: "Nigerian businesses are winning on WhatsApp, Instagram, and websites. But customers want answers immediately — and no business owner can be available 24 hours a day.",
  closing:
    "When a customer messages at 11pm to place an order or ask about a product — waiting until tomorrow often means losing them.",
  stats: [
    {
      id: "stat-1",
      value: "96.5%",
      label: "of consumers say a fast response is important or very important.",
      source: "Customer Experience Survey",
    },
    {
      id: "stat-2",
      value: "7 in 10",
      label: "customers expect a reply within one hour of reaching out.",
      source: "2025 Consumer Study",
    },
    {
      id: "stat-3",
      value: "54%",
      label: "of Nigerian MSMEs say social media and digital channels are very relevant to their business.",
      source: "PwC MSME Survey 2024",
    },
  ],
};

// ─── Features (Bento Grid) ───────────────────────────────────────────────────

export const FEATURES = {
  eyebrow: "Capabilities",
  headline: "What Voxy Actually Does",
  body: "Not another generic chatbot. A real autonomous employee grounded in your approved business data.",
  
  // Spotlight Tall Card
  spotlight: {
    title: "Your whole team. One platform.",
    description:
      "Set it once. Your AI employee works nights, weekends, holidays — without a break, missing an order, or dropping a customer.",
    cta: "Get started free",
  },

  // 8 Core Bento Feature Grid Items
  items: [
    {
      id: "feat-ai-employee",
      icon: Bot,
      title: "AI Employee",
      description: "Answers customers and represents your business with real approved facts.",
    },
    {
      id: "feat-conversations",
      icon: MessageSquare,
      title: "Customer Conversations",
      description: "Chat with customers naturally with full context memory and zero delay.",
    },
    {
      id: "feat-sales",
      icon: Sparkles,
      title: "AI Sales",
      description: "Recommends products and helps customers decide what to buy based on budget.",
    },
    {
      id: "feat-orders",
      icon: ShoppingBag,
      title: "Orders",
      description: "Creates and manages orders automatically with stock and variant awareness.",
    },
    {
      id: "feat-payments",
      icon: CreditCard,
      title: "Payments",
      description: "Creates payment requests and confirms only on verified successful payment.",
    },
    {
      id: "feat-voice",
      icon: PhoneCall,
      title: "Voxy Voice",
      description: "Customers can actually call and talk to your AI employee in real-time.",
    },
    {
      id: "feat-languages",
      icon: Globe,
      title: "Nigerian Languages",
      description: "English, Nigerian Pidgin, Yoruba, Hausa, and Igbo with consistent pricing.",
    },
    {
      id: "feat-dashboard",
      icon: LayoutDashboard,
      title: "Business Dashboard",
      description: "See customers, conversations, orders, payments, and live operations.",
    },
  ],
};

// ─── How It Works ─────────────────────────────────────────────────────────────

export const HOW_IT_WORKS = {
  eyebrow: "How It Works",
  headline: "Set up once.",
  headlineAccent: "Sell and serve forever.",
  body: "Get your AI employee up and running in minutes — no tech skills needed.",
  steps: [
    {
      id: "step-setup",
      number: "01",
      title: "Add your business",
      description:
        "Enter your products, prices, delivery zones, and policies. Voxy learns your business and never makes up information it wasn't given.",
    },
    {
      id: "step-interact",
      number: "02",
      title: "Share your link",
      description:
        "Customers chat or call through your unique Voxy link. Your AI employee greets them, answers questions, and recommends the right products.",
    },
    {
      id: "step-confirm",
      number: "03",
      title: "Orders in. Money in.",
      description:
        "Voxy confirms the order with the customer, sends a Paystack payment link, and updates your dashboard the moment payment lands.",
    },
  ],
};

// ─── Pricing ──────────────────────────────────────────────────────────────────

export const PRICING = {
  eyebrow: "Pricing",
  headline: "Start small,",
  headlineAccent: "grow when ready.",
  body: "Simple monthly pricing. No contracts, no surprises.",
  plans: [
    {
      id: "starter",
      name: "Starter",
      price: "₦15,000",
      period: "/ month",
      description: "For small businesses getting started with Voxy.",
      features: [
        "AI employee for your business",
        "Customer conversations",
        "Product catalogue",
        "Automated order taking",
        "Basic analytics & customer records",
        "5 language text support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      id: "business",
      name: "Business",
      price: "₦45,000",
      period: "/ month",
      description: "For businesses ready to automate more.",
      features: [
        "Everything in Starter",
        "AI sales & recommendations",
        "Paystack Payments & Receipts",
        "Voxy Voice (Inbound calls)",
        "Advanced analytics & audit logs",
        "More conversations & priority routing",
        "Human escalation & team handoff",
      ],
      cta: "Get Started",
      popular: true,
      badge: "Most Popular",
    },
  ],
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const FAQ = {
  eyebrow: "FAQ",
  headline: "You have questions.",
  headlineAccent: "We have answers.",
  body: "Everything you need to know about how Voxy works and how it powers your business.",
  items: [
    {
      question: "How is Voxy different from a general AI tool?",
      answer:
        "Traditional chatbots only answer generic questions. Voxy is an autonomous AI employee that is strictly grounded in your actual catalogue, prices, and policies. It recommends matching products, builds draft orders, requires explicit customer confirmation, and collects payments through Paystack.",
    },
    {
      question: "Will it actually adapt to how we work?",
      answer:
        "Yes. Voxy conforms to your business rules, operating hours, delivery zones, and product variants. You configure your tone, permitted tools, and escalation contacts once, and Voxy works as a trained team member.",
    },
    {
      question: "How much can my business automate?",
      answer:
        "Voxy automates up to 80% of repetitive customer inquiries, product recommendations, order creation, order confirmation, and payment requests, freeing you to focus on product quality and operations.",
    },
    {
      question: "How does Voxy Voice work for phone calls?",
      answer:
        "Customers can call and speak directly with Voxy in real time. Powered by speech recognition and natural text-to-speech, Voxy keeps voice turns short, asks one question at a time, and confirms orders before proceeding.",
    },
    {
      question: "Is my business and customer data private?",
      answer:
        "Yes. All conversations, customer details, and business data are encrypted in transit and at rest. Voxy never shares your proprietary catalogue or customer information across businesses.",
    },
    {
      question: "Can I cancel or upgrade anytime?",
      answer:
        "Yes, you can upgrade, downgrade, or cancel your subscription at any time directly from your dashboard with zero penalty or locked contracts.",
    },
  ],
};

// ─── CTA ──────────────────────────────────────────────────────────────────────

export const CTA = {
  eyebrow: "Get Started",
  headline: "Your AI employee",
  headlineAccent: "is ready to work.",
  body: "Set up in minutes. No technical skills needed. Your first 14 days are on us.",
  primaryCTA: "Hire Voxy Free",
  loginCTA: "Already have an account? Log in",
};

// ─── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER = {
  brand: "Voxy",
  tagline: "The autonomous AI employee for African businesses.",
  links: [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  copyright: `© ${new Date().getFullYear()} Voxy AI. All rights reserved.`,
};
