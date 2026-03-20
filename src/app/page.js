/**
 * page.js — Landing page composition root.
 *
 * This file has one job: import and sequence the landing page sections.
 * No logic, no hardcoded strings, no layout concerns live here.
 * Each import is a self-contained section from src/landing/sections/.
 */

import Navbar from "@/landing/sections/Navbar";
import Hero from "@/landing/sections/Hero";
import ProblemSection from "@/landing/sections/ProblemSection";
import HowItWorksSection from "@/landing/sections/HowItWorksSection";
import FeaturesSection from "@/landing/sections/FeaturesSection";
import CTASection from "@/landing/sections/CTASection";
import Footer from "@/landing/sections/Footer";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Voxy | AI Business Chat Platform",
  description: "Empower your business with AI-powered voice and text chat. Seamlessly engage with customers across English, Pidgin, and Yoruba.",
});



export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
