import React from 'react';
import { Clock, Moon } from 'lucide-react';

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const BusinessHoursEditor = ({ hours, setHours }) => {
  const handleToggleClosed = (day) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day]?.closed }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D18F]/5 blur-[100px] rounded-full pointer-events-none" />
      
      <h2 className="text-2xl font-display font-black text-white italic tracking-tight relative z-10">Operation <span className="text-[#00D18F]">Cycles</span></h2>
      
      <div className="space-y-4 relative z-10">
        {days.map((day) => {
          const dayData = hours[day] || { open: '09:00', close: '18:00', closed: false };
          const isClosed = dayData.closed;

          return (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.03] group/row hover:border-[#00D18F]/20 transition-all duration-500">
              <div className="flex items-center gap-5 mb-4 sm:mb-0">
                <div className={`size-12 rounded-xl flex items-center justify-center transition-all duration-500 ${isClosed ? 'bg-zinc-800/50 text-zinc-600' : 'bg-[#00D18F]/10 text-[#00D18F] shadow-[0_0_15px_rgba(0,209,143,0.1)]'}`}>
                  {isClosed ? <Moon size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <span className={`font-bold text-sm transition-colors duration-500 ${isClosed ? 'text-zinc-600' : 'text-zinc-200'}`}>{day}</span>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isClosed ? 'text-zinc-700' : 'text-[#00D18F]/60'}`}>
                    {isClosed ? 'Suspended' : 'Operational'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    disabled={isClosed}
                    value={dayData.open}
                    onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-xl py-2 px-4 text-xs text-white disabled:opacity-10 transition-all focus:outline-none focus:border-[#00D18F]/30 font-medium"
                  />
                  <span className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">to</span>
                  <input
                    type="time"
                    disabled={isClosed}
                    value={dayData.close}
                    onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-xl py-2 px-4 text-xs text-white disabled:opacity-10 transition-all focus:outline-none focus:border-[#00D18F]/30 font-medium"
                  />
                </div>

                <div className="w-[1px] h-8 bg-white/5 hidden sm:block" />

                <button
                  type="button"
                  onClick={() => handleToggleClosed(day)}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                    isClosed 
                      ? 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50' 
                      : 'bg-[#00D18F]/10 text-[#00D18F] border border-[#00D18F]/20 hover:bg-[#00D18F] hover:text-black'
                  }`}
                >
                  {isClosed ? 'Closed' : 'Open'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessHoursEditor;
