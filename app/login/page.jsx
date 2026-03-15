import PublicLayout from '@/components/layout/PublicLayout';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <PublicLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex justify-center mb-6">
            <img src="/logo.jpg" alt="Voxy Logo" className="size-12 rounded-xl" />
          </div>
          <h1 className="text-3xl font-bold text-white text-center">Welcome Back</h1>
          <p className="mt-2 text-zinc-400 text-center">Access your Voxy dashboard</p>
          
          <form className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email Address</label>
              <input 
                type="email" 
                className="w-full p-3 bg-black border border-white/10 rounded-lg focus:ring-2 focus:ring-[#00D18F] focus:border-transparent outline-none text-white transition-all" 
                placeholder="name@example.com" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <input 
                type="password" 
                className="w-full p-3 bg-black border border-white/10 rounded-lg focus:ring-2 focus:ring-[#00D18F] focus:border-transparent outline-none text-white transition-all" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-4 bg-[#00D18F] text-black rounded-lg font-bold hover:brightness-110 transition-all mt-4"
            >
              Login
            </button>
          </form>
          
          <p className="mt-6 text-center text-zinc-500 text-sm">
            Don't have an account? <Link href="/register" className="text-[#00D18F] hover:underline">Register now</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
