import React from 'react';
import {
  ShieldCheck,
  Zap,
  Utensils,
  UserCheck,
  Receipt,
  Scale,
  Award,
  Layers,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AboutPage = () => {
  return (
    <div className="py-12 lg:py-20 bg-slate-50">
      <Container>
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <Badge variant="brand" size="md">
            Our Purpose
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Fixing the Broken PG & Hostel Search Experience
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Finding a place in a new city shouldn't involve fake photos, surprise electricity bills, terrible food surprises, and withheld security deposits.
          </p>
        </div>

        {/* The Core Problem & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-rose-50 border border-rose-200/80 rounded-3xl p-8 space-y-4">
            <div className="text-rose-600 font-bold uppercase text-xs tracking-wider flex items-center gap-1.5">
              <span>⚠️</span> The Problem Today
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              The Reality Gap in Accommodation
            </h2>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>Hidden Costs:</strong> Stated rent is ₹8,000, but electricity is charged at ₹16/unit with mandatory extra fees.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>Fake Reviews:</strong> Owners ask friends to post 5-star reviews while actual residents suffer bad food.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>Deposit Traps:</strong> Security deposits take months to get refunded or are withheld arbitrarily.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>Unresponsive Owners:</strong> Water and Wi-Fi complaints go unresolved for weeks.</span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/80 rounded-3xl p-8 space-y-4">
            <div className="text-emerald-700 font-bold uppercase text-xs tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> The StayEasy Solution
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Living Transparency & Trust Score
            </h2>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>All-Inclusive Cost Disclosure:</strong> Electricity unit rate, food options, and deposit refund terms disclosed upfront.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Verified Resident Reviews:</strong> Only users with a completed active stay lifecycle can submit reviews.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Owner Promise vs Reality:</strong> Algorithmic comparison between advertised amenities and resident feedback.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Zero Brokerage:</strong> Direct booking between verified tenants and verified property owners.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Production Architecture Card */}
        <Card className="p-8 border-brand-200 bg-white shadow-card mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <Badge variant="brand" size="md">
                Architectural Status
              </Badge>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                Full-Stack Production Architecture & Infrastructure
              </h2>
            </div>
            <div className="bg-brand-50 text-brand-700 px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-brand-200">
              Enterprise Platform Certified
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Frontend Stack</span>
              <p className="text-xs text-slate-600">React 18 + Vite + Tailwind CSS + React Router + Lucide Icons</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Backend Stack</span>
              <p className="text-xs text-slate-600">Node.js + Express.js + REST API + Helmet + CORS + Rate Limiting</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Database Layer</span>
              <p className="text-xs text-slate-600">MongoDB + Mongoose with lifecycle and role-based schema architecture</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Security & Error Handling</span>
              <p className="text-xs text-slate-600">Centralized error handler, 404 handler, rate limits, env security</p>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default AboutPage;
