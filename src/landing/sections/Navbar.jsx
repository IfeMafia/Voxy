"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useScrolled } from "@/landing/hooks/useScrolled";
import { useAuth } from "@/hooks/useAuth";
import { NAV_LINKS } from "@/landing/landingData";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const scrolled = useScrolled(16);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const handleDashboardRedirect = () => {
    if (!user) return;
    if (user.role === "customer") {
      router.push("/customer/chat");
    } else if (user.role === "admin") {
      router.push("/lighthouse/dashboard");
    } else {
      router.push("/business/dashboard");
    }
  };

  return (
    <>
      {/* ── Desktop / Scroll Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/[0.06]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="max-w-[1240px] mx-auto px-6 h-[68px] relative flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <Image
              src="/logo.jpg"
              alt="Voxy Logo"
              width={32}
              height={32}
              className="rounded-lg object-cover group-hover:scale-105 transition-transform"
            />
            <span className="font-sans font-semibold text-[17px] tracking-tight text-white">
              Voxy
            </span>
          </Link>

          {/* Center Nav Links — absolutely centered ── */}
          <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13.5px] font-normal text-[#a1a1aa] hover:text-white transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right CTA — Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button
                size="sm"
                className="rounded-full px-5 h-9 bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-all"
                onClick={handleDashboardRedirect}
              >
                Go to {user?.role === "customer" ? "Chat" : "Dashboard"}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#a1a1aa] hover:text-white hover:bg-white/[0.05] rounded-full px-4 h-9 text-[13.5px]"
                  onClick={() => router.push("/login")}
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  className="rounded-full px-5 h-9 bg-transparent border border-white/25 text-white text-[13.5px] font-medium hover:bg-white hover:text-black transition-all"
                  onClick={() => router.push("/register")}
                >
                  Try Voxy
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </nav>
      </header>

      {/* ── Full-Page Mobile Menu Overlay ── */}
      <div
        className={`fixed inset-0 z-[100] bg-black flex flex-col transition-all duration-300 md:hidden ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Mobile Header Row */}
        <div className="flex items-center justify-between px-6 h-[68px] border-b border-white/[0.06] flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image
              src="/logo.jpg"
              alt="Voxy Logo"
              width={32}
              height={32}
              className="rounded-lg object-cover"
            />
            <span className="font-sans font-semibold text-[17px] tracking-tight text-white">
              Voxy
            </span>
          </Link>

          <button
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex-1 flex flex-col justify-between px-6 py-10 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-medium text-white/70 hover:text-white py-3 border-b border-white/[0.06] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile CTAs */}
          <div className="flex flex-col gap-3 pt-8">
            {user ? (
              <Button
                className="w-full h-13 rounded-2xl bg-white text-black font-bold text-base"
                onClick={() => {
                  handleDashboardRedirect();
                  setIsMobileMenuOpen(false);
                }}
              >
                Go to {user?.role === "customer" ? "Chat" : "Dashboard"}
              </Button>
            ) : (
              <>
                <Button
                  className="w-full h-13 rounded-2xl bg-white text-black font-bold text-base"
                  onClick={() => {
                    router.push("/register");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-13 rounded-2xl border-white/10 text-white hover:bg-white/5 font-medium text-base"
                  onClick={() => {
                    router.push("/login");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Log in
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
