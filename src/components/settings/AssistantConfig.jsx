import React from 'react';
import { Label } from '@/components/ui/label';
import { Bot, MessageSquareText, Sparkles } from 'lucide-react';

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
    <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Bot size={20} className="text-[#00D18F]" />
          </div>
          <h3 className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Assistant profile</h3>
        </div>
      </div>
      
      <div className="space-y-10">
        <div className="space-y-4">
          <Label htmlFor="assistant_tone" className="text-xs font-bold text-zinc-500 uppercase tracking-wide ml-1">Voice tone</Label>
          <p className="text-xs text-zinc-600 font-medium leading-relaxed max-w-sm mb-4">Select the operational tone for all automated customer interactions.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => onChange({ ...data, assistant_tone: tone })}
                className={`h-11 text-[11px] font-bold uppercase tracking-wider rounded-xl border transition-all ${
                  data.assistant_tone === tone
                    ? 'bg-[#00D18F]/5 border-[#00D18F]/30 text-[#00D18F]'
                    : 'bg-white/5 border-white/5 text-zinc-600 hover:text-white hover:border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/[0.03]">
          <div className="flex items-center justify-between">
            <Label htmlFor="assistant_instructions" className="text-xs font-bold text-zinc-500 uppercase tracking-wide ml-1">Specific instructions</Label>
          </div>
          <p className="text-xs text-zinc-600 font-medium leading-relaxed max-w-sm mb-4">Detailed behavioral rules or information the AI should follow.</p>
          <div className="relative group">
            <MessageSquareText className="absolute top-4 left-4 w-4 h-4 text-zinc-800 transition-colors group-focus-within:text-[#00D18F]/50" />
            <textarea
              id="assistant_instructions"
              name="assistant_instructions"
              value={data.assistant_instructions || ''}
              onChange={handleInputChange}
              placeholder="e.g. Be polite. If a customer asks about prices, mention our weekly 10% discount on cakes."
              rows={5}
              className="w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 py-4 text-sm text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#00D18F]/40 transition-all font-medium leading-relaxed resize-none shadow-inner"
            />
          </div>
        </div>

        <div className="p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="text-[#00D18F]/60 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1.5 leading-none">Best practice</p>
              <p className="text-[12px] text-zinc-600 font-medium leading-relaxed">
                Be specific. Instead of "be nice", say "greet the customer with 'Hello! How can I help you today?' and keep responses under 2 sentences."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantConfig;
