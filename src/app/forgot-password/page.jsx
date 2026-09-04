"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  ArrowRight, 
  Loader2,
  ArrowLeft,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, resetPassword, loading } = useAuth();

  // Steps: 'request' | 'otp' | 'success'
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef([]);

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle OTP digit inputs
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMessage('');

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIdx]?.focus();
  };

  // Step 1: Submit Email for OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const res = await forgotPassword(email);
    if (res?.success) {
      setStep('otp');
      setResendCooldown(60);
    } else if (res?.error) {
      setErrorMessage(res.error);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMessage('');
    const res = await forgotPassword(email);
    if (res?.success) {
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } else if (res?.error) {
      setErrorMessage(res.error);
    }
  };

  // Step 2: Submit OTP & New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const res = await resetPassword({
      email,
      otp: fullOtp,
      newPassword,
    });

    if (res?.success) {
      setStep('success');
    } else if (res?.error) {
      setErrorMessage(res.error);
    }
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
        <div className="w-full max-w-[420px] space-y-8">

          {/* ─── STEP 1: Enter Email ─── */}
          {step === 'request' && (
            <>
              <div className="space-y-2">
                <Link href="/login" className="inline-flex items-center gap-2 text-xs text-[#71717a] hover:text-white transition-colors mb-2 font-medium">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
                <h1 className="font-medium text-2xl tracking-tight">Reset your password</h1>
                <p className="text-sm text-[#71717a]">Enter your registered business email. We'll send a 6-digit verification code to reset your password.</p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSendOtp}>
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="you@business.com" 
                      className="pl-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all" 
                      required 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !email} 
                  className="w-full h-11 rounded-xl bg-[#00D18F] text-black font-semibold text-sm hover:bg-[#00D18F]/90 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send Verification Code <ArrowRight size={15} />
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* ─── STEP 2: Enter OTP & New Password ─── */}
          {step === 'otp' && (
            <>
              <div className="space-y-2">
                <button 
                  type="button" 
                  onClick={() => setStep('request')} 
                  className="inline-flex items-center gap-2 text-xs text-[#71717a] hover:text-white transition-colors mb-2 font-medium"
                >
                  <ArrowLeft size={14} /> Change email
                </button>
                <h1 className="font-medium text-2xl tracking-tight">Enter verification code</h1>
                <p className="text-sm text-[#71717a]">
                  We sent a 6-digit code to <span className="text-white font-medium">{email}</span>. Enter the code and set your new password.
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleResetPassword}>
                {/* 6-digit OTP Inputs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-[#71717a] uppercase tracking-wider">
                      6-Digit Code
                    </Label>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || loading}
                      className="text-xs text-[#00D18F] hover:underline disabled:text-[#52525b] disabled:no-underline inline-flex items-center gap-1"
                    >
                      <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>

                  <div className="flex justify-between gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-13 text-center text-xl font-bold bg-white/[0.04] border border-white/[0.12] rounded-xl text-[#00D18F] focus:border-[#00D18F] focus:outline-none focus:ring-1 focus:ring-[#00D18F] transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs text-[#71717a] uppercase tracking-wider">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Minimum 6 characters"
                      className="pl-10 pr-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-white"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-[#71717a] uppercase tracking-wider">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={15} />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Repeat new password"
                      className="pl-10 pr-10 h-11 bg-white/[0.03] border-white/[0.10] focus:border-[#00D18F]/50 text-white placeholder:text-[#52525b] rounded-xl transition-all"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || otp.some((d) => !d) || !newPassword || !confirmPassword} 
                  className="w-full h-11 rounded-xl bg-[#00D18F] text-black font-semibold text-sm hover:bg-[#00D18F]/90 transition-all hover:scale-[1.01] active:scale-[0.99] mt-3 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Reset Password <ArrowRight size={15} />
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* ─── STEP 3: Success ─── */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-[#00D18F]/10 border border-[#00D18F]/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-[#00D18F]" size={30} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-medium tracking-tight">Password Reset Complete</h2>
                <p className="text-sm text-[#71717a] leading-relaxed">
                  Your password has been successfully updated. You can now log in to your account with your new credentials.
                </p>
              </div>

              <Button 
                onClick={() => router.push('/login')}
                className="w-full h-11 rounded-xl bg-[#00D18F] text-black font-semibold text-sm hover:bg-[#00D18F]/90 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                Sign In to Voxy
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
