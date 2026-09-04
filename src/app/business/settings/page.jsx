"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { getBusiness, updateBusiness } from "@/lib/api/business";
import ImageUpload from "@/components/settings/ImageUpload";
import {
  Building2, Bot, User, MapPin, Clock, Truck, Languages,
  Instagram, Twitter, Globe, MessageCircle, Save, Loader2, Copy,
  Check, ExternalLink, Plus, Trash2, CheckCircle2, AlertCircle,
  ShieldCheck, Sparkles, Store, Share2,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ── Constants ──────────────────────────────────────────────────────────────

const DAYS = [
  { key: "mon", label: "Monday" }, { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" }, { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" }, { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];
const CATEGORIES = [
  "Retail & E-commerce", "Restaurant & Food", "Fashion & Apparel",
  "Electronics & Gadgets", "Health & Beauty", "Groceries & Supermarket",
  "Professional Services", "Automotive", "Home & Furniture", "Other",
];
const LANGUAGES = [
  { code: "en", label: "English" }, { code: "pcm", label: "Nigerian Pidgin" },
  { code: "yo", label: "Yoruba" }, { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" }, { code: "fr", label: "French" },
];
const TONES = [
  { value: "friendly", label: "Friendly & Warm", desc: "Approachable, conversational, uses polite emojis" },
  { value: "casual", label: "Casual & Direct", desc: "Quick, concise, modern chat style" },
  { value: "formal", label: "Formal & Professional", desc: "Polite, strictly business, respectful" },
];
const ACTIONS = [
  { id: "browse_menu", label: "Browse Catalogue & Products", desc: "Share product details and current prices with customers" },
  { id: "recommend_products", label: "Recommend Products", desc: "Suggest items based on what the customer is looking for" },
  { id: "place_order", label: "Take Orders", desc: "Collect items, delivery info and create confirmed orders" },
  { id: "check_order_status", label: "Check Order Status", desc: "Look up order progress for returning customers" },
  { id: "customer_support", label: "Answer Business FAQs", desc: "Explain hours, location, and delivery policies" },
];

const NAV_ITEMS = [
  { key: "business", label: "Business Profile", icon: Building2 },
  { key: "ai", label: "AI Employee", icon: Bot },
  { key: "account", label: "Account", icon: User },
];

// ── Shared field component ──────────────────────────────────────────────────

function Field({ label, hint, required, half, children }) {
  return (
    <div className={half ? "" : ""}>
      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
        {label}{required && <span className="text-[#00D18F] ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-600 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full bg-black border border-white/[0.09] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/50 focus:ring-1 focus:ring-[#00D18F]/10 transition-all";
const TEXTAREA = INPUT + " resize-none";

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.05]">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Business Profile Section ────────────────────────────────────────────────

function BusinessSection({ data, onChange }) {
  return (
    <div className="space-y-4">
      <SectionCard icon={Store} title="Business Identity" description="Core details your AI employee and customers see.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business name" required>
            <input value={data.name} onChange={(e) => onChange("name", e.target.value)} placeholder="e.g. Mama Put Kitchen" className={INPUT} />
          </Field>
          <Field label="Category">
            <select value={data.category} onChange={(e) => onChange("category", e.target.value)} className={INPUT}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Contact phone">
            <input type="tel" value={data.contactPhone} onChange={(e) => onChange("contactPhone", e.target.value)} placeholder="+234 801 234 5678" className={INPUT} />
          </Field>
          <Field label="Public URL slug" hint="Your customer chat link: /business/[slug]">
            <div className="flex items-center bg-black border border-white/[0.09] rounded-lg overflow-hidden focus-within:border-[#00D18F]/50 focus-within:ring-1 focus-within:ring-[#00D18F]/10 transition-all">
              <span className="pl-3 pr-1 text-xs text-zinc-600 font-mono shrink-0">/business/</span>
              <input value={data.slug} onChange={(e) => onChange("slug", e.target.value)} placeholder="mama-put" className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-white focus:outline-none font-mono" />
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Business description" hint="Used by Voxy to answer questions about your business.">
              <textarea rows={3} value={data.description} onChange={(e) => onChange("description", e.target.value)} placeholder="What does your business do, specialize in, or stand for?" className={TEXTAREA} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Business logo" hint="Square image recommended. Max 2MB. Uploaded to secure storage.">
              <ImageUpload
                currentImage={data.logoUrl}
                onUpload={(url) => onChange("logoUrl", url)}
                folder="business-logos"
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={MapPin} title="Location & Address" description="Used by Voxy to answer pickup and location questions from customers.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street address">
              <input value={data.address?.street || ""} onChange={(e) => onChange("address", { ...data.address, street: e.target.value })} placeholder="e.g. 14 Admiralty Way, Lekki Phase 1" className={INPUT} />
            </Field>
          </div>
          <Field label="City">
            <input value={data.address?.city || ""} onChange={(e) => onChange("address", { ...data.address, city: e.target.value })} placeholder="e.g. Lekki" className={INPUT} />
          </Field>
          <Field label="State">
            <input value={data.address?.state || ""} onChange={(e) => onChange("address", { ...data.address, state: e.target.value })} placeholder="e.g. Lagos" className={INPUT} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Clock} title="Operating Hours" description="Voxy will accurately tell customers when you are open or closed.">
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const day = data.hours?.[key] || { open: "09:00", close: "18:00", closed: false };
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                <span className="w-28 text-sm font-medium text-zinc-300 shrink-0">{label}</span>
                <div className="flex items-center gap-2 flex-1">
                  {!day.closed ? (
                    <>
                      <input type="time" value={day.open || "09:00"}
                        onChange={(e) => onChange("hours", { ...data.hours, [key]: { ...day, open: e.target.value } })}
                        className="bg-black border border-white/[0.09] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D18F]/50" />
                      <span className="text-xs text-zinc-600">to</span>
                      <input type="time" value={day.close || "18:00"}
                        onChange={(e) => onChange("hours", { ...data.hours, [key]: { ...day, close: e.target.value } })}
                        className="bg-black border border-white/[0.09] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D18F]/50" />
                    </>
                  ) : (
                    <span className="text-xs text-zinc-600 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-lg">Closed all day</span>
                  )}
                </div>
                <button type="button"
                  onClick={() => onChange("hours", { ...data.hours, [key]: { ...day, closed: !day.closed } })}
                  className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${day.closed ? "bg-[#00D18F]/10 text-[#00D18F] border-[#00D18F]/20" : "bg-white/[0.04] text-zinc-500 border-white/[0.07] hover:text-zinc-300"}`}>
                  {day.closed ? "Open" : "Close"}
                </button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard icon={Truck} title="Delivery & Policies" description="Ground truth for what Voxy tells customers about delivery and returns.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Delivery coverage & timelines" hint="e.g. Lagos same-day ₦2,500, interstate 2–3 days ₦4,500">
            <textarea rows={3} value={data.deliveryInfo} onChange={(e) => onChange("deliveryInfo", e.target.value)} placeholder="Where do you deliver? How long does it take? What does it cost?" className={TEXTAREA} />
          </Field>
          <Field label="Return & refund policy" hint="e.g. 7-day exchange for defective items. No cash refunds once seals are broken.">
            <textarea rows={3} value={data.policies} onChange={(e) => onChange("policies", e.target.value)} placeholder="What is your return or exchange policy?" className={TEXTAREA} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={Languages} title="Supported Languages" description="Voxy will converse fluently with customers in these languages.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map(({ code, label }) => {
            const on = (data.supportedLanguages || ["en"]).includes(code);
            return (
              <button key={code} type="button"
                onClick={() => {
                  const cur = data.supportedLanguages || ["en"];
                  onChange("supportedLanguages", on && cur.length > 1 ? cur.filter((c) => c !== code) : on ? cur : [...cur, code]);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all ${on ? "bg-[#00D18F]/10 border-[#00D18F]/30 text-white" : "bg-white/[0.02] border-white/[0.07] text-zinc-500 hover:text-zinc-300"}`}>
                <div className={`size-3.5 rounded-full border flex items-center justify-center shrink-0 ${on ? "bg-[#00D18F] border-[#00D18F]" : "border-zinc-600"}`}>
                  {on && <Check className="size-2 text-black stroke-[3]" />}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard icon={Globe} title="Social & Online Channels" description="Where customers can find and connect with your brand.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="WhatsApp number">
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-emerald-500" />
              <input value={data.socialLinks?.whatsapp || ""} onChange={(e) => onChange("socialLinks", { ...data.socialLinks, whatsapp: e.target.value })} placeholder="+2348012345678" className={INPUT + " pl-9"} />
            </div>
          </Field>
          <Field label="Instagram handle">
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-pink-400" />
              <input value={data.socialLinks?.instagram || ""} onChange={(e) => onChange("socialLinks", { ...data.socialLinks, instagram: e.target.value })} placeholder="@yourhandle" className={INPUT + " pl-9"} />
            </div>
          </Field>
          <Field label="Twitter / X">
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-sky-400" />
              <input value={data.socialLinks?.twitter || ""} onChange={(e) => onChange("socialLinks", { ...data.socialLinks, twitter: e.target.value })} placeholder="@yourhandle" className={INPUT + " pl-9"} />
            </div>
          </Field>
          <Field label="Website">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-indigo-400" />
              <input type="url" value={data.socialLinks?.website || ""} onChange={(e) => onChange("socialLinks", { ...data.socialLinks, website: e.target.value })} placeholder="https://yoursite.com" className={INPUT + " pl-9"} />
            </div>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

// ── AI Employee Section ────────────────────────────────────────────────────

function AISection({ data, onChange }) {
  const [newRule, setNewRule] = useState("");
  const [newTrigger, setNewTrigger] = useState("");
  const ai = data.aiConfig || {};

  const setAI = (k, v) => onChange("aiConfig", { ...ai, [k]: v });

  const addRule = (e) => {
    e?.preventDefault();
    const t = newRule.trim();
    if (!t || (ai.rules || []).includes(t)) return;
    setAI("rules", [...(ai.rules || []), t]);
    setNewRule("");
  };

  const addTrigger = (e) => {
    e?.preventDefault();
    const t = newTrigger.trim().toLowerCase();
    if (!t || (ai.escalationTriggers || []).includes(t)) return;
    setAI("escalationTriggers", [...(ai.escalationTriggers || []), t]);
    setNewTrigger("");
  };

  return (
    <div className="space-y-4">
      <SectionCard icon={Bot} title="Identity" description="Give your AI employee a name and personality that represents your brand.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Employee name" hint="The name customers see in the chat. e.g. Amaka, Voxy, David.">
            <input value={ai.employeeName || ""} onChange={(e) => { setAI("employeeName", e.target.value); setAI("persona", e.target.value); }} placeholder="e.g. Voxy" className={INPUT} />
          </Field>
          <Field label="Tone & personality" hint="How your AI employee communicates with customers.">
            <select value={ai.tone || "friendly"} onChange={(e) => setAI("tone", e.target.value)} className={INPUT}>
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Opening greeting" hint="The first message customers receive when they start a chat.">
              <textarea rows={2} value={ai.greeting || ""} onChange={(e) => setAI("greeting", e.target.value)} placeholder="Hi! Welcome to our store. I'm Voxy, your AI assistant. How can I help you today?" className={TEXTAREA} />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Sparkles} title="Capabilities" description="Choose what this AI employee is allowed to help customers with.">
        <div className="space-y-2">
          {ACTIONS.map((action) => {
            const on = (ai.permittedActions || []).includes(action.id);
            return (
              <button key={action.id} type="button"
                onClick={() => {
                  const cur = ai.permittedActions || [];
                  setAI("permittedActions", on ? cur.filter((a) => a !== action.id) : [...cur, action.id]);
                }}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${on ? "bg-[#00D18F]/[0.06] border-[#00D18F]/30" : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.12]"}`}>
                <div className={`size-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${on ? "bg-[#00D18F] border-[#00D18F]" : "border-zinc-600"}`}>
                  {on && <Check className="size-2.5 text-black stroke-[3]" />}
                </div>
                <div>
                  <div className={`text-sm font-medium ${on ? "text-white" : "text-zinc-400"}`}>{action.label}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{action.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard icon={ShieldCheck} title="Handoff & Escalation" description="When Voxy detects these phrases, it alerts you to take over the conversation.">
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
              {(ai.escalationTriggers || []).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                  {t}
                  <button type="button" onClick={() => setAI("escalationTriggers", (ai.escalationTriggers || []).filter((_, j) => j !== i))} className="hover:text-white">
                    <Trash2 className="size-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTrigger(e)} placeholder="e.g. speak to human, refund, complaint…" className={INPUT} />
              <button type="button" onClick={addTrigger} className="px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] text-white text-xs font-semibold rounded-lg hover:bg-white/[0.08] flex items-center gap-1.5 shrink-0">
                <Plus className="size-3.5" /> Add
              </button>
            </div>
          </div>
          <Field label="Fallback message" hint="What Voxy says when handing off or unable to help.">
            <textarea rows={2} value={ai.fallbackMessage || ""} onChange={(e) => setAI("fallbackMessage", e.target.value)} placeholder="Let me connect you with our team right away." className={TEXTAREA} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={AlertCircle} title="Business Rules & Guardrails" description="Strict instructions Voxy must follow in every conversation.">
        <div className="space-y-2 mb-3">
          {(ai.rules || []).map((rule, i) => (
            <div key={i} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-sm text-zinc-300">• {rule}</span>
              <button type="button" onClick={() => setAI("rules", (ai.rules || []).filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 transition-colors ml-3 shrink-0">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newRule} onChange={(e) => setNewRule(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRule(e)} placeholder="e.g. Never offer discounts below catalogue price…" className={INPUT} />
          <button type="button" onClick={addRule} className="px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] text-white text-xs font-semibold rounded-lg hover:bg-white/[0.08] flex items-center gap-1.5 shrink-0">
            <Plus className="size-3.5" /> Add
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Account Section ────────────────────────────────────────────────────────

function AccountSection({ user }) {
  return (
    <div className="space-y-4">
      <SectionCard icon={User} title="Your Account" description="Your login details and preferences.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email address" hint="Contact support to change your email.">
            <input value={user?.email || ""} disabled className={INPUT + " opacity-50 cursor-not-allowed"} />
          </Field>
          <Field label="Account type">
            <input value="Business Owner" disabled className={INPUT + " opacity-50 cursor-not-allowed"} />
          </Field>
        </div>
        <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs text-zinc-500">To update your password or account email, please contact <span className="text-[#00D18F]">support@voxy.app</span></p>
        </div>
      </SectionCard>
    </div>
  );
}

function SettingsContent() {
  const { user, setUser, refreshSession } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "business";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState({
    name: "", slug: "", description: "", category: "Retail & E-commerce",
    contactPhone: "", logoUrl: "",
    address: { street: "", city: "", state: "", country: "Nigeria" },
    socialLinks: { whatsapp: "", instagram: "", twitter: "", website: "" },
    hours: {
      mon: { open: "08:00", close: "18:00", closed: false },
      tue: { open: "08:00", close: "18:00", closed: false },
      wed: { open: "08:00", close: "18:00", closed: false },
      thu: { open: "08:00", close: "18:00", closed: false },
      fri: { open: "08:00", close: "18:00", closed: false },
      sat: { open: "09:00", close: "17:00", closed: false },
      sun: { open: "10:00", close: "16:00", closed: true },
    },
    deliveryInfo: "", policies: "", supportedLanguages: ["en"],
    aiConfig: {
      employeeName: "Voxy", persona: "Voxy", tone: "friendly",
      greeting: "", fallbackMessage: "",
      permittedActions: ["browse_menu", "place_order", "customer_support"],
      rules: [], escalationTriggers: ["speak to human", "refund", "complaint"],
    },
  });

  const setTab = (tab) => router.push(`/business/settings?tab=${tab}`);

  const handleChange = useCallback((key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getBusiness(user.id).then((biz) => {
      if (!biz) return;
      const ai = biz.aiConfig || {};
      setData({
        name: biz.name || "",
        slug: biz.slug || "",
        description: biz.description || "",
        category: biz.category || "Retail & E-commerce",
        contactPhone: biz.contactPhone || "",
        logoUrl: biz.logoUrl || "",
        address: { street: "", city: "", state: "", country: "Nigeria", ...(biz.address || {}) },
        socialLinks: { whatsapp: "", instagram: "", twitter: "", website: "", ...(biz.socialLinks || {}) },
        hours: {
          mon: { open: "08:00", close: "18:00", closed: false },
          tue: { open: "08:00", close: "18:00", closed: false },
          wed: { open: "08:00", close: "18:00", closed: false },
          thu: { open: "08:00", close: "18:00", closed: false },
          fri: { open: "08:00", close: "18:00", closed: false },
          sat: { open: "09:00", close: "17:00", closed: false },
          sun: { open: "10:00", close: "16:00", closed: true },
          ...(biz.hours || {}),
        },
        deliveryInfo: biz.deliveryInfo || "",
        policies: biz.policies || "",
        supportedLanguages: biz.supportedLanguages?.length ? biz.supportedLanguages : ["en"],
        aiConfig: {
          employeeName: ai.employeeName || ai.persona || "Voxy",
          persona: ai.persona || "Voxy",
          tone: ai.tone || "friendly",
          greeting: ai.greeting || `Hi! Welcome to ${biz.name || "our store"}. How can I help you today?`,
          fallbackMessage: ai.fallbackMessage || "Let me connect you with our team right away.",
          permittedActions: ai.permittedActions || ["browse_menu", "place_order", "customer_support"],
          rules: ai.rules || [],
          escalationTriggers: ai.escalationTriggers || ["speak to human", "refund", "complaint"],
        },
      });
    }).catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const updated = await updateBusiness(user.id, {
        name: data.name.trim() || user.name,
        slug: data.slug.trim() || undefined,
        description: data.description.trim(),
        category: data.category,
        contactPhone: data.contactPhone.trim(),
        logoUrl: data.logoUrl.trim() || null,
        address: data.address,
        socialLinks: data.socialLinks,
        hours: data.hours,
        deliveryInfo: data.deliveryInfo.trim(),
        policies: data.policies.trim(),
        supportedLanguages: data.supportedLanguages,
        aiConfig: data.aiConfig,
      });
      if (updated) { setUser(updated); refreshSession?.(); }
      toast.success("Settings saved");
      setDirty(false);
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://voxy.app";
  const publicLink = `${origin}/business/${data.slug || user?.slug || ""}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-60">
          <Loader2 className="size-6 animate-spin text-[#00D18F]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Manage your business profile, AI employee, and account.</p>
          </div>
        </div>

        {/* Public link banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-6">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Public customer link</div>
            <div className="text-sm font-mono text-zinc-300 truncate mt-0.5">{publicLink}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleCopyLink} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors">
              {copied ? <><Check className="size-3.5 text-[#00D18F]" /> Copied</> : <><Copy className="size-3.5" /> Copy link</>}
            </button>
            <a href={publicLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors">
              <ExternalLink className="size-3.5" /> Preview
            </a>
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar nav — desktop ── */}
          <nav className="hidden lg:block w-48 xl:w-52 shrink-0">
            <ul className="space-y-0.5">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <li key={key}>
                  <button
                    onClick={() => setTab(key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"}`}
                  >
                    <Icon className={`size-4 shrink-0 ${activeTab === key ? "text-[#00D18F]" : "text-zinc-600"}`} />
                    {label}
                    {activeTab === key && <span className="ml-auto size-1.5 rounded-full bg-[#00D18F]" />}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Mobile tab nav ── */}
          <div className="flex lg:hidden items-center gap-1 border-b border-white/[0.07] pb-px mb-2 overflow-x-auto">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === key ? "border-[#00D18F] text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0">
            {activeTab === "business" && <BusinessSection data={data} onChange={handleChange} />}
            {activeTab === "ai" && <AISection data={data} onChange={handleChange} />}
            {activeTab === "account" && <AccountSection user={user} />}
          </div>
        </div>
      </div>

      {/* ── Unsaved changes sticky bar ── */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#050505]/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-400">You have unsaved changes</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setDirty(false); window.location.reload(); }}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white border border-white/[0.08] rounded-lg transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#00D18F] text-black text-xs font-semibold rounded-lg hover:bg-[#00D18F]/90 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Settings">
          <div className="flex items-center justify-center h-60">
            <Loader2 className="size-6 animate-spin text-[#00D18F]" />
          </div>
        </DashboardLayout>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
