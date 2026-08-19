import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  TrendingUp,
  Trash2,
  LogOut,
  Sparkles,
  X,
  Home,
  User,
  Search
} from 'lucide-react';

export default function OwnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobile search
  const [searchVal, setSearchVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchData, setSearchData] = useState({ customers: [], bills: [], requests: [], activities: [] });

  const closeSidebar = () => setSidebarOpen(false);

  // Load data for mobile search autocomplete
  useEffect(() => {
    const loadData = async () => {
      try {
        const [custRes, billRes, reqRes, actRes] = await Promise.all([
          api.get('/api/owner/customers'),
          api.get('/api/owner/bills'),
          api.get('/api/owner/requests'),
          api.get('/api/owner/activities'),
        ]);
        setSearchData({
          customers: custRes.data || [],
          bills: billRes.data || [],
          requests: reqRes.data || [],
          activities: actRes.data || [],
        });
      } catch (_) { }
    };
    loadData();
  }, []);

  const handleSearchInput = (val) => {
    setSearchVal(val);
    if (!val.trim()) { setSuggestions([]); return; }
    const q = val.toLowerCase();

    const pages = [
      { name: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'home', 'summary'] },
      { name: 'Shop Billing', path: '/shop/bills', keywords: ['billing', 'bills', 'shop', 'invoices'] },
      { name: 'Shop Quotations', path: '/shop/quotations', keywords: ['quotation', 'estimates'] },
      { name: 'View Revenue', path: '/revenue', keywords: ['revenue', 'analytics', 'finance'] },
      { name: 'Activity History', path: '/activities', keywords: ['activities', 'logs', 'audit'] },
      { name: 'Maintenance', path: '/maintenance', keywords: ['maintenance', 'customers', 'clients'] },
    ];

    const results = [];
    pages.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.keywords.some(k => k.includes(q)))
        results.push({ type: 'Page', title: p.name, link: p.path });
    });
    searchData.customers.forEach(c => {
      if (c.name?.toLowerCase().includes(q))
        results.push({ type: 'Customer', title: c.name, subtitle: c.customerType, link: `/maintenance/${c.id}` });
    });
    searchData.bills.forEach(b => {
      if (b.billNumber?.toLowerCase().includes(q) || b.customerName?.toLowerCase().includes(q))
        results.push({
          type: b.billType === 'SHOP_QUOTATION' ? 'Quotation' : 'Bill',
          title: b.billNumber,
          subtitle: `₹${b.totalAmount}`,
          link: b.billType === 'SHOP_QUOTATION' ? '/shop/quotations' : '/shop/bills'
        });
    });
    setSuggestions(results.slice(0, 6));
  };

  // Active check for footer tabs (matches exact path or sub-paths)
  const isFooterActive = (paths) =>
    paths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  return (
    <div className="layout-container">

      {/* ── MOBILE TOP BAR: Search only — shown ONLY on Dashboard ── */}
      {location.pathname === '/dashboard' && (
        <header className="mobile-top-search no-print">
          <div className="mobile-search-wrapper" onClick={e => e.stopPropagation()}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchVal}
              onChange={e => handleSearchInput(e.target.value)}
              className="mobile-search-input"
            />
            {searchVal && (
              <button
                className="mobile-search-clear"
                onClick={() => { setSearchVal(''); setSuggestions([]); }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && (
            <div className="mobile-search-dropdown">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="mobile-search-item"
                  onClick={() => { navigate(item.link); setSearchVal(''); setSuggestions([]); }}
                >
                  <span className="mobile-search-item-type">{item.type}</span>
                  <span className="mobile-search-item-title">{item.title}</span>
                  {item.subtitle && <span className="mobile-search-item-sub">{item.subtitle}</span>}
                </div>
              ))}
            </div>
          )}
        </header>
      )}

      {/* Sidebar Overlay Backdrop */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* ── DESKTOP SIDEBAR (completely unchanged) ── */}
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
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/shop/bills"
                className={({ isActive }) => `nav-link ${isActive || window.location.pathname === '/shop/quotations' ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <ShoppingCart size={18} /> Shop Billing
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/maintenance"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Users size={18} /> Maintenance
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/revenue"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <TrendingUp size={18} /> View Revenue
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/trash"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Trash2 size={18} /> Trash
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="user-profile-section">
          <div className="user-info">
            <span className="username-display">{user?.username}</span>
            <span className="role-display">Owner Account</span>
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

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── MOBILE FOOTER TAB BAR (5 tabs) ── */}
      <nav className="mobile-footer-nav no-print">
        <button
          className={`mobile-footer-tab ${isFooterActive(['/dashboard']) ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <Home size={22} />
          <span>Home</span>
        </button>
        <button
          className={`mobile-footer-tab ${isFooterActive(['/shop/bills', '/shop/quotations']) ? 'active' : ''}`}
          onClick={() => navigate('/shop/bills')}
        >
          <ShoppingCart size={22} />
          <span>Billing</span>
        </button>
        <button
          className={`mobile-footer-tab ${isFooterActive(['/maintenance']) ? 'active' : ''}`}
          onClick={() => navigate('/maintenance')}
        >
          <Users size={22} />
          <span>Maintenance</span>
        </button>
        <button
          className={`mobile-footer-tab ${isFooterActive(['/revenue']) ? 'active' : ''}`}
          onClick={() => navigate('/revenue')}
        >
          <TrendingUp size={22} />
          <span>Revenue</span>
        </button>
        <button
          className={`mobile-footer-tab ${isFooterActive(['/profile']) ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <User size={22} />
          <span>Profile</span>
        </button>
      </nav>

    </div>
  );
}
