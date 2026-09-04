"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/useUserStore";
import { updateBusiness } from "@/lib/api/business";
import { ArrowRight, Check, Loader2 } from "lucide-react";

/* ── Step definitions ─────────────────────────────────────────── */
const STEPS = ["name", "description", "offering", "helpWith"];

const OFFERING_OPTIONS = [
  { value: "products", label: "Products", sub: "Physical or digital items" },
  { value: "services", label: "Services", sub: "Work done for customers" },
  { value: "both", label: "Products & Services", sub: "A mix of both" },
];

const HELP_OPTIONS = [
  { value: "answer_questions", label: "Answer questions" },
  { value: "recommend_products", label: "Recommend products" },
  { value: "place_order", label: "Take orders" },
  { value: "sales_support", label: "Help with sales" },
  { value: "customer_support", label: "Customer support" },
];

const CATEGORY_MAP = {
  products: "Retail",
  services: "Services",
  both: "Retail & Services",
};

/* ── Progress bar ─────────────────────────────────────────────── */
function ProgressBar({ step }) {
  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  return (
    <div className="w-full h-0.5 bg-white/8 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#00D18F] transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [offering, setOffering] = useState("");
  const [helpWith, setHelpWith] = useState([]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const businessId = user?.id;

  /* ── Helpers ──────────────────────────────────────────────── */
  const toggleHelp = (val) =>
    setHelpWith((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );

  const canContinue = () => {
    if (step === 0) return businessName.trim().length >= 2;
    if (step === 1) return description.trim().length >= 10;
    if (step === 2) return offering !== "";
    if (step === 3) return helpWith.length > 0;
    return false;
  };

  /* ── Save & advance ───────────────────────────────────────── */
  const handleContinue = async () => {
    if (!canContinue() || saving) return;

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final step — save everything
    setSaving(true);
    try {
      const updated = await updateBusiness(businessId, {
        name: businessName.trim(),
        slug: businessName.trim(),
        description: description.trim(),
        category: CATEGORY_MAP[offering] || "General",
        aiConfig: {
          persona: "Voxy",
          tone: "friendly",
          greeting: `Hi! Welcome to ${businessName.trim()}. How can I help you today?`,
          fallbackMessage: "Let me connect you with our team.",
          permittedActions: helpWith,
          rules: [],
          escalationTriggers: ["speak to human", "human", "agent"],
        },
      });
      if (updated) {
        useUserStore.getState().setUser(updated);
      }
      setDone(true);
    } catch (err) {
      console.error("Onboarding save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Done screen ──────────────────────────────────────────── */
  if (done) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="size-16 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/30 flex items-center justify-center mx-auto">
            <Check className="size-8 text-[#00D18F]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Your Voxy is ready.
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We've got the basics. You can now start teaching Voxy about your
              business and sharing it with customers.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/business/dashboard")}
              className="w-full h-11 bg-[#00D18F] text-black font-semibold rounded-xl hover:bg-[#00D18F]/90 transition-colors flex items-center justify-center gap-2"
            >
              Go to dashboard
              <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => router.push(`/${user?.slug}`)}
              className="w-full h-11 border border-white/10 text-zinc-300 font-medium rounded-xl hover:border-white/20 hover:text-white transition-colors"
            >
              Test Voxy
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Onboarding screens ───────────────────────────────────── */
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/favicon.jpg" alt="Voxy" className="size-7 rounded-lg" />
          <span className="font-bold text-white text-sm">Voxy</span>
        </div>
        <span className="text-xs text-zinc-500 font-medium">
          {step + 1} of {STEPS.length}
        </span>
      </header>

      {/* Progress */}
      <div className="px-6 pt-4">
        <ProgressBar step={step} />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-8 animate-fade-in-up">

          {/* ── Screen 0: Business name ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Hey {firstName} 👋<br />
                  Let's get your business set up.
                </h1>
                <p className="text-zinc-400 text-sm">
                  What's the name of your business?
                </p>
              </div>
              <input
                autoFocus
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                placeholder="e.g. Mama's Kitchen"
                className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 px-4 py-3.5 text-base focus:outline-none focus:border-[#00D18F]/50 transition-colors"
              />
            </div>
          )}

          {/* ── Screen 1: Description ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  What is {businessName} about?
                </h1>
                <p className="text-zinc-400 text-sm">
                  Tell us a little about what you do. This helps Voxy understand
                  your business.
                </p>
              </div>
              <textarea
                autoFocus
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. We sell Nigerian food and deliver across Lagos."
                className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 px-4 py-3.5 text-base focus:outline-none focus:border-[#00D18F]/50 transition-colors resize-none"
              />
            </div>
          )}

          {/* ── Screen 2: What do you offer ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  What do you offer?
                </h1>
                <p className="text-zinc-400 text-sm">
                  Choose what best describes your business.
                </p>
              </div>
              <div className="space-y-3">
                {OFFERING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOffering(opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border text-left transition-all ${
                      offering === opt.value
                        ? "border-[#00D18F]/50 bg-[#00D18F]/8 text-white"
                        : "border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{opt.sub}</div>
                    </div>
                    <div
                      className={`size-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        offering === opt.value
                          ? "border-[#00D18F] bg-[#00D18F]"
                          : "border-white/20"
                      }`}
                    >
                      {offering === opt.value && (
                        <Check className="size-3 text-black" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 3: What should Voxy help with ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  What should Voxy help your customers with?
                </h1>
                <p className="text-zinc-400 text-sm">
                  Select everything that applies. You can change this later.
                </p>
              </div>
              <div className="space-y-2">
                {HELP_OPTIONS.map((opt) => {
                  const selected = helpWith.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleHelp(opt.value)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-[#00D18F]/50 bg-[#00D18F]/8 text-white"
                          : "border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      <div
                        className={`size-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                          selected
                            ? "border-[#00D18F] bg-[#00D18F]"
                            : "border-white/25"
                        }`}
                      >
                        {selected && <Check className="size-3 text-black" />}
                      </div>
                      <span className="font-medium text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={!canContinue() || saving}
            className="w-full h-11 bg-[#00D18F] text-black font-semibold rounded-xl hover:bg-[#00D18F]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : step === STEPS.length - 1 ? (
              "Finish setup"
            ) : (
              <>
                Continue
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          {/* Back */}
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
