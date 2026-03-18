"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Building2, 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Clock, 
  Terminal,
  Activity,
  Calendar,
  Zap,
  ShieldCheck,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * OnboardingModal Component
 * An expanded, educational onboarding guide that teaches the user
 * how Voxy works while setting up their business.
 */
export default function OnboardingModal({ onComplete }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [setupLogs, setSetupLogs] = useState([]);
  const router = useRouter();

  // Working Hours State
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('17:00');
  const [is247, setIs247] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    tone: 'Professional',
    systemInstructions: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => setIsOpen(false);

  const handleSkip = () => {
    setIsOpen(false);
    router.push('/business/settings');
  };

  const addLog = (message) => {
    setSetupLogs(prev => [...prev.slice(-4), message]);
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const constructHoursObject = () => {
    if (is247) {
      return DAYS.reduce((acc, day) => {
        const fullDay = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }[day];
        acc[fullDay] = { open: '00:00', close: '23:59', closed: false };
        return acc;
      }, {});
    }

    return DAYS.reduce((acc, day) => {
      const fullDay = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }[day];
      const isSelected = selectedDays.includes(day);
      acc[fullDay] = { 
        open: openTime, 
        close: closeTime, 
        closed: !isSelected 
      };
      return acc;
    }, {});
  };

  const handleComplete = async () => {
    try {
      setIsFinishing(true);
      setStep(5); // Jump to technical deployment
      
      const progressSteps = [
        "Initializing profile...",
        "Setting hours...",
        "Configuring voice...",
        "Saving instructions...",
        "Finalizing assistant...",
        "System ready."
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        addLog(progressSteps[i]);
      }

      const businessHours = constructHoursObject();

      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.businessName,
          business_hours: businessHours,
          description: formData.description,
          assistant_tone: formData.tone,
          assistant_instructions: formData.systemInstructions,
          is_live: true,
          profile_completion: 100
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setTimeout(() => {
          setIsOpen(false);
          if (onComplete) onComplete();
        }, 1200);
      }
    } catch (err) {
      console.error('Setup Error:', err);
      setStep(3);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tones = ['Professional', 'Friendly', 'Casual', 'Formal'];

  const springTransition = { type: "spring", stiffness: 260, damping: 26 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          <motion.div
            layout
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={springTransition}
            className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] w-full max-w-[480px] shadow-2xl relative z-50 overflow-hidden"
          >
            <div className="p-10">
              <LayoutGroup>
                {/* STEP 1: Welcome & Mission */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-center text-center"
                  >
                    <motion.div 
                      layoutId="voxy-logo-plate"
                      className="mb-10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                          <img src="/logo.jpg" alt="Voxy Logo" className="w-9 h-9 object-contain" />
                        </div>
                        <span className="font-sans text-2xl font-bold tracking-tighter text-white">Voxy</span>
                      </div>
                    </motion.div>

                    <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Your business, automated.</h2>
                    <p className="text-zinc-500 mb-10 leading-relaxed text-[15px] max-w-[340px] font-medium">
                      Voxy acts as a 24/7 bridge between you and your customers. We listen, understand, and resolve queries while you focus on growth.
                    </p>

                    <div className="grid grid-cols-1 w-full gap-4 mb-10 text-left">
                       <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="size-10 rounded-xl bg-voxy-primary/10 flex items-center justify-center shrink-0">
                             <Zap size={18} className="text-voxy-primary" />
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-white">Instant resolution</h4>
                             <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-0.5">Automated replies based on your custom business logic.</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                             <ShieldCheck size={18} className="text-blue-400" />
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-white">Human oversight</h4>
                             <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-0.5">Jump into any conversation when the AI needs your expertise.</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col w-full gap-3">
                      <Button onClick={() => setStep(2)} className="w-full h-12 text-[15px] font-semibold bg-[#00D18F] text-black hover:bg-[#00D18F]/90 rounded-xl transition-all tracking-tight">
                        Start guided setup <ArrowRight size={16} className="ml-2" />
                      </Button>
                      <button onClick={handleSkip} className="w-full py-2 text-[11px] font-medium text-zinc-700 hover:text-white transition-colors mt-2">
                        Skip and explore alone
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Business Info */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <motion.div layoutId="voxy-logo-plate" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden grayscale opacity-40">
                          <img src="/logo.jpg" alt="Voxy Logo" className="w-7 h-7 object-contain" />
                        </motion.div>
                        <div>
                          <h2 className="text-xl font-bold text-white tracking-tight leading-none">Business profile</h2>
                          <p className="text-[11px] font-medium text-zinc-600 mt-1.5">Step 1 of 3</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6 mb-10">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-500 ml-1">Company name</Label>
                        <Input 
                          value={formData.businessName}
                          onChange={(e) => handleChange('businessName', e.target.value)}
                          placeholder="What's your business name?" 
                          className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-[#00D18F]/40 transition-all text-sm font-medium placeholder:text-zinc-800" 
                        />
                      </div>

                      {/* Improved Working Hours Selector */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                          <Label className="text-xs font-semibold text-zinc-500 flex items-center gap-2">
                            <Clock size={12} className="text-[#00D18F]/40" /> Working hours
                          </Label>
                          <button 
                            onClick={() => setIs247(!is247)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                              is247 ? 'bg-[#00D18F]/10 text-[#00D18F]' : 'text-zinc-600 hover:text-white'
                            }`}
                          >
                            {is247 ? 'Active 24/7' : 'Set 24/7'}
                          </button>
                        </div>
                        
                        {!is247 ? (
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4 shadow-inner">
                            <div className="flex items-center justify-between gap-1">
                              {DAYS.map(day => (
                                <button
                                  key={day}
                                  onClick={() => toggleDay(day)}
                                  className={`size-9 rounded-lg text-[10px] font-bold transition-all ${
                                    selectedDays.includes(day)
                                      ? 'bg-white text-black'
                                      : 'bg-white/5 text-zinc-600 hover:bg-white/10'
                                  }`}
                                >
                                  {day[0]}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                              <div className="flex-1 space-y-1">
                                <span className="text-[10px] font-medium text-zinc-700 ml-1">Open</span>
                                <input 
                                  type="time" 
                                  value={openTime}
                                  onChange={(e) => setOpenTime(e.target.value)}
                                  className="w-full bg-white/5 border-white/10 h-10 rounded-lg text-xs font-semibold px-3 text-white focus:outline-none focus:border-[#00D18F]/40 transition-all"
                                />
                              </div>
                              <span className="text-zinc-800 mt-5">-</span>
                              <div className="flex-1 space-y-1">
                                <span className="text-[10px] font-medium text-zinc-700 ml-1">Close</span>
                                <input 
                                  type="time" 
                                  value={closeTime}
                                  onChange={(e) => setCloseTime(e.target.value)}
                                  className="w-full bg-white/5 border-white/10 h-10 rounded-lg text-xs font-semibold px-3 text-white focus:outline-none focus:border-[#00D18F]/40 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#00D18F]/5 border border-[#00D18F]/10 rounded-2xl h-[116px] flex flex-col items-center justify-center text-center">
                            <Activity size={24} className="text-[#00D18F] mb-2 opacity-40" />
                            <p className="text-[11px] font-bold text-[#00D18F]">Always online</p>
                            <p className="text-[10px] text-[#00D18F]/60 font-medium italic">Assistant active 24 hours every day</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-500 ml-1">Description</Label>
                        <textarea 
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#00D18F]/40 min-h-[80px] resize-none transition-all font-medium leading-relaxed"
                          placeholder="Briefly describe what you do..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(1)} className="w-[100px] h-12 rounded-xl border-white/5 hover:bg-white/5 bg-transparent text-[11px] font-bold text-zinc-500 hover:text-white transition-all">Back</Button>
                      <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl font-semibold bg-[#00D18F] text-black hover:bg-[#00D18F]/90 text-[15px] tracking-tight">Next</Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: AI Settings */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <motion.div layoutId="voxy-logo-plate" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden grayscale opacity-40">
                          <img src="/logo.jpg" alt="Voxy Logo" className="w-7 h-7 object-contain" />
                        </motion.div>
                        <div>
                          <h2 className="text-xl font-bold text-white tracking-tight leading-none">AI settings</h2>
                          <p className="text-[11px] font-medium text-zinc-600 mt-1.5">Step 2 of 3</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-8 mb-12">
                      <div className="space-y-4">
                        <Label className="text-xs font-semibold text-zinc-500 ml-1">Assistant tone</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {tones.map(tone => (
                            <button 
                              key={tone}
                              onClick={() => handleChange('tone', tone)}
                              className={`h-11 rounded-xl border text-[11px] font-bold transition-all ${
                                formData.tone === tone 
                                  ? 'border-[#00D18F]/40 bg-[#00D18F]/10 text-[#00D18F]' 
                                  : 'border-white/5 bg-white/5 text-zinc-600 hover:text-white hover:border-white/10'
                              }`}
                            >
                              {tone}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-500 ml-1">Specific instructions</Label>
                        <textarea 
                          value={formData.systemInstructions}
                          onChange={(e) => handleChange('systemInstructions', e.target.value)}
                          className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#00D18F]/40 min-h-[130px] resize-none transition-all font-medium leading-relaxed"
                          placeholder="e.g. Be polite. Mention our weekly discounts..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(2)} className="w-[100px] h-12 rounded-xl border-white/5 hover:bg-white/5 bg-transparent text-[11px] font-bold text-zinc-500 hover:text-white transition-all">Back</Button>
                      <Button 
                         onClick={() => setStep(4)} 
                        className="flex-1 h-12 rounded-xl font-semibold bg-[#00D18F] text-black hover:bg-[#00D18F]/90 text-[15px] flex items-center justify-center gap-2 group tracking-tight"
                      >
                        Preview guide <ArrowRight size={16} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* NEW STEP 4: Platform Guide */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-4">
                          <motion.div layoutId="voxy-logo-plate" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden grayscale opacity-40">
                             <img src="/logo.jpg" alt="Voxy Logo" className="w-7 h-7 object-contain" />
                          </motion.div>
                          <div>
                             <h2 className="text-xl font-bold text-white tracking-tight leading-none">Your dashboard</h2>
                             <p className="text-[11px] font-medium text-zinc-600 mt-1.5">Step 3 of 3</p>
                          </div>
                       </div>
                    </div>

                    <p className="text-zinc-500 text-sm mb-10 font-medium leading-relaxed">
                       Once you complete setup, your command center will be active. Here is what you can track:
                    </p>

                    <div className="space-y-6 mb-12">
                       <div className="flex gap-4 group">
                          <div className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 transition-colors group-hover:bg-voxy-primary/10 group-hover:border-voxy-primary/20">
                             <BarChart3 size={18} className="text-zinc-500 transition-colors group-hover:text-voxy-primary" />
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-white">Efficiency metrics</h4>
                             <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-0.5">Track how many customers the AI resolves automatically every single day.</p>
                          </div>
                       </div>
                       <div className="flex gap-4 group">
                          <div className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 transition-colors group-hover:bg-voxy-primary/10 group-hover:border-voxy-primary/20">
                             <MessageSquare size={18} className="text-zinc-500 transition-colors group-hover:text-voxy-primary" />
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-white">Live activity</h4>
                             <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-0.5">Read through AI conversations and intervene instantly if a customer needs personal care.</p>
                          </div>
                       </div>
                       <div className="flex gap-4 group">
                          <div className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 transition-colors group-hover:bg-voxy-primary/10 group-hover:border-voxy-primary/20">
                             <Activity size={18} className="text-zinc-500 transition-colors group-hover:text-voxy-primary" />
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-white">Health status</h4>
                             <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-0.5">Real-time indicators showing your AI assistant is active and synchronized.</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <Button variant="outline" onClick={() => setStep(3)} className="w-[100px] h-12 rounded-xl border-white/5 hover:bg-white/5 bg-transparent text-[11px] font-bold text-zinc-500 hover:text-white transition-all">Back</Button>
                       <Button 
                          onClick={handleComplete} 
                          disabled={isFinishing}
                          className="flex-1 h-12 rounded-xl font-semibold bg-[#00D18F] text-black hover:bg-[#00D18F]/90 text-[15px] flex items-center justify-center gap-2 group tracking-tight"
                       >
                          Launch AI <Bot size={16} className="group-hover:translate-x-0.5 transition-transform" />
                       </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: Technical Launch */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-6 min-h-[380px]"
                  >
                    <div className="relative mb-12">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="size-24 rounded-full border border-white/5 border-t-[#00D18F] flex items-center justify-center"
                      >
                      </motion.div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Activity size={24} className="text-[#00D18F] animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="w-full space-y-3 px-4 text-center">
                       <AnimatePresence mode="popLayout">
                        {setupLogs.map((log, i) => (
                           <motion.div
                            key={log}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1 - (setupLogs.length - 1 - i) * 0.25, y: 0 }}
                            className="text-[11px] font-medium text-zinc-600"
                           >
                             {log}
                           </motion.div>
                        ))}
                       </AnimatePresence>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 4.5, duration: 0.5 }}
                      className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-20"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 4.6 }}
                        className="size-16 rounded-2xl bg-[#00D18F] flex items-center justify-center mb-8 shadow-xl shadow-black/20"
                      >
                        <CheckCircle2 size={32} className="text-black" strokeWidth={3} />
                      </motion.div>
                      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">System ready.</h2>
                      <p className="text-zinc-500 text-[11px] font-bold">Your assistant is now active.</p>
                    </motion.div>
                  </motion.div>
                )}
              </LayoutGroup>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
