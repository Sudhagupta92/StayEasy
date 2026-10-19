import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STUDENT',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-12 lg:py-20 bg-slate-50 min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="brand" size="md">
            Get in Touch
          </Badge>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            We're Here to Help You Stay Easy
          </h1>
          <p className="text-slate-600 text-base">
            Have questions about property verification, tenant security, or listing your PG/hostel?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Info Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">StayEasy Support</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Our dedicated trust team is available 6 days a week.
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Email Us</span>
                    <strong className="text-white">support@stayeasy.local</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Trust Helpline</span>
                    <strong className="text-white">+91 (800) 123-STAY</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Auditing Hub</span>
                    <strong className="text-white">Bengaluru & New Delhi, India</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Physical Audit Promise
              </div>
              <p>Every report of misleading owner info triggers an on-site audit within 48 hours.</p>
            </div>
          </div>

          {/* Form */}
          <Card className="lg:col-span-2 p-8 shadow-card">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Message Received!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Thank you for reaching out. Your inquiry has been received by StayEasy Support. Our concierge team will review and respond within 2-4 business hours.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline" size="sm">
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Send an Inquiry</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    I am a:
                  </label>
                  <div className="flex gap-2">
                    {['STUDENT', 'WORKING_PROFESSIONAL', 'PROPERTY_OWNER'].map((role) => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`flex-1 py-2 px-2 text-xs font-medium rounded-xl border transition-all ${
                          formData.role === role
                            ? 'bg-brand-50 border-brand-500 text-brand-700 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {role === 'STUDENT' ? 'Student' : role === 'WORKING_PROFESSIONAL' ? 'Professional' : 'Property Owner'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we assist you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" icon={Send}>
                  Submit Inquiry
                </Button>
              </form>
            )}
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default ContactPage;
