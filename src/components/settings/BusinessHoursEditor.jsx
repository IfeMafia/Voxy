import React from 'react';
import { Label } from '@/components/ui/label';
import { Clock, Moon } from 'lucide-react';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const BusinessHoursEditor = ({ hours, onChange }) => {
  // Ensure we have a default structure
  const currentHours = hours || DAYS.reduce((acc, day) => {
    acc[day] = { open: '09:00', close: '18:00', closed: false };
    return acc;
  }, {});

  const handleToggleClosed = (day) => {
    const updatedHours = {
      ...currentHours,
      [day]: { 
        ...currentHours[day], 
        closed: !currentHours[day]?.closed 
      }
    };
    onChange(updatedHours);
  };

  const handleTimeChange = (day, type, value) => {
    const updatedHours = {
      ...currentHours,
      [day]: { 
        ...currentHours[day], 
        [type]: value 
      }
    };
    onChange(updatedHours);
  };

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-2xl p-6 shadow-sm transition-colors duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center">
            <Clock size={20} className="text-[#00D18F]" />
          </div>
          <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-600">Working hours</h3>
        </div>
      </div>
      
      <div className="space-y-3">
        {DAYS.map((day) => {
          const dayData = currentHours[day] || { open: '09:00', close: '18:00', closed: false };
          return (
            <div 
              key={day} 
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
                dayData.closed 
                  ? 'bg-zinc-50 dark:bg-white/[0.01] border-zinc-100 dark:border-white/[0.02] opacity-50 grayscale shadow-inner' 
                  : 'bg-zinc-50/50 dark:bg-white/[0.02] border-zinc-200/60 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-white/[0.1] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:w-32">
                <span className={`font-bold text-[13px] tracking-tight ${dayData.closed ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-voxy-text'}`}>{day}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="space-y-1.5 flex-1 sm:flex-none">
                    <Label htmlFor={`${day}-open`} className="text-[10px] font-bold text-zinc-400 dark:text-zinc-700 ml-1">Open</Label>
                    <input
                      type="time"
                      id={`${day}-open`}
                      disabled={dayData.closed}
                      value={dayData.open}
                      onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                      className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#00D18F]/40 disabled:opacity-20 w-full sm:w-32 transition-all font-semibold"
                    />
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-800 mt-7">-</span>
                  <div className="space-y-1.5 flex-1 sm:flex-none">
                    <Label htmlFor={`${day}-close`} className="text-[10px] font-bold text-zinc-400 dark:text-zinc-700 ml-1">Close</Label>
                    <input
                      type="time"
                      id={`${day}-close`}
                      disabled={dayData.closed}
                      value={dayData.close}
                      onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                      className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#00D18F]/40 disabled:opacity-20 w-full sm:w-32 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-4 pt-4 sm:pt-0 border-t border-white/[0.03] sm:border-t-0 sm:pl-8 sm:border-l sm:border-white/[0.03]">
                  <Label 
                    htmlFor={`${day}-closed-toggle`} 
                    className={`text-[11px] font-bold cursor-pointer transition-colors ${dayData.closed ? 'text-[#00D18F]' : 'text-zinc-400 dark:text-zinc-700'}`}
                  >
                    {dayData.closed ? 'Closed' : 'Active'}
                  </Label>
                  <button
                    id={`${day}-closed-toggle`}
                    onClick={() => handleToggleClosed(day)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all focus-visible:outline-none ${
                        dayData.closed ? 'bg-[#00D18F]' : 'bg-zinc-200 dark:bg-white/10'
                    } shadow-lg`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xl ring-0 transition-transform ${
                        dayData.closed ? 'translate-x-[22px]' : 'translate-x-1'
                      } ${dayData.closed ? '' : 'bg-zinc-400 dark:bg-zinc-700'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessHoursEditor;
