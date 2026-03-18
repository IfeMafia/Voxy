"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Lock, Mail, Bell, LogOut, Loader2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CustomerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const router = useRouter();

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data.success) {
        setCustomer(data.user);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: "profile",
      title: "Profile",
      subtitle: customer.name || "Manage your identity",
      icon: User,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      href: "/customer/settings/profile"
    },
    {
      id: "security",
      title: "Security",
      subtitle: "Password and authentication",
      icon: Lock,
      color: "text-red-400",
      bg: "bg-red-400/10",
      href: "/customer/settings/security"
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Configure alerts and signals",
      icon: Bell,
      color: "text-[#00D18F]",
      bg: "bg-[#00D18F]/10",
      href: "/customer/settings/notifications"
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-800" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl mx-auto px-1 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10 animate-in fade-in duration-500">
        <div className="space-y-1.5 px-3 sm:px-0">
          <h1 className="text-[1.75rem] sm:text-4xl font-bold tracking-tight text-white leading-tight">Settings</h1>
          <p className="text-[9px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] opacity-80">Configure your experience</p>
        </div>

        <div className="space-y-3">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="w-full flex items-center gap-4 p-5 rounded-[2rem] bg-zinc-950/50 border border-white/5 hover:border-[#00D18F]/20 hover:bg-white/[0.02] transition-all group text-left active:scale-[0.98]"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                <item.icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white mb-0.5 group-hover:text-[#00D18F] transition-colors">{item.title}</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium truncate">{item.subtitle}</p>
              </div>
              <ChevronRight size={18} className="text-zinc-800 group-hover:text-[#00D18F] group-hover:translate-x-1 transition-all" />
            </Link>
          ))}

          <div className="pt-6">
            <button
              onClick={() => {
                // Handle logout logic here or redirect
                toast.success("Logging out...");
                setTimeout(() => router.push("/login"), 1000);
              }}
              className="w-full flex items-center gap-4 p-5 rounded-[2rem] bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all text-left active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <LogOut size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-red-500 mb-0.5">Logout</h3>
                <p className="text-[10px] text-red-500/50 uppercase tracking-wider font-medium">Terminate current session</p>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center pt-10 px-6 opacity-20">
          <div className="h-px bg-white/10 w-full mb-6" />
        </div>
      </div>
    </DashboardLayout>
  );
}
