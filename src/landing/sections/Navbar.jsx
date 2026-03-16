"use client";

/**
 * Navbar.jsx
 *
 * Responsibilities:
 *   - Render brand logo, navigation links, and auth CTAs
 *   - Switch between transparent (top of page) and frosted glass (scrolled)
 *
 * Constraints:
 *   - Does NOT hardcode any link labels — sourced from landingData
 *   - Scroll behaviour is isolated in useScrolled hook
 *   - Uses Next.js Link and useRouter, not react-router-dom
 */

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useScrolled } from "@/landing/hooks/useScrolled";
import { NAV_LINKS } from "@/landing/landingData";

export default function Navbar() {
  const router = useRouter();
  const scrolled = useScrolled(12);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled
          ? "bg-black/70 backdrop-blur-md border-b border-voxy-border"
          : "bg-transparent"
        }
      `}
    >
      <nav className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
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

        {/* Auth CTAs */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex text-voxy-muted hover:text-voxy-text"
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
        </div>

      </nav>
    </header>
  );
}
