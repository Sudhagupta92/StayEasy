import React from 'react';
import {
  Search,
  Scale,
  FileCheck2,
  KeyRound,
  Home,
  MessageSquareQuote,
  ArrowRight,
} from 'lucide-react';
import { Container } from '../common/Container';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const HowItWorks = () => {
  const steps = [
    {
      step: '1',
      title: 'Search',
      subtitle: 'Filter By Reality',
      description: 'Filter by budget, room sharing (1/2/3/4-seater), food preferences, and verified sub-metered power.',
      icon: Search,
    },
    {
      step: '2',
      title: 'Compare',
      subtitle: 'Owner Claims vs Reality',
      description: 'Check verified resident ratings on food taste, cleaning frequency, and owner response time.',
      icon: Scale,
    },
    {
      step: '3',
      title: 'Verify',
      subtitle: '100% Audit Score',
      description: 'Review physical audit logs, deposit refund guarantees, and transparent expense breakdowns.',
      icon: FileCheck2,
    },
    {
      step: '4',
      title: 'Book',
      subtitle: 'Zero Brokerage',
      description: 'Direct room/bed booking with fixed deposit terms and zero unverified broker fees.',
      icon: KeyRound,
    },
    {
      step: '5',
      title: 'Stay',
      subtitle: 'Track Your Experience',
      description: 'Experience verified living with automated rent receipts and digital maintenance ticketing.',
      icon: Home,
    },
    {
      step: '6',
      title: 'Review',
      subtitle: 'Verified Resident Voice',
      description: 'Post authentic reviews after your stay to empower future students and professionals.',
      icon: MessageSquareQuote,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200/60">
      <Container>
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <Badge variant="brand" size="md">
            Seamless & Transparent
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How StayEasy Works
          </h2>
          <p className="text-slate-600 text-base">
            From search to checkout — a transparent accommodation journey built for your peace of mind.
          </p>
        </div>

        {/* 6 Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card hover:border-brand-300 transition-all duration-300 group"
              >
                {/* Step badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-200 group-hover:text-brand-200 transition-colors font-mono">
                    0{item.step}
                  </span>
                </div>

                <div className="space-y-1 mb-2">
                  <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
                    {item.subtitle}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.step}. {item.title}
                  </h3>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick CTA */}
        <div className="mt-12 text-center">
          <Button to="/properties" variant="secondary" size="md" icon={ArrowRight} iconPosition="right">
            Explore Verified Stays
          </Button>
        </div>
      </Container>
    </section>
  );
};
