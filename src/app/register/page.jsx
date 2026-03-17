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
  
  const [role, setRole] = useState('customer'); 
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
      await register({
        ...formData,
        role: role
      });
      router.push('/login?registered=true');
    } catch (err) {
      // Error handled by useAuth via toast
    }
  };

  const currentContent = SIGNUP_CONTENT[role];

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col text-voxy-text font-sans selection:bg-voxy-primary/30 selection:text-white">
      <Navbar />
      
      <div className="flex-1 flex flex-col lg:flex-row pt-16 lg:pt-0">
        {/* Left Column */}
      <AuthBranding>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0A0A] border border-voxy-border mb-6">
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
            <div key={idx} className="bg-[#0A0A0A] p-5 rounded-xl border border-transparent hover:border-voxy-border transition-colors">
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

        <div className="w-full max-w-[480px] lg:max-w-none bg-[#0A0A0A] border border-voxy-border rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
          <div className="mb-8 text-left">
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-2 uppercase tracking-tighter">Create Account</h2>
            <p className="text-sm sm:text-base text-voxy-muted">{currentContent.formSubheading}</p>
          </div>

          {/* Role Switching Tabs */}
          <div className="flex bg-[#141414] p-1 rounded-lg mb-8 border border-voxy-border">
            <button 
              onClick={() => setRole('business')}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all flex items-center justify-center gap-2 ${role === 'business' ? 'bg-[#222222] text-voxy-text shadow-sm' : 'text-voxy-muted hover:text-voxy-text'}`}
            >
              <Building2 size={16} /> Business
            </button>
            <button 
              onClick={() => setRole('customer')}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all flex items-center justify-center gap-2 ${role === 'customer' ? 'bg-[#222222] text-voxy-text shadow-sm' : 'text-voxy-muted hover:text-voxy-text'}`}
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
                  className="pl-10 bg-[#141414] border-transparent focus:border-voxy-primary/50 h-11" 
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
                  className="pl-10 bg-[#141414] border-transparent focus:border-voxy-primary/50 h-11" 
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
                  className={`pl-10 pr-10 bg-[#141414] h-11 transition-colors ${
                    isPasswordValid ? 'border-voxy-primary focus:border-voxy-primary focus:ring-voxy-primary/20' : 
                    passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 
                    'border-transparent focus:border-voxy-primary/50'
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
