import React from 'react';
import { Zap, ShieldCheck, Smile, Briefcase, Sparkles } from 'lucide-react';

const tones = [
  { id: 'Friendly', icon: Smile, color: 'text-yellow-400' },
  { id: 'Professional', icon: Briefcase, color: 'text-blue-400' },
  { id: 'Casual', icon: Zap, color: 'text-orange-400' },
  { id: 'Formal', icon: ShieldCheck, color: 'text-purple-400' }
];

const AssistantConfig = ({ config, setConfig }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleToneSelect = (tone) => {
    setConfig(prev => ({ ...prev, assistant_tone: tone }));
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D18F]/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-black text-white italic tracking-tight">Intelligence <span className="text-[#00D18F]">Sync</span></h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 opacity-60">Assistant behavior matrices</p>
        </div>
        <div className="p-3 rounded-2xl bg-[#00D18F]/10 text-[#00D18F]">
          <Sparkles size={24} />
        </div>
      </div>
      
      <div className="space-y-4 relative z-10">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Behavioral Tone</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tones.map(({ id, icon: Icon, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleToneSelect(id)}
              className={`flex flex-col items-center gap-4 p-5 rounded-2xl border transition-all duration-500 group/btn ${
                config.assistant_tone === id
                  ? 'bg-[#00D18F] text-black border-[#00D18F] shadow-[0_0_30px_rgba(0,209,143,0.3)] scale-105'
                  : 'bg-white/[0.02] text-zinc-500 border-white/5 hover:border-[#00D18F]/30'
              }`}
            >
              <Icon size={24} className={config.assistant_tone === id ? 'text-black' : `${color} group-hover/btn:scale-110 transition-transform`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Primary Protocols</label>
          <span className="text-[9px] font-black text-[#00D18F] uppercase tracking-widest opacity-60">AI Core Directives</span>
        </div>
        <textarea
          name="assistant_instructions"
          value={config.assistant_instructions || ''}
          onChange={handleChange}
          placeholder="e.g. Prioritize clarity. Focus on reservation flow. Maintain elite service standards."
          rows={6}
          className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] py-5 px-6 text-white text-sm focus:outline-none focus:border-[#00D18F]/30 focus:ring-4 focus:ring-[#00D18F]/5 transition-all duration-500 resize-none leading-relaxed"
        />
        <div className="flex items-center gap-2 px-1 text-[9px] text-zinc-600 font-black uppercase tracking-[0.1em] italic">
          <ShieldCheck size={12} className="text-[#00D18F]/40" />
          These instructions define the AI's core mission and personality traits.
        </div>
      </div>
    </div>
  );
};

export default AssistantConfig;
