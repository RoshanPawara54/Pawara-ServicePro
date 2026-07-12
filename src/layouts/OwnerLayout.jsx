import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Trash2,
  LogOut, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export default function OwnerLayout() {
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

      {/* Sidebar Nav */}
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

        <nav style={{ flex: 1 }}>
          <ul className="nav-links">
            <li>
              <NavLink 
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/shop/bills"
                className={({ isActive }) => `nav-link ${isActive || window.location.pathname === '/shop/quotations' ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <ShoppingCart size={18} />
                Shop Billing
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/maintenance"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Users size={18} />
                Maintenance
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/revenue"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <TrendingUp size={18} />
                View Revenue
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/trash"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Trash2 size={18} />
                Trash
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="user-profile-section">
          <div className="user-info">
            <span className="username-display">{user?.username}</span>
            <span className="role-display">Owner Account</span>
          </div>
          <button className="btn-secondary btn-small" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
}

