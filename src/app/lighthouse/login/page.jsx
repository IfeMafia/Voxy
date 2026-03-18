"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  
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
    console.log('Admin login attempt form data:', { email: formData.email, passwordLength: formData.password.length });
    try {
      const data = await login(formData);
      console.log('Login endpoint returned:', data);
      
      if (data?.success && data?.user) {
        if (data.user.role === 'admin') {
          console.log('Auth success, redirecting to dashboard');
          toast.success('Admin access granted');
          router.push('/lighthouse/dashboard');
        } else {
          console.warn('Auth success but role is NOT admin:', data.user.role);
          toast.error('Access denied. Administrator privileges required.');
        }
      } else {
        console.warn('Login failed or incomplete data:', data);
      }
    } catch (err) {
      console.error('Login submission error:', err);
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-[420px]">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="size-16 rounded-2xl bg-[#00D18F]/10 border border-[#00D18F]/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-[#00D18F]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white uppercase italic">
            VOXY <span className="text-[#00D18F] not-italic">LIGHTHOUSE</span>
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Internal Administration Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                Admin Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#00D18F] transition-colors" size={16} />
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@voxy.ai" 
                  className="pl-10 bg-black border-white/5 focus:border-[#00D18F]/50 h-12 transition-all rounded-xl text-white" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                Security Key
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#00D18F] transition-colors" size={16} />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••" 
                  className="pl-10 pr-10 bg-black border-white/5 focus:border-[#00D18F]/50 h-12 transition-all rounded-xl text-white" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-[15px] font-bold bg-[#00D18F] text-black hover:bg-[#00D18F]/90 transition-all rounded-xl shadow-[0_0_20px_rgba(0,209,143,0.15)] group">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Authorize Access <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
              Return to main site
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em]">
            Protected by Voxy Security Protocol v4.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
