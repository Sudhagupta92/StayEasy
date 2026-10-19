import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  IndianRupee,
  BedDouble,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const HeroSection = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [roomType, setRoomType] = useState('');
  const [occupantType, setOccupantType] = useState('STUDENT');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Navigate to properties catalog with current filters as query params (for exploration)
    navigate('/properties');
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 gradient-hero-bg border-b border-slate-200/60">
      {/* Decorative backdrop glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-brand-300/30 to-emerald-200/30 blur-3xl -z-10 pointer-events-none rounded-full" />

      <Container>
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-brand-200 shadow-sm backdrop-blur">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-slate-800 tracking-wide uppercase">
              India's 1st Verified Living Experience Platform
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Find a place you can <span className="gradient-text">trust.</span>
          </h1>

          {/* Supporting Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Discover verified PGs, hostels and flats with transparent pricing, real resident experiences and reliable information.
          </p>

          {/* Quick Category Tabs */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setOccupantType('STUDENT')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                occupantType === 'STUDENT'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200'
              }`}
            >
              🎓 For Students
            </button>
            <button
              onClick={() => setOccupantType('PROFESSIONAL')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                occupantType === 'PROFESSIONAL'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200'
              }`}
            >
              💼 Working Professionals
            </button>
            <button
              onClick={() => setOccupantType('FEMALE_ONLY')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                occupantType === 'FEMALE_ONLY'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200'
              }`}
            >
              ✨ Women's Only PGs
            </button>
          </div>
        </div>

        {/* Search Bar Card */}
        <div className="mt-10 max-w-5xl mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white rounded-3xl p-3 sm:p-4 shadow-card hover:shadow-card-hover border border-slate-200/80 transition-shadow duration-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Location Input */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-brand-300 transition-all flex flex-col justify-center">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" /> City or College/Office
                </label>
                <input
                  type="text"
                  placeholder="e.g. Koramangala, DU North..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none w-full"
                />
              </div>

              {/* Budget Dropdown */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-brand-300 transition-all flex flex-col justify-center">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Max Monthly Budget
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-900 focus:outline-none w-full cursor-pointer"
                >
                  <option value="">Any Budget</option>
                  <option value="5000-8000">₹5,000 - ₹8,000 / mo</option>
                  <option value="8000-12000">₹8,000 - ₹12,000 / mo</option>
                  <option value="12000-18000">₹12,000 - ₹18,000 / mo</option>
                  <option value="18000-25000">₹18,000 - ₹25,000 / mo</option>
                  <option value="25000+">₹25,000+ / mo</option>
                </select>
              </div>

              {/* Room Type */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-brand-300 transition-all flex flex-col justify-center">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                  <BedDouble className="w-3.5 h-3.5 text-amber-600" /> Room / Sharing
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-900 focus:outline-none w-full cursor-pointer"
                >
                  <option value="">All Room Types</option>
                  <option value="SINGLE">Single Private Room</option>
                  <option value="DOUBLE">2-Seater Sharing</option>
                  <option value="TRIPLE">3-Seater Sharing</option>
                  <option value="FOUR_SEATER">4-Seater Sharing</option>
                  <option value="FLAT">Complete 1/2 BHK Flat</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-center">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full h-full py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2"
                  icon={Search}
                >
                  Find Stays
                </Button>
              </div>
            </div>
          </form>

          {/* Quick trust assurances under search */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Zero Brokerage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Electricity & Food Bills Disclosed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Security Deposit Refund Guarantee</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
