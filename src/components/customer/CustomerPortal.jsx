import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { generateInvoicePDF } from '../../utils/generateInvoicePDF';
import {
  FileText,
  Send,
  Clock,
  CreditCard,
  Check,
  Printer,
  AlertCircle,
  TrendingUp,
  User,
  Home,
  LogOut,
  Download,
  Shield,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export default function CustomerPortal() {
  const { user, logout } = useAuth();

  // Mobile tab: 'home' | 'bills' | 'profile'
  const [mobileTab, setMobileTab] = useState('home');

  // Billing sub-tab: 'invoices' | 'ledger'
  const [billingSubTab, setBillingSubTab] = useState('invoices');

  const [contract, setContract] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);

  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBillDetail, setSelectedBillDetail] = useState(null);

  const getBusinessNameDisplay = (bill) => {
    if (!bill) return 'PRASHANSHA ELECTRICAL';
    if (bill.billType === 'SHOP_QUOTATION') return 'PRASHANSHA ELECTRICALS';
    if (bill.businessName === 'PAWARA_ELECTRICAL') return 'PAWARA ELECTRICAL';
    return 'PRASHANSHA ELECTRICAL';
  };

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', message: '', onConfirm: null
  });

  const showCustomConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true, title, message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const fetchCustomerData = async () => {
    try {
      try {
        const contractRes = await api.get('/api/customer/contract');
        setContract(contractRes.data);
      } catch { setContract(null); }

      try {
        const profileRes = await api.get('/api/customer/profile');
        setCustomerProfile(profileRes.data);
      } catch { setCustomerProfile(null); }

      const reqsRes = await api.get('/api/customer/requests');
      const reqList = reqsRes.data || [];
      reqList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0));
      setRequests(reqList);

      const billsRes = await api.get('/api/customer/bills');
      const billList = billsRes.data || [];
      billList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0));
      setBills(billList);

      const paymentsRes = await api.get('/api/customer/payments');
      const paymentList = paymentsRes.data || [];
      paymentList.sort((a, b) => new Date(b.paymentDate || b.createdAt || 0) - new Date(a.paymentDate || a.createdAt || 0) || (b.id || 0) - (a.id || 0));
      setPayments(paymentList);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomerData(); }, []);

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

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the electrical maintenance work required.');
      return;
    }
    setError(''); setSuccess('');
    try {
      await api.post('/api/customer/requests', { description });
      setSuccess('Maintenance request submitted successfully!');
      setDescription('');
      fetchCustomerData();
    } catch (err) { setError(err.response?.data?.message || err.message); }
  };

  const handlePayBillCustomer = (billId) => {
    showCustomConfirm(
      'Are you sure you want to mark this material invoice as paid?',
      'This will submit the invoice to the admin for verification and approval.',
      async () => {
        setError(''); setSuccess('');
        try {
          await api.put(`/api/customer/bills/${billId}/pay`);
          setSuccess('Invoice marked as paid successfully! Waiting for admin approval.');
          fetchCustomerData();
        } catch (err) { setError(err.response?.data?.message || err.message); }
      }
    );
  };

  const handleDownloadBillPDF = async (billId, billFallback) => {
    try {
      const res = await api.get(`/api/customer/bills/${billId}`);
      const fullBill = res.data;
      const businessDisplay = getBusinessNameDisplay(fullBill);
      generateInvoicePDF(fullBill, businessDisplay);
    } catch (err) {
      if (billFallback) {
        const businessDisplay = getBusinessNameDisplay(billFallback);
        generateInvoicePDF(billFallback, businessDisplay);
      } else {
        setError('Failed to download invoice PDF');
      }
    }
  };

  const handlePrint = () => window.print();

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
      {/* ── MOBILE STICKY TOP BAR: Module Name ── */}
      <div className="mobile-sticky-page-header no-print">
        <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {mobileTab === 'bills' ? 'Billing' : (mobileTab === 'profile' ? 'Profile' : 'Client Service Portal')}
        </h1>
      </div>
      <div className="mobile-sticky-spacer no-print" />

      {/* Desktop Header */}
      <div className="desktop-header-only no-print" style={{ marginBottom: '30px' }}>
        <h1 className="portal-title">Client Service Portal</h1>
      </div>

      {/* Global alerts (visible on all tabs) */}
      {success && (
        <div className="no-print" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '12px 20px', borderRadius: '10px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Check size={20} /><span>{success}</span>
        </div>
      )}
      {error && (
        <div className="no-print" style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', padding: '12px 20px', borderRadius: '10px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} /><span>{error}</span>
        </div>
      )}

      {/* ── BILL PRINT VIEW ── */}
      {selectedBillDetail && (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '30px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '25px' }}>
            <button className="btn-secondary" onClick={() => setSelectedBillDetail(null)}>← Back to Portal</button>
            <button className="btn-secondary" onClick={handlePrint}><Printer size={18} /> Print Invoice</button>
          </div>

          <div className="print-sheet" style={{ color: '#000', background: '#fff', fontFamily: 'sans-serif', padding: '30px', lineHeight: '1.4' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <h1 style={{ color: '#e11d48', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 5px 0', letterSpacing: '1px' }}>
                {getBusinessNameDisplay(selectedBillDetail)}
              </h1>
              <h4 style={{ color: '#000', fontSize: '0.95rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                Electrical Wiring, Fitting Works, Supply of All Kind of Electricals Goods
              </h4>
              <p style={{ color: '#000', fontSize: '0.85rem', margin: '0' }}>
                Nashik Maharashtra-422010 Mob.:+919422761843
              </p>
            </div>
            <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '10px 0 15px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '55%', color: '#000' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: '24px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '8px', whiteSpace: 'nowrap' }}>To,</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', paddingBottom: '2px', fontWeight: 'bold', fontSize: '1rem' }}>
                    {selectedBillDetail.customerName || selectedBillDetail.customer?.name || user?.customerName || user?.username}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: '24px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '8px', visibility: 'hidden', whiteSpace: 'nowrap' }}>To,</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', paddingBottom: '2px', fontSize: '0.95rem' }}>
                    {selectedBillDetail.customerAddress || selectedBillDetail.customer?.address || 'Nashik'}
                  </div>
                </div>
              </div>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', marginBottom: '20px', color: '#000' }}>
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
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}.</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px' }}>{item.itemName}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
                {selectedBillDetail.labourCharge > 0 && (
                  <tr>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{selectedBillDetail.items.length + 1}.</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px' }}>Labour &amp; Service Charges</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>1</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{selectedBillDetail.labourCharge.toFixed(2)}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{selectedBillDetail.labourCharge.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan="3" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px' }}></td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{selectedBillDetail.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'flex-end', color: '#000' }}>
              <div style={{ fontSize: '0.85rem', textAlign: 'left', lineHeight: '1.6' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>Bank Details :</strong>
                <div><strong>Bank Name</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Panjab National Bank</div>
                <div><strong>A/C No.</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 0849050012971</div>
                <div><strong>Branch-IFS Code</strong> : PUNB0084920</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: '220px' }}>
                <strong style={{ display: 'block', textTransform: 'uppercase', marginBottom: '50px', fontSize: '0.95rem', fontWeight: 'bold' }}>
                  {getBusinessNameDisplay(selectedBillDetail)}
                </strong>
                <span style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Proprietor
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN PORTAL CONTENT ── */}
      {!selectedBillDetail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="no-print">

          {/* Contract Info Banner
              Desktop: always visible
              Mobile: hidden here — shown in the Profile tab instead */}
          <div
            className="customer-contract-banner glass-card"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Maintenance Contract</span>
              <h3 style={{ marginTop: '5px', color: 'var(--text-main)' }}>
                {contract ? 'Monthly Package' : 'No Active Contract'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {contract
                  ? `Start: ${new Date(contract.startDate).toLocaleDateString()}`
                  : 'Please contact the owner to establish a plan'}
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
                    {user?.customerStatus === 'INACTIVE' ? (
                      <span className="badge badge-pending" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        Inactive
                      </span>
                    ) : (
                      <span className="badge badge-completed">{contract.status}</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── 2-COLUMN GRID (Desktop) / TAB SECTIONS (Mobile) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>

            {/* LEFT COLUMN — Home tab on mobile */}
            <div
              className={`customer-home-section ${mobileTab === 'home' ? 'tab-active' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}
            >
              {/* Submit Maintenance Request */}
              <div className="glass-card">
                {user?.customerStatus === 'INACTIVE' ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <AlertCircle size={40} color="var(--color-danger)" style={{ marginBottom: '15px' }} />
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Account Inactive</h3>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.6' }}>
                      Your account is Inactive. Please Contact Prashansha Electrical Services.
                    </p>
                  </div>
                ) : (
                  <>
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
                          onChange={e => setDescription(e.target.value)}
                          style={{ resize: 'none' }}
                          required
                        />
                      </div>
                      <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
                        Send Request
                      </button>
                    </form>
                  </>
                )}
              </div>

              {/* Request History */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--color-warning)" /> Request History
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {requests.length > 0 ? (
                    requests.map(req => (
                      <div key={req.id} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', padding: '12px' }}>
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

            {/* RIGHT COLUMN — Billing tab on mobile / right column on desktop */}
            <div
              className={`customer-bills-section ${mobileTab === 'bills' ? 'tab-active' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* ── BILLING SUB-TAB SWITCHER (Material Invoices & Payment Ledger) ── */}
              <div className="shop-tab-switcher customer-billing-tab-switcher">
                <button
                  type="button"
                  className={`shop-tab-btn ${billingSubTab === 'invoices' ? 'active' : ''}`}
                  onClick={() => setBillingSubTab('invoices')}
                >
                  Material Invoices
                </button>
                <button
                  type="button"
                  className={`shop-tab-btn ${billingSubTab === 'ledger' ? 'active' : ''}`}
                  onClick={() => setBillingSubTab('ledger')}
                >
                  Payment Ledger
                </button>
              </div>

              {/* Material Invoices Sub-tab */}
              {billingSubTab === 'invoices' && (
                <div className="glass-card">
                  <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="var(--color-primary)" /> Material Invoices (Uncovered Cost)
                  </h3>

                  {/* Desktop Table View */}
                  <div className="data-table-container customer-bills-table-desktop">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice No</th><th>Amount</th><th>Status</th><th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bills.length > 0 ? bills.map(b => (
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
                                <button className="btn-secondary btn-small" onClick={() => setSelectedBillDetail(b)}>View</button>
                                <button className="btn-secondary btn-small" onClick={() => handleDownloadBillPDF(b.id, b)}>
                                  <Download size={14} /> PDF
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
                        )) : (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '15px', fontSize: '0.85rem' }}>
                              No material bills generated.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cart View */}
                  <div className="customer-bills-cards-mobile">
                    {bills.length > 0 ? (
                      bills.map(b => (
                        <div key={b.id} className="cust-bill-card">
                          <div className="cust-bill-card-header">
                            <strong className="cust-bill-card-number">{b.billNumber}</strong>
                            <span className={`badge ${b.status === 'PAID' ? 'badge-completed' : (b.status === 'PENDING_APPROVAL' ? 'badge-pending' : 'badge-unpaid')}`}>
                              {b.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : b.status}
                            </span>
                          </div>
                          <div className="cust-bill-card-body">
                            <div className="cust-bill-card-row">
                              <span className="cust-bill-card-label">Invoice Date</span>
                              <span className="cust-bill-card-val">{new Date(b.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="cust-bill-card-row">
                              <span className="cust-bill-card-label">Total Amount</span>
                              <span className="cust-bill-card-amount">₹{b.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="cust-bill-card-actions">
                            <button
                              className="btn-secondary btn-small cust-bill-card-btn"
                              onClick={() => handleDownloadBillPDF(b.id, b)}
                            >
                              <Download size={14} /> Download
                            </button>
                            {b.status === 'UNPAID' && (
                              <button
                                className="btn-primary btn-small cust-bill-card-btn"
                                onClick={() => handlePayBillCustomer(b.id)}
                                style={{ background: '#047857', borderColor: '#047857', color: '#fff' }}
                              >
                                Tick Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '25px 15px', fontSize: '0.9rem' }}>
                        No material bills generated.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Ledger Sub-tab */}
              {billingSubTab === 'ledger' && (
                <div className="glass-card">
                  <h3 style={{ marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={18} color="var(--color-success)" /> Your Payment Ledger
                  </h3>

                  {/* Desktop Table View */}
                  <div className="data-table-container payment-ledger-table-desktop">
                    <table className="data-table">
                      <thead>
                        <tr><th>Date</th><th>Type</th><th>Amount</th></tr>
                      </thead>
                      <tbody>
                        {payments.length > 0 ? (
                          payments.map(p => (
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

                  {/* Mobile Activity History Style Cards */}
                  <div className="payment-ledger-cards-mobile">
                    {payments.length > 0 ? (
                      payments.map(p => (
                        <div key={p.id} className="ledger-card">
                          <div className="ledger-card-top">
                            <span className="ledger-card-date">{new Date(p.paymentDate).toLocaleString()}</span>
                            <span className="badge badge-quotation">
                              {p.paymentType === 'CONTRACT_PAYMENT' ? 'Contract' : 'Material'}
                            </span>
                          </div>
                          <div className="ledger-card-content">
                            <strong className="ledger-card-title">
                              {p.paymentType === 'CONTRACT_PAYMENT' ? 'Maintenance Contract Payment' : 'Material Bill Payment'}
                            </strong>
                            <span className="ledger-card-amount">₹{p.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '25px 15px', fontSize: '0.9rem' }}>
                        No logged payments found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── PROFILE TAB (mobile-only, styled exactly like Admin Profile) ── */}
          <div className={`customer-profile-section ${mobileTab === 'profile' ? 'tab-active' : ''}`}>
            <div className="owner-profile-container" style={{ width: '100%', padding: '0 4px 20px' }}>

              {/* ── Avatar & Client Info ── */}
              <div className="opp-avatar-section">
                <div className="opp-avatar-circle">
                  <User size={50} color="#111111" strokeWidth={1.8} />
                </div>
                <h1 className="opp-admin-name">
                  {(customerProfile?.name || user?.customerName || user?.username || 'CLIENT').toUpperCase()}
                </h1>
                <div className="opp-badge-row">
                  <span className="opp-owner-badge">
                    <Shield size={13} style={{ marginRight: '4px' }} /> Client Account
                  </span>
                </div>
                <p className="opp-company-name">Prashansa Electrical Services</p>
              </div>

              {/* ── Divider ── */}
              <hr className="opp-divider" />

              {/* ── ACCOUNT SECTION ── */}
              <div className="opp-account-wrapper">
                <h3 className="opp-section-heading">ACCOUNT</h3>

                {/* 👤 Contact Details Card (No Edit Button) */}
                <div className="opp-card opp-personal-info-card">
                  <div className="opp-card-header">
                    <div className="opp-card-title-group">
                      <div className="opp-icon-badge">
                        <User size={18} />
                      </div>
                      <span className="opp-card-title">Contact Information</span>
                    </div>
                  </div>

                  <div className="opp-info-body">
                    <div className="opp-info-row">
                      <span className="opp-info-label">Contact Person</span>
                      <span className="opp-info-value">
                        {customerProfile?.contactPerson || customerProfile?.name || user?.customerName || user?.username || '—'}
                      </span>
                    </div>
                    <div className="opp-info-row">
                      <span className="opp-info-label">Portal Username</span>
                      <span className="opp-info-value">
                        {user?.username || '—'}
                      </span>
                    </div>
                    <div className="opp-info-row">
                      <span className="opp-info-label">Email</span>
                      <span className="opp-info-value opp-info-link">
                        {customerProfile?.email || '—'}
                      </span>
                    </div>
                    <div className="opp-info-row">
                      <span className="opp-info-label">Mobile No.</span>
                      <span className="opp-info-value">
                        {customerProfile?.phone || '—'}
                      </span>
                    </div>
                    {customerProfile?.address && (
                      <div className="opp-info-row">
                        <span className="opp-info-label">Address</span>
                        <span className="opp-info-value">
                          {customerProfile.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 📄 Contract Summary Card */}
                {contract && (
                  <div className="opp-card opp-personal-info-card">
                    <div className="opp-card-header">
                      <div className="opp-card-title-group">
                        <div className="opp-icon-badge">
                          <TrendingUp size={18} />
                        </div>
                        <span className="opp-card-title">Maintenance Contract</span>
                      </div>
                      <span className={`badge ${user?.customerStatus === 'INACTIVE' ? 'badge-unpaid' : 'badge-completed'}`}>
                        {user?.customerStatus === 'INACTIVE' ? 'INACTIVE' : contract.status}
                      </span>
                    </div>

                    <div className="opp-info-body">
                      <div className="opp-info-row">
                        <span className="opp-info-label">Monthly Package Fee</span>
                        <span className="opp-info-value" style={{ color: 'var(--color-primary)' }}>
                          ₹{contract.monthlyPaymentAmount.toFixed(2)} / month
                        </span>
                      </div>
                      <div className="opp-info-row">
                        <span className="opp-info-label">Monthly Payment Due Date</span>
                        <span className="opp-info-value">
                          {contract.monthlyPaymentDueDate}th of each month
                        </span>
                      </div>
                      <div className="opp-info-row">
                        <span className="opp-info-label">Contract Start Date</span>
                        <span className="opp-info-value">
                          {new Date(contract.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🚪 Log Out Button */}
                <button
                  type="button"
                  className="opp-logout-action-btn"
                  onClick={logout}
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ── CONFIRM MODAL ── */}
      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid var(--card-hover-border)', margin: '0 20px' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>{confirmModal.title}</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '25px', lineHeight: '1.5' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button type="button" className="btn-secondary" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} style={{ minWidth: '100px', justifyContent: 'center' }}>NO</button>
              <button type="button" className="btn-primary" onClick={confirmModal.onConfirm} style={{ minWidth: '100px', justifyContent: 'center', background: '#111111', borderColor: '#111111' }}>YES</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER MOBILE FOOTER (3 tabs) ── */}
      <nav className="customer-mobile-footer no-print">
        <button
          className={`mobile-footer-tab ${mobileTab === 'home' ? 'active' : ''}`}
          onClick={() => setMobileTab('home')}
        >
          <Home size={22} />
          <span>Home</span>
        </button>
        <button
          className={`mobile-footer-tab ${mobileTab === 'bills' ? 'active' : ''}`}
          onClick={() => setMobileTab('bills')}
        >
          <FileText size={22} />
          <span>Billing</span>
        </button>
        <button
          className={`mobile-footer-tab ${mobileTab === 'profile' ? 'active' : ''}`}
          onClick={() => setMobileTab('profile')}
        >
          <User size={22} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

