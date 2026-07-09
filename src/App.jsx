import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import ResetPassword from './components/auth/ResetPassword';
import OwnerDashboard from './components/owner/OwnerDashboard';
import ShopBilling from './components/owner/ShopBilling';
import CustomerManagement from './components/owner/CustomerManagement';
import RevenueAnalytics from './components/owner/RevenueAnalytics';
import CustomerPortal from './components/customer/CustomerPortal';

import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  LogOut, 
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [shopMode, setShopMode] = useState('bill'); // 'bill' or 'quotation' for shop quick actions
  const [isResetMode, setIsResetMode] = useState(false);

  useEffect(() => {
    // Check if token exists in url indicating a reset password flow
    const queryToken = new URLSearchParams(window.location.search).get('token');
    if (queryToken) {
      setIsResetMode(true);
    }
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#fcfbf7',
        color: '#111111'
      }}>
        <h2>Loading Pawara ServicePro...</h2>
      </div>
    );
  }

  // Password reset view
  if (isResetMode) {
    return (
      <ResetPassword 
        onBackToLogin={() => setIsResetMode(false)} 
      />
    );
  }

  // Logged out view
  if (!user) {
    return <Login />;
  }

  // Logged in: Owner Dashboard Layout
  if (user.role === 'OWNER') {
    return (
      <div className="layout-container">
        
        {/* Sidebar Nav */}
        <aside className="sidebar no-print">
          <div className="logo-container">
            <Sparkles size={24} color="#8b5cf6" />
            <span className="logo-text">ServicePro</span>
          </div>

          <nav style={{ flex: 1 }}>
            <ul className="nav-links">
              <li>
                <button 
                  className={`nav-link ${tab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setTab('dashboard')}
                  style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${tab === 'shop' ? 'active' : ''}`}
                  onClick={() => { setTab('shop'); setShopMode('bill'); }}
                  style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                >
                  <ShoppingCart size={18} />
                  Shop Billing
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${tab === 'customers' ? 'active' : ''}`}
                  onClick={() => setTab('customers')}
                  style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                >
                  <Users size={18} />
                  Maintenance
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${tab === 'revenue' ? 'active' : ''}`}
                  onClick={() => setTab('revenue')}
                  style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                >
                  <TrendingUp size={18} />
                  Revenue Analytics
                </button>
              </li>
            </ul>
          </nav>

          <div className="user-profile-section">
            <div className="user-info">
              <span className="username-display">{user.username}</span>
              <span className="role-display">Owner Account</span>
            </div>
            <button className="btn-secondary btn-small" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="main-content">
          {tab === 'dashboard' && (
            <OwnerDashboard 
              setTab={setTab} 
              setShopMode={setShopMode} 
            />
          )}
          {tab === 'shop' && (
            <ShopBilling 
              initialMode={shopMode} 
            />
          )}
          {tab === 'customers' && (
            <CustomerManagement />
          )}
          {tab === 'revenue' && (
            <RevenueAnalytics />
          )}
        </main>

      </div>
    );
  }

  // Logged in: Customer Portal Layout
  return (
    <div className="layout-container">
      
      {/* Customer Sidebar */}
      <aside className="sidebar no-print">
        <div className="logo-container">
          <Sparkles size={24} color="#8b5cf6" />
          <span className="logo-text">ServicePro</span>
        </div>

        <div style={{ flex: 1 }}>
          <ul className="nav-links">
            <li>
              <div className="nav-link active">
                <UserCheck size={18} />
                Client Panel
              </div>
            </li>
          </ul>
        </div>

        <div className="user-profile-section">
          <div className="user-info">
            <span className="username-display" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user.customerName || user.username}
            </span>
            <span className="role-display">Customer Account</span>
          </div>
          <button className="btn-secondary btn-small" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="main-content">
        <CustomerPortal />
      </main>

    </div>
  );
}
