"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Shield, 
  Settings, 
  Bell, 
  Lock, 
  Globe, 
  Cpu, 
  Save, 
  Loader2, 
  ToggleLeft, 
  ToggleRight,
  Database,
  Key
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    aiModel: 'gemini-2.0-flash',
    apiKeyRotation: 'monthly',
    platformNotification: 'Voxy system update scheduled for midnight.',
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('System configuration saved to database');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Platform Config">
        <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-zinc-500 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
          <p className="font-black uppercase tracking-widest text-xs">Accessing System Core...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Platform Settings">
      <div className="space-y-10 pb-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 bg-[#00D18F]/10 text-[#00D18F] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#00D18F]/20">
                Core Settings
              </span>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest ml-1">v1.2.0-stable</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">System Configuration</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-[#00D18F] text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:bg-[#00D18F]/80 transition-all shadow-xl shadow-[#00D18F]/10 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: General & Availability */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[#050505] border border-white/5 rounded-[40px] p-10 shadow-2xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="size-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#00D18F]">
                  <Globe className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Site Status</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-zinc-900/50 border border-white/5 rounded-3xl">
                  <div className="flex flex-col">
                    <span className="text-white font-black text-xs uppercase">Maintenance Mode</span>
                    <span className="text-[10px] text-zinc-500 font-bold mt-1 max-w-[300px]">Disable all public access while performing system updates. Admins will still have access.</span>
                  </div>
                  <button onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}>
                    {settings.maintenanceMode ? <ToggleRight className="w-10 h-10 text-[#00D18F]" /> : <ToggleLeft className="w-10 h-10 text-zinc-700" />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-6 bg-zinc-900/50 border border-white/5 rounded-3xl">
                  <div className="flex flex-col">
                    <span className="text-white font-black text-xs uppercase">Open Registration</span>
                    <span className="text-[10px] text-zinc-500 font-bold mt-1">Allow new business entities to register without an invitation code.</span>
                  </div>
                   <button onClick={() => setSettings({...settings, registrationEnabled: !settings.registrationEnabled})}>
                    {settings.registrationEnabled ? <ToggleRight className="w-10 h-10 text-[#00D18F]" /> : <ToggleLeft className="w-10 h-10 text-zinc-700" />}
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-[#050505] border border-white/5 rounded-[40px] p-10 shadow-2xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="size-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-blue-500">
                  <Cpu className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">AI Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Primary Processor</label>
                    <select 
                      value={settings.aiModel}
                      onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-[#00D18F]/50 appearance-none transition-all"
                    >
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fastest)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Precision)</option>
                      <option value="gpt-4o">GPT-4o (Standard-Alt)</option>
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">API Key Management</label>
                    <select 
                      value={settings.apiKeyRotation}
                      onChange={(e) => setSettings({...settings, apiKeyRotation: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-[#00D18F]/50 appearance-none transition-all"
                    >
                      <option value="daily">Every Day</option>
                      <option value="weekly">Every Week</option>
                      <option value="monthly">Manual Only</option>
                    </select>
                 </div>
              </div>
            </section>
          </div>

          {/* Right Column: Alerts & Security */}
          <div className="space-y-8">
            <section className="bg-[#050505] border border-white/5 rounded-[40px] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Site-wide Message</h3>
              </div>
              <textarea 
                value={settings.platformNotification}
                onChange={(e) => setSettings({...settings, platformNotification: e.target.value})}
                className="w-full h-32 bg-zinc-900 border border-white/5 rounded-2xl p-4 text-xs font-bold text-zinc-400 outline-none focus:border-[#00D18F]/50 transition-all resize-none"
                placeholder="Broadcast a system message to all users..."
              />
              <p className="text-[9px] text-zinc-500 mt-2 font-bold uppercase leading-relaxed">This message will appear on the dash of all active entities.</p>
            </section>

            <section className="bg-zinc-950 border border-red-500/10 rounded-[40px] p-8 shadow-2xl">
               <div className="flex items-center gap-3 mb-8">
                  <Lock className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Advanced Controls</h3>
               </div>
               <div className="space-y-4">
                  <button className="w-full py-4 px-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                     <Database className="w-3.5 h-3.5" />
                     Clear Temporary Data
                  </button>
                  <button className="w-full py-4 px-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                     <Key className="w-3.5 h-3.5" />
                     Sign out all users
                  </button>
               </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
