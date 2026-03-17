"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { LOGIN_CONTENT } from '@/landing/loginData';
import { AuthBranding, AuthAlternativeAction, MobileAuthHeader } from '@/components/layout/AuthLayout';
import { Suspense } from 'react';
import Navbar from '@/landing/sections/Navbar';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered');
  const { login, loading, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(formData);
      if (data?.success && data?.user) {
        const routes = {
          customer: '/customer/chat',
          business: '/business/dashboard',
          admin: '/lighthouse/dashboard'
        };
        const target = routes[data.user.role] || routes.business;
        router.push(target);
      }
    } catch (err) {
      // Error is gracefully handled by the useAuth hook/toast
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col text-voxy-text font-sans selection:bg-voxy-primary/30 selection:text-white">
      <Navbar />
      
      <div className="flex-1 flex flex-col lg:flex-row pt-16 lg:pt-0">
        {/* High Cohesion Branding Column */}
      <AuthBranding>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0A0A] border border-voxy-border mb-6">
          {LOGIN_CONTENT.badge.icon}
          <span className="text-xs font-medium text-voxy-muted">{LOGIN_CONTENT.badge.text}</span>
        </div>

        <h1 className="text-[40px] lg:text-[56px] font-sans font-bold leading-[1.1] tracking-tight mb-6 tracking-tight">
          {LOGIN_CONTENT.heading}
        </h1>
        
        <p className="text-[16px] text-voxy-muted leading-[1.6] max-w-[500px] mb-12">
          {LOGIN_CONTENT.subheading}
        </p>

        {/* Value Props Grid */}
        <div className="grid gap-6 mb-16">
          {LOGIN_CONTENT.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] border border-voxy-border flex items-center justify-center shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-[15px] font-semibold mb-1">{feature.title}</h3>
                <p className="text-[13px] text-voxy-muted leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="flex items-center gap-12 border-t border-voxy-border pt-8">
          {LOGIN_CONTENT.stats.map((stat, idx) => (
            <div key={idx}>
              <div className="text-2xl font-bold text-voxy-text mb-1">{stat.value}</div>
              <div className="text-xs text-voxy-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </AuthBranding>

      {/* Form Column */}
      <div className="w-full lg:w-[560px] p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen lg:min-h-0">
        
        <MobileAuthHeader />

        <div className="w-full max-w-[480px] lg:max-w-none bg-[#0A0A0A] border border-voxy-border rounded-3xl p-6 sm:p-10 shadow-2xl">
          
          <div className="mb-8 text-center sm:text-left">
            {isRegistered && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-voxy-primary/10 border border-voxy-primary/20 mb-4">
                <CheckCircle2 size={14} className="text-voxy-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-voxy-primary">Account created</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-2 uppercase tracking-tighter">Welcome Back</h2>
            <p className="text-sm sm:text-base text-voxy-muted">Sign in to access your Voxy dashboard.</p>
          </div>

          <Button variant="outline" className="w-full mb-6 bg-[#141414] border-voxy-border hover:bg-[#222222] h-11 transition-all">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-voxy-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0A0A0A] px-3 text-voxy-muted font-medium tracking-wider">Or sign in with email</span>
            </div>
          </div>

          <form className="space-y-5 mb-8" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-voxy-muted uppercase tracking-wider">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-voxy-muted group-focus-within:text-voxy-primary transition-colors" size={16} />
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com" 
                  className="pl-10 bg-[#141414] border-transparent focus:border-voxy-primary/50 h-11 transition-all" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-voxy-muted uppercase tracking-wider">Password</Label>
                <Link href="/forgot-password" size="sm" className="text-xs text-voxy-muted hover:text-voxy-primary transition-colors">Forgot password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-voxy-muted group-focus-within:text-voxy-primary transition-colors" size={16} />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••" 
                  className="pl-10 pr-10 bg-[#141414] border-transparent focus:border-voxy-primary/50 h-11 transition-all" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-voxy-muted hover:text-voxy-text transition-colors p-1 rounded-md hover:bg-white/5"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 text-[15px] font-semibold mt-2 bg-voxy-primary text-black hover:bg-voxy-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(0,209,143,0.1)]">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight size={16} />
                </div>
              )}
            </Button>
          </form>

          <AuthAlternativeAction 
            message="New to Voxy?"
            actionLabel="Create an account"
            actionHref="/register"
          />
        </div>
      </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-voxy-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
