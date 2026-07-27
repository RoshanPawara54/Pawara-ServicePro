import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Clock, CheckCircle, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ActivityLogHistory() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActivities = async () => {
    try {
      const res = await api.get('/api/owner/activities');
      setActivities(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '15px' }}>
        <div className="spin-loader" />
        <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', padding: '8px 12px' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1>Activity History</h1>
          <p style={{ color: 'var(--text-muted)' }}>Complete audit log of actions performed in Pawara ServicePro</p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '12px 20px',
          borderRadius: '10px',
          marginBottom: '25px'
        }}>
          {error}
        </div>
      )}

      <div className="glass-card">
        {activities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {activities.map((act) => {
              const dt = new Date(act.createdAt);
              return (
                <div key={act.id} className="activity-log-card" style={{
                  background: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {act.description}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Performed by: <strong style={{ color: 'var(--text-main)' }}>{act.performedBy}</strong> | Type: {act.activityType}
                    </div>
                  </div>
                  <div className="activity-log-date" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <div>{dt.toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                      {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-muted)'
          }}>
            <Activity size={40} color="var(--text-muted)" style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p style={{ fontWeight: '500', color: 'var(--text-main)' }}>No Activity Recorded</p>
            <p style={{ fontSize: '0.85rem' }}>Audit trail is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
