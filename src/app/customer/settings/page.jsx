"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Lock, 
  Mail, 
  CheckCircle2, 
  Save, 
  Loader2,
  ShieldCheck,
  Bell,
  Palette,
  RefreshCcw,
  Eye,
  EyeOff
} from "lucide-react";
import toast from "react-hot-toast";

export default function CustomerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const res = await fetch("/api/customer");
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
      } else {
        toast.error(data.error || "Failed to load settings");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("An error occurred while loading settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/customer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customer.name }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully");
        setCustomer(data.customer);
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      toast.error("An error occurred during update");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error("New passwords do not match");
    }
    if (passwords.new.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/customer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwords.new }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password updated successfully");
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        toast.error(data.error || "Password update failed");
      }
    } catch (err) {
      toast.error("An error occurred during password update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Processing...">
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
          <p className="text-zinc-400 font-black uppercase tracking-[0.3em] text-xs">Decrypting Profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 p-4 md:p-8">
        {/* Header */}
        <div className="space-y-4 pt-4">
          <Badge className="bg-[#00D18F]/10 text-[#00D18F] border-none px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
            User Settings
          </Badge>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-2">
            Manage your personal profile, account security, and notification preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Navigation/Summary Column */}
          <div className="space-y-8">
            {/* Only keeping the Status card for context */}
            <div className="bg-white dark:bg-[#18181b] border border-zinc-100 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D18F]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#00D18F]/10 transition-colors duration-1000"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-[#00D18F]/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#00D18F]" />
                </div>
                <h2 className="text-xl font-display font-black tracking-tight">Status</h2>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Status</span>
                  <Badge className="bg-[#00D18F] text-white border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Identity</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[120px]">
                    {customer.email.split('@')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Profile Section */}
            <div className="bg-white dark:bg-[#18181b] border border-zinc-100 dark:border-white/5 rounded-[3rem] p-10 md:p-14 space-y-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D18F]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-white/10 shadow-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-[#00D18F]" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-black tracking-tighter">Profile Information</h2>
                </div>
                <Badge className="bg-zinc-100 dark:bg-white/5 text-zinc-400 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  Personal
                </Badge>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Your Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-[#00D18F]">
                        <User className="w-5 h-5 opacity-50" />
                      </div>
                      <input 
                        type="text" 
                        value={customer.name}
                        onChange={(e) => setCustomer({...customer, name: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-[#00D18F]/10 focus:border-[#00D18F]/30 transition-all placeholder:text-zinc-600"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-50">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input 
                        type="email" 
                        value={customer.email}
                        disabled
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-zinc-400 cursor-not-allowed opacity-60"
                      />
                      <div className="absolute top-1/2 right-4 -translate-y-1/2">
                        <CheckCircle2 className="w-5 h-5 text-[#00D18F]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="bg-[#00D18F] hover:bg-[#00A370] text-white rounded-xl h-14 px-10 shadow-xl shadow-[#00D18F]/20 transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-3" />}
                    Store Configuration
                  </Button>
                </div>
              </form>
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-[#18181b] border border-zinc-100 dark:border-white/5 rounded-[3rem] p-10 md:p-14 space-y-10 shadow-sm relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-white/10 shadow-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-red-500" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-black tracking-tighter">Change Password</h2>
                </div>
                <Badge className="bg-red-500/10 text-red-500 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  Secure
                </Badge>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1 text-red-500/80">Current Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-50 group-focus-within:text-red-500 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block"></div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-50 group-focus-within:text-[#00D18F] transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-[#00D18F]/10 focus:border-[#00D18F]/30 transition-all"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-[#00D18F] transition-colors"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-1">Confirm New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-50 group-focus-within:text-[#00D18F] transition-colors">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPasswords.confirm ? "text" : "password"} 
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-[#00D18F]/10 focus:border-[#00D18F]/30 transition-all"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-[#00D18F] transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    variant="outline"
                    className="rounded-xl h-14 px-10 border-2 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-900 hover:text-white transition-all active:scale-95"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCcw className="w-5 h-5 mr-3" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
