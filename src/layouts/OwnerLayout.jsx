import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Trash2,
  LogOut, 
  Sparkles 
} from 'lucide-react';

export default function OwnerLayout() {
  const { user, logout } = useAuth();

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
              <NavLink 
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/shop/bills"
                className={({ isActive }) => `nav-link ${isActive || window.location.pathname === '/shop/quotations' ? 'active' : ''}`}
              >
                <ShoppingCart size={18} />
                Shop Billing
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/maintenance"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Users size={18} />
                Maintenance
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/revenue"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <TrendingUp size={18} />
                View Revenue
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/trash"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
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
