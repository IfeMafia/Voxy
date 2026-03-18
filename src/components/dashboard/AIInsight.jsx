"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Cpu, Zap, Target } from 'lucide-react';

export default function AIInsight({ data }) {
  if (!data) return null;

  const COLORS = ['#00D18F', '#3b82f6', '#8b5cf6'];

  return (
    <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">AI Engine Pulse</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Provider Distribution</p>
        </div>
        <div className="size-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#00D18F]">
          <Cpu className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 h-[200px] relative">
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.model_distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="usage"
              >
                {data.model_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: 'white' }}
              />
            </PieChart>
         </ResponsiveContainer>
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-white">75%</span>
         </div>
      </div>

      <div className="mt-8 space-y-4">
         {data.model_distribution.map((model, idx) => (
           <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                 <span className="text-[10px] font-bold text-zinc-400 uppercase">{model.name}</span>
              </div>
              <span className="text-[10px] font-black text-white">{model.usage}%</span>
           </div>
         ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
         <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
               <Zap className="w-3 h-3 text-yellow-500" />
               <span className="text-[8px] font-black uppercase">Efficiency</span>
            </div>
            <div className="text-xs font-black text-white">High</div>
         </div>
         <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
               <Target className="w-3 h-3 text-red-500" />
               <span className="text-[8px] font-black uppercase">Accuracy</span>
            </div>
            <div className="text-xs font-black text-white">99.1%</div>
         </div>
      </div>
    </div>
  );
}
