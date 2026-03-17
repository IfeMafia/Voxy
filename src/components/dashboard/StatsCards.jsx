import React from 'react';
import { MessageSquare, Activity, CheckCircle2, UserCheck } from 'lucide-react';

const StatsCard = ({ title, value, description, icon: Icon, colorClass, bgColor, textColor }) => (
  <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl transition-all duration-300 hover:border-voxy-primary/20 hover:bg-[#141414] group">
    <div className="space-y-5">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
        <Icon size={24} className={textColor} />
      </div>
      
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
        </div>
        <p className="text-3xl font-display font-bold text-white tracking-tight leading-none mb-2">{value}</p>
        <p className="text-[11px] text-zinc-600 font-medium leading-tight">{description}</p>
      </div>
    </div>
  </div>
);

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Conversations',
      value: stats?.total || 0,
      description: 'Cumulative total conversations across all channels',
      icon: MessageSquare,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    {
      title: 'Active Today',
      value: stats?.activeToday || 0,
      description: 'Conversations with user activity within last 24h',
      icon: Activity,
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-500'
    },
    {
      title: 'AI Resolved',
      value: stats?.aiResolved || 0,
      description: 'Conversations handled entirely without human intervention',
      icon: CheckCircle2,
      bgColor: 'bg-voxy-primary/10',
      textColor: 'text-voxy-primary'
    },
    {
      title: 'Owner Interventions',
      value: stats?.ownerInterventions || 0,
      description: 'Conversations where you joined to assist the customer',
      icon: UserCheck,
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-500'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  );
};

export default StatsCards;

