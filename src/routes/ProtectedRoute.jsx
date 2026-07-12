import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    if (user.role === 'OWNER') {
      return <Navigate to="/dashboard" replace />;
    }
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
