import { BetaWall } from "@/components/beta/beta-wall";
import { PricingCards } from "@/components/marketing/pricing-cards";

export default function PricingPage() {
  return (
    <BetaWall nextPath="/pricing">
      <main className="bg-black">
        <PricingCards ctaHref="/upload" />
      </main>
    </BetaWall>
  );
}
