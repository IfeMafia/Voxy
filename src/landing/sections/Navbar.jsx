"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useScrolled } from "@/landing/hooks/useScrolled";
import { useAuth } from "@/hooks/useAuth";
import { NAV_LINKS } from "@/landing/landingData";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const scrolled = useScrolled(12);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleDashboardRedirect = () => {
    if (!user) return;
    if (user.role === 'customer') {
      router.push('/customer/chat');
    } else if (user.role === 'admin') {
      router.push('/lighthouse/dashboard');
    } else if (user.role === 'business' || user.role === 'business_owner') {
      router.push('/business/dashboard');
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-[400ms]
        ${scrolled || isMobileMenuOpen
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10"
          : "bg-transparent"
        }
      `}
    >
      <nav className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group relative z-50">
          <img src="/favicon.jpg" alt="Voxy Logo" className="w-5 h-5 rounded-full flex-shrink-0 transition-transform group-hover:scale-110 object-cover" />
          <span className="font-sans font-bold text-[18px] tracking-tight text-voxy-text">Voxy</span>
        </Link>

        {/* Section links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-voxy-muted hover:text-voxy-text transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side CTAs + Theme + Mobile Toggle */}
        <div className="flex items-center gap-3 relative z-50">
          <ThemeToggle />
          
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                size="sm"
                className="bg-voxy-primary text-black font-semibold hover:bg-voxy-primary/90"
                onClick={handleDashboardRedirect}
              >
                Go to {user?.role === 'customer' ? 'Chat' : 'Dashboard'}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-voxy-muted hover:text-voxy-text"
                  onClick={() => router.push("/login")}
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  className="bg-voxy-primary text-black font-semibold hover:bg-voxy-primary/90"
                  onClick={() => router.push("/register")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            className="md:hidden p-2 text-voxy-text hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        <div 
          className={`
            absolute top-full left-0 right-0 bg-white dark:bg-black/95 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/10 md:hidden transition-all duration-500 ease-in-out origin-top border-t border-zinc-100 dark:border-white/5 shadow-2xl overflow-hidden
            ${isMobileMenuOpen ? "max-h-[80vh] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-95 pointer-events-none"}
          `}
        >
          <div className="flex flex-col p-6 gap-8">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link, idx) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    text-[15px] font-semibold text-voxy-text hover:text-voxy-primary transition-all duration-300 transform
                    ${isMobileMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}
                  `}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-white/5">
                    {link.label}
                    <ArrowRight size={14} className="text-voxy-muted/50" />
                  </div>
                </Link>
              ))}
            </div>

            <div 
              className={`
                flex flex-col gap-3 pt-4 transition-all duration-500 transform
                ${isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
              `}
              style={{ transitionDelay: `${NAV_LINKS.length * 50}ms` }}
            >
              {user ? (
                <Button
                  className="w-full h-12 bg-voxy-primary text-black font-bold text-sm rounded-xl transform active:scale-95 transition-transform"
                  onClick={() => {
                    handleDashboardRedirect();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Go to {user?.role === 'customer' ? 'Chat' : 'Dashboard'}
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 text-voxy-text border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-sm font-medium rounded-xl"
                    onClick={() => {
                      router.push("/login");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    className="h-12 bg-voxy-primary text-black font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-transform"
                    onClick={() => {
                      router.push("/register");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

      </nav>
    </header>
  );
}
