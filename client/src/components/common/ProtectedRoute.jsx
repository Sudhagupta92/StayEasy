import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Container } from './Container';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <span className="text-sm font-medium text-slate-600">Verifying session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect / Access Denied UI for unauthorized role
    const getDashboardPath = (role) => {
      if (role === 'ADMIN') return '/admin/dashboard';
      if (role === 'OWNER') return '/owner/dashboard';
      return '/user/dashboard';
    };

    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 py-12">
        <Container>
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your account role (<strong className="text-slate-900">{user?.role}</strong>) does not have permission to access this area.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Button to={getDashboardPath(user?.role)} variant="primary" size="md">
                Go to Your {user?.role} Dashboard
              </Button>
              <Button to="/" variant="ghost" size="sm" icon={ArrowLeft}>
                Return to Homepage
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
