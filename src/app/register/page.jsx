"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2, Mail, Lock, Eye, EyeOff,
  ArrowRight, Loader2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { usePasswordValidation } from "@/hooks/usePasswordValidation";

const PERKS = [
  "AI employee ready in minutes",
  "Product catalogue & order management",
  "Paystack payment integration",
  "Business operations dashboard",
  "No technical skills needed",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();
  const { passwordError, isPasswordValid, validatePassword } = usePasswordValidation();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setSubmitError("");
    if (id === "password") validatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    setSubmitError("");
    try {
      const data = await register(formData);
      if (data?.success) {
        router.push("/onboarding");
      } else if (data?.error) {
        setSubmitError(data.error);
      }
    } catch (err) {
      setSubmitError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex font-sans text-white">

      {/* ── Left: Branding column (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[520px] flex-shrink-0 border-r border-white/[0.07] p-12 xl:p-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="Voxy" width={30} height={30} className="rounded-lg object-cover" />
          <span className="font-semibold text-[17px] tracking-tight">Voxy</span>
        </Link>

        {/* Headline */}
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#00D18F]">
              <span className="w-5 h-px bg-[#00D18F]" />
              Get Started
            </div>
            <h2 className="font-medium text-4xl leading-[1.1] tracking-tight">
              Your AI employee<br />
              <span className="text-[#3f3f46]">starts here.</span>
            </h2>
            <p className="text-[#71717a] text-base leading-relaxed">
              Set up once. Voxy handles your customer chats, takes orders, and collects payment 24/7.
            </p>
          </div>

          {/* Perks list */}
          <ul className="space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-[#a1a1aa]">
                <div className="w-5 h-5 rounded-full border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-[#00D18F]" />
                </div>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-[#3f3f46]">© 2026 Voxy. All rights reserved.</p>
      </div>

      {/* ── Right: Form column ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] space-y-8">

          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <Image src="/logo.jpg" alt="Voxy" width={28} height={28} className="rounded-lg object-cover" />
            <span className="font-semibold text-[16px] tracking-tight">Voxy</span>
          </Link>

          {/* Form header */}
          <div className="space-y-1">
            <h1 className="font-medium text-2xl text-white tracking-tight">Create your account</h1>
            <p className="text-sm text-[#71717a]">Get your AI employee set up in minutes.</p>
          </div>

          {/* Google sign-up */}
          <button
            type="button"
            onClick={() => (window.location.href = "/api/auth/google?role=business")}
            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.07] text-sm font-medium transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-xs text-[#3f3f46] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{submitError}</span>
                </div>
                {submitError.toLowerCase().includes("already exists") && (
                  <Link
                    href={`/login${formData.email ? `?email=${encodeURIComponent(formData.email)}` : ""}`}
                    className="font-bold text-[#00D18F] hover:underline underline-offset-2 shrink-0 ml-3.5 sm:ml-0"
                  >
                    Sign in instead →
                  </Link>
                )}
              </div>
            )}

            {/* Business Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-[#71717a] uppercase tracking-wider">
                Business Name
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Mama's Kitchen"
                  className="pl-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-[#71717a] uppercase tracking-wider">
                Work Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@business.com"
                  className="pl-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-[#71717a] uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-11 bg-white/[0.03] text-white placeholder:text-[#52525b] rounded-xl transition-all border ${
                    isPasswordValid
                      ? "border-[#00D18F]/50"
                      : passwordError
                      ? "border-red-500/60"
                      : "border-white/[0.10] focus:border-[#00D18F]/50"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-400 leading-relaxed">{passwordError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#00D18F] text-black font-semibold text-sm hover:bg-[#00D18F]/90 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight size={15} />
                </span>
              )}
            </Button>
          </form>

          {/* Switch to login */}
          <p className="text-center text-sm text-[#71717a]">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:text-[#00D18F] transition-colors font-medium">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-[#3f3f46] leading-relaxed">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-white transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-white transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
