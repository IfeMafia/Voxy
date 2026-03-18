"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfileCompletion from '@/components/settings/ProfileCompletion';
import BusinessInfoForm from '@/components/settings/BusinessInfoForm';
import BusinessHoursEditor from '@/components/settings/BusinessHoursEditor';
import AssistantConfig from '@/components/settings/AssistantConfig';
import { Button } from '@/components/ui/button';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const SETTINGS_FIELDS = [
  'name',
  'description',
  'category',
  'business_hours',
  'assistant_tone',
  'logo_url'
];

export default function BusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessData, setBusinessData] = useState({
    name: '',
    description: '',
    category: '',
    custom_category: '',
    business_hours: {},
    assistant_tone: '',
    assistant_instructions: '',
    profile_completion: 0,
    is_live: false,
    logo_url: ''
  });

  const calculateCompletion = useCallback((data) => {
    let completedCount = 0;
    
    if (data.name && data.name.trim().length > 0) completedCount++;
    if (data.description && data.description.trim().length > 0) completedCount++;
    if (data.category && data.category.trim().length > 0) completedCount++;
    
    if (data.business_hours && Object.keys(data.business_hours).length > 0) {
      completedCount++;
    }
    
    if (data.assistant_tone && data.assistant_tone.trim().length > 0) completedCount++;
    if (data.logo_url && data.logo_url.trim().length > 0) completedCount++;

    const percentage = Math.round((completedCount / SETTINGS_FIELDS.length) * 100);
    return percentage;
  }, []);

  const fetchBusinessData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/businesses');
      const data = await res.json();
      
      if (data.success && data.business) {
        setBusinessData(data.business);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const handleDataChange = (newData) => {
    const completion = calculateCompletion(newData);
    setBusinessData({
      ...newData,
      profile_completion: completion,
      is_live: completion >= 80
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Settings saved successfully');
        setBusinessData(data.business);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving business data:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
          <p className="text-zinc-500 font-medium">Loading your profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-[1400px] mx-auto pb-32 space-y-6 pt-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
             <h1 className="text-3xl font-bold text-white tracking-tighter">Gateway config</h1>
             <p className="text-[15px] font-medium text-zinc-600 mt-1">Configure your business presence and AI intelligence.</p>
          </div>
          <Button 
            onClick={fetchBusinessData} 
            variant="outline" 
            size="icon" 
            className="rounded-xl border-white/5 bg-[#0A0A0A] text-zinc-500 hover:text-white hover:border-white/10 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Profile Completion */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
           <ProfileCompletion completionPercentage={businessData.profile_completion} />
        </div>

        <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          {/* Business Info */}
          <BusinessInfoForm 
            data={businessData} 
            onChange={handleDataChange} 
          />

          {/* Business Hours */}
          <BusinessHoursEditor 
            hours={businessData.business_hours} 
            onChange={(hours) => handleDataChange({ ...businessData, business_hours: hours })} 
          />

          {/* Assistant Config */}
          <AssistantConfig 
            data={businessData} 
            onChange={handleDataChange} 
          />
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:left-64 bg-[#050505]/90 backdrop-blur-md border-t border-white/[0.03] z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 px-4">
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full ${businessData.is_live ? 'bg-[#00D18F]' : 'bg-zinc-800'}`}></div>
                <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">
                  {businessData.is_live 
                    ? "Gateway active & serving" 
                    : "Profiling standby"}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full sm:w-auto bg-[#00D18F] hover:bg-[#00D18F]/90 text-black font-bold h-12 px-10 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-black/10 tracking-tight"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save configuration
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
