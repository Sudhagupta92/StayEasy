import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Heart,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Container } from './Container';
import { Badge } from './Badge';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      {/* Upper Footer: Value Proposition & Links */}
      <Container className="py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                Stay<span className="text-brand-400">Easy</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Find a place you can trust. StayEasy is redefining student and professional accommodation discovery with complete expense transparency, physical verification, and resident-only reviews.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <Badge variant="emerald" icon={ShieldCheck} size="sm">
                Trust Guarantee Active
              </Badge>
              <Badge variant="dark" size="sm">
                Production Certified
              </Badge>
            </div>
          </div>

          {/* Column 2: Discover */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Discover
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Student PGs
                </Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Working Pro Hostels
                </Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Co-Living Spaces
                </Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Private Flats
                </Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Verified Rooms
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Platform */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Trust & System
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How StayEasy Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  StayEasy Trust Score
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Owner Promise vs Reality
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Resident Review Standard
                </Link>
              </li>
              <li>
                <Link to="/owners" className="hover:text-white transition-colors">
                  List Your Property
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Dashboards & Architecture */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Portals (Phased)
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/user/dashboard" className="hover:text-brand-400 transition-colors flex items-center gap-1.5">
                  User Dashboard <span className="text-[10px] text-slate-500 font-mono">(Preview)</span>
                </Link>
              </li>
              <li>
                <Link to="/owner/dashboard" className="hover:text-brand-400 transition-colors flex items-center gap-1.5">
                  Owner Dashboard <span className="text-[10px] text-slate-500 font-mono">(Preview)</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-brand-400 transition-colors flex items-center gap-1.5">
                  Admin Portal <span className="text-[10px] text-slate-500 font-mono">(Preview)</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Demo Data & Transparency Notice */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 bg-slate-950/40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 rounded-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Badge variant="emerald" size="sm">
                Live Platform
              </Badge>
              <p className="text-xs text-slate-400 leading-relaxed">
                StayEasy Enterprise Architecture: Live listings with <strong className="text-emerald-400">Escrow Deposit Protection</strong>, Sub-Meter Unit Billing, Verified Resident Reviews, and SLA Maintenance Tracking.
              </p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
              <span>Stack:</span>
              <span className="text-brand-300 font-mono">React + Vite + Node + Express + Mongo</span>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-5 text-xs text-slate-500">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} StayEasy Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/about" className="hover:text-slate-400">Terms of Service</Link>
            <Link to="/contact" className="hover:text-slate-400">Security & Trust</Link>
          </div>
        </Container>
      </div>
    </footer>
  );
};
