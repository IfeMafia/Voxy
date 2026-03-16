"use client";

import React from "react";
import Navbar from "@/landing/sections/Navbar";
import Footer from "@/landing/sections/Footer";
import { SECTION_IDS } from "@/landing/landingData";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-[800px] mx-auto space-y-12 animate-fade-in-up">
          
          <header className="space-y-4">
            <p className="eyebrow">Legal</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-voxy-muted">Last updated: March 16, 2026</p>
          </header>

          <section className="space-y-6 text-[16px] leading-[1.7] text-voxy-muted">
            <div className="voxy-card p-1"> {/* Decorative border line */}
              <div className="bg-voxy-surface rounded-[0.7rem] p-8 space-y-8">
                
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using Voxy AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We provide a multilingual AI voice assistant designed to help small businesses process customer inquiries.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">2. Service Description</h2>
                  <p>
                    Voxy AI converts voice notes and informal text (in English, Pidgin, and Yoruba) into structured text and drafts suggested replies. The service is provided "as is" and relies on artificial intelligence which may occasionally produce inaccurate or incomplete results.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">3. User Responsibilities</h2>
                  <p>
                    You are responsible for the content of the replies you send to your customers. Voxy provides drafts; the final communication is your sole responsibility. You must comply with all local laws and regulations regarding electronic communications and data privacy.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">4. Account Security</h2>
                  <p>
                    You are responsible for maintaining the confidentiality of your login credentials. Any activity that occurs under your account is your responsibility.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white font-display">5. Limitations of Liability</h2>
                  <p>
                    To the maximum extent permitted by law, Voxy AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
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
