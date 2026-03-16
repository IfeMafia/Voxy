/**
 * Footer.jsx
 *
 * Responsibilities:
 *   - Render brand, navigation links, legal links, and copyright
 *
 * Design intent:
 *   - Minimal, professional — does not compete with the CTA above it
 *   - All links sourced from landingData FOOTER constant
 */

import React from "react";
import Link from "next/link";
import { FOOTER } from "@/landing/landingData";

export default function Footer() {
  return (
    <footer className="border-t border-voxy-border px-6 py-12">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src="/favicon.jpg" alt="Voxy Logo" className="size-8 rounded-lg object-cover" />
          <span className="text-xl font-bold tracking-tight text-white">
            VOXY
          </span>
          <span className="text-voxy-subtle text-[13px] hidden sm:inline">
            — {FOOTER.tagline}
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-4">
          {FOOTER.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-voxy-subtle hover:text-voxy-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-[12px] text-voxy-subtle text-center md:text-right">
          {FOOTER.copyright}
        </p>

      </div>
    </footer>
  );
}
