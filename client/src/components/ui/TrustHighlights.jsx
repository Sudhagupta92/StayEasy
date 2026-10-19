import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  Receipt,
  Sparkles,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Container } from '../common/Container';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const TrustHighlights = () => {
  const iconMap = {
    ShieldCheck: ShieldCheck,
    UserCheck: UserCheck,
    Receipt: Receipt,
    Sparkles: Sparkles,
  };

  const highlights = [
    {
      title: 'Verified Properties',
      badge: 'Physical Audit',
      description:
        'Every PG and hostel is physically audited. Verified photos, verified amenities, and room dimensions before you visit.',
      points: ['No misleading wide-angle photos', 'Physical audit report', 'Verified room sizes'],
      icon: ShieldCheck,
      color: 'emerald',
    },
    {
      title: 'Verified Residents Only',
      badge: 'Anti-Fake Reviews',
      description:
        'Only users with an active or completed stay can post ratings. No fake reviews from friends or owners.',
      points: ['Life-cycle checked reviews', 'Food quality ratings', 'Warden & owner feedback'],
      icon: UserCheck,
      color: 'blue',
    },
    {
      title: 'Transparent Pricing',
      badge: 'Zero Hidden Costs',
      description:
        'Know exact electricity charges per unit, maintenance fees, and exact security deposit refund history upfront.',
      points: ['Sub-metering disclosed', 'Deposit return track record', 'Food menu inclusion terms'],
      icon: Receipt,
      color: 'amber',
    },
    {
      title: 'Owner Promise vs Reality',
      badge: 'StayEasy Trust Score',
      description:
        'We compare owner promises with resident feedback on Wi-Fi speeds, cleaning frequency, and complaint turnaround.',
      points: ['Complaint resolution speed', 'Food freshness score', 'Deposit return reliability'],
      icon: Sparkles,
      color: 'indigo',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white border-b border-slate-200/60">
      <Container>
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <Badge variant="brand" size="md">
            The StayEasy Difference
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built on Trust, Not Marketing Promises
          </h2>
          <p className="text-slate-600 text-base">
            Moving to a new city is hard. Finding a reliable accommodation with honest pricing and clean food shouldn't be.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant={item.color === 'emerald' ? 'emerald' : item.color === 'amber' ? 'amber' : 'brand'} size="sm">
                      {item.badge}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {item.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
