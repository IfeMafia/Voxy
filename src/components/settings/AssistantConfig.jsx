import React from 'react';
import { Label } from '@/components/ui/label';
import { Bot, MessageSquareText } from 'lucide-react';

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
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 sm:p-6 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-5 h-5 text-[#00D18F]" />
        <h3 className="text-lg font-medium text-white">Assistant Configuration</h3>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="assistant_tone" className="text-zinc-300">Assistant Tone</Label>
          <p className="text-xs text-zinc-500 mb-2">How should the AI assistant sound when talking to customers?</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => onChange({ ...data, assistant_tone: tone })}
                className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                  data.assistant_tone === tone
                    ? 'bg-[#00D18F]/20 border-[#00D18F] text-[#00D18F] font-medium'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="assistant_instructions" className="text-zinc-300">System Instructions</Label>
            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">Voxy Intelligence</span>
          </div>
          <p className="text-xs text-zinc-500 mb-2">Specific rules or information the AI should follow.</p>
          <div className="relative">
            <MessageSquareText className="absolute top-3 left-3 w-4 h-4 text-zinc-600" />
            <textarea
              id="assistant_instructions"
              name="assistant_instructions"
              value={data.assistant_instructions || ''}
              onChange={handleInputChange}
              placeholder="Example: Answer customer questions clearly. If a customer asks about prices, encourage them to visit the store."
              rows={5}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/30 pl-10 pr-4 py-3 text-sm ring-offset-background placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00D18F]/20 focus:border-[#00D18F] transition-all text-white resize-none"
            />
          </div>
        </div>

        <div className="p-4 bg-zinc-800/20 border border-amber-900/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-amber-500/80 uppercase tracking-wider mb-1">PRO TIP</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Be specific. Instead of saying "be nice", say "greet the customer with 'Hello! How can I help you today?' and keep responses under 2 sentences."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantConfig;
