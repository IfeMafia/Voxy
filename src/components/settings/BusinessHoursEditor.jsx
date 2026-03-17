import React from 'react';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';

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
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-[#00D18F]" />
        <h3 className="text-lg font-medium text-white">Business Hours</h3>
      </div>
      
      <div className="space-y-4">
        {DAYS.map((day) => {
          const dayData = currentHours[day] || { open: '09:00', close: '18:00', closed: false };
          return (
            <div 
              key={day} 
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                dayData.closed 
                  ? 'bg-zinc-950/50 border-zinc-800/50 opacity-60' 
                  : 'bg-zinc-800/30 border-zinc-700/50'
              }`}
            >
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:w-32">
                <span className="font-medium text-zinc-200">{day}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="space-y-1 flex-1 sm:flex-none">
                    <Label htmlFor={`${day}-open`} className="text-[10px] uppercase text-zinc-500 ml-1">Open</Label>
                    <input
                      type="time"
                      id={`${day}-open`}
                      disabled={dayData.closed}
                      value={dayData.open}
                      onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00D18F] disabled:opacity-50 w-full sm:w-auto"
                    />
                  </div>
                  <span className="text-zinc-600 mt-5">-</span>
                  <div className="space-y-1 flex-1 sm:flex-none">
                    <Label htmlFor={`${day}-close`} className="text-[10px] uppercase text-zinc-500 ml-1">Close</Label>
                    <input
                      type="time"
                      id={`${day}-close`}
                      disabled={dayData.closed}
                      value={dayData.close}
                      onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00D18F] disabled:opacity-50 w-full sm:w-auto"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2 border-t sm:border-t-0 sm:border-l border-zinc-700 pt-4 sm:pt-0 sm:pl-6 sm:ml-2">
                  <Label 
                    htmlFor={`${day}-closed-toggle`} 
                    className={`text-xs cursor-pointer ${dayData.closed ? 'text-[#00D18F]' : 'text-zinc-500'}`}
                  >
                    Closed
                  </Label>
                  {/* Using a simple custom switch if shadcn Switch is not available or to ensure consistency */}
                  <button
                    id={`${day}-closed-toggle`}
                    onClick={() => handleToggleClosed(day)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      dayData.closed ? 'bg-[#00D18F]' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        dayData.closed ? 'translate-x-4' : 'translate-x-1'
                      }`}
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
