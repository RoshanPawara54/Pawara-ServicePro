import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Sparkles, UserCheck, X } from 'lucide-react';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout-container">

      {/* Mobile top header REMOVED — navigation is handled by
          the 3-tab footer bar inside CustomerPortal on mobile */}

      {/* Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Customer Sidebar (desktop only — hidden on mobile via CSS) */}
      <aside className={`sidebar no-print ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={24} color="#8b5cf6" />
            <span className="logo-text">ServicePro</span>
          </div>
          <button className="menu-close-btn" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <ul className="nav-links">
            <li>
              <div className="nav-link active" onClick={closeSidebar}>
                <UserCheck size={18} />
                Client Panel
              </div>
            </li>
          </ul>
        </div>

        <div className="user-profile-section">
          <div className="user-info">
            <span
              className="username-display"
              style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              {user?.customerName || user?.username}
            </span>
            <span className="role-display">Customer Account</span>
          </div>
          <button
            className="btn-secondary btn-small"
            onClick={logout}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
}
