import React from "react";
import Link from "next/link";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00D18F]/30 selection:text-[#00D18F]">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Voxy Logo" className="size-8 rounded-lg object-cover" />
            <span className="text-xl font-bold tracking-tight text-white">
              Voxy
            </span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-white"
            >
              How it Works
            </a>
            <a href="#pricing" className="transition-colors hover:text-white">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="rounded-full bg-[#00D18F] px-5 py-2 text-sm font-semibold text-black transition-all hover:brightness-110"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00D18F]/20 bg-[#00D18F]/5 px-4 py-1.5 text-xs font-semibold text-[#00D18F] backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D18F] opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-[#00D18F]"></span>
            </span>
            Now supporting 12+ African Languages
          </div>

          <h1 className="text-6xl font-extrabold tracking-tight sm:text-[100px] text-white leading-[1.05] md:-tracking-[0.02em]">
            Speak the Language of <br className="hidden md:block" />
            <span className="text-[#00D18F]">
              Your People.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-zinc-400 sm:text-xl font-medium leading-relaxed">
            Empower your business with an AI voice assistant that understands
            local dialects and nuances. Seamlessly handle orders, inquiries, and
            support across Africa.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
            <Link 
              href="/register"
              className="w-full rounded-full bg-[#00D18F] px-10 py-5 text-center font-bold text-black transition-all hover:brightness-110 sm:w-auto"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/register"
              className="w-full rounded-full border border-white/10 bg-zinc-900 px-10 py-5 text-center font-bold transition-all hover:bg-zinc-800 sm:w-auto text-white"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              title: "Native Accents",
              desc: "Deeply trained on Pidgin, Yoruba, Swahili and more. Not just translation - true understanding.",
              icon: "🌍",
            },
            {
              title: "Lightning Fast",
              desc: "Optimized response times less than 1s. Keep your customers engaged without the wait.",
              icon: "⚡",
            },
            {
              title: "Privacy First",
              desc: "Local processing options available for sensitive business data. Your data stays Yours.",
              icon: "🛡️",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-white/5 bg-zinc-900/40 p-8 transition-all hover:border-[#00D18F]/30 hover:bg-zinc-900/60"
            >
              <div className="mb-4 text-3xl">{feature.icon}</div>
              <h3 className="mb-3 text-xl font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Quote */}
      <section className="bg-black py-24 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="text-4xl font-serif text-zinc-700 mb-8 opacity-50">
            "
          </div>
          <p className="text-2xl font-light italic text-zinc-300 sm:text-3xl">
            "Voxy transformed how I handle delivery orders in Lagos. I
            no longer miss calls during rush hour, and my customers love that it
            speaks their language."
          </p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="size-12 rounded-full border border-white/10 bg-zinc-900 overflow-hidden">
               <img src="/logo.jpg" alt="Founder" className="size-full object-cover grayscale opacity-50" />
            </div>
            <span className="font-bold whitespace-nowrap text-white">Emeka Okafor</span>
            <span className="text-sm text-zinc-500 uppercase tracking-widest">
              Founder, LagosDelights
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-black">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Voxy Logo" className="size-6 rounded" />
            <span className="text-lg font-bold tracking-tight text-white">Voxy</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <Link href="#" className="hover:text-[#00D18F]">
              Terms
            </Link>
            <Link href="#" className="hover:text-[#00D18F]">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#00D18F]">
              Contact
            </Link>
          </div>
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Voxy. Built for the
            future of Africa.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
