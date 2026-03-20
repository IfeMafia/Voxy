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
    try {
      const data = await login(formData);
      
      if (data?.success && data?.user) {
        if (data.user.role === 'admin') {
          toast.success('Admin access granted');
          router.push('/lighthouse/dashboard');
        } else {
          toast.error('Access denied. Administrator privileges required.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-700">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="size-14 rounded-2xl bg-voxy-primary/10 border border-voxy-primary/20 flex items-center justify-center mb-6 shadow-xl shadow-voxy-primary/5">
            <ShieldCheck className="w-7 h-7 text-voxy-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Voxy <span className="text-voxy-primary">Lighthouse</span>
          </h1>
          <p className="text-zinc-500 font-medium text-[15px]">Internal Administration Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-[11px] font-bold text-zinc-500 ml-1">
                Admin Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-voxy-primary transition-colors" size={18} />
                <input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@voxy.ai" 
                  className="w-full h-12 pl-12 pr-4 bg-[#0A0A0A] border border-white/5 text-sm font-medium text-white placeholder:text-zinc-800 rounded-xl outline-none focus:border-voxy-primary/40 transition-all" 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-[11px] font-bold text-zinc-500">
                  Password
                </Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-voxy-primary transition-colors" size={18} />
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••" 
                  className="w-full h-12 pl-12 pr-12 bg-[#0A0A0A] border border-white/5 text-sm font-medium text-white placeholder:text-zinc-800 rounded-xl outline-none focus:border-voxy-primary/40 transition-all" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-[14px] font-bold bg-voxy-primary text-black hover:bg-voxy-primary/90 transition-all rounded-xl shadow-xl shadow-voxy-primary/10 group">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link href="/" className="text-[13px] font-medium text-zinc-500 hover:text-white transition-colors">
              Return to main site
            </Link>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-[11px] text-zinc-600 font-medium">
            Protected by Voxy Security Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
