import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function CustomerLayout() {
  const { user, logout } = useAuth();

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
