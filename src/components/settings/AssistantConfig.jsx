import React from 'react';
import { Label } from '@/components/ui/label';
import { Bot, MessageSquareText, Sparkles, HelpCircle } from 'lucide-react';

const TONES = [
  'Friendly',
  'Professional',
  'Casual',
  'Formal'
];

const AssistantConfig = ({ data, onChange }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-2xl p-6 shadow-sm transition-colors duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center">
            <Bot size={20} className="text-[#00D18F]" />
          </div>
          <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-600">AI assistant</h3>
        </div>
      </div>
      
      <div className="space-y-10">
        <div className="space-y-4">
          <Label htmlFor="assistant_tone" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Speaking style</Label>
          <p className="text-xs text-zinc-500 dark:text-zinc-600 font-medium leading-relaxed max-w-sm mb-4">Choose how your AI should talk to customers.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => onChange({ ...data, assistant_tone: tone })}
                className={`h-11 text-[11px] font-bold rounded-xl border transition-all ${
                  data.assistant_tone === tone
                    ? 'bg-[#00D18F]/5 border-[#00D18F]/30 text-[#00D18F]'
                    : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-[#222222] text-zinc-500 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-white/[0.03]">
          <div className="flex items-center gap-2">
            <Label htmlFor="assistant_instructions" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">AI instructions</Label>
            <div className="group relative">
              <HelpCircle size={14} className="text-zinc-300 dark:text-zinc-800 cursor-help hover:text-[#00D18F] transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70]">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Tell the AI <span className="text-white font-bold">how to answer questions</span>. Tell it what to say and what NOT to say so it can help your customers better.
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900"></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-600 font-medium leading-relaxed max-w-sm mb-4">Give your AI some rules to follow.</p>
          <div className="relative group">
            <MessageSquareText className="absolute top-4 left-4 w-4 h-4 text-zinc-800 transition-colors group-focus-within:text-[#00D18F]/50" />
            <textarea
              id="assistant_instructions"
              name="assistant_instructions"
              value={data.assistant_instructions || ''}
              onChange={handleInputChange}
              placeholder="e.g. Be polite. If a customer asks about prices, mention our weekly 10% discount on cakes."
              rows={5}
              className="w-full rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 pl-12 pr-4 py-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-800 focus:outline-none focus:border-[#00D18F]/40 transition-all font-medium leading-relaxed resize-none shadow-inner"
            />
          </div>
        </div>

        <div className="p-5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] rounded-2xl">
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="text-[#00D18F]/60 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-zinc-900 dark:text-white mb-1.5 leading-none">Best practice</p>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-600 font-medium leading-relaxed">
                Be specific. Instead of "be nice", say "greet the customer with 'Hello! How can I help you today?'."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantConfig;
