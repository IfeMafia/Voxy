import React from 'react';
import { MessageSquare, Users, CheckCircle, AlertCircle } from 'lucide-react';

const StatsCard = ({ title, value, description, icon: Icon, colorClass }) => (
  <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl transition-all duration-300 hover:border-[#00D18F]/20">
    <div className="space-y-4">
      <div className={`w-10 h-10 rounded-lg ${colorClass} bg-opacity-10 flex items-center justify-center`}>
        <Icon size={20} className={colorClass.split(' ')[0]} />
      </div>
      
      <div>
        <h3 className="text-zinc-500 text-xs font-semibold mb-1">{title}</h3>
        <p className="text-3xl font-display font-bold text-white tracking-tight">{value}</p>
        <p className="text-[10px] text-zinc-600 mt-1 font-medium">{description}</p>
      </div>
    </div>
  </div>
);

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Conversations',
      value: stats?.total || 0,
      description: 'Cumulative total conversations',
      icon: MessageSquare,
      colorClass: 'text-blue-400 bg-blue-400'
    },
    {
      title: 'Active Conversations Today',
      value: stats?.activeToday || 0,
      description: 'Conversations with activity today',
      icon: Users,
      colorClass: 'text-purple-400 bg-purple-400'
    },
    {
      title: 'AI Resolved Conversations',
      value: stats?.aiResolved || 0,
      description: 'Handled entirely by AI',
      icon: CheckCircle,
      colorClass: 'text-[#00D18F] bg-[#00D18F]'
    },
    {
      title: 'Owner Interventions',
      value: stats?.ownerInterventions || 0,
      description: 'Owner replied at least once',
      icon: AlertCircle,
      colorClass: 'text-orange-400 bg-orange-400'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  );
};

export default StatsCards;

