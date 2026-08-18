import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Trash, Check, Printer, AlertCircle, ShoppingCart, Edit, Download } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';
import { generateInvoicePDF } from '../../utils/generateInvoicePDF';

// ── Utility: detect mobile ──────────────────────────────────────────
const isMobile = () => window.innerWidth <= 768;

export default function ShopBilling() {
  const location = useLocation();
  const isQuotationMode = location.pathname === '/shop/quotations';

  const [billType, setBillType] = useState(isQuotationMode ? 'SHOP_QUOTATION' : 'SHOP_BILL');
  const [businessName, setBusinessName] = useState('PRASHANSHA_ELECTRICAL');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [labourCharge, setLabourCharge] = useState('0');
  const [items, setItems] = useState([
    { itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }
  ]);

  const [editingBillId, setEditingBillId] = useState(null);
  const [pastBills, setPastBills] = useState([]);
  const [activeBillDetail, setActiveBillDetail] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  // t5: loading state for history tab
  const [historyLoading, setHistoryLoading] = useState(false);

  // t4: auto-dismiss timers
  const successTimer = useRef(null);
  const errorTimer = useRef(null);

  const setSuccessWithTimer = (msg) => {
    setSuccess(msg);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 10000);
  };

  const setErrorWithTimer = (msg) => {
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(''), 10000);
  };

  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current);
    if (errorTimer.current) clearTimeout(errorTimer.current);
  }, []);

  const getBusinessNameDisplay = (bill) => {
    if (!bill) return '';
    if (bill.billType === 'SHOP_QUOTATION') return 'PRASHANSHA ELECTRICALS';
    if (bill.businessName === 'PAWARA_ELECTRICAL') return 'PAWARA ELECTRICAL';
    return 'PRASHANSHA ELECTRICAL';
  };

  useEffect(() => {
    setBillType(isQuotationMode ? 'SHOP_QUOTATION' : 'SHOP_BILL');
  }, [isQuotationMode]);

  useEffect(() => {
    if (location.state && location.state.viewBillId) {
      const loadBillFromState = async () => {
        try {
          const res = await api.get(`/api/owner/bills/${location.state.viewBillId}`);
          setActiveBillDetail(res.data);
          setActiveTab('history');
        } catch (err) {
          setErrorWithTimer('Failed to load bill detail');
        }
      };
      loadBillFromState();
    }
  }, [location.state]);

  const fetchPastBills = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/api/owner/bills');
      const shopInvoices = res.data.filter(b => b.billType === 'SHOP_BILL' || b.billType === 'SHOP_QUOTATION');
      shopInvoices.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        if (dateA.getTime() !== dateB.getTime()) return dateB.getTime() - dateA.getTime();
        return b.id - a.id;
      });
      setPastBills(shopInvoices);
    } catch (err) {
      setErrorWithTimer(err.response?.data?.message || err.message || 'Error occurred');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') fetchPastBills();
  }, [activeTab]);

  const handleAddItem = () => setItems([...items, { itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
  const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  const labourVal = parseFloat(labourCharge) || 0;
  const grandTotal = subtotal + labourVal;

  // t3: generate A4 PDF and trigger download
  const downloadBillAsPDF = (bill) => {
    generateInvoicePDF(bill, getBusinessNameDisplay(bill));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName) { setErrorWithTimer('Please provide a Customer Name'); return; }
    if (items.some(item => !item.itemName || parseFloat(item.quantity) <= 0 || parseFloat(item.unitPrice) < 0)) {
      setErrorWithTimer('Please verify all items have a valid name, quantity and price');
      return;
    }
    setError(''); setSuccess('');
    const payload = {
      billType, customerName, customerAddress, createdAt,
      labourCharge: parseFloat(labourCharge) || 0,
      status: billType === 'SHOP_QUOTATION' ? 'QUOTATION' : 'BILL',
      businessName: billType === 'SHOP_QUOTATION' ? 'PRASHANSHA_ELECTRICALS' : businessName,
      items: items.map(item => ({
        itemName: item.itemName,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        unitCost: parseFloat(item.unitCost) || 0
      }))
    };
    try {
      let res;
      if (editingBillId) {
        res = await api.put(`/api/owner/bills/${editingBillId}`, payload);
      } else {
        res = await api.post('/api/owner/bills', payload);
      }
      const savedBill = res.data;
      setSuccessWithTimer(`${billType === 'SHOP_QUOTATION' ? 'Quotation' : 'Bill'} ${editingBillId ? 'updated' : 'created'} successfully: ${savedBill.billNumber}`);

      // t3: on mobile, download directly; on desktop show preview
      if (isMobile()) {
        downloadBillAsPDF(savedBill);
        // Reset form immediately
        setCustomerName(''); setCustomerAddress('');
        setCreatedAt(new Date().toISOString().split('T')[0]);
        setLabourCharge('0');
        setItems([{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
        setEditingBillId(null);
        fetchPastBills();
      } else {
        setActiveBillDetail(savedBill);
        setCustomerName(''); setCustomerAddress('');
        setCreatedAt(new Date().toISOString().split('T')[0]);
        setLabourCharge('0');
        setItems([{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
        setEditingBillId(null);
        fetchPastBills();
      }
    } catch (err) {
      setErrorWithTimer(err.response?.data?.message || err.message || 'Error occurred');
    }
  };

  const handleConvertQuotation = async (id) => {
    try {
      const res = await api.put(`/api/owner/bills/${id}/convert`);
      const updated = res.data;
      setSuccessWithTimer(`Quotation successfully converted to Bill: ${updated.billNumber}`);
      if (activeBillDetail && activeBillDetail.id === id) setActiveBillDetail(updated);
      fetchPastBills();
    } catch (err) {
      setErrorWithTimer(err.response?.data?.message || err.message);
    }
  };

  const handleEditBill = (b) => {
    setEditingBillId(b.id);
    setBillType(b.billType);
    setBusinessName(b.businessName || 'PRASHANSHA_ELECTRICAL');
    setCustomerName(b.customerName || '');
    setCustomerAddress(b.customerAddress || '');
    setCreatedAt(b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setLabourCharge(b.labourCharge ? b.labourCharge.toString() : '0');
    setItems(b.items && b.items.length > 0
      ? b.items.map(item => ({ itemName: item.itemName, quantity: item.quantity.toString(), unitPrice: item.unitPrice.toString(), unitCost: item.unitCost ? item.unitCost.toString() : '0' }))
      : [{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
    setActiveTab('create');
  };

  const handlePrint = () => window.print();

  return (
    <div>
      {/* ── HEADER + TAB SWITCHER ── */}
      <div className="no-print shop-header-row">
        <div>
          <h1>Electrical Shop Module</h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate bills and convert quotations for Pawara Electrical Shop</p>
        </div>

        {/* t1: on mobile these render as full-width stacked buttons (via CSS) */}
        <div className="shop-tab-switcher">
          <button
            className={`shop-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => { setActiveTab('create'); setActiveBillDetail(null); }}
          >
            Create Invoice
          </button>
          <button
            className={`shop-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('history'); setActiveBillDetail(null); }}
          >
            Sales History
          </button>
        </div>
      </div>

      {/* t4: auto-dismissing alerts (10 sec) */}
      {success && (
        <div className="no-print alert-success">
          <Check size={20} /><span>{success}</span>
        </div>
      )}
      {error && (
        <div className="no-print alert-error">
          <AlertCircle size={20} /><span>{error}</span>
        </div>
      )}

      {/* ── CREATE TAB ── */}
      {activeTab === 'create' && !activeBillDetail && (
        <div className="glass-card no-print">
          {editingBillId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0 }}>
                Edit Invoice: Bill #{pastBills.find(b => b.id === editingBillId)?.billNumber}
              </h3>
              <button type="button" className="btn-secondary btn-small" onClick={() => {
                setEditingBillId(null);
                setCustomerName(''); setCustomerAddress('');
                setCreatedAt(new Date().toISOString().split('T')[0]);
                setLabourCharge('0');
                setItems([{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
              }}>Cancel Edit</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* t2: form-select styled to match system theme — see CSS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Invoice Type</label>
                <CustomSelect
                  value={billType}
                  onChange={val => setBillType(val)}
                  options={[
                    { value: 'SHOP_BILL', label: 'Direct Bill' },
                    { value: 'SHOP_QUOTATION', label: 'Quotation' }
                  ]}
                />
              </div>

              {billType === 'SHOP_BILL' && (
                <div className="form-group">
                  <label className="form-label">Bill Format / Business Name</label>
                  <CustomSelect
                    value={businessName}
                    onChange={val => setBusinessName(val)}
                    options={[
                      { value: 'PRASHANSHA_ELECTRICAL', label: 'Prashansha Electrical Bill' },
                      { value: 'PAWARA_ELECTRICAL', label: 'Pawara Electrical Bill' }
                    ]}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Customer Name (Walk-In)</label>
                <input className="form-input" type="text" placeholder="e.g. Ramesh Chandra" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Address</label>
                <input className="form-input" type="text" placeholder="e.g. Pathardi Phata, Nashik" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input className="form-input" type="date" value={createdAt} onChange={e => setCreatedAt(e.target.value)} />
              </div>
            </div>

            {/* Items */}
            <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--text-main)' }}>Bill Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {items.map((item, index) => (
                <div key={index} className="bill-item-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Item Name / Description</label>
                    <input className="form-input" type="text" placeholder="e.g. LED Bulb 12W" value={item.itemName} onChange={e => handleItemChange(index, 'itemName', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Quantity</label>
                    <input className="form-input" type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Selling Price (₹)</label>
                    <input className="form-input" type="number" placeholder="Sell Price" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      Cost Price (₹) <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)' }}>(Hidden on Print)</span>
                    </label>
                    <input className="form-input" type="number" placeholder="Cost" value={item.unitCost} onChange={e => handleItemChange(index, 'unitCost', e.target.value)} />
                  </div>
                  <button type="button" className="btn-danger btn-small" style={{ padding: '12px', display: 'flex', justifyContent: 'center', alignSelf: 'flex-end' }} onClick={() => handleRemoveItem(index)} disabled={items.length === 1}>
                    <Trash size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn-secondary" onClick={handleAddItem} style={{ marginBottom: '30px' }}>
              <Plus size={16} /> Add Item
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Labour / Installation Charges (₹)</label>
                <input className="form-input" type="number" placeholder="0.00" value={labourCharge} onChange={e => setLabourCharge(e.target.value)} />
              </div>
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Items Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Labour Charge:</span><span>₹{labourVal.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '8px', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-main)' }}><span>Grand Total:</span><span>₹{grandTotal.toFixed(2)}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-primary" type="submit">
                <ShoppingCart size={18} />
                {editingBillId ? 'Update' : 'Generate'} {billType === 'SHOP_QUOTATION' ? 'Quotation' : 'Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── BILL DETAIL / PRINT PREVIEW ── */}
      {activeBillDetail && (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '25px' }}>
            <button className="btn-secondary" onClick={() => setActiveBillDetail(null)}>← Back</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              {activeBillDetail.billType === 'SHOP_QUOTATION' && (
                <button className="btn-primary" onClick={() => handleConvertQuotation(activeBillDetail.id)} style={{ background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
                  Convert to Bill
                </button>
              )}
              <button className="btn-secondary" onClick={handlePrint}><Printer size={18} /> Print Invoice</button>
            </div>
          </div>

          <div className="print-sheet" style={{ color: '#000', background: '#fff', fontFamily: 'sans-serif', padding: '30px', lineHeight: '1.4' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <h1 style={{ color: '#e11d48', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 5px', letterSpacing: '1px' }}>{getBusinessNameDisplay(activeBillDetail)}</h1>
              <h4 style={{ color: '#000', fontSize: '0.95rem', fontWeight: 'bold', margin: '0 0 4px' }}>Electrical Wiring, Fitting Works, Supply of All Kind of Electricals Goods</h4>
              <p style={{ color: '#000', fontSize: '0.85rem', margin: '0' }}>Nashik Maharashtra-422010 Mob.:+919422761843</p>
            </div>
            <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '10px 0 15px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '55%', color: '#000' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: '24px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '8px', whiteSpace: 'nowrap' }}>To,</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', paddingBottom: '2px', fontWeight: 'bold', fontSize: '1rem' }}>{activeBillDetail.customerName || activeBillDetail.customer?.name || ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: '24px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '8px', visibility: 'hidden', whiteSpace: 'nowrap' }}>To,</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', paddingBottom: '2px', fontSize: '0.95rem' }}>{activeBillDetail.customerAddress || activeBillDetail.customer?.address || ''}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: '200px' }}>
                <div style={{ marginBottom: '6px' }}><strong>Date : </strong><span>{new Date(activeBillDetail.createdAt).toLocaleDateString('en-GB')}</span></div>
                {activeBillDetail.billType !== 'SHOP_QUOTATION' && (<div><strong>Bill no : </strong><span>{activeBillDetail.id || '80'}</span></div>)}
              </div>
            </div>
            {activeBillDetail.billType === 'SHOP_QUOTATION' && (
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h3 style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', textDecoration: 'underline', fontSize: '1.1rem' }}>QUOTATION</h3>
              </div>
            )}
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
                {activeBillDetail.items && activeBillDetail.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}.</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px' }}>{item.itemName}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
                {activeBillDetail.labourCharge > 0 && (
                  <tr>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{activeBillDetail.items.length + 1}.</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px' }}>Labour &amp; Service Charges</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>1</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{activeBillDetail.labourCharge.toFixed(2)}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{activeBillDetail.labourCharge.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan="3" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px' }}></td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{activeBillDetail.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'flex-end', color: '#000' }}>
              <div style={{ fontSize: '0.85rem', textAlign: 'left', lineHeight: '1.6' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>Bank Details :</strong>
                <div><strong>Bank Name</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Panjab National Bank</div>
                <div><strong>A/C No.</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 0849050012971</div>
                <div><strong>Branch-IFS Code</strong> : PUNB0084920</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: '220px' }}>
                <strong style={{ display: 'block', textTransform: 'uppercase', marginBottom: '50px', fontSize: '0.95rem', fontWeight: 'bold' }}>{getBusinessNameDisplay(activeBillDetail)}</strong>
                <span style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>Proprietor</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && !activeBillDetail && (
        <div className="glass-card">
          <div style={{ marginBottom: '20px' }}>
            <h3>Invoice History</h3>
          </div>

          {/* t5: show spinner while loading */}
          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '12px' }}>
              <div className="spin-loader" />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading invoices…</span>
            </div>
          ) : pastBills.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '0.9rem' }}>
              No shop bills or quotations recorded yet.
            </div>
          ) : (
            <>
              {/* t6: Desktop — table view */}
              <div className="data-table-container history-table-desktop">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bill Number</th>
                      <th>Type</th>
                      <th>Customer Name</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastBills.map(b => (
                      <tr key={b.id}>
                        <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td><strong style={{ color: 'var(--text-main)' }}>{b.billType === 'SHOP_QUOTATION' ? '-' : b.id}</strong></td>
                        <td>
                          <span className="badge" style={{ background: b.businessName === 'PAWARA_ELECTRICAL' ? 'rgba(139,92,246,0.08)' : 'rgba(225,29,72,0.08)', color: b.businessName === 'PAWARA_ELECTRICAL' ? '#4c1d95' : '#be123c', border: b.businessName === 'PAWARA_ELECTRICAL' ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(225,29,72,0.2)' }}>
                            {b.businessName === 'PAWARA_ELECTRICAL' ? 'Pawara Ele' : 'Prashansha Ele'}
                          </span>
                        </td>
                        <td>{b.customerName || 'Walk-In'}</td>
                        <td>₹{b.totalAmount.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${b.status === 'QUOTATION' ? 'badge-quotation' : b.status === 'PAID' ? 'badge-paid' : 'badge-completed'}`}>{b.status}</span>
                        </td>
                        <td className="actions-cell" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button className="btn-secondary btn-small" onClick={() => setActiveBillDetail(b)}>View &amp; Print</button>
                          <button className="btn-secondary btn-small" onClick={() => handleEditBill(b)} title="Edit Invoice" style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={14} /></button>
                          {b.billType === 'SHOP_QUOTATION' && (
                            <button className="btn-primary btn-small" onClick={() => handleConvertQuotation(b.id)} style={{ background: '#10b981' }}>Convert</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* t6: Mobile — card view */}
              <div className="history-cards-mobile">
                {pastBills.map(b => (
                  <div key={b.id} className="bill-history-card">
                    <div className="bill-card-header">
                      <div className="bill-card-title">
                        <span className="bill-card-number">
                          {b.billType === 'SHOP_QUOTATION' ? 'Quotation' : `Bill #${b.id}`}
                        </span>
                        <span className="bill-card-date">{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`badge ${b.status === 'QUOTATION' ? 'badge-quotation' : b.status === 'PAID' ? 'badge-paid' : 'badge-completed'}`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="bill-card-body">
                      <div className="bill-card-row">
                        <span className="bill-card-label">Customer</span>
                        <span className="bill-card-value">{b.customerName || 'Walk-In'}</span>
                      </div>
                      <div className="bill-card-row">
                        <span className="bill-card-label">Business</span>
                        <span className="badge" style={{ fontSize: '0.72rem', padding: '3px 8px', background: b.businessName === 'PAWARA_ELECTRICAL' ? 'rgba(139,92,246,0.1)' : 'rgba(225,29,72,0.1)', color: b.businessName === 'PAWARA_ELECTRICAL' ? '#4c1d95' : '#be123c', border: b.businessName === 'PAWARA_ELECTRICAL' ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(225,29,72,0.2)' }}>
                          {b.businessName === 'PAWARA_ELECTRICAL' ? 'Pawara Electrical' : 'Prashansha Electrical'}
                        </span>
                      </div>
                      <div className="bill-card-row">
                        <span className="bill-card-label">Total</span>
                        <span className="bill-card-amount">₹{b.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bill-card-actions">
                      <button 
                        className="btn-secondary btn-small" 
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                        onClick={() => downloadBillAsPDF(b)}
                      >
                        <Download size={15} /> Download PDF
                      </button>
                      <button 
                        className="btn-secondary btn-small" 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 14px' }} 
                        onClick={() => handleEditBill(b)} 
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      {b.billType === 'SHOP_QUOTATION' && (
                        <button 
                          className="btn-primary btn-small" 
                          style={{ flex: 1, justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }} 
                          onClick={() => handleConvertQuotation(b.id)}
                        >
                          Convert
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
