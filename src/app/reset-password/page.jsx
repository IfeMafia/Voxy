"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      router.push('/login');
    }
  }, [token, router]);

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        toast.success(data.message || 'Password reset successfully!');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        toast.error(data.error || 'Failed to reset password. Link might be expired.');
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col font-sans text-white">
        <div className="p-6 sm:p-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.jpg" alt="Voxy" width={28} height={28} className="rounded-lg object-cover" />
            <span className="font-semibold text-[16px] tracking-tight">Voxy</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[400px] text-center space-y-6">
            <div className="w-16 h-16 bg-[#00D18F]/10 border border-[#00D18F]/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-[#00D18F]" size={28} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-medium tracking-tight">Password Updated</h2>
              <p className="text-sm text-[#71717a] leading-relaxed">
                Your password has been successfully reset. <br/> You can now log in with your new password.
              </p>
            </div>
            <Button onClick={() => router.push('/login')} className="w-full h-11 rounded-xl bg-[#00D18F] text-black font-semibold text-sm hover:bg-[#00D18F]/90 transition-all mt-4">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-white">
      {/* ── Top Nav ── */}
      <div className="p-6 sm:p-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="Voxy" width={28} height={28} className="rounded-lg object-cover" />
          <span className="font-semibold text-[16px] tracking-tight">Voxy</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px] space-y-8">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-medium text-2xl tracking-tight">Set new password</h1>
            <p className="text-sm text-[#71717a]">Enter a new, secure password for your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#71717a] uppercase tracking-wider">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create new password"
                  className="pl-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#71717a] uppercase tracking-wider">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pl-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 pb-2">
               <input 
                 type="checkbox" 
                 id="show" 
                 checked={showPasswords} 
                 onChange={() => setShowPasswords(!showPasswords)}
                 className="accent-[#00D18F] w-3.5 h-3.5 rounded-sm bg-white/[0.03] border-white/[0.10]" 
               />
               <label htmlFor="show" className="text-xs text-[#71717a] cursor-pointer select-none">Show passwords</label>
            </div>

            <Button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full h-11 rounded-xl bg-[#00D18F] text-black font-semibold text-sm hover:bg-[#00D18F]/90 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                <span className="flex items-center justify-center gap-2">
                  Update Password <ArrowRight size={15} />
                </span>
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link href="/login" className="text-sm text-[#71717a] hover:text-white transition-colors font-medium">
              Cancel and go back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#00D18F]" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
