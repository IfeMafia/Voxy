"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Bell, BellRing, Mail, Smartphone, Save, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

export default function CustomerNotificationsPage() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushNotifications: false,
    chatAlerts: true,
    marketing: false
  });

  const handleSave = () => {
    toast.success("Notification preferences saved!");
  };

  const NotificationItem = ({ title, description, icon: Icon, value, onToggle }) => (
    <div className="flex items-center justify-between p-6 bg-zinc-950/50 border border-white/5 rounded-3xl group hover:border-[#00D18F]/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/5 rounded-2xl text-zinc-400 group-hover:text-[#00D18F] transition-colors">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{description}</p>
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onToggle} className="scale-110" />
    </div>
  );

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/customer/settings" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Configure alerts and signals</p>
          </div>
        </div>

        <div className="space-y-3">
          <NotificationItem 
            title="Chat Alerts" 
            description="When AI or owner responds" 
            icon={MessageSquare} 
            value={settings.chatAlerts}
            onToggle={(v) => setSettings({...settings, chatAlerts: v})}
          />
          <NotificationItem 
            title="Email Notifications" 
            description="Summary of missed chats" 
            icon={Mail} 
            value={settings.emailAlerts}
            onToggle={(v) => setSettings({...settings, emailAlerts: v})}
          />
          <NotificationItem 
            title="Push Alerts" 
            description="Direct to your device" 
            icon={Smartphone} 
            value={settings.pushNotifications}
            onToggle={(v) => setSettings({...settings, pushNotifications: v})}
          />
        </div>

        <button
          onClick={handleSave}
            className="w-full bg-[#00D18F] text-black font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,209,143,0.15)]"
          >
            <BellRing size={18} />
            Save Preferences
          </button>
      </div>
    </DashboardLayout>
  );
}
