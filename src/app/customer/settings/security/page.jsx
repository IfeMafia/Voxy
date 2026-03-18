"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Lock, Save, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CustomerSecurityPage() {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.password }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Password updated successfully!");
        setFormData({ password: "", confirmPassword: "" });
      } else {
        toast.error(json.error || "Update failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Security">
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/customer/settings" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Security Settings</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Protect your account</p>
          </div>
        </div>

        <div className="bg-[#00D18F]/5 border border-[#00D18F]/10 rounded-3xl p-6 flex items-start gap-4">
            <div className="p-2 bg-[#00D18F]/10 rounded-xl text-[#00D18F]">
                <ShieldCheck size={20} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-white mb-1">Two-Factor Authentication</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Boost your security by requiring a code from your mobile device upon login. (Coming Soon)</p>
            </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00D18F] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#00D18F]/30 focus:bg-zinc-900/50 outline-none transition-all placeholder:text-zinc-700"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00D18F] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#00D18F]/30 focus:bg-zinc-900/50 outline-none transition-all placeholder:text-zinc-700"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#00D18F] text-black font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale shadow-[0_0_30px_rgba(0,209,143,0.15)]"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
