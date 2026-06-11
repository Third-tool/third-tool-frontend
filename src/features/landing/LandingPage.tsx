import { useFadeUp } from '@/lib/motion/useFadeUp';
import { GlassPillNav } from '@/components/GlassPillNav';
import { HeroSection } from './sections/HeroSection';
import { ConceptSection } from './sections/ConceptSection';
import { ThreeStepsSection } from './sections/ThreeStepsSection';
import { VoicesSection } from './sections/VoicesSection';
import { ClosingCtaSection } from './sections/ClosingCtaSection';
import { Footer } from './components/Footer';

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useFadeUp<HTMLDivElement>();
  return <div ref={ref}>{children}</div>;
}

export function LandingPage() {
  return (
    <>
      <GlassPillNav />
      <main>
        <HeroSection />
        <Reveal>
          <ConceptSection />
        </Reveal>
        <Reveal>
          <ThreeStepsSection />
        </Reveal>
        <Reveal>
          <VoicesSection />
        </Reveal>
        <Reveal>
          <ClosingCtaSection />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
