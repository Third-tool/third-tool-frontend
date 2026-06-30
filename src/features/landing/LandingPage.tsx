import { LandingNav } from './components/LandingNav';
import { HeroSection } from './sections/HeroSection';
import { ConceptSection } from './sections/ConceptSection';
import { ThreeStepsSection } from './sections/ThreeStepsSection';
import { VoicesSection } from './sections/VoicesSection';
import { FaqSection } from './sections/FaqSection';
import { ClosingCtaSection } from './sections/ClosingCtaSection';
import { Footer } from './components/Footer';

export function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-canvas text-cream">
      <LandingNav />
      <main>
        <HeroSection />
        <ConceptSection />
        <ThreeStepsSection />
        <VoicesSection />
        <FaqSection />
        <ClosingCtaSection />
      </main>
      <Footer />
    </div>
  );
}
