import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Sparkles,
  UserCheck,
  Menu,
  X
} from 'lucide-react';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout-container">
      
      {/* Mobile Top Header */}
      <header className="mobile-header no-print">
        <button className="menu-toggle-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="mobile-logo-text" style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111111' }}>ServicePro</span>
      </header>

      {/* Sidebar Overlay (Backdrop) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Customer Sidebar */}
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
            <span className="username-display" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.customerName || user?.username}
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
        <Outlet />
      </main>

    </div>
  );
}

