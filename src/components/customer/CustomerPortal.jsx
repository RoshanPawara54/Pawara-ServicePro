import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FileText, 
  Send, 
  Clock, 
  CreditCard, 
  Check, 
  Printer, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  User
} from 'lucide-react';

export default function CustomerPortal() {
  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [requests, setRequests] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);

  // New Request Form
  const [description, setDescription] = useState('');
  
  // State indicators
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Selected bill detail for view & print
  const [selectedBillDetail, setSelectedBillDetail] = useState(null);

  // Custom confirmation popup states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const showCustomConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const fetchCustomerData = async () => {
    try {
      // 1. Fetch Contract
      try {
        const contractRes = await api.get('/api/customer/contract');
        setContract(contractRes.data);
      } catch {
        setContract(null);
      }

      // 2. Fetch Requests
      const reqsRes = await api.get('/api/customer/requests');
      setRequests(reqsRes.data);

      // 3. Fetch Bills
      const billsRes = await api.get('/api/customer/bills');
      setBills(billsRes.data);

      // 4. Fetch Payments
      const paymentsRes = await api.get('/api/customer/payments');
      setPayments(paymentsRes.data);

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const { customerId } = user || {};

  // For safety, let's look up using the explicit customer API paths if we are logged in as customer.
  // The backend mapping is configured at `/api/customer/**`
  useEffect(() => {
    fetchCustomerData();
  }, []);

  const handleContractLookup = async () => {
    try {
      const res = await api.get('/api/customer/contract');
      setContract(res.data);
    } catch(err) {}
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the electrical maintenance work required.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await api.post('/api/customer/requests', { description });

      setSuccess('Maintenance request submitted successfully! The Owner has been notified in real-time.');
      setDescription('');
      
      // Refresh list
      fetchCustomerData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handlePayBillCustomer = (billId) => {
    showCustomConfirm(
      'Are you sure you want to mark this material invoice as paid?',
      'This will submit the invoice to the admin for verification and approval.',
      async () => {
        setError('');
        setSuccess('');
        try {
          await api.put(`/api/customer/bills/${billId}/pay`);
          setSuccess('Invoice marked as paid successfully! Waiting for admin approval.');
          fetchCustomerData();
        } catch (err) {
          setError(err.response?.data?.message || err.message);
        }
      }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>Loading customer portal...</div>;
  }

  return (
    <div>
      {/* Title section - Hidden when printing */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Client Service Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Logged in as: <strong>{user?.customerName || user?.username}</strong></p>
        </div>
        <div>
          <span className="badge badge-quotation" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <User size={14} /> Maintenance Account
          </span>
        </div>
      </div>

      {success && (
        <div className="no-print" style={{
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
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="no-print" style={{
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
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Bill Print View */}
      {selectedBillDetail && (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '30px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '15px', marginBottom: '25px' }}>
            <button className="btn-secondary" onClick={() => setSelectedBillDetail(null)}>
              ← Back to Portal
            </button>
            <button className="btn-secondary" onClick={handlePrint}>
              <Printer size={18} /> Print Invoice
            </button>
          </div>

          {/* Invoice Page */}
          <div className="print-sheet" style={{ 
            color: '#000', 
            background: '#fff', 
            fontFamily: 'sans-serif',
            padding: '30px',
            lineHeight: '1.4'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <h1 style={{ 
                color: '#e11d48', // Red header color
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                margin: '0 0 5px 0',
                letterSpacing: '1px'
              }}>
                PRASHANSA ELECTRICAL
              </h1>
              <h4 style={{ 
                color: '#000', 
                fontSize: '0.95rem', 
                fontWeight: 'bold',
                margin: '0 0 4px 0'
              }}>
                Electrical Wiring, Fitting Works, Supply of All Kind of Electricals Goods
              </h4>
              <p style={{ 
                color: '#000', 
                fontSize: '0.85rem', 
                margin: '0'
              }}>
                Nashik Maharashtra-422010 Mob.:9552650767
              </p>
            </div>

            {/* Thick dividing line */}
            <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '10px 0 15px 0' }} />

            {/* Metadata (To, Date, Bill No) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start' }}>
              {/* Left: Customer To details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '55%' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '5px' }}>To,</span>
                  <span style={{ fontWeight: 'bold' }}>{user?.customerName || user?.username}</span>
                </div>
                <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', minHeight: '22px' }}>
                  <span style={{ fontSize: '0.9rem' }}>Hospital, Nashik</span>
                </div>
              </div>

              {/* Right: Date and Bill number */}
              <div style={{ textAlign: 'right', minWidth: '200px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong style={{ fontWeight: 'bold' }}>Date : </strong>
                  <span>{new Date(selectedBillDetail.createdAt).toLocaleDateString('en-GB')}</span>
                </div>
                <div>
                  <strong style={{ fontWeight: 'bold' }}>Bill no : </strong>
                  <span>{selectedBillDetail.id || '80'}</span>
                </div>
              </div>
            </div>

            {/* Table with solid black grid lines */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              border: '2px solid #000',
              marginBottom: '20px',
              color: '#000'
            }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.01)' }}>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '60px', textAlign: 'center', fontWeight: 'bold' }}>Sr.No.</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Particular</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '70px', textAlign: 'center', fontWeight: 'bold' }}>Qty.</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '110px', textAlign: 'right', fontWeight: 'bold' }}>Rate</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '120px', textAlign: 'right', fontWeight: 'bold' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedBillDetail.items && selectedBillDetail.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}.</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{item.itemName}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Labour Charge if non-zero */}
                {selectedBillDetail.labourCharge > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{selectedBillDetail.items.length + 1}.</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Labour & Service Charges</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>1</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{selectedBillDetail.labourCharge.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{selectedBillDetail.labourCharge.toFixed(2)}</td>
                  </tr>
                )}
                {/* Total Row */}
                <tr>
                  <td colSpan="3" style={{ border: '1px solid #000', padding: '6px 8px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{selectedBillDetail.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Note and Proprietor block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '0.8rem', maxWidth: '60%' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>Note:</strong> RR wire, Legrand Switchs , Pipe regular,</p>
                <p style={{ margin: '0' }}><strong>Payment :</strong> step by step for the wiring and Switches, On light Final</p>
              </div>
              <div style={{ textAlign: 'center', minWidth: '200px' }}>
                <strong style={{ display: 'block', textTransform: 'uppercase', marginBottom: '55px', fontSize: '0.9rem' }}>
                  PRASHANSA ELECTRICAL
                </strong>
                <span style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Proprietor
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedBillDetail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="no-print">
          {/* Top Info Banner - Contract info */}
          <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Maintenance Contract</span>
              <h3 style={{ marginTop: '5px', color: 'var(--text-main)' }}>
                {contract ? `Monthly Package` : `No Active Contract`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {contract ? `Start: ${new Date(contract.startDate).toLocaleDateString()}` : 'Please contact the owner to establish a plan'}
              </p>
            </div>
            
            {contract && (
              <>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contract Fee</span>
                  <h3 style={{ marginTop: '5px', color: 'var(--color-primary)' }}>
                    ₹{contract.monthlyPaymentAmount.toFixed(2)} / month
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Due day: {contract.monthlyPaymentDueDate}th of every month
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Coverage Status</span>
                  <div style={{ marginTop: '5px' }}>
                    <span className="badge badge-completed">
                      {contract.status}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
            {/* Submit Request Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} color="var(--color-primary)" />
                  Submit Maintenance Request
                </h3>
                <form onSubmit={handleRequestSubmit}>
                  <div className="form-group">
                    <label className="form-label">Task Description</label>
                    <textarea 
                      className="form-input"
                      rows="4"
                      placeholder="Describe the issue, e.g., 'Hall light not working', 'Replace switches in lobby', 'Check main power fluctuations'"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{ resize: 'none' }}
                      required
                    />
                  </div>
                  <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
                    Send Request
                  </button>
                </form>
              </div>

              {/* Request Logs */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--color-warning)" />
                  Request History
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {requests.length > 0 ? (
                    requests.map((req) => (
                      <div key={req.id} style={{
                        background: 'rgba(0, 0, 0, 0.02)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className={`badge ${req.status === 'PENDING' ? 'badge-pending' : 'badge-completed'}`}>
                            {req.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.9rem' }}>{req.description}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No service requests recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoices and Payments column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Material Invoices */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--color-primary)" />
                  Material Invoices (Uncovered Cost)
                </h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.length > 0 ? (
                        bills.map((b) => (
                          <tr key={b.id}>
                            <td><strong>{b.billNumber}</strong></td>
                            <td>₹{b.totalAmount.toFixed(2)}</td>
                            <td>
                              <span className={`badge ${b.status === 'PAID' ? 'badge-completed' : (b.status === 'PENDING_APPROVAL' ? 'badge-pending' : 'badge-unpaid')}`}>
                                {b.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : b.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="btn-secondary btn-small"
                                  onClick={() => setSelectedBillDetail(b)}
                                >
                                  View
                                </button>
                                {b.status === 'UNPAID' && (
                                  <button 
                                    className="btn-primary btn-small"
                                    onClick={() => handlePayBillCustomer(b.id)}
                                    style={{ background: '#047857', borderColor: '#047857', padding: '6px 10px' }}
                                  >
                                    Tick Paid
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '15px', fontSize: '0.85rem' }}>
                            No material bills generated.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments log */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="var(--color-success)" />
                  Your Payment Ledger
                </h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length > 0 ? (
                        payments.map((p) => (
                          <tr key={p.id}>
                            <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td style={{ fontSize: '0.8rem' }}>
                              {p.paymentType === 'CONTRACT_PAYMENT' ? '📅 Contract' : '🔧 Materials'}
                            </td>
                            <td>₹{p.amount.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '15px', fontSize: '0.85rem' }}>
                            No logged payments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmModal.isOpen && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid var(--card-hover-border)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>{confirmModal.title}</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '25px', lineHeight: '1.5' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{ minWidth: '100px', justifyContent: 'center' }}
              >
                NO
              </button>
              <button 
                type="button"
                className="btn-primary" 
                onClick={confirmModal.onConfirm}
                style={{ minWidth: '100px', justifyContent: 'center', background: '#111111', borderColor: '#111111' }}
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
