import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function TrashManagement() {
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
      setTrashedCustomers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching trash');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedCustomers();
  }, []);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Customer Trash Bin</h1>
          <p style={{ color: 'var(--text-muted)' }}>Restore or permanently delete trashed customer accounts and their associated history</p>
        </div>
      </div>

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
        <div className="data-table-container">
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
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading trash bin...</span>
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
                    <td className="actions-cell">
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-secondary btn-small" 
                          onClick={() => handleRestoreClick(cust)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                        <button 
                          className="btn-danger btn-small" 
                          onClick={() => handleDeleteClick(cust)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
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
