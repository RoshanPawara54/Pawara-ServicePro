import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertCircle, 
  Clock, 
  FileText, 
  UserPlus, 
  Search, 
  Bell, 
  CheckCircle, 
  ShieldAlert,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function OwnerDashboard({ setTab, setShopMode, setSearchTerm }) {
  const { apiFetch } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time notifications state
  const [newRequestAlerts, setNewRequestAlerts] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/owner/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard statistics');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Subscribe to real-time updates via Server-Sent Events (SSE)
    const eventSource = new EventSource('http://localhost:8080/api/notifications/subscribe');

    eventSource.addEventListener('INIT', (e) => {
      console.log('SSE connection initialized:', e.data);
    });

    eventSource.addEventListener('NEW_REQUEST', (e) => {
      try {
        const payload = JSON.parse(e.data);
        console.log('Received live request via SSE:', payload);
        
        // Show visual banner alert
        setNewRequestAlerts(prev => [payload, ...prev]);
        
        // Refresh dashboard stats to update counts
        fetchStats();
      } catch (err) {
        console.error('Error parsing SSE payload:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.log('SSE connection error, closing or retrying...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleDismissAlert = (id) => {
    setNewRequestAlerts(prev => prev.filter(alert => alert.requestId !== id));
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>Loading dashboard details...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Welcome, Admin</h1>
          <p style={{ color: 'var(--text-muted)' }}>Daily business operations summary for Pawara ServicePro</p>
        </div>
      </div>

      {/* SSE Real-Time Notification Banners */}
      {newRequestAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
          {newRequestAlerts.map((alert) => (
            <div key={alert.requestId} className="glass-card" style={{
              background: 'rgba(139, 92, 246, 0.15)',
              borderColor: 'rgba(139, 92, 246, 0.4)',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              animation: 'slideIn 0.3s ease-out',
              padding: '16px 24px',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <Bell size={24} color="#8b5cf6" className="bounce" />
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>New Maintenance Request Received!</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    Customer: <strong>{alert.customerName}</strong> ({alert.customerType}) — <em>"{alert.description}"</em>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-primary btn-small" 
                  onClick={() => {
                    handleDismissAlert(alert.requestId);
                    setTab('customers');
                  }}
                >
                  View Profile
                </button>
                <button 
                  className="btn-secondary btn-small"
                  onClick={() => handleDismissAlert(alert.requestId)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="glass-card" style={{ marginBottom: '35px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>Quick Actions</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <button 
            className="btn-primary" 
            onClick={() => { setShopMode('bill'); setTab('shop'); }}
            style={{ justifyContent: 'center', padding: '16px' }}
          >
            <FileText size={20} />
            New Bill
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={() => { setShopMode('quotation'); setTab('shop'); }}
            style={{ justifyContent: 'center', padding: '16px' }}
          >
            <FileText size={20} />
            New Quotation
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={() => { setTab('customers'); }}
            style={{ justifyContent: 'center', padding: '16px' }}
          >
            <UserPlus size={20} />
            Search Customer
          </button>

          <button 
            className="btn-secondary" 
            onClick={() => { setTab('revenue'); }}
            style={{ justifyContent: 'center', padding: '16px' }}
          >
            <TrendingUp size={20} />
            Revenue Report
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Pending Maintenance Requests */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock color="var(--color-warning)" size={20} />
              New Maintenance Requests
            </h3>
            <span className="badge badge-pending">
              {stats?.pendingRequestsCount || 0} Pending
            </span>
          </div>

          {stats?.pendingRequests && stats.pendingRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {stats.pendingRequests.map((req) => (
                <div key={req.id} style={{
                  background: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: '10px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{req.customer?.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{req.description}</p>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-primary btn-small"
                      onClick={() => setTab('customers')}
                      style={{ gap: '4px' }}
                    >
                      Process Work
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)'
            }}>
              <CheckCircle size={40} color="var(--color-success)" style={{ marginBottom: '10px' }} />
              <p style={{ fontWeight: '500', color: 'var(--text-main)' }}>No Maintenance Requests</p>
              <p style={{ fontSize: '0.85rem' }}>All service requests have been processed successfully!</p>
            </div>
          )}
        </div>

        {/* Right Side: Contract Payment Reminders */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert color="var(--color-danger)" size={20} />
              Contract Payment Reminders
            </h3>
            <span className="badge badge-unpaid">
              {stats?.paymentReminders?.length || 0} Due
            </span>
          </div>

          {stats?.paymentReminders && stats.paymentReminders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.paymentReminders.map((reminder) => (
                <div key={reminder.customerId} style={{
                  background: 'rgba(244, 63, 94, 0.05)',
                  border: '1px solid rgba(244, 63, 94, 0.15)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{reminder.customerName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Contract Amount: <strong style={{ color: 'var(--text-main)' }}>₹{reminder.amount.toFixed(2)}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: reminder.isOverdue ? '#fb7185' : 'var(--color-warning)', marginTop: '2px', fontWeight: '500' }}>
                      {reminder.isOverdue ? `🔴 OVERDUE: Due on ${new Date(reminder.dueDate).toLocaleDateString()}` : `⚠️ Due on ${new Date(reminder.dueDate).toLocaleDateString()}`}
                    </div>
                  </div>
                  <button 
                    className="btn-secondary btn-small"
                    onClick={() => setTab('customers')}
                  >
                    Record Payment
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)'
            }}>
              <CheckCircle size={40} color="var(--color-success)" style={{ marginBottom: '10px' }} />
              <p style={{ fontWeight: '500', color: 'var(--text-main)' }}>No Pending Contract Payments</p>
              <p style={{ fontSize: '0.85rem' }}>All monthly maintenance contract accounts are fully paid!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
