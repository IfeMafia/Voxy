"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FOOTER } from "@/landing/landingData";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#060709] px-6 py-14">
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Voxy Logo"
            width={28}
            height={28}
            className="rounded-lg object-cover"
          />
          <span className="font-sans font-bold text-lg text-white tracking-tight">
            Voxy
          </span>
          <span className="text-xs text-[#64748b] hidden sm:inline">
            — {FOOTER.tagline}
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-3">
          {FOOTER.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-[#94a3b8] hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <div>
          <p className="text-xs text-[#64748b]">
            {FOOTER.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
