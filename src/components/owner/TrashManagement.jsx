import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Trash2, RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function TrashManagement() {
  const navigate = useNavigate();
  const [trashedCustomers, setTrashedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state for Restore
  const [restoreModal, setRestoreModal] = useState({
    isOpen: false,
    customerId: null,
    customerName: ''
  });

  // Modal state for Permanent Delete
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    customerId: null,
    customerName: '',
    confirmText: ''
  });

  const fetchTrashedCustomers = async () => {
    try {
      const res = await api.get('/api/owner/customers/trash');
      const list = res.data || [];
      list.sort((a, b) => new Date(b.trashedAt || b.createdAt || 0) - new Date(a.trashedAt || a.createdAt || 0) || (b.id || 0) - (a.id || 0));
      setTrashedCustomers(list);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedCustomers();
  }, []);

  // Auto-dismiss success alert after 10 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error alert after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleRestoreClick = (cust) => {
    setRestoreModal({
      isOpen: true,
      customerId: cust.id,
      customerName: cust.name
    });
  };

  const handleRestoreConfirm = async () => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/owner/customers/${restoreModal.customerId}/restore`);
      setSuccess(`Customer "${restoreModal.customerName}" successfully restored to Active!`);
      setRestoreModal({ isOpen: false, customerId: null, customerName: '' });
      fetchTrashedCustomers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteClick = (cust) => {
    setDeleteModal({
      isOpen: true,
      customerId: cust.id,
      customerName: cust.name,
      confirmText: ''
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.confirmText !== 'DELETE') return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/owner/customers/${deleteModal.customerId}`);
      setSuccess(`Customer "${deleteModal.customerName}" permanently deleted.`);
      setDeleteModal({ isOpen: false, customerId: null, customerName: '', confirmText: '' });
      fetchTrashedCustomers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <div className="mobile-sticky-page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/dashboard');
            }
          }}
          title="Go Back"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            flexShrink: 0
          }}
        >
          <ArrowLeft size={28} strokeWidth={2.4} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Trash
        </h1>
      </div>
      {/* Spacer to push content below the fixed bar on mobile */}
      <div className="mobile-sticky-spacer" />


      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '12px 20px',
          borderRadius: '10px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          padding: '12px 20px',
          borderRadius: '10px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{error}</span>
        </div>
      )}

      <div className="glass-card">
        {/* Desktop Table View */}
        <div className="data-table-container trash-table-desktop">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Customer Type</th>
                <th>Date Moved To Trash</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div className="spin-loader" style={{ width: '24px', height: '24px', borderWidth: '3px' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : trashedCustomers.length > 0 ? (
                trashedCustomers.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{cust.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-quotation">{cust.customerType}</span>
                    </td>
                    <td>
                      {cust.trashedAt ? new Date(cust.trashedAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="actions-cell" style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
                        <button 
                          className="btn-secondary btn-small" 
                          onClick={() => handleRestoreClick(cust)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                        <button 
                          className="btn-danger btn-small" 
                          onClick={() => handleDeleteClick(cust)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', borderColor: '#dc2626', color: '#fff', whiteSpace: 'nowrap' }}
                        >
                          <Trash2 size={14} /> Delete Permanently
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '5px' }}>No Trashed Customers</div>
                    <div style={{ fontSize: '0.9rem' }}>Trash bin is currently empty.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (Cart View) */}
        <div className="trash-cards-mobile">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div className="spin-loader" style={{ width: '24px', height: '24px', borderWidth: '3px', margin: '0 auto 10px' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</span>
            </div>
          ) : trashedCustomers.length > 0 ? (
            trashedCustomers.map((cust) => (
              <div key={cust.id} className="trash-card">
                <div className="trash-card-header">
                  <strong className="trash-card-name">{cust.name}</strong>
                  <span className="badge badge-quotation">{cust.customerType}</span>
                </div>
                <div className="trash-card-body">
                  <div className="trash-card-row">
                    <span className="trash-card-label">Date Moved to Trash</span>
                    <span className="trash-card-val">{cust.trashedAt ? new Date(cust.trashedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="trash-card-actions">
                  <button
                    className="btn-secondary btn-small trash-card-btn"
                    onClick={() => handleRestoreClick(cust)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button
                    className="btn-danger btn-small trash-card-btn"
                    onClick={() => handleDeleteClick(cust)}
                    style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff', whiteSpace: 'nowrap' }}
                  >
                    <Trash2 size={14} /> Delete Permanently
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 15px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-main)' }}>No Trashed Customers</div>
              <div style={{ fontSize: '0.85rem' }}>Trash bin is currently empty.</div>
            </div>
          )}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Restore Customer?</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '25px', lineHeight: '1.5' }}>
              Are you sure you want to restore <strong>{restoreModal.customerName}</strong> back to Active status?
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setRestoreModal({ isOpen: false, customerId: null, customerName: '' })}
                style={{ minWidth: '100px', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn-primary" 
                onClick={handleRestoreConfirm}
                style={{ minWidth: '100px', justifyContent: 'center', background: '#4c1d95', borderColor: '#4c1d95' }}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', color: '#dc2626' }}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{ marginBottom: '15px', color: '#dc2626' }}>Delete Customer Permanently</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px', textAlign: 'left', lineHeight: '1.4' }}>
              This action is irreversible. The following information will be permanently deleted:
            </p>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'left', marginBottom: '20px', paddingLeft: '20px', lineHeight: '1.5' }}>
              <li>Customer Profile & login credentials</li>
              <li>Contracts</li>
              <li>Quotations & Bills</li>
              <li>Material Bills</li>
              <li>Maintenance Requests</li>
              <li>Activity History</li>
            </ul>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '15px', fontWeight: '500' }}>
              To proceed, type <strong style={{ color: '#dc2626' }}>DELETE</strong> in the field below:
            </p>
            <input 
              className="form-input" 
              type="text" 
              placeholder="Type DELETE to confirm" 
              value={deleteModal.confirmText}
              onChange={(e) => setDeleteModal(prev => ({ ...prev, confirmText: e.target.value }))}
              style={{ marginBottom: '25px', textAlign: 'center', textTransform: 'uppercase' }}
            />
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setDeleteModal({ isOpen: false, customerId: null, customerName: '', confirmText: '' })}
                style={{ minWidth: '100px', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn-danger" 
                onClick={handleDeleteConfirm}
                disabled={deleteModal.confirmText !== 'DELETE'}
                style={{ 
                  minWidth: '160px', 
                  justifyContent: 'center',
                  background: deleteModal.confirmText === 'DELETE' ? '#dc2626' : '#fca5a5',
                  borderColor: deleteModal.confirmText === 'DELETE' ? '#dc2626' : '#fca5a5',
                  cursor: deleteModal.confirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                  color: '#fff'
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
