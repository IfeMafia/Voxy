"use client";

import { useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered');
  const { login, loading, error, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (err) {
      // Error is caught and accessible via the useAuth `error` state
    }
  };

  return (
    <PublicLayout>
      <div className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40">
           <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-[#00D18F] rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
           <div className="absolute top-[30%] right-[20%] w-72 h-72 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000" />
           <div className="absolute bottom-[20%] left-[40%] w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000" />
        </div>

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {/* Main Glass Card */}
          <div className="backdrop-blur-xl bg-zinc-950/60 p-8 sm:p-10 rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative before:absolute before:inset-0 before:rounded-[2rem] before:border before:border-white/5 before:-z-10 before:background-glass">
            
            {/* Header section */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00D18F] to-emerald-400 p-[2px] mb-6 shadow-lg shadow-[#00D18F]/20">
                <img src="/logo.jpg" alt="Voxy Logo" className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 text-center tracking-tight">
                Welcome Back
              </h1>
              <p className="mt-2 text-zinc-400/80 text-center text-sm font-medium">Log into your Voxy workspace</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegistered && (
                <div className="bg-[#00D18F]/10 border border-[#00D18F]/20 text-[#00D18F] text-sm p-3.5 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Account created! Log in to continue.
                </div>
              )}

              {/* Email Input */}
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#00D18F] transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-[#00D18F]/50 focus:border-[#00D18F] outline-none text-zinc-100 transition-all placeholder:text-zinc-600 font-medium shadow-inner" 
                  placeholder="Email address" 
                />
              </div>

              {/* Password Input */}
              <div className="group relative">
                <div className="flex items-center justify-between absolute -top-6 right-0 w-full px-1">
                  <span /> {/* Spacer */}
                  <Link href="#" className="text-xs font-semibold text-zinc-500 hover:text-[#00D18F] transition-colors">Recover password?</Link>
                </div>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#00D18F] transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-[#00D18F]/50 focus:border-[#00D18F] outline-none text-zinc-100 transition-all placeholder:text-zinc-600 font-medium shadow-inner" 
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#00D18F] to-emerald-500 text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(0,209,143,0.4)] transition-all duration-300 mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-500 font-medium">
              <span>New to Voxy?</span>
              <Link href="/register" className="text-white hover:text-[#00D18F] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#00D18F] after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100 pb-0.5">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
