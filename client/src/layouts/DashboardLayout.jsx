import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Home,
  User,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Compass,
  Bell,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout = ({ role = 'USER', title = 'Dashboard' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeVariant = () => {
    if (role === 'ADMIN') return 'brand';
    if (role === 'OWNER') return 'emerald';
    return 'brand';
  };

  const getRoleLabel = () => {
    if (role === 'ADMIN') return 'Platform Admin';
    if (role === 'OWNER') return 'Property Landlord';
    return 'Resident Tenant';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between p-6 border-r border-slate-800">
        <div>
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xl text-white tracking-tight">
                  Stay<span className="text-brand-400">Easy</span>
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
              </div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                {getRoleLabel()}
              </span>
            </div>
          </Link>

          {/* User Profile Mini Card */}
          {user && (
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="space-y-1">
            <div className="pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3">
                Workspace
              </span>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-white shrink-0" />
              <span className="truncate">{title}</span>
            </div>

            <div className="pt-4 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3">
                Quick Shortcuts
              </span>
            </div>

            <Link
              to="/properties"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Compass className="w-4 h-4 text-slate-400" /> Discover Properties
            </Link>

            {role === 'OWNER' && (
              <Link
                to="/owners"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Building2 className="w-4 h-4 text-slate-400" /> Landlord Portal Info
              </Link>
            )}

            <Link
              to="/notifications"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-400" /> Notifications Center
            </Link>

            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Home className="w-4 h-4 text-slate-400" /> Return to Website
            </Link>
          </div>
        </div>

        {/* Phase 13 Enterprise Status & Logout */}
        <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" /> StayEasy Enterprise · Phase 13
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Phase 13 Enterprise · Production Hardened · 100% Escrow & SLA Audited
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-slate-500 hover:text-slate-800 md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <Badge variant={getRoleBadgeVariant()} size="sm">
              {getRoleLabel()}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              to="/"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </header>

        {/* Outlet Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
