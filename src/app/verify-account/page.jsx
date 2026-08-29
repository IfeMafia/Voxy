"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Loader2, Clock, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

function VerifyAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState(['', '', '', '']); // 4-digit as per request
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes (600 seconds)
  const [isExpired, setIsExpired] = useState(false);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error("Email is missing. Please sign up or login again.");
      router.push('/register');
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, router]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, 4);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    
    // Focus last input
    const lastIdx = Math.min(data.length - 1, 3);
    inputRefs.current[lastIdx]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (isExpired) {
      toast.error("The code has expired. Please request a new one.");
      return;
    }

    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      toast.error("Please enter the full 4-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Account verified! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(data.error || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('New 4-digit code sent to your email!');
        setOtp(['', '', '', '']);
        setTimer(600);
        setIsExpired(false);
      } else {
        toast.error(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setResending(false);
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
        <div className="w-full max-w-[440px] space-y-8">
          
          <div className="mb-8 text-center sm:text-left space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#00D18F]/10 rounded-full border border-[#00D18F]/20">
              <Mail className="w-5 h-5 text-[#00D18F]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-medium tracking-tight">Check your email</h1>
              <p className="text-sm text-[#71717a] leading-relaxed">
                We sent a 4-digit verification code to<br/>
                <span className="text-white font-medium">{email}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-8">
            <div className="grid grid-cols-4 gap-3 px-2 sm:px-0">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  readOnly={isExpired}
                  className={`aspect-square sm:aspect-auto sm:h-16 bg-white/[0.03] border rounded-xl text-center text-xl sm:text-2xl font-medium text-white focus:border-[#00D18F]/50 outline-none transition-all ${digit ? 'border-[#00D18F]/30' : 'border-white/[0.10]'} ${isExpired ? 'opacity-30 cursor-not-allowed' : ''}`}
                />
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex justify-center sm:justify-start">
                {isExpired ? (
                  <div className="flex items-center gap-2 text-red-400 font-medium text-xs bg-red-400/10 px-3 py-1.5 rounded-md border border-red-400/20">
                    <AlertCircle size={14} />
                    Code Expired
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[#71717a] text-xs font-medium">
                    <Clock size={14} className="text-[#00D18F]" />
                    Code expires in <span className="text-white">{formatTime(timer)}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || otp.some(d => !d) || isExpired}
                className="w-full h-11 text-sm font-semibold bg-[#00D18F] text-black rounded-xl hover:bg-[#00D18F]/90 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>Verify Account</>
                )}
              </Button>

              <div className="text-center sm:text-left space-y-4">
                <p className="text-sm text-[#71717a]">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-white hover:text-[#00D18F] font-medium transition-colors disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Click to resend'}
                  </button>
                </p>

                <div className="pt-6 border-t border-white/[0.07]">
                  <Link 
                    href="/register" 
                    className="text-sm text-[#71717a] hover:text-white transition-colors font-medium"
                  >
                    Back to sign up
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00D18F]/20 border-t-[#00D18F] rounded-full animate-spin" />
      </div>
    }>
      <VerifyAccountContent />
    </Suspense>
  );
}
