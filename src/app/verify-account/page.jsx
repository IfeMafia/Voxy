"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Loader2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { AuthBranding, MobileAuthHeader } from '@/components/layout/AuthLayout';
import { VERIFY_CONTENT } from '@/landing/signupData';
import Navbar from '@/landing/sections/Navbar';

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
    <div className="min-h-screen bg-[#000000] flex flex-col text-voxy-text font-sans selection:bg-voxy-primary/30 selection:text-white">
      <Navbar />
      
      <div className="flex-1 flex flex-col lg:flex-row pt-16 lg:pt-0">
        <AuthBranding>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0A0A] border border-voxy-border mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-voxy-primary"></div>
            <span className="text-xs font-medium text-voxy-muted">{VERIFY_CONTENT.badge}</span>
          </div>

          <h1 className="text-[40px] lg:text-[56px] font-sans font-bold leading-[1.1] tracking-tight mb-6 tracking-tight">
            {VERIFY_CONTENT.heading}
          </h1>
          
          <p className="text-[16px] text-voxy-muted leading-[1.6] max-w-[500px] mb-12">
            {VERIFY_CONTENT.subheading}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-16">
            {VERIFY_CONTENT.features.map((feature, idx) => (
              <div key={idx} className="bg-[#0A0A0A] p-5 rounded-xl border border-transparent hover:border-voxy-border transition-colors">
                {feature.icon}
                <h3 className="text-[15px] font-semibold mb-2">{feature.title}</h3>
                <p className="text-[13px] text-voxy-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-12 border-t border-voxy-border pt-8">
            {VERIFY_CONTENT.stats.map((stat, idx) => (
              <div key={idx}>
                <div className="text-2xl font-bold text-voxy-text mb-1 italic">{stat.value}</div>
                <div className="text-xs text-voxy-muted font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </AuthBranding>

        <div className="w-full lg:w-[560px] p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen lg:min-h-0 relative z-10">
          <MobileAuthHeader />

          <div className="w-full max-w-[480px] lg:max-w-none bg-[#0A0A0A] border border-voxy-border rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
            <div className="mb-8 text-left">
              <div className="inline-flex items-center justify-center p-2.5 bg-voxy-primary/10 rounded-xl mb-6 border border-voxy-primary/20">
                <Mail className="w-6 h-6 text-voxy-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3 uppercase tracking-tighter">Check your email</h2>
              <p className="text-sm sm:text-base text-voxy-muted leading-relaxed">
                We sent a 4-digit verification code to<br/>
                <span className="text-voxy-text font-semibold">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-8">
              <div className="grid grid-cols-4 gap-4 px-2">
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
                    className={`aspect-square sm:aspect-auto sm:h-20 bg-[#141414] border rounded-xl text-center text-2xl sm:text-3xl font-bold text-voxy-text focus:border-voxy-primary focus:ring-1 focus:ring-voxy-primary/20 outline-none transition-all ${digit ? 'border-voxy-primary/50' : 'border-voxy-border'} ${isExpired ? 'opacity-30 cursor-not-allowed' : ''}`}
                  />
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex justify-center">
                  {isExpired ? (
                    <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs uppercase tracking-wider bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/20">
                      <AlertCircle size={14} />
                      Code Expired
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-voxy-muted text-xs font-medium">
                      <Clock size={14} className="text-voxy-primary" />
                      Code expires in <span className="text-voxy-text font-bold">{formatTime(timer)}</span>
                    </div>
                  )}
                </div>

                <button
                  disabled={loading || otp.some(d => !d) || isExpired}
                  className="w-full h-11 text-[15px] font-semibold bg-voxy-primary text-black rounded-lg hover:bg-voxy-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    <>Verify Account</>
                  )}
                </button>

                <div className="text-center space-y-4">
                  <p className="text-sm text-voxy-muted">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-voxy-primary hover:text-voxy-primary/80 font-semibold transition-colors disabled:opacity-50"
                    >
                      {resending ? 'Sending...' : 'Click to resend'}
                    </button>
                  </p>

                  <div className="pt-6 border-t border-voxy-border">
                    <Link 
                      href="/register" 
                      className="text-sm text-voxy-muted hover:text-voxy-text transition-colors font-medium"
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
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-voxy-primary/20 border-t-voxy-primary rounded-full animate-spin" />
      </div>
    }>
      <VerifyAccountContent />
    </Suspense>
  );
}
