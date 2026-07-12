import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  AlertCircle, 
  Clock, 
  FileText, 
  UserPlus, 
  Search, 
  Bell, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time notifications state
  const [newRequestAlerts, setNewRequestAlerts] = useState([]);

  // Search autocomplete states
  const [searchVal, setSearchVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchData, setSearchData] = useState({
    customers: [],
    bills: [],
    requests: [],
    activities: []
  });

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/owner/dashboard');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadSearchData = async () => {
    try {
      const [custRes, billRes, reqRes, actRes] = await Promise.all([
        api.get('/api/owner/customers'),
        api.get('/api/owner/bills'),
        api.get('/api/owner/requests'),
        api.get('/api/owner/activities')
      ]);
      setSearchData({
        customers: custRes.data || [],
        bills: billRes.data || [],
        requests: reqRes.data || [],
        activities: actRes.data || []
      });
    } catch (err) {
      console.error('Error fetching search data:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    loadSearchData();

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

    const handleOutsideClick = () => {
      setSuggestions([]);
    };
    document.addEventListener('click', handleOutsideClick);

    return () => {
      eventSource.close();
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const handleDismissAlert = (id) => {
    setNewRequestAlerts(prev => prev.filter(alert => alert.requestId !== id));
  };

  const handleSearchInputChange = (val) => {
    setSearchVal(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    const query = val.toLowerCase();
    
    // System navigation pages
    const systemPages = [
      { name: 'Maintenance', path: '/maintenance', keywords: ['maintenance', 'customers', 'clients', 'directory'] },
      { name: 'Shop Billing', path: '/shop/bills', keywords: ['billing', 'bills', 'shop', 'invoices', 'new bill'] },
      { name: 'Shop Quotations', path: '/shop/quotations', keywords: ['quotation', 'quotations', 'estimates', 'new quotation'] },
      { name: 'View Revenue', path: '/revenue', keywords: ['revenue', 'analytics', 'reports', 'finance', 'view revenue'] },
      { name: 'Activity History', path: '/activities', keywords: ['activities', 'activity', 'logs', 'audit log', 'history'] }
    ];

    const startMatches = [];
    const containMatches = [];

    // A. Match System Pages
    systemPages.forEach(page => {
      const nameLower = page.name.toLowerCase();
      const startsWithName = nameLower.startsWith(query);
      const startsWithKeyword = page.keywords.some(kw => kw.startsWith(query));
      
      const pageSuggestion = {
        type: 'Page Navigation',
        title: page.name,
        subtitle: `Go to ${page.name} section`,
        link: page.path
      };

      if (startsWithName || startsWithKeyword) {
        startMatches.push(pageSuggestion);
      } else if (nameLower.includes(query) || page.keywords.some(kw => kw.includes(query))) {
        containMatches.push(pageSuggestion);
      }
    });

    // B. Match Customers
    searchData.customers.forEach(cust => {
      const nameLower = cust.name?.toLowerCase() || '';
      const startsWithName = nameLower.startsWith(query);

      const customerSuggestion = {
        type: 'Customer Profile',
        title: cust.name,
        subtitle: `${cust.customerType} | Contact: ${cust.contactPerson || 'N/A'}`,
        link: `/maintenance/${cust.id}`
      };

      if (startsWithName) {
        startMatches.push(customerSuggestion);
      } else if (
        nameLower.includes(query) ||
        cust.contactPerson?.toLowerCase().includes(query) ||
        cust.phone?.toLowerCase().includes(query) ||
        cust.email?.toLowerCase().includes(query) ||
        cust.address?.toLowerCase().includes(query)
      ) {
        containMatches.push(customerSuggestion);
      }
    });

    // C. Match Bills / Quotations
    searchData.bills.forEach(bill => {
      const numLower = bill.billNumber?.toLowerCase() || '';
      const custLower = bill.customerName?.toLowerCase() || '';
      const startsWithNum = numLower.startsWith(query);
      const startsWithCust = custLower.startsWith(query);

      const isQuo = bill.billType === 'SHOP_QUOTATION';
      const billSuggestion = {
        type: isQuo ? 'Quotation' : 'Bill Record',
        title: bill.billNumber,
        subtitle: `${isQuo ? 'Quotation' : 'Bill'} for ${bill.customerName} (₹${bill.totalAmount})`,
        link: isQuo ? '/shop/quotations' : '/shop/bills'
      };

      if (startsWithNum || startsWithCust) {
        startMatches.push(billSuggestion);
      } else if (
        numLower.includes(query) ||
        custLower.includes(query) ||
        bill.billType?.toLowerCase().includes(query)
      ) {
        containMatches.push(billSuggestion);
      }
    });

    // D. Match Maintenance Requests
    searchData.requests.forEach(req => {
      const descLower = req.description?.toLowerCase() || '';
      const custLower = req.customer?.name?.toLowerCase() || '';
      const startsWithCust = custLower.startsWith(query);
      const startsWithDesc = descLower.startsWith(query);

      const requestSuggestion = {
        type: 'Maintenance Request',
        title: `Request from ${req.customer?.name}`,
        subtitle: req.description,
        link: req.customer ? `/maintenance/${req.customer.id}` : '/maintenance'
      };

      if (startsWithCust || startsWithDesc) {
        startMatches.push(requestSuggestion);
      } else if (
        descLower.includes(query) ||
        custLower.includes(query) ||
        req.status?.toLowerCase().includes(query)
      ) {
        containMatches.push(requestSuggestion);
      }
    });

    // E. Match Activities
    searchData.activities.forEach(act => {
      const typeLower = act.activityType?.toLowerCase() || '';
      const descLower = act.description?.toLowerCase() || '';
      const startsWithType = typeLower.startsWith(query);
      const startsWithDesc = descLower.startsWith(query);

      const activitySuggestion = {
        type: 'Audit Log',
        title: act.activityType,
        subtitle: act.description,
        link: '/activities'
      };

      if (startsWithType || startsWithDesc) {
        startMatches.push(activitySuggestion);
      } else if (
        typeLower.includes(query) ||
        descLower.includes(query) ||
        act.performedBy?.toLowerCase().includes(query)
      ) {
        containMatches.push(activitySuggestion);
      }
    });

    // Combine prioritizing starts-with matches
    const allMatches = [...startMatches, ...containMatches];
    
    // De-duplicate matches by link and title
    const uniqueMatches = [];
    const seen = new Set();
    for (const match of allMatches) {
      const key = `${match.link}-${match.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMatches.push(match);
      }
    }

    setSuggestions(uniqueMatches.slice(0, 6));
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>Loading dashboard details...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1>Welcome, Jankiram</h1>
          <p style={{ color: 'var(--text-muted)' }}>Daily business operations summary for Pawara ServicePro</p>
        </div>

        {/* Global Admin Search Bar */}
        <div 
          style={{ position: 'relative', width: '320px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: '#ffffff', 
            border: '1px solid rgba(17,17,17,0.15)', 
            borderRadius: '8px', 
            padding: '10px 14px' 
          }}>
            <Search size={18} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search anything in system..." 
              value={searchVal}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.92rem', background: 'transparent', color: 'var(--text-main)' }}
            />
          </div>

          {/* Autocomplete Suggestions List */}
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              zIndex: 999,
              marginTop: '5px',
              maxHeight: '350px',
              overflowY: 'auto'
            }}>
              {suggestions.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    navigate(item.link);
                    setSearchVal('');
                    setSuggestions([]);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  className="search-item-hover"
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9f8f3'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                      {item.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)', marginTop: '2px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.subtitle}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    navigate('/maintenance/' + alert.customerId);
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          <button 
            className="btn-primary" 
            onClick={() => { navigate('/shop/bills'); }}
            style={{ justifyContent: 'center', padding: '16px' }}
          >
            <FileText size={20} />
            New Bill
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={() => { navigate('/shop/quotations'); }}
            style={{ justifyContent: 'center', padding: '16px' }}
          >
            <FileText size={20} />
            New Quotation
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={() => { navigate('/maintenance'); }}
            style={{ justifyContent: 'center', padding: '16px' }}
          >
            <UserPlus size={20} />
            Search Customer
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
                      onClick={() => navigate('/maintenance/' + req.customer?.id)}
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

        {/* Right Side: Recent Activity Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity color="var(--color-primary)" size={20} />
              Recent Activity
            </h3>
          </div>

          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentActivities.map((act) => {
                const dt = new Date(act.createdAt);
                return (
                  <div key={act.id} style={{
                    background: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>
                        {act.description}
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Performed by: {act.performedBy}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', minWidth: '90px' }}>
                      <div>{dt.toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                        {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button 
                  className="btn-secondary btn-small"
                  onClick={() => navigate('/activities')}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                >
                  View All Activity
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)'
            }}>
              <CheckCircle size={40} color="var(--color-success)" style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p style={{ fontWeight: '500', color: 'var(--text-main)' }}>No Recent Activity</p>
              <p style={{ fontSize: '0.85rem' }}>No actions have been logged in the system.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
