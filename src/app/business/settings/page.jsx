"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import ProfileCompletion from '@/components/settings/ProfileCompletion';
import BusinessInfoForm from '@/components/settings/BusinessInfoForm';
import BusinessHoursEditor from '@/components/settings/BusinessHoursEditor';
import AssistantConfig from '@/components/settings/AssistantConfig';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState(null);
  
  // States for different sections
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

      // 1. Check if business exists for this owner
      const { data: existing, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw fetchError;
      }

      let resultData;

      if (existing) {
        // 2a. UPDATE existing business
        const { data: updatedBusiness, error: updateError } = await supabase
          .from('businesses')
          .update(payload)
          .eq('owner_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        resultData = updatedBusiness;
      } else {
        // 2b. INSERT new business
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
      toast.success('Settings saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
          <p className="mt-2 text-zinc-500">Manage your business profile and AI assistant behavior.</p>
        </div>

        <ProfileCompletion completion={completion} />

        <div className="grid grid-cols-1 gap-8">
          <BusinessInfoForm formData={formData} setFormData={setFormData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BusinessHoursEditor hours={hours} setHours={setHours} />
            <AssistantConfig config={config} setConfig={setConfig} />
          </div>
        </div>

        <div className="fixed bottom-8 right-8 sm:right-12 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save size={20} className="group-hover:rotate-12 transition-transform" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
