import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Briefcase,
  UserCog,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await login(email, password);
      const userRole = res.user?.role;

      if (from && from !== '/login' && from !== '/register' && from !== '/') {
        navigate(from, { replace: true });
      } else if (userRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (userRole === 'OWNER') {
        navigate('/owner/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Helper to login with demo accounts or auto-register them if not yet in database
   */
  const handleQuickDemoLogin = async (roleType) => {
    setErrorMsg('');
    setSubmitting(true);

    const demoAccounts = {
      USER: {
        name: 'Alex Johnson (Student)',
        email: 'alex.student@stayeasy.local',
        password: 'Password123!',
        role: 'USER',
        phone: '9876543210',
      },
      OWNER: {
        name: 'Venkatesh Rao (Owner)',
        email: 'rao.hostels@stayeasy.local',
        password: 'Password123!',
        role: 'OWNER',
        phone: '9876543211',
        businessName: 'Greenwood Luxury Student Living',
      },
      ADMIN: {
        name: 'Admin Officer',
        email: 'admin@stayeasy.local',
        password: 'Password123!',
        role: 'ADMIN',
        phone: '9000000000',
      },
    };

    const target = demoAccounts[roleType];
    setEmail(target.email);
    setPassword(target.password);

    try {
      // First attempt to login
      try {
        await login(target.email, target.password);
      } catch (loginErr) {
        // If user doesn't exist, auto-register demo user
        await register(target);
      }

      if (roleType === 'ADMIN') navigate('/admin/dashboard');
      else if (roleType === 'OWNER') navigate('/owner/dashboard');
      else navigate('/user/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Demo authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 lg:py-16 bg-slate-50 min-h-[85vh] flex items-center justify-center">
      <Container>
        <div className="max-w-md mx-auto space-y-6">
          {/* Logo & Headline */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
                Stay<span className="text-brand-600">Easy</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-xs text-slate-500">
              Sign in to your verified living portal
            </p>
          </div>

          <Card className="p-8 shadow-card border-slate-200">
            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={submitting}
                icon={submitting ? Loader2 : ArrowRight}
                iconPosition="right"
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>

            {/* 1-Click Role Testing Shortcuts */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Quick 1-Click Demo Login
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('USER')}
                  disabled={submitting}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex flex-col items-center gap-1 transition-all"
                >
                  <User className="w-4 h-4 text-brand-600" />
                  <span>Tenant</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('OWNER')}
                  disabled={submitting}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex flex-col items-center gap-1 transition-all"
                >
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Landlord</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('ADMIN')}
                  disabled={submitting}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex flex-col items-center gap-1 transition-all"
                >
                  <UserCog className="w-4 h-4 text-indigo-600" />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </Card>

          <p className="text-center text-xs text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
};

export default LoginPage;
