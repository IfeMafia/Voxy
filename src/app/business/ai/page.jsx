"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { getBusiness, updateBusiness } from "@/lib/api/business";
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
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly & Warm", desc: "Approachable, conversational, uses polite emojis" },
  { value: "casual", label: "Casual & Direct", desc: "Quick, concise, modern chat style" },
  { value: "formal", label: "Formal & Professional", desc: "Polite, strictly business, respectful" },
];

const ACTION_OPTIONS = [
  { id: "browse_menu", label: "Browse Catalog & Products", desc: "Share items, details, and current prices" },
  { id: "recommend_products", label: "Recommend Products", desc: "Suggest items based on customer preferences" },
  { id: "place_order", label: "Take Orders", desc: "Collect items, delivery info, and create orders" },
  { id: "check_order_status", label: "Check Order Status", desc: "Look up order progress for returning customers" },
  { id: "customer_support", label: "Answer Business FAQs", desc: "Explain hours, location, delivery policies" },
];

export default function AIEmployeePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [persona, setPersona] = useState("Voxy");
  const [tone, setTone] = useState("friendly");
  const [greeting, setGreeting] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [permittedActions, setPermittedActions] = useState(["browse_menu", "place_order"]);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState("");
  const [escalationTriggers, setEscalationTriggers] = useState([]);
  const [newTrigger, setNewTrigger] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getBusiness(user.id)
      .then((biz) => {
        const ai = biz?.aiConfig || {};
        setPersona(ai.persona || "Voxy");
        setTone(ai.tone || "friendly");
        setGreeting(ai.greeting || `Hi! Welcome to ${biz?.name || "our business"}. How can I help you today?`);
        setFallbackMessage(ai.fallbackMessage || "Let me connect you with a team member who can help.");
        setPermittedActions(ai.permittedActions || ["browse_menu", "place_order", "customer_support"]);
        setRules(ai.rules || []);
        setEscalationTriggers(ai.escalationTriggers || ["speak to human", "refund", "complaint", "manager"]);
      })
      .catch((err) => {
        console.error("Load AI config error:", err);
        toast.error("Failed to load AI Employee settings");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const toggleAction = (actionId) => {
    setPermittedActions((prev) =>
      prev.includes(actionId) ? prev.filter((a) => a !== actionId) : [...prev, actionId]
    );
  };

  const addRule = (e) => {
    e?.preventDefault();
    const trimmed = newRule.trim();
    if (!trimmed) return;
    if (rules.includes(trimmed)) {
      toast.error("Rule already exists");
      return;
    }
    setRules([...rules, trimmed]);
    setNewRule("");
  };

  const removeRule = (idx) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const addTrigger = (e) => {
    e?.preventDefault();
    const trimmed = newTrigger.trim().toLowerCase();
    if (!trimmed) return;
    if (escalationTriggers.includes(trimmed)) {
      toast.error("Trigger keyword already exists");
      return;
    }
    setEscalationTriggers([...escalationTriggers, trimmed]);
    setNewTrigger("");
  };

  const removeTrigger = (idx) => {
    setEscalationTriggers(escalationTriggers.filter((_, i) => i !== idx));
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
      toast.success("AI Employee configuration updated");
    } catch (err) {
      console.error("Save AI config error:", err);
      toast.error(err.message || "Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="AI Employee">
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
          <p className="text-zinc-500 text-sm">Loading AI settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AI Employee">
      <div className="max-w-4xl mx-auto space-y-8 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Employee</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Teach Voxy how to talk to customers, what actions to take, and when to get human help.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00D18F] text-black font-semibold text-sm rounded-xl hover:bg-[#00D18F]/90 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </button>
        </div>

        {/* Section 1: How Voxy Talks */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
            <div className="size-9 rounded-lg bg-[#00D18F]/10 flex items-center justify-center">
              <MessageSquare className="size-4 text-[#00D18F]" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-base">How Voxy talks</h2>
              <p className="text-xs text-zinc-500">Define personality, greeting, and conversational tone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                Assistant Persona / Name
              </label>
              <input
                type="text"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="e.g. Voxy or Mama Put Assistant"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                Conversational Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D18F]/50 transition-colors"
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
              Greeting message
            </label>
            <textarea
              rows={2}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="First message sent when a customer opens chat..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/50 transition-colors resize-none"
            />
            <p className="text-[11px] text-zinc-600 mt-1">
              Sent automatically when customers start a conversation.
            </p>
          </div>
        </div>

        {/* Section 2: What Voxy Can Do */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
            <div className="size-9 rounded-lg bg-[#00D18F]/10 flex items-center justify-center">
              <Sparkles className="size-4 text-[#00D18F]" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-base">What Voxy can do</h2>
              <p className="text-xs text-zinc-500">Enable or disable specific capabilities for your AI employee</p>
            </div>
          </div>

          <div className="space-y-3">
            {ACTION_OPTIONS.map((action) => {
              const isChecked = permittedActions.includes(action.id);
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => toggleAction(action.id)}
                  className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                    isChecked
                      ? "bg-[#00D18F]/[0.05] border-[#00D18F]/30 text-white"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/15 hover:text-zinc-200"
                  }`}
                >
                  <div
                    className={`size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                      isChecked
                        ? "bg-[#00D18F] border-[#00D18F] text-black"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="size-3.5 text-black stroke-[3]" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">{action.label}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{action.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: When Voxy Needs Help (Escalation / Human Handoff) */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
            <div className="size-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ShieldAlert className="size-4 text-orange-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-base">When Voxy needs help</h2>
              <p className="text-xs text-zinc-500">Keywords and triggers that hand the customer over to you</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
              Escalation trigger keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {escalationTriggers.map((trig, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-300"
                >
                  {trig}
                  <button
                    type="button"
                    onClick={() => removeTrigger(idx)}
                    className="text-orange-400/60 hover:text-orange-300 transition-colors"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTrigger(e)}
                placeholder="e.g. speak to human, complaint, refund, call me..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 transition-colors"
              />
              <button
                type="button"
                onClick={addTrigger}
                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 mt-1.5">
              When a customer types one of these keywords, Voxy marks the conversation as <strong>Needs Attention</strong> and pauses automated replies.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
              Fallback message
            </label>
            <textarea
              rows={2}
              value={fallbackMessage}
              onChange={(e) => setFallbackMessage(e.target.value)}
              placeholder="What Voxy says when it doesn't know the answer..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/50 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Section 4: Rules & Guardrails */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
            <div className="size-9 rounded-lg bg-[#00D18F]/10 flex items-center justify-center">
              <Sliders className="size-4 text-[#00D18F]" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-base">Business rules & guardrails</h2>
              <p className="text-xs text-zinc-500">Specific instructions Voxy must always obey</p>
            </div>
          </div>

          <div className="space-y-3">
            {rules.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">
                No specific rules added. Voxy will follow general product guidelines.
              </p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-200"
                  >
                    <span>• {rule}</span>
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Remove rule"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRule(e)}
                placeholder="e.g. Never offer discounts without manager approval..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors"
              />
              <button
                type="button"
                onClick={addRule}
                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Plus className="size-3.5" /> Add rule
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#00D18F] text-black font-semibold text-sm rounded-xl hover:bg-[#00D18F]/90 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-[#00D18F]/10"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save AI settings
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
