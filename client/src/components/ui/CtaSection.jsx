import React from 'react';
import { ShieldCheck, ArrowRight, Building, Sparkles } from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';

export const CtaSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900 text-white relative overflow-hidden">
      {/* Decorative backdrop glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(12,141,230,0.15),transparent_50%)]" />
      <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* User CTA */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> For Students & Professionals
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Ready to experience verified living without the stress?
            </h2>
            <p className="text-slate-300 text-base max-w-lg leading-relaxed">
              Explore audited PGs and hostels with full cost breakdowns, guaranteed deposit terms, and zero brokerage.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button to="/properties" variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                Find Your Stay
              </Button>
              <Button to="/how-it-works" variant="outline" size="lg" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50">
                How It Works
              </Button>
            </div>
          </div>

          {/* Owner CTA Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Are you a PG or Hostel Owner?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              List your property on StayEasy, earn the Verified Trust Badge, and connect directly with quality student & professional tenants with zero intermediary cuts.
            </p>
            <div className="pt-2">
              <Button to="/owners" variant="emerald" size="md" icon={ShieldCheck}>
                List Your Property
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
