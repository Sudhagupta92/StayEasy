import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  Calculator,
  IndianRupee,
  Sparkles,
  Award,
  Clock,
  ChevronRight,
  FileCheck2,
  Lock,
  Headphones,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const OwnersPage = () => {
  // Interactive ROI Calculator State
  const [beds, setBeds] = useState(24);
  const [rentPerBed, setRentPerBed] = useState(8500);
  const [currentOccupancy, setCurrentOccupancy] = useState(70);

  // Calculations
  const currentMonthlyRevenue = Math.round(beds * (currentOccupancy / 100) * rentPerBed);
  const stayEasyOccupancy = Math.min(100, currentOccupancy + 18);
  const stayEasyMonthlyRevenue = Math.round(beds * (stayEasyOccupancy / 100) * rentPerBed);
  const monthlyRevenueGain = stayEasyMonthlyRevenue - currentMonthlyRevenue;
  const annualRevenueGain = monthlyRevenueGain * 12;
  const estimatedBrokerageSaved = Math.round(beds * 0.4 * rentPerBed); // brokerage saved assuming 40% annual tenant churn

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(12,141,230,0.18),transparent_60%)]" />
        <div className="absolute left-0 bottom-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" /> For PG, Hostel & Co-Living Landlords
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Maximize Occupancy. <br />
                <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  Automate Rent. Zero Brokerage.
                </span>
              </h1>

              <p className="text-slate-300 text-lg sm:text-xl max-w-2xl leading-relaxed">
                Join India's most trusted accommodation platform. Eliminate electricity billing disputes, stop chasing monthly rent, and connect directly with verified students and working professionals.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  to="/register?role=OWNER"
                  variant="emerald"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="shadow-xl shadow-emerald-500/20 font-bold"
                >
                  List Your Property Free
                </Button>
                <Button
                  to="/login"
                  variant="outline"
                  size="lg"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                >
                  Owner Portal Login
                </Button>
              </div>

              {/* Quick Trust Badges */}
              <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">0%</p>
                  <p className="text-xs text-slate-400 font-medium">Listing Commission</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">96.8%</p>
                  <p className="text-xs text-slate-400 font-medium">Average Occupancy</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-brand-400">&lt; 24h</p>
                  <p className="text-xs text-slate-400 font-medium">Audit & Verification</p>
                </div>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Verified Landlord Badge</h3>
                      <p className="text-xs text-emerald-400 font-semibold">Boosts inquiries by 2.4x</p>
                    </div>
                  </div>
                  <Badge variant="emerald" size="sm">
                    Active
                  </Badge>
                </div>

                <div className="space-y-3 text-xs text-slate-200">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automated digital rent invoices sent via WhatsApp/SMS</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Exact sub-meter unit electricity billing (zero disputes)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Deposit escrow protection & automated digital receipts</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ML occupancy forecasts & seasonal demand pricing</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/register?role=OWNER"
                    className="block w-full text-center py-3 px-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors shadow-lg"
                  >
                    Get Verified Badge Today →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Interactive Revenue / ROI Estimator */}
      <section className="py-16 lg:py-24 bg-white border-b border-slate-200">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold">
              <Calculator className="w-3.5 h-3.5" /> Interactive Earnings Estimator
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              See How Much More You Earn with StayEasy
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Calculate your projected revenue increase with our automated occupancy pipeline, zero brokerage, and on-time rent collections.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders (Left) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Slider 1: Total Beds */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">Total Capacity (Beds / Rooms):</span>
                  <span className="font-extrabold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                    {beds} Beds
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="120"
                  step="2"
                  value={beds}
                  onChange={(e) => setBeds(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>4 beds</span>
                  <span>60 beds</span>
                  <span>120 beds</span>
                </div>
              </div>

              {/* Slider 2: Average Rent */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">Average Rent per Bed / Room:</span>
                  <span className="font-extrabold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                    ₹{rentPerBed.toLocaleString()} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="4000"
                  max="30000"
                  step="500"
                  value={rentPerBed}
                  onChange={(e) => setRentPerBed(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>₹4,000</span>
                  <span>₹15,000</span>
                  <span>₹30,000</span>
                </div>
              </div>

              {/* Slider 3: Current Occupancy */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">Current Occupancy Rate:</span>
                  <span className="font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {currentOccupancy}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="90"
                  step="5"
                  value={currentOccupancy}
                  onChange={(e) => setCurrentOccupancy(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>40% (Low)</span>
                  <span>65% (Average)</span>
                  <span>90% (High)</span>
                </div>
              </div>
            </div>

            {/* Results Card (Right) */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 space-y-5 border border-slate-800">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Projected Revenue Gain
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  +{stayEasyOccupancy - currentOccupancy}% Occupancy
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400">Projected Monthly Revenue</p>
                <p className="text-3xl font-extrabold text-emerald-400">
                  ₹{stayEasyMonthlyRevenue.toLocaleString()}
                  <span className="text-xs text-slate-400 font-normal"> / month</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  vs ₹{currentMonthlyRevenue.toLocaleString()} current
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Extra Monthly Earnings:</span>
                  <span className="font-bold text-emerald-300">+₹{monthlyRevenueGain.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Extra Annual Profit:</span>
                  <span className="font-bold text-emerald-400">+₹{annualRevenueGain.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Brokerage Saved Yearly:</span>
                  <span className="font-bold text-brand-300">~₹{estimatedBrokerageSaved.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  to="/register?role=OWNER"
                  variant="emerald"
                  size="md"
                  className="w-full justify-center font-bold"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Start Earning with StayEasy
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Core Value Pillars for Landlords */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <Badge variant="brand" size="md">
              Landlord Advantage
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed to Make Property Management Effortless
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              We took everything frustrating about running a PG or hostel and replaced it with intelligent, automated systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 space-y-4 hover:shadow-xl transition-all duration-200 border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Verified Trust Badge</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Properties with our StayEasy Trust Badge receive top placement in student discovery, 2.4x more booking requests, and higher conversion rates.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 space-y-4 hover:shadow-xl transition-all duration-200 border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Transparent Sub-Meter Billing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Log start and end electricity meter units per room. The system automatically computes rates with zero disputes and integrates directly into the monthly invoice.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 space-y-4 hover:shadow-xl transition-all duration-200 border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Deposit Escrow Protection</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tenants pay their security deposit securely into escrow. Clear terms and automated receipts eliminate move-out tensions while securing your damages buffer.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-8 space-y-4 hover:shadow-xl transition-all duration-200 border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Demand & Revenue Prediction</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our machine learning models forecast upcoming seasonal admissions, suggest competitive room pricing, and alert you before vacancies happen.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-8 space-y-4 hover:shadow-xl transition-all duration-200 border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Guaranteed Complaint SLAs</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Residents log maintenance tickets digitally. Fast turnaround maintains your high Trust Score and prevents negative reviews before they happen.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-8 space-y-4 hover:shadow-xl transition-all duration-200 border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">1-Click Disbursals & Ledger</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track all gross collections, pending dues, and request instant bank payouts with complete GST and tax-compliant digital records.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* 4. Onboarding Roadmap: 4 Simple Steps */}
      <section className="py-16 lg:py-24 bg-white border-y border-slate-200">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <Badge variant="emerald" size="md">
              Fast & Simple
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Get Listed in 4 Easy Steps
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Start welcoming verified residents in as little as 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-sm">
                1
              </span>
              <h4 className="text-base font-bold text-slate-900">Create Free Account</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sign up as a Property Owner in under 2 minutes with your mobile number and business details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-sm">
                2
              </span>
              <h4 className="text-base font-bold text-slate-900">Add Property & Rooms</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add your room configurations (single, double, triple sharing), transparent amenities, and house rules.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                3
              </span>
              <h4 className="text-base font-bold text-slate-900">Physical Trust Audit</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our local city representative audits facilities, verifies Wi-Fi and amenities, and awards your Trust Badge.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                4
              </span>
              <h4 className="text-base font-bold text-slate-900">Accept Bookings</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive direct inquiries and bookings from pre-screened students and professionals with zero broker cuts.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5" /> Landlord FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
              <h4 className="text-base font-bold text-slate-900">Does StayEasy charge a commission on bookings?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                No! Listing your property is 100% free. When tenants pay rent online through the payment gateway, a tiny 2% platform processing and escrow facilitation fee applies—infinitely cheaper than real estate brokers who take an entire month's rent.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
              <h4 className="text-base font-bold text-slate-900">How does the Physical Audit work?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                A verified StayEasy field agent visits your property to confirm photos, test Wi-Fi speeds, inspect cleanliness, and check sub-meter setups. This ensures your property gets the coveted Verified Trust Badge, which immediately ranks it above unverified competitors.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
              <h4 className="text-base font-bold text-slate-900">How do electricity sub-meters work on StayEasy?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                You input your room's start and end meter units into the Rent Ledger invoice generator. The system calculates exact units consumed at your declared rate per unit, generates transparent receipts, and prevents any tenant disputes over high electricity bills.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
              <h4 className="text-base font-bold text-slate-900">Can anyone leave fake negative reviews on my PG?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Strictly NO. Our USP is the <strong>Verified Resident Review System™</strong>. Only tenants with an authoritative backend check-in record who have actually lived at your property can submit a review. Landlord competitors and random internet users are completely blocked with HTTP 403 Forbidden.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Final Call to Action */}
      <section className="py-20 bg-gradient-to-tr from-brand-900 via-slate-900 to-emerald-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.15),transparent_50%)]" />
        <Container className="relative z-10 text-center max-w-3xl space-y-6">
          <Badge variant="emerald" size="md">
            Join 3,400+ Trusted PG & Hostel Owners
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Ready to upgrade your property management?
          </h2>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Take 2 minutes to list your property, claim your Verified Trust Badge, and start collecting rent with zero stress.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Button
              to="/register?role=OWNER"
              variant="emerald"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              className="font-bold shadow-xl shadow-emerald-500/30"
            >
              Register as Property Owner
            </Button>
            <Button
              to="/properties"
              variant="outline"
              size="lg"
              className="bg-transparent border-white/30 text-white hover:bg-white/10"
            >
              Explore Existing Listings
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default OwnersPage;
