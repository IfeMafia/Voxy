"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ name: "", email: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/me");
      const json = await res.json();
      if (json.success) {
        setData({ name: json.user.name || "", email: json.user.email || "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Profile updated!");
      } else {
        toast.error(json.error || "Update failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Profile">
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/customer/settings" className="p-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Profile Settings</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">Manage your identity</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Display Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00D18F] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-zinc-800 dark:text-white focus:border-[#00D18F]/30 focus:bg-white dark:focus:bg-zinc-900/50 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00D18F] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-zinc-800 dark:text-white focus:border-[#00D18F]/30 focus:bg-white dark:focus:bg-zinc-900/50 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 shadow-sm"
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
            {saving ? "Saving Updates..." : "Save Changes"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
