"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

const ConversationChart = ({ data, timeRange, setTimeRange }) => {
  const [isRechartsLoaded, setIsRechartsLoaded] = useState(false);

  useEffect(() => {
    import('recharts').then(() => {
      setIsRechartsLoaded(true);
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-[#111111] border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Conversation Activity</h2>
          <p className="text-zinc-500 text-xs mt-1">Monitor your message volume over time</p>
        </div>
        
        <div className="flex bg-[#0a0a0a] p-1 rounded-xl self-start border border-white/5">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                timeRange === range 
                  ? 'bg-[#1a1a1a] text-white' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        {isRechartsLoaded && data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#71717a' }}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: '#71717a' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                itemStyle={{ color: '#00D18F', fontWeight: 700, fontSize: '12px' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#00D18F" 
                strokeWidth={2}
                fill="#00D18F"
                fillOpacity={0.1}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : !isRechartsLoaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#00D18F]/20 border-t-[#00D18F] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <p className="text-xs font-medium">No activity detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationChart;

