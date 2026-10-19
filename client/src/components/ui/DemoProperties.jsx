import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Star,
  Zap,
  Utensils,
  UserCheck,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Container } from '../common/Container';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { DEMO_PROPERTIES } from '../../constants';
import { formatCurrency, getTrustScoreColor } from '../../utils/formatters';

export const DemoProperties = () => {
  return (
    <section className="py-16 lg:py-24 bg-white border-b border-slate-200/60">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="demo" size="sm">
                Demo Data
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                Prototype Interface Preview
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Featured Accommodations
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Preview how StayEasy surfaces transparent rent, sub-metered power costs, verified food ratings, and the StayEasy Trust Score.
            </p>
          </div>

          <Button to="/properties" variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
            View All Demo Stays
          </Button>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DEMO_PROPERTIES.map((property) => (
            <Card key={property.id} className="overflow-hidden flex flex-col justify-between">
              <div>
                {/* Image & Badges */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {/* Top Bar with Demo Tag & Type */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant="demo" size="sm">
                      Demo Data
                    </Badge>
                    <span className="bg-slate-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur">
                      {property.type}
                    </span>
                  </div>

                  {/* Trust Score Pill */}
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Trust {property.trustScore}/100
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Location & Title */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{property.location}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {property.tagline}
                    </p>
                  </div>

                  {/* Room Types Available */}
                  <div className="flex flex-wrap gap-1.5">
                    {property.roomTypes.map((rt, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                      >
                        {rt}
                      </span>
                    ))}
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-md">
                      {property.gender}
                    </span>
                  </div>

                  {/* Real Metrics Box */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-slate-600">Food:</span>
                      <strong className="text-slate-900">{property.foodRating} ★</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-slate-600">Owner:</span>
                      <strong className="text-slate-900">{property.ownerRating} ★</strong>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 text-[11px] text-slate-600 border-t border-slate-200/60 pt-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Power: <strong>{property.electricity}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Starts from</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatCurrency(property.baseRent)}
                  </span>
                  <span className="text-xs text-slate-500 font-normal"> /mo</span>
                </div>

                <Button to="/properties" variant="primary" size="sm">
                  View Breakdown
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};
