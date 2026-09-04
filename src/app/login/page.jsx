"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mail, Lock, Eye, EyeOff,
  ArrowRight, Loader2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered");
  const { login, loading } = useAuth();

  const initialEmail = searchParams.get("email") || "";
  const [formData, setFormData] = useState({ email: initialEmail, password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setLoginError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const data = await login(formData);
      if (data?.success) {
        router.push("/business/dashboard");
      } else if (data?.error) {
        setLoginError(data.error);
      }
    } catch (err) {
      setLoginError(err.message || "Invalid email or password");
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
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#00D18F]">
            <span className="w-5 h-px bg-[#00D18F]" />
            Welcome back
          </div>
          <h2 className="font-medium text-4xl leading-[1.1] tracking-tight">
            Your AI employee<br />
            <span className="text-[#3f3f46]">is still working.</span>
          </h2>
          <p className="text-[#71717a] text-base leading-relaxed">
            Log in to check your orders, conversations, payments, and see what Voxy has been handling while you were away.
          </p>
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
          <div className="space-y-2">
            {isRegistered && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D18F]/10 border border-[#00D18F]/20 mb-2">
                <CheckCircle2 size={13} className="text-[#00D18F]" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#00D18F]">
                  Account created — sign in to continue
                </span>
              </div>
            )}
            <h1 className="font-medium text-2xl text-white tracking-tight">Sign in to Voxy</h1>
            <p className="text-sm text-[#71717a]">Access your business dashboard.</p>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={() => (window.location.href = "/api/auth/google")}
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
            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
                {loginError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-[#71717a] uppercase tracking-wider">
                Email Address
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-[#71717a] uppercase tracking-wider">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#52525b] hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all"
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
                  Sign In <ArrowRight size={15} />
                </span>
              )}
            </Button>
          </form>

          {/* Switch to register */}
          <p className="text-center text-sm text-[#71717a]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-white hover:text-[#00D18F] transition-colors font-medium">
              Get started free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#00D18F]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
