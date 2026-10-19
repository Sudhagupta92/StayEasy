import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Menu,
  X,
  Building2,
  User,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  UserCircle,
} from 'lucide-react';
import { Container } from './Container';
import { Button } from './Button';
import { Badge } from './Badge';
import { NAV_LINKS } from '../../constants';
import { healthService } from '../../services/healthService';
import { useAuth } from '../../context/AuthContext';

import { NotificationBell } from '../notifications/NotificationBell';

export const Navbar = () => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState({ checking: true, online: false });
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const { user, isAuthenticated, role, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const checkApi = async () => {
      const res = await healthService.getHealth();
      if (isMounted) {
        setApiStatus({
          checking: false,
          online: res.success,
        });
      }
    };

    checkApi();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'OWNER') return '/owner/dashboard';
    return '/user/dashboard';
  };

  const getRoleLabel = () => {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'OWNER') return 'Landlord';
    return 'Tenant';
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 transition-all duration-300">
      {/* Micro Top Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <Container className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-200">StayEasy Trust Guarantee:</span>
            <span className="hidden sm:inline text-slate-400">100% Physical Audits & Verified Resident Reviews</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">API:</span>
              {apiStatus.checking ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-spin" /> Checking...
                </span>
              ) : apiStatus.online ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Atlas Online (v1)
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <Link to="/about" className="hover:text-white transition-colors hidden sm:inline">
              Enterprise Production Ready
            </Link>
          </div>
        </Container>
      </div>

      {/* Main Navbar */}
      <Container className="flex items-center justify-between h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Stay<span className="text-brand-600">Easy</span>
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-50" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Verified Accommodations
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-brand-600 ${
                  isActive ? 'text-brand-600 font-semibold' : 'text-slate-600'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions (Authenticated vs Guest) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              <div className="relative" ref={dropdownRef}>

              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-3 pr-2.5 rounded-full bg-white border border-slate-200 hover:border-brand-300 shadow-sm transition-all text-left"
              >
                <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[100px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">
                    {getRoleLabel()}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <Badge variant="brand" size="sm" className="mt-1">
                      Role: {user.role}
                    </Badge>
                  </div>

                  <div className="py-1">
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
          ) : (

            <>
              <Button to="/login" variant="ghost" size="sm">
                Log In
              </Button>
              <Button to="/register" variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Register
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </Container>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 pt-2">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                    <Badge variant="brand" size="sm" className="mt-1">
                      Role: {user.role}
                    </Badge>
                  </div>
                  <Button to={getDashboardLink()} variant="primary" className="w-full justify-center" icon={LayoutDashboard}>
                    Dashboard
                  </Button>
                  <Button onClick={handleLogout} variant="outline" className="w-full justify-center text-rose-600" icon={LogOut}>
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/login" variant="outline" className="w-full justify-center">
                    Log In
                  </Button>
                  <Button to="/register" variant="primary" className="w-full justify-center">
                    Create Account
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
