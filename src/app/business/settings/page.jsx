"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import ProfileCompletion from '@/components/settings/ProfileCompletion';
import BusinessInfoForm from '@/components/settings/BusinessInfoForm';
import BusinessHoursEditor from '@/components/settings/BusinessHoursEditor';
import AssistantConfig from '@/components/settings/AssistantConfig';
import { Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState(null);
  
  const [formData, setFormData] = useState({});
  const [hours, setHours] = useState({});
  const [config, setConfig] = useState({});
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/businesses');
        const data = await res.json();
        
        if (data.success && data.business) {
          const biz = data.business;
          setBusiness(biz);
          setFormData({
            name: biz.name,
            description: biz.description,
            category: biz.category,
            custom_category: biz.custom_category
          });
          setHours(biz.business_hours || {});
          setConfig({
            assistant_tone: biz.assistant_tone,
            assistant_instructions: biz.assistant_instructions
          });
          setCompletion(biz.profile_completion || 0);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [user]);

  const calculateCompletion = (data, hrs, cfg) => {
    const fields = [
      !!data.name,
      !!data.description,
      !!(data.category && (data.category !== 'Other' || data.custom_category)),
      Object.keys(hrs).length > 0 && Object.values(hrs).some(h => h.closed || (h.open && h.close)),
      !!cfg.assistant_tone
    ];
    
    const completedCount = fields.filter(Boolean).length;
    return Math.round((completedCount / fields.length) * 100);
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      const newCompletion = calculateCompletion(formData, hours, config);
      const isLive = newCompletion >= 80;

      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        custom_category: formData.custom_category,
        assistant_tone: config.assistant_tone,
        assistant_instructions: config.assistant_instructions,
        business_hours: hours,
        profile_completion: newCompletion,
        is_live: isLive
      };

      const { data: existing, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let resultData;

      if (existing) {
        const { data: updatedBusiness, error: updateError } = await supabase
          .from('businesses')
          .update(payload)
          .eq('owner_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        resultData = updatedBusiness;
      } else {
        const { data: newBusiness, error: insertError } = await supabase
          .from('businesses')
          .insert([{ ...payload, owner_id: user.id }])
          .select()
          .single();

        if (insertError) throw insertError;
        resultData = newBusiness;
      }
      
      setBusiness(resultData);
      setCompletion(newCompletion);
      toast.success('Settings synchronized successfully!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to sync settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-[#00D18F]" />
            <div className="absolute inset-0 blur-xl bg-[#00D18F]/20 animate-pulse" />
          </div>
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Secure Config</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-5xl mx-auto space-y-12 pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-zinc-500 text-sm font-medium">Configure your business profile and AI assistant behavior.</p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="group flex items-center gap-3 bg-[#00D18F] text-black px-8 py-4 rounded-xl font-bold hover:bg-emerald-400 active:scale-95 transition-all duration-300 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap size={18} className="fill-current" />
            )}
            <span className="text-xs uppercase tracking-wider">{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        <ProfileCompletion completion={completion} />

        <div className="grid grid-cols-1 gap-12">
          <BusinessInfoForm formData={formData} setFormData={setFormData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <BusinessHoursEditor hours={hours} setHours={setHours} />
            <AssistantConfig config={config} setConfig={setConfig} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
