'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useUserStore from '@/store/useUserStore';
import { updateBusiness } from '@/lib/api/business';
import toast from 'react-hot-toast';
import { Languages, Check, Loader2, Globe } from 'lucide-react';

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', description: 'Standard global business English' },
  { code: 'pcm', name: 'Nigerian Pidgin', description: 'Natural, informal Nigerian Pidgin' },
  { code: 'yo', name: 'Yoruba', description: 'Fluent Yoruba for Western Nigeria' },
  { code: 'ha', name: 'Hausa', description: 'Fluent Hausa for Northern Nigeria' },
  { code: 'ig', name: 'Igbo', description: 'Fluent Igbo for Eastern Nigeria' },
];

export default function LanguagesPage() {
  const { business, user, setBusiness } = useUserStore();
  const [selectedLangs, setSelectedLangs] = useState(['en']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const activeBiz = business || user;
    if (activeBiz?.supportedLanguages && Array.isArray(activeBiz.supportedLanguages)) {
      setSelectedLangs(activeBiz.supportedLanguages);
    }
  }, [business, user]);

  const toggleLanguage = (code) => {
    setSelectedLangs((prev) => {
      const isSelected = prev.includes(code);
      if (isSelected) {
        if (prev.length <= 1) {
          toast.error('Store must support at least one language.');
          return prev;
        }
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const handleSave = async () => {
    const activeBiz = business || user;
    if (!activeBiz?.id) {
      toast.error('No active business loaded.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateBusiness(activeBiz.id, {
        supportedLanguages: selectedLangs,
      });

      if (res?.data || res?.business) {
        const updated = res.data || res.business;
        setBusiness(updated);
        toast.success('Multilingual settings saved successfully!');
      } else {
        toast.success('Languages updated!');
      }
    } catch (err) {
      console.error('[LanguagesPage] Save error:', err);
      toast.error(err.message || 'Failed to save language settings.');
    } finally {
      setSaving(false);
    }
  };

  const isMultilingualActive = selectedLangs.length > 1 || (selectedLangs.length === 1 && selectedLangs[0] !== 'en');

  return (
    <DashboardLayout title="Languages">
      <div className="p-6 md:p-8 max-w-4xl space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#00D18F]/10 border border-[#00D18F]/20 flex items-center justify-center text-[#00D18F]">
              <Languages className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Multilingual Settings</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Control which languages Voxy is allowed to converse in for your store.</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-[#00D18F]" />
            <div>
              <p className="text-xs font-semibold text-white">
                Multilingual Adaptive Responses: <span className={isMultilingualActive ? "text-[#00D18F]" : "text-amber-400"}>{isMultilingualActive ? "Enabled" : "Disabled (English Only)"}</span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isMultilingualActive
                  ? "Voxy will match customer language & register (English, Pidgin, Yoruba, Hausa, Igbo) while keeping product prices verbatim."
                  : "Voxy responds strictly in English for all customers."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isChecked = selectedLangs.includes(lang.code);
            return (
              <div
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isChecked
                    ? "bg-[#00D18F]/10 border-[#00D18F]/30 text-white shadow-lg shadow-[#00D18F]/5"
                    : "bg-white/[0.02] border-white/[0.07] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{lang.name}</span>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 bg-white/[0.05] px-1.5 py-0.5 rounded">
                      {lang.code}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{lang.description}</p>
                </div>
                <div
                  className={`size-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked ? "bg-[#00D18F] border-[#00D18F]" : "border-zinc-700 bg-white/[0.02]"
                  }`}
                >
                  {isChecked && <Check className="size-3 text-black stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto h-11 px-6 bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          <span>Save Multilingual Settings</span>
        </button>
      </div>
    </DashboardLayout>
  );
}
