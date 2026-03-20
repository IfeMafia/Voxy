"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Mail, 
  Lock, 
  User,
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
import { useRouter } from 'next/navigation';
import { SIGNUP_CONTENT } from '@/landing/signupData';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { AuthBranding, AuthAlternativeAction, MobileAuthHeader } from '@/components/layout/AuthLayout';
import Navbar from '@/landing/sections/Navbar';

export default function Signup() {
  const router = useRouter();
  const { register, loading } = useAuth();
  const { passwordError, isPasswordValid, validatePassword } = usePasswordValidation();
  
  const [role, setRole] = useState('business'); 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    if (id === 'password') {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    
    try {
      const data = await register({
        ...formData,
        role: role
      });
      if (data?.success) {
        router.push(`/verify-account?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      // Error handled by useAuth via toast
    }
  };

  const currentContent = SIGNUP_CONTENT[role];

  return (
    <div className="min-h-screen bg-background flex flex-col text-voxy-text font-sans selection:bg-voxy-primary/30 selection:text-white">
      <Navbar />
      
      <div className="flex-1 flex flex-col lg:flex-row pt-16 lg:pt-0">
        {/* Left Column */}
      <AuthBranding>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-voxy-surface border border-voxy-border mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-voxy-primary"></div>
          <span className="text-xs font-medium text-voxy-muted">{currentContent.badge}</span>
        </div>

        <h1 className="text-[40px] lg:text-[56px] font-sans font-bold leading-[1.1] tracking-tight mb-6 tracking-tight">
          {currentContent.heading}
        </h1>
        
        <p className="text-[16px] text-voxy-muted leading-[1.6] max-w-[500px] mb-12">
          {currentContent.subheading}
        </p>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {currentContent.features.map((feature, idx) => (
            <div key={idx} className="bg-voxy-surface p-5 rounded-xl border border-transparent hover:border-voxy-border transition-colors">
              {feature.icon}
              <h3 className="text-[15px] font-semibold mb-2">{feature.title}</h3>
              <p className="text-[13px] text-voxy-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-12 border-t border-voxy-border pt-8">
          {currentContent.stats.map((stat, idx) => (
            <div key={idx}>
              <div className="text-2xl font-bold text-voxy-text mb-1">{stat.value}</div>
              <div className="text-xs text-voxy-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </AuthBranding>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[560px] p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen lg:min-h-0 relative max-h-[1000px] z-10">
        
        <MobileAuthHeader />

        <div className="w-full max-w-[480px] lg:max-w-none bg-voxy-surface border border-voxy-border rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
          <div className="mb-8 text-left">
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-2 uppercase tracking-tighter">Create Account</h2>
            <p className="text-sm sm:text-base text-voxy-muted">{currentContent.formSubheading}</p>
          </div>

          {/* Role Switching Tabs */}
          <div className="flex bg-muted p-1 rounded-lg mb-8 border border-border">
            <button 
              onClick={() => setRole('business')}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all flex items-center justify-center gap-2 ${role === 'business' ? 'bg-background text-voxy-text shadow-sm' : 'text-voxy-muted hover:text-voxy-text'}`}
            >
              <Building2 size={16} /> Business
            </button>
            <button 
              onClick={() => setRole('customer')}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all flex items-center justify-center gap-2 ${role === 'customer' ? 'bg-background text-voxy-text shadow-sm' : 'text-voxy-muted hover:text-voxy-text'}`}
            >
              <User size={16} /> Customer
            </button>
          </div>

          <form className="space-y-5 mb-8" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-voxy-muted uppercase tracking-wider">
                {role === 'business' ? 'Company Name' : 'Full Name'}
              </Label>
              <div className="relative">
                {role === 'business' ? (
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-voxy-muted" size={16} />
                ) : (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-voxy-muted" size={16} />
                )}
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={role === 'business' ? "Acme Corp" : "Jane Doe"} 
                  className="pl-10 bg-background border-border h-11" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-voxy-muted uppercase tracking-wider">
                {role === 'business' ? 'Work Email' : 'Email Address'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-voxy-muted" size={16} />
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={role === 'business' ? "work@company.com" : "jane@example.com"} 
                  className="pl-10 bg-background border-border h-11" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-voxy-muted uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-voxy-muted" size={16} />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••" 
                  className={`pl-10 pr-10 bg-background h-11 transition-colors ${
                    isPasswordValid ? 'border-voxy-primary focus:border-voxy-primary focus:ring-voxy-primary/20' : 
                    passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 
                    'border-border focus:border-voxy-primary/50'
                  }`} 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-voxy-muted hover:text-voxy-text transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-500 mt-1 leading-relaxed">{passwordError}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 text-[15px] font-semibold mt-2 bg-voxy-primary text-black hover:bg-voxy-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99]">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <>Create {role === 'business' ? 'Business' : 'Customer'} Account</>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-voxy-surface px-3 text-voxy-muted font-medium tracking-wider">Or</span></div>
          </div>

          <button
            type="button"
            onClick={() => window.location.href = `/api/auth/google?role=${role}`}
            className="w-full mb-6 flex items-center justify-center gap-3 bg-background border border-border hover:bg-muted h-11 rounded-lg transition-all text-sm font-medium text-voxy-text"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google as {role === 'business' ? 'Business' : 'Customer'}
          </button>

          <div className="flex items-start gap-2 mb-8">
            <CheckCircle2 className="text-voxy-primary shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-voxy-muted leading-relaxed">
              {currentContent.privacyNotice}
            </p>
          </div>

          <AuthAlternativeAction 
            message="Already have an account?"
            actionLabel="Sign in"
            actionHref="/login"
          />
        </div>
      </div>
    </div>
  </div>
  );
}
