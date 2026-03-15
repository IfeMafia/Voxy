import Link from "next/link";
import { Globe, Zap, Shield } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white selection:bg-[#00D18F]/30 selection:text-[#00D18F] transition-colors">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-200 dark:border-white/5 bg-white/60 dark:bg-black/60 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.jpg" alt="Voxy Logo" className="size-8 rounded-lg object-cover" />
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Voxy
            </span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-500 dark:text-zinc-400 md:flex">
            <a href="#features" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              How it Works
            </a>
            <a href="#pricing" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-white"
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

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl text-zinc-900 dark:text-white leading-[1.1] md:-tracking-[0.02em] transition-colors">
            Speak the Language of <br className="hidden md:block" />
            <span className="text-[#00D18F]">
              Your People.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl font-medium leading-relaxed transition-colors">
            Empower your business with an AI voice assistant that understands
            local dialects and nuances. Seamlessly handle orders, inquiries, and
            support across Africa.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
            <Link 
              href="/register"
              className="w-full rounded-full bg-[#00D18F] px-10 py-5 text-center font-bold text-black transition-all hover:brightness-110 sm:w-auto shadow-lg shadow-[#00D18F]/20"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/register"
              className="w-full rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-10 py-5 text-center font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 sm:w-auto text-zinc-900 dark:text-white shadow-sm"
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
              icon: Globe,
            },
            {
              title: "Lightning Fast",
              desc: "Optimized response times less than 1s. Keep your customers engaged without the wait.",
              icon: Zap,
            },
            {
              title: "Privacy First",
              desc: "Local processing options available for sensitive business data. Your data stays Yours.",
              icon: Shield,
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/40 p-8 transition-all hover:border-[#00D18F]/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 shadow-sm dark:shadow-none"
            >
              <div className="mb-4 text-[#00D18F]">
                <feature.icon className="size-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-zinc-900 dark:text-white transition-colors">
                {feature.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Quote */}
      <section className="bg-zinc-50 dark:bg-black py-24 border-t border-zinc-200 dark:border-white/5 transition-colors">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="text-4xl font-serif text-zinc-400 dark:text-zinc-700 mb-8 opacity-50">
            "
          </div>
          <p className="text-2xl font-light italic text-zinc-700 dark:text-zinc-300 sm:text-3xl transition-colors">
            "Voxy transformed how I handle delivery orders in Lagos. I
            no longer miss calls during rush hour, and my customers love that it
            speaks their language."
          </p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="size-12 rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
               <img src="/favicon.jpg" alt="Founder" className="size-full object-cover grayscale opacity-50" />
            </div>
            <span className="font-bold whitespace-nowrap text-zinc-900 dark:text-white transition-colors">Emeka Okafor</span>
            <span className="text-sm text-zinc-500 uppercase tracking-widest">
              Founder, LagosDelights
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/5 py-12 px-6 bg-white dark:bg-black transition-colors">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/favicon.jpg" alt="Voxy Logo" className="size-8 rounded-lg object-cover" />
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white transition-colors">Voxy</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <Link href="#" className="hover:text-[#00D18F] transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-[#00D18F] transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#00D18F] transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-600 transition-colors">
            &copy; {new Date().getFullYear()} Voxy. Built for the
            future of Africa.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
