import React from 'react';
import { HeroSection } from '../../components/ui/HeroSection';
import { TrustHighlights } from '../../components/ui/TrustHighlights';
import { HowItWorks } from '../../components/ui/HowItWorks';
import { DemoProperties } from '../../components/ui/DemoProperties';
import { CtaSection } from '../../components/ui/CtaSection';

export const HomePage = () => {
  return (
    <div className="space-y-0">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Trust Highlights */}
      <TrustHighlights />

      {/* 3. Demo Properties Preview */}
      <DemoProperties />

      {/* 4. How StayEasy Works */}
      <HowItWorks />

      {/* 5. Call to Action */}
      <CtaSection />
    </div>
  );
};

export default HomePage;
