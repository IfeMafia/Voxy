"use client";

import React from "react";
import Navbar from "@/landing/sections/Navbar";
import Footer from "@/landing/sections/Footer";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-[1000px] mx-auto space-y-16 animate-fade-in-up">
          
          <header className="space-y-4 text-center">
            <p className="eyebrow">Support</p>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight">
              Get in touch
            </h1>
            <p className="text-voxy-muted text-lg max-w-xl mx-auto">
              Have questions about Voxy? We're here to help you supercharge your business communication.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="voxy-card p-8 flex flex-col items-center text-center space-y-4 group hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-voxy-primary/10 flex items-center justify-center text-voxy-primary mb-2">
                <Mail size={24} />
              </div>
              <h3 className="font-display text-xl font-bold">Email Us</h3>
              <p className="text-voxy-muted text-sm">For general inquiries and support</p>
              <a href="mailto:hello@voxy.ai" className="text-[#00D18F] font-semibold hover:underline">hello@voxy.ai</a>
            </div>

            <div className="voxy-card p-8 flex flex-col items-center text-center space-y-4 group hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-voxy-primary/10 flex items-center justify-center text-voxy-primary mb-2">
                <MessageCircle size={24} />
              </div>
              <h3 className="font-display text-xl font-bold">WhatsApp</h3>
              <p className="text-voxy-muted text-sm">Live chat for urgent business needs</p>
              <a href="#" className="text-[#00D18F] font-semibold hover:underline">+234 812 345 6789</a>
            </div>

            <div className="voxy-card p-8 flex flex-col items-center text-center space-y-4 group hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-voxy-primary/10 flex items-center justify-center text-voxy-primary mb-2">
                <MapPin size={24} />
              </div>
              <h3 className="font-display text-xl font-bold">Office</h3>
              <p className="text-voxy-muted text-sm">Visit our innovation hub</p>
              <p className="text-white font-medium">Lagos, Nigeria</p>
            </div>

          </div>

          <div className="voxy-card p-1">
             <div className="bg-voxy-surface rounded-[0.7rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-4 text-center md:text-left">
                   <h2 className="font-display text-3xl font-bold">Need a demo?</h2>
                   <p className="text-voxy-muted max-w-sm">
                      Our team can show you how Voxy integrates with your specific business workflow.
                   </p>
                </div>
                <Button size="lg" className="bg-voxy-primary text-black font-bold px-8 h-14 hover:bg-voxy-primary/90 shadow-lg shadow-voxy-primary/20">
                   Schedule Demo
                </Button>
             </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
