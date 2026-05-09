import { BeforeAfterGallery } from "@/components/marketing/before-after-gallery";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { RealismPillars } from "@/components/marketing/realism-pillars";
import { TrustSafetySection } from "@/components/marketing/trust-safety-section";

export default function Home() {
  return (
    <main className="bg-black">
      <HeroSection />
      <RealismPillars />
      <BeforeAfterGallery />
      <HowItWorks />
      <PricingCards />
      <TrustSafetySection />
    </main>
  );
}
