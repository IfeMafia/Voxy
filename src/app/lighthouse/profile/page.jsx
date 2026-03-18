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
  EyeOff
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
        toast.error(data.error || "Failed to load admin profile");
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
      <DashboardLayout title="Platform Registry">
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
          <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Admin Vault...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#00D18F]/10 text-[#00D18F] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#00D18F]/20">
              Admin Profile
            </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Personal Identity</h1>
          <p className="text-zinc-500 text-sm font-bold max-w-2xl leading-relaxed">
            Update your administrative credentials and security layer. Changes are audited for platform compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Navigation/Summary Column */}
          <div className="space-y-8">
            <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D18F]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#00D18F]/10 transition-colors duration-1000"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-[#00D18F]/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#00D18F]" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Status</h2>
              </div>
              
              <div className="space-y-6 relative z-10 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Global Role</span>
                  <span className="bg-[#00D18F] text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {admin.role || 'Admin'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Identity ID</span>
                  <span className="text-xs font-bold text-zinc-400 truncate max-w-[120px]">
                    {admin.id?.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Profile Section */}
            <div className="bg-[#050505] border border-white/5 rounded-[40px] p-10 md:p-14 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D18F]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl border border-white/10 shadow-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-[#00D18F]" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Basic Info</h2>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-[#00D18F]">
                        <User className="w-5 h-5 opacity-50" />
                      </div>
                      <input 
                        type="text" 
                        value={admin.name}
                        onChange={(e) => setAdmin({...admin, name: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white outline-none focus:border-[#00D18F]/50 transition-all placeholder:text-zinc-700"
                        placeholder="Admin Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email (Immutable)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-50">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input 
                        type="email" 
                        value={admin.email}
                        disabled
                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-zinc-600 cursor-not-allowed"
                      />
                      <div className="absolute top-1/2 right-4 -translate-y-1/2">
                        <CheckCircle2 className="w-5 h-5 text-[#00D18F]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full sm:w-auto bg-[#00D18F] hover:bg-[#00D18F]/80 text-black font-black text-xs uppercase tracking-widest rounded-2xl h-14 px-10 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-3" />}
                    Update Identity
                  </button>
                </div>
              </form>
            </div>

            {/* Security Section */}
            <div className="bg-[#050505] border border-white/5 rounded-[40px] p-10 md:p-14 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl border border-white/10 shadow-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-red-500" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Security</h2>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Current Vault Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-50 group-focus-within:text-red-500 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-white outline-none focus:border-red-500/30 transition-all placeholder:text-zinc-700"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block"></div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">New Key</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-50 group-focus-within:text-[#00D18F] transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-white outline-none focus:border-[#00D18F]/50 transition-all placeholder:text-zinc-700"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-600 hover:text-[#00D18F] transition-colors"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Confirm New Key</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-50 group-focus-within:text-[#00D18F] transition-colors">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPasswords.confirm ? "text" : "password"} 
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-white outline-none focus:border-[#00D18F]/50 transition-all placeholder:text-zinc-700"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute inset-y-0 right-4 flex items-center text-zinc-600 hover:text-[#00D18F] transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full sm:w-auto bg-[#00D18F] hover:bg-[#00D18F]/80 text-black font-black text-xs uppercase tracking-widest rounded-2xl h-14 px-10 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCcw className="w-5 h-4 mr-3" />}
                    Rotate Access Key
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
