"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness, useInvalidators } from "@/hooks/useBusinessData";
import { updateBusiness } from "@/lib/api/business";
import {
  Bot,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Sliders,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";

const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly & Warm", desc: "Approachable, conversational, uses polite emojis" },
  { value: "casual",   label: "Casual & Direct",  desc: "Quick, concise, modern chat style" },
  { value: "formal",   label: "Formal & Professional", desc: "Polite, strictly business, respectful" },
];

const ACTION_OPTIONS = [
  { id: "browse_menu",          label: "Browse Catalog & Products",  desc: "Share items, details, and current prices" },
  { id: "recommend_products",   label: "Recommend Products",         desc: "Suggest items based on customer preferences" },
  { id: "place_order",          label: "Take Orders",                desc: "Collect items, delivery info, and create orders" },
  { id: "check_order_status",   label: "Check Order Status",         desc: "Look up order progress for returning customers" },
  { id: "customer_support",     label: "Answer Business FAQs",       desc: "Explain hours, location, delivery policies" },
];

const inputCls = "w-full bg-black border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/50 transition-colors";
const labelCls = "text-xs font-medium text-zinc-400 block mb-1.5";

function Section({ icon: Icon, iconColor = "text-[#00D18F]", iconBg = "bg-[#00D18F]/10", title, subtitle, children }) {
  return (
    <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className={`size-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`size-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  );
}

export default function AIEmployeePage() {
  const { user } = useAuth();
  const { data: business, isLoading: loading } = useBusiness(user?.id);
  const { invalidateBusiness } = useInvalidators();

  const [saving, setSaving] = useState(false);
  const [persona, setPersona] = useState("Voxy");
  const [tone, setTone] = useState("friendly");
  const [greeting, setGreeting] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [permittedActions, setPermittedActions] = useState(["browse_menu", "place_order", "customer_support"]);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState("");
  const [escalationTriggers, setEscalationTriggers] = useState([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!business) return;
    const ai = business?.aiConfig || {};
    setPersona(ai.persona || "Voxy");
    setTone(ai.tone || "friendly");
    setGreeting(ai.greeting || `Hi! Welcome to ${business?.name || "our business"}. How can I help you today?`);
    setFallbackMessage(ai.fallbackMessage || "Let me connect you with a team member who can help.");
    setPermittedActions(ai.permittedActions || ["browse_menu", "place_order", "customer_support"]);
    setRules(ai.rules || []);
    setEscalationTriggers(ai.escalationTriggers || ["speak to human", "refund", "complaint", "manager"]);
    setDirty(false);
  }, [business]);

  const mark = (fn) => (...args) => { fn(...args); setDirty(true); };

  const toggleAction = mark((actionId) => {
    setPermittedActions(prev =>
      prev.includes(actionId) ? prev.filter(a => a !== actionId) : [...prev, actionId]
    );
  });

  const addRule = (e) => {
    e?.preventDefault();
    const trimmed = newRule.trim();
    if (!trimmed) return;
    if (rules.includes(trimmed)) { toast.error("Rule already exists"); return; }
    setRules([...rules, trimmed]);
    setNewRule("");
    setDirty(true);
  };

  const addTrigger = (e) => {
    e?.preventDefault();
    const trimmed = newTrigger.trim().toLowerCase();
    if (!trimmed) return;
    if (escalationTriggers.includes(trimmed)) { toast.error("Trigger already exists"); return; }
    setEscalationTriggers([...escalationTriggers, trimmed]);
    setNewTrigger("");
    setDirty(true);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateBusiness(user.id, {
        aiConfig: {
          persona: persona.trim() || "Voxy",
          tone,
          greeting: greeting.trim(),
          fallbackMessage: fallbackMessage.trim(),
          permittedActions,
          rules,
          escalationTriggers,
        },
      });
      toast.success("AI Employee settings saved");
      setDirty(false);
      invalidateBusiness(user.id);
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const selectedTone = TONE_OPTIONS.find(t => t.value === tone) || TONE_OPTIONS[0];

  if (loading) {
    return (
      <DashboardLayout title="AI Employee">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {[120, 200, 180, 160].map((h, i) => (
            <div key={i} className="animate-pulse bg-white/[0.03] border border-white/[0.06] rounded-2xl" style={{ height: h }} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AI Employee">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-5">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Employee</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Configure how Voxy talks, acts, and escalates to you.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 h-9 px-4 bg-[#00D18F] text-black font-semibold text-sm rounded-lg hover:bg-[#00D18F]/90 disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </button>
        </div>

        {/* Live preview banner */}
        <div className="flex items-start gap-3 p-4 bg-[#00D18F]/[0.04] border border-[#00D18F]/15 rounded-2xl">
          <div className="size-8 rounded-lg bg-[#00D18F]/10 flex items-center justify-center shrink-0">
            <Sparkles className="size-4 text-[#00D18F]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Preview as customer</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Voxy greets customers with: <span className="text-zinc-300 italic">"{greeting || 'No greeting set yet.'}"</span>
            </p>
          </div>
        </div>

        {/* 1. Identity & Tone */}
        <Section icon={MessageSquare} title="Identity & Tone" subtitle="Personality, name, and how Voxy speaks">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Assistant name</label>
              <input
                type="text"
                value={persona}
                onChange={e => { setPersona(e.target.value); setDirty(true); }}
                placeholder="e.g. Voxy or Mama Put Assistant"
                className={inputCls}
              />
              <p className="text-[11px] text-zinc-600 mt-1">How customers see the AI in chat.</p>
            </div>
            <div>
              <label className={labelCls}>Conversational tone</label>
              <div className="relative">
                <select
                  value={tone}
                  onChange={e => { setTone(e.target.value); setDirty(true); }}
                  className={inputCls + " appearance-none pr-8"}
                >
                  {TONE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
              </div>
              <p className="text-[11px] text-zinc-600 mt-1">{selectedTone.desc}</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Opening greeting</label>
            <textarea
              rows={2}
              value={greeting}
              onChange={e => { setGreeting(e.target.value); setDirty(true); }}
              placeholder="First message sent when a customer starts a conversation..."
              className={inputCls + " resize-none"}
            />
            <p className="text-[11px] text-zinc-600 mt-1">Sent automatically when customers open chat.</p>
          </div>
        </Section>

        {/* 2. Capabilities */}
        <Section icon={Sparkles} title="Capabilities" subtitle="What actions Voxy is permitted to perform">
          <div className="space-y-2.5">
            {ACTION_OPTIONS.map(action => {
              const enabled = permittedActions.includes(action.id);
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => toggleAction(action.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    enabled
                      ? "bg-[#00D18F]/[0.05] border-[#00D18F]/25"
                      : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`size-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                    enabled ? "bg-[#00D18F] border-[#00D18F]" : "border-white/20 bg-transparent"
                  }`}>
                    {enabled && <CheckCircle2 className="size-3.5 text-black stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{action.desc}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${
                    enabled ? "bg-[#00D18F]/10 text-[#00D18F]" : "bg-white/[0.04] text-zinc-600"
                  }`}>
                    {enabled ? "On" : "Off"}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 3. Escalation */}
        <Section
          icon={ShieldAlert}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          title="Escalation & Handoff"
          subtitle="When Voxy pauses and alerts you to take over"
        >
          <div>
            <label className={labelCls}>Trigger keywords</label>
            <p className="text-[11px] text-zinc-600 mb-3">
              When a customer types one of these, Voxy marks the conversation as <strong className="text-zinc-400">Needs Attention</strong> and pauses.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {escalationTriggers.map((trig, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300"
                >
                  {trig}
                  <button
                    type="button"
                    onClick={() => { setEscalationTriggers(escalationTriggers.filter((_, i) => i !== idx)); setDirty(true); }}
                    className="text-amber-400/50 hover:text-amber-300 transition-colors"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
              {escalationTriggers.length === 0 && (
                <p className="text-xs text-zinc-600 italic">No triggers set. Add keywords below.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTrigger}
                onChange={e => setNewTrigger(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTrigger(e)}
                placeholder="e.g. speak to human, complaint, refund..."
                className={inputCls + " flex-1"}
              />
              <button
                type="button"
                onClick={addTrigger}
                className="h-10 px-4 bg-white/[0.05] border border-white/[0.09] text-white rounded-xl text-xs font-semibold hover:bg-white/[0.09] transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Fallback message</label>
            <textarea
              rows={2}
              value={fallbackMessage}
              onChange={e => { setFallbackMessage(e.target.value); setDirty(true); }}
              placeholder="What Voxy says when it doesn't know the answer..."
              className={inputCls + " resize-none"}
            />
          </div>
        </Section>

        {/* 4. Business rules */}
        <Section icon={Sliders} title="Business Rules" subtitle="Specific instructions Voxy must always follow">
          <div className="space-y-2">
            {rules.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No rules yet. Add instructions Voxy must always follow.</p>
            ) : (
              rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                >
                  <span className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-zinc-600 shrink-0 mt-0.5">•</span> {rule}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setRules(rules.filter((_, i) => i !== idx)); setDirty(true); }}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addRule(e)}
              placeholder="e.g. Never offer discounts without manager approval..."
              className={inputCls + " flex-1"}
            />
            <button
              type="button"
              onClick={addRule}
              className="h-10 px-4 bg-white/[0.05] border border-white/[0.09] text-white rounded-xl text-xs font-semibold hover:bg-white/[0.09] transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
        </Section>
      </div>

      {/* Sticky save bar — only visible when dirty */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/95 backdrop-blur border-t border-white/[0.08] lg:left-56">
          <p className="text-xs text-zinc-400">You have unsaved changes.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (business) { const ai = business.aiConfig || {}; setPersona(ai.persona || "Voxy"); setTone(ai.tone || "friendly"); setGreeting(ai.greeting || ""); setFallbackMessage(ai.fallbackMessage || ""); setPermittedActions(ai.permittedActions || []); setRules(ai.rules || []); setEscalationTriggers(ai.escalationTriggers || []); setDirty(false); } }}
              className="h-9 px-4 border border-white/[0.09] text-zinc-400 hover:text-white text-xs font-medium rounded-xl transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-5 bg-[#00D18F] text-black font-semibold text-xs rounded-xl hover:bg-[#00D18F]/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save changes
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
