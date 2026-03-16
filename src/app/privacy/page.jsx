"use client";

import React from "react";
import Navbar from "@/landing/sections/Navbar";
import Footer from "@/landing/sections/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-[800px] mx-auto space-y-12 animate-fade-in-up">
          
          <header className="space-y-4">
            <p className="eyebrow">Privacy</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-voxy-muted">Last updated: March 16, 2026</p>
          </header>

          <section className="space-y-6 text-[16px] leading-[1.7] text-voxy-muted">
            <div className="voxy-card p-1">
              <div className="bg-voxy-surface rounded-[0.7rem] p-8 space-y-8">
                
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">1. Data We Collect</h2>
                  <p>
                    We collect minimal personal information required to manage your account (name, email). We also temporarily process voice notes and text messages you provide through the integration to generate transcriptions and replies.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">2. Processing of Voice Data</h2>
                  <p>
                    User voice data is processed using our AI models to provide transcriptions. We do not store the original audio files permanently. Once converted to text for your dashboard, the source audio is discarded from our primary processing servers.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">3. Third-Party Services</h2>
                  <p>
                    We may use third-party AI providers (such as Google Gemini) to assist in language processing and reply generation. Data sent to these providers is anonymized where possible.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">4. Your Rights</h2>
                  <p>
                    You have the right to request access to the personal data we hold about you and to request that it be corrected or deleted. You can also export your conversation data at any time through your dashboard settings.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">5. Security</h2>
                  <p>
                    We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or destruction.
                  </p>
                </div>

              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
