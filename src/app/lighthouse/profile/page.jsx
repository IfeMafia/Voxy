"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  User, 
  Lock, 
  Mail, 
  CheckCircle2, 
  Save, 
  Loader2,
  ShieldCheck,
  RefreshCcw,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from '@/hooks/useAuth';

export default function AdminProfilePage() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data.success) {
        setAdmin(data.user);
      } else {
        toast.error(data.error || "Failed to load profile");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("An error occurred while loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: admin.name }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully");
        setAdmin(data.user);
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
      const res = await fetch("/api/me", {
        method: "PATCH",
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
      <DashboardLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-voxy-primary" />
          <p className="text-zinc-500 font-medium text-[13px]">Loading profile details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-[1400px] mx-auto pt-8 pb-32 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Profile Settings</h1>
            <p className="text-[15px] text-zinc-500 font-medium max-w-2xl leading-relaxed">
              Manage your personal information, email preferences, and account security settings.
            </p>
          </div>
          
          <div className="h-11 px-4 bg-[#0A0A0A] border border-white/5 rounded-xl flex items-center gap-3">
             <ShieldCheck size={14} className="text-voxy-primary" />
             <span className="text-[13px] font-medium text-zinc-400">Authenticated Admin</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Status Column */}
          <div className="space-y-8">
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-voxy-primary">
                  <Shield size={18} />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Account Status</h2>
              </div>
              
              <div className="space-y-6 relative z-10 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-zinc-500">System Role</span>
                  <span className="bg-voxy-primary/10 text-voxy-primary px-3 py-1 rounded-lg text-[11px] font-bold">
                    {admin.role || 'Administrator'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-zinc-500">Account ID</span>
                  <span className="text-xs font-medium text-zinc-400 tabular-nums">
                    {admin.id?.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Basic Info Section */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 md:p-12 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-voxy-primary">
                  <User size={18} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Personal Information</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-zinc-500 ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-voxy-primary transition-colors">
                        <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        value={admin.name}
                        onChange={(e) => setAdmin({...admin, name: e.target.value})}
                        className="w-full bg-[#0F0F0F] border border-white/5 rounded-xl py-4 pl-14 pr-6 text-sm font-medium text-white outline-none focus:border-voxy-primary/40 transition-all placeholder:text-zinc-800"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-zinc-500 ml-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-700">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email" 
                        value={admin.email}
                        disabled
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-4 pl-14 pr-6 text-sm font-medium text-zinc-600 cursor-not-allowed"
                      />
                      <div className="absolute top-1/2 right-4 -translate-y-1/2">
                        <CheckCircle2 size={16} className="text-voxy-primary/50" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="h-12 px-8 bg-voxy-primary text-black font-bold text-[13px] rounded-xl hover:bg-voxy-primary/90 transition-all flex items-center gap-3 shadow-xl shadow-voxy-primary/10 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Update Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Security Section */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 md:p-12 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-red-500">
                  <Lock size={18} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Security & Password</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-zinc-500 ml-1">Current Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-red-500/50 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        className="w-full bg-[#0F0F0F] border border-white/5 rounded-xl py-4 pl-14 pr-12 text-sm font-medium text-white outline-none focus:border-red-500/20 transition-all placeholder:text-zinc-800"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-600 hover:text-white transition-colors"
                      >
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block"></div>
                  
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-zinc-500 ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-voxy-primary transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-[#0F0F0F] border border-white/5 rounded-xl py-4 pl-14 pr-12 text-sm font-medium text-white outline-none focus:border-voxy-primary/40 transition-all placeholder:text-zinc-800"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-600 hover:text-white transition-colors"
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-zinc-500 ml-1">Confirm New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-voxy-primary transition-colors">
                        <CheckCircle2 size={18} />
                      </div>
                      <input 
                        type={showPasswords.confirm ? "text" : "password"} 
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-[#0F0F0F] border border-white/5 rounded-xl py-4 pl-14 pr-12 text-sm font-medium text-white outline-none focus:border-voxy-primary/40 transition-all placeholder:text-zinc-800"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-600 hover:text-white transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="h-12 px-8 bg-zinc-100 text-black font-bold text-[13px] rounded-xl hover:bg-white transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
