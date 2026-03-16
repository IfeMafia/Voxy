"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useScrolled } from "@/landing/hooks/useScrolled";
import { useAuth } from "@/hooks/useAuth";
import { NAV_LINKS } from "@/landing/landingData";
import { Menu, X } from "lucide-react";

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
      router.push('/admin/dashboard');
    } else {
      router.push('/business/dashboard');
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-[400ms]
        ${scrolled || isMobileMenuOpen
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
        }
      `}
    >
      <nav className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group relative z-50">
          <img src="/favicon.jpg" alt="Voxy Logo" className="w-5 h-5 rounded-full flex-shrink-0 transition-transform group-hover:scale-110 object-cover" />
          <span className="font-bold text-[18px] tracking-tight text-voxy-text">VOXY</span>
        </Link>

        {/* Section links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-voxy-muted hover:text-voxy-text transition-colors duration-200"
            >
              {link.label}
            </a>
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
            className="md:hidden p-2 text-voxy-text hover:bg-white/10 rounded-lg transition-colors"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        <div 
          className={`
            fixed inset-0 bg-black/95 backdrop-blur-2xl md:hidden transition-all duration-500 flex flex-col items-center justify-center gap-8
            ${isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"}
          `}
        >
          <div className="flex flex-col items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-bold text-voxy-text hover:text-voxy-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 w-full px-6 pt-6 border-t border-white/10 max-w-xs">
            {user ? (
              <Button
                className="w-full h-14 bg-voxy-primary text-black font-bold text-lg"
                onClick={() => {
                  handleDashboardRedirect();
                  setIsMobileMenuOpen(false);
                }}
              >
                Go to {user?.role === 'customer' ? 'Chat' : 'Dashboard'}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full h-14 text-voxy-text border border-white/10 text-lg font-medium"
                  onClick={() => {
                    router.push("/login");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Log in
                </Button>
                <Button
                  className="w-full h-14 bg-voxy-primary text-black font-bold text-lg"
                  onClick={() => {
                    router.push("/register");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>

      </nav>
    </header>
  );
}
