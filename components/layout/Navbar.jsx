import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Voxy Logo" className="size-8 rounded-lg object-cover" />
          <span className="text-xl font-bold tracking-tight text-white">
            Voxy
          </span>
        </div>
        
        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
          <Link href="/#features" className="transition-colors hover:text-white">Features</Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-white">How it Works</Link>
          <Link href="/#pricing" className="transition-colors hover:text-white">Pricing</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
            Login
          </Link>
          <Link href="/register" className="rounded-full bg-[#00D18F] px-5 py-2 text-sm font-semibold text-black transition-all hover:brightness-110">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
