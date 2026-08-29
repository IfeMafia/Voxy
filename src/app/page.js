/**
 * page.js — Landing page composition root.
 *
 * Sequence of sections following the Verity-inspired aesthetic and structure:
 *   Navbar → Hero → Features (Bento Grid) → How It Works → Pricing → FAQ → CTA → Footer
 */

import Navbar from "@/landing/sections/Navbar";
import Hero from "@/landing/sections/Hero";
import ProblemSection from "@/landing/sections/ProblemSection";
import FeaturesSection from "@/landing/sections/FeaturesSection";
import HowItWorksSection from "@/landing/sections/HowItWorksSection";
import PricingSection from "@/landing/sections/PricingSection";
import FAQSection from "@/landing/sections/FAQSection";
import CTASection from "@/landing/sections/CTASection";
import Footer from "@/landing/sections/Footer";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Voxy | Your Autonomous AI Workforce for Business",
  description:
    "An all-in-one platform to deploy autonomous AI employees that talk to your customers, recommend products, take orders, and get you paid 24/7 across English, Pidgin, Yoruba, Hausa, and Igbo.",
});

export default function LandingPage() {
  return (
    <div className="bg-background text-white min-h-screen selection:bg-[#00D18F]/25 selection:text-[#00D18F] overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
