import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import OwnerLayout from '../layouts/OwnerLayout';
import CustomerLayout from '../layouts/CustomerLayout';

// Auth pages
import Login from '../components/auth/Login';
import ResetPassword from '../components/auth/ResetPassword';

// Owner pages
import OwnerDashboard from '../components/owner/OwnerDashboard';
import ShopBilling from '../components/owner/ShopBilling';
import CustomerManagement from '../components/owner/CustomerManagement';
import RevenueAnalytics from '../components/owner/RevenueAnalytics';
import ActivityLogHistory from '../components/owner/ActivityLogHistory';
import TrashManagement from '../components/owner/TrashManagement';

// Customer pages
import CustomerPortal from '../components/customer/CustomerPortal';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#fcfbf7',
        color: '#111111',
        gap: '20px'
      }}>
        <div className="spin-loader" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Loading...</h2>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'OWNER') return <Navigate to="/dashboard" replace />;
  if (user.role === 'CUSTOMER') return <Navigate to="/portal" replace />;
  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Owner routes */}
      <Route
        element={
          <ProtectedRoute role="OWNER">
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<OwnerDashboard />} />
        <Route path="/shop/bills" element={<ShopBilling />} />
        <Route path="/shop/quotations" element={<ShopBilling />} />
        <Route path="/maintenance" element={<CustomerManagement />} />
        <Route path="/maintenance/:id" element={<CustomerManagement />} />
        <Route path="/revenue" element={<RevenueAnalytics />} />
        <Route path="/activities" element={<ActivityLogHistory />} />
        <Route path="/trash" element={<TrashManagement />} />
      </Route>

      {/* Customer routes */}
      <Route
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/portal" element={<CustomerPortal />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
