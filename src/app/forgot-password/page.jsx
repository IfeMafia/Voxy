"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Mail, 
  ArrowRight, 
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {}
  };

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

          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="space-y-2">
                <Link href="/login" className="inline-flex items-center gap-2 text-xs text-[#71717a] hover:text-white transition-colors mb-2 font-medium">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
                <h1 className="font-medium text-2xl tracking-tight">Reset your password</h1>
                <p className="text-sm text-[#71717a]">Enter your email and we'll send you a link to reset your password.</p>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-[#71717a] uppercase tracking-wider">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@business.com" 
                      className="pl-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all" 
                      required 
                    />
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
                      Send Reset Link <ArrowRight size={15} />
                    </span>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-[#00D18F]/10 border border-[#00D18F]/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="text-[#00D18F]" size={28} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-medium tracking-tight">Check your email</h2>
                <p className="text-sm text-[#71717a] leading-relaxed">
                  We sent a password reset link to <br/>
                  <span className="text-white font-medium">{email}</span>
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setIsSubmitted(false)}
                className="w-full h-11 rounded-xl border-white/[0.10] bg-transparent text-white hover:bg-white/[0.05] font-medium text-sm transition-all"
              >
                Didn't receive an email? Try again
              </Button>

              <div className="pt-4">
                <Link href="/login" className="text-sm text-[#71717a] hover:text-white transition-colors font-medium">
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
