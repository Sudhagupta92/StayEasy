import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Common
import ProtectedRoute from '../components/common/ProtectedRoute';

// Public Pages
import HomePage from '../pages/public/HomePage';
import PropertiesPage from '../pages/public/PropertiesPage';
import PropertyDetailPage from '../pages/public/PropertyDetailPage';
import AboutPage from '../pages/public/AboutPage';
import OwnersPage from '../pages/public/OwnersPage';
import ContactPage from '../pages/public/ContactPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Dashboards
import UserDashboard from '../pages/user/UserDashboard';
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';

import NotificationCenterPage from '../pages/user/NotificationCenterPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/how-it-works" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/owners" element={<OwnersPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationCenterPage />
            </ProtectedRoute>
          }
        />
      </Route>


      {/* Protected User / Tenant Dashboard (USER and ADMIN) */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <DashboardLayout role="USER" title="Tenant Portal" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
      </Route>

      {/* Protected Property Owner Dashboard (OWNER and ADMIN) */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <DashboardLayout role="OWNER" title="Property Owner Hub" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
      </Route>

      {/* Protected Admin Dashboard (ADMIN only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout role="ADMIN" title="StayEasy Trust Control" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Dashboard Route Aliases */}
      <Route path="/dashboard/user" element={<Navigate to="/user/dashboard" replace />} />
      <Route path="/dashboard/owner" element={<Navigate to="/owner/dashboard" replace />} />
      <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* 404 Fallback */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
