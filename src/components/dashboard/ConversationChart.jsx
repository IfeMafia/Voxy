"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Activity } from 'lucide-react';

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
    <div className="bg-[#0A0A0A] border border-[#222222] rounded-2xl flex flex-col h-full min-h-[400px]">
      <div className="p-6 pb-2 flex flex-row items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-voxy-text">Conversation Activity</h2>
          <p className="text-sm text-voxy-muted mt-1">Monitor your message volume over time</p>
        </div>
        <div className="flex bg-[#141414] rounded-lg p-1 border border-[#222222]">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-300 ${
                timeRange === range 
                  ? 'bg-[#222222] text-voxy-text shadow-sm' 
                  : 'text-voxy-muted hover:text-voxy-text'
              }`}
            >
              {range === '24h' ? '24H' : range === '7d' ? '7 DAYS' : '30 DAYS'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 pt-0 flex items-center justify-center">
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
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <Activity className="size-6 text-zinc-700" />
            </div>
            <p className="text-zinc-400 font-medium text-sm">No activity recorded</p>
            <p className="text-zinc-600 text-[11px] max-w-[200px] mt-1">Activity data will appear here once customers start reaching out.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationChart;
