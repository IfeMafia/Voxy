import React from 'react';
import { MessageSquare, Activity, CheckCircle2, UserCheck } from 'lucide-react';

const StatsCard = ({ title, value, description, icon: Icon, colorClass, bgColor, textColor }) => (
  <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-5 rounded-2xl transition-all duration-300 hover:border-[#333333] group hover:bg-[#0D0D0D]">
    <div className="flex items-start justify-between mb-5">
      <div className={`size-10 rounded-xl ${bgColor} flex items-center justify-center transition-colors group-hover:bg-[#1A1A1A] duration-500`}>
        <Icon size={20} className={textColor} />
      </div>
      <div className="text-[11px] font-semibold text-zinc-500 tracking-tight text-right">{title}</div>
    </div>
    
    <div>
      <h3 className="text-3xl font-bold text-voxy-text mb-1 tracking-tighter">{value}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed font-medium">{description}</p>
    </div>
  </div>
);

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total chats',
      value: stats?.total || 0,
      description: 'Total messages processed',
      icon: MessageSquare,
      bgColor: 'bg-white/5',
      textColor: 'text-zinc-400'
    },
    {
      title: 'Active today',
      value: stats?.activeToday || 0,
      description: 'Chats in last 24 hours',
      icon: Activity,
      bgColor: 'bg-indigo-500/5',
      textColor: 'text-indigo-400'
    },
    {
      title: 'AI resolved',
      value: stats?.aiResolved || 0,
      description: 'Handled automatically',
      icon: CheckCircle2,
      bgColor: 'bg-voxy-primary/5',
      textColor: 'text-voxy-primary'
    },
    {
      title: 'Needs review',
      value: stats?.ownerInterventions || 0,
      description: 'Pending your attention',
      icon: UserCheck,
      bgColor: 'bg-orange-500/5',
      textColor: 'text-orange-400'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  );
};

export default StatsCards;
