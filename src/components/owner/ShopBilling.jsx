import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Trash, FileText, Check, Printer, AlertCircle, ShoppingCart, Edit, Pencil } from 'lucide-react';

export default function ShopBilling() {
  const location = useLocation();
  const isQuotationMode = location.pathname === '/shop/quotations';
  
  const [billType, setBillType] = useState(isQuotationMode ? 'SHOP_QUOTATION' : 'SHOP_BILL'); // 'SHOP_BILL' or 'SHOP_QUOTATION'
  const [businessName, setBusinessName] = useState('PRASHANSHA_ELECTRICAL'); // 'PRASHANSHA_ELECTRICAL' or 'PAWARA_ELECTRICAL'
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [labourCharge, setLabourCharge] = useState('0');
  const [items, setItems] = useState([
    { itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }
  ]);

  const [editingBillId, setEditingBillId] = useState(null);

  // List of bills state
  const [pastBills, setPastBills] = useState([]);
  const [activeBillDetail, setActiveBillDetail] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'history'

  const getBusinessNameDisplay = (bill) => {
    if (!bill) return '';
    if (bill.billType === 'SHOP_QUOTATION') {
      return 'PRASHANSHA ELECTRICALS';
    }
    if (bill.businessName === 'PAWARA_ELECTRICAL') {
      return 'PAWARA ELECTRICAL';
    }
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
          setError('Failed to load bill detail');
        }
      };
      loadBillFromState();
    }
  }, [location.state]);

  const fetchPastBills = async () => {
    try {
      const res = await api.get('/api/owner/bills');
      
      // Filter out maintenance material bills so we only show shop bills/quotations in the history here
      const shopInvoices = res.data.filter(b => b.billType === 'SHOP_BILL' || b.billType === 'SHOP_QUOTATION');
      setPastBills(shopInvoices);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error occurred');
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPastBills();
    }
  }, [activeTab]);

  const handleAddItem = () => {
    setItems([...items, { itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);

  const labourVal = parseFloat(labourCharge) || 0;
  const grandTotal = subtotal + labourVal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName) {
      setError('Please provide a Customer Name');
      return;
    }
    if (items.some(item => !item.itemName || parseFloat(item.quantity) <= 0 || parseFloat(item.unitPrice) < 0)) {
      setError('Please verify all items have a valid name, quantity and price');
      return;
    }

    setError('');
    setSuccess('');

    const payload = {
      billType,
      customerName,
      customerAddress,
      createdAt,
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
      
      setSuccess(`${billType === 'SHOP_QUOTATION' ? 'Quotation' : 'Bill'} ${editingBillId ? 'updated' : 'created'} successfully: ${savedBill.billNumber}`);
      setActiveBillDetail(savedBill);
      
      // Reset form
      setCustomerName('');
      setCustomerAddress('');
      setCreatedAt(new Date().toISOString().split('T')[0]);
      setLabourCharge('0');
      setItems([{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
      setEditingBillId(null);
      
      // Refresh list
      fetchPastBills();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error occurred');
    }
  };

  const handleConvertQuotation = async (id) => {
    try {
      const res = await api.put(`/api/owner/bills/${id}/convert`);
      const updated = res.data;
      
      setSuccess(`Quotation successfully converted to Bill: ${updated.billNumber}`);
      if (activeBillDetail && activeBillDetail.id === id) {
        setActiveBillDetail(updated);
      }
      fetchPastBills();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleEditBill = (b) => {
    setEditingBillId(b.id);
    setBillType(b.billType);
    setBusinessName(b.businessName || 'PRASHANSHA_ELECTRICAL');
    setCustomerName(b.customerName || '');
    setCustomerAddress(b.customerAddress || '');
    if (b.createdAt) {
      setCreatedAt(new Date(b.createdAt).toISOString().split('T')[0]);
    } else {
      setCreatedAt(new Date().toISOString().split('T')[0]);
    }
    setLabourCharge(b.labourCharge ? b.labourCharge.toString() : '0');
    
    if (b.items && b.items.length > 0) {
      setItems(b.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        unitCost: item.unitCost ? item.unitCost.toString() : '0'
      })));
    } else {
      setItems([{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
    }
    
    setActiveTab('create');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Electrical Shop Module</h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate bills and convert quotations for Pawara Electrical Shop</p>
        </div>
        
        {/* Toggle create vs history */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '4px',
          borderRadius: '10px',
          display: 'flex',
          gap: '4px'
        }}>
          <button 
            className="nav-link" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px',
              background: activeTab === 'create' ? '#4c1d95' : 'transparent',
              color: activeTab === 'create' ? '#ffffff' : 'var(--text-muted)'
            }}
            onClick={() => { setActiveTab('create'); setActiveBillDetail(null); }}
          >
            Create Invoice
          </button>
          <button 
            className="nav-link" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px',
              background: activeTab === 'history' ? '#4c1d95' : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : 'var(--text-muted)'
            }}
            onClick={() => { setActiveTab('history'); setActiveBillDetail(null); }}
          >
            Sales History
          </button>
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

      {activeTab === 'create' && !activeBillDetail && (
        <div className="glass-card no-print">
          {editingBillId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Edit Invoice: Bill #{pastBills.find(b => b.id === editingBillId)?.billNumber}</h3>
              <button 
                type="button" 
                className="btn-secondary btn-small"
                onClick={() => {
                  setEditingBillId(null);
                  setCustomerName('');
                  setCustomerAddress('');
                  setCreatedAt(new Date().toISOString().split('T')[0]);
                  setLabourCharge('0');
                  setItems([{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
                }}
              >
                Cancel Edit
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Invoice Type</label>
                <select 
                  className="form-select"
                  value={billType} 
                  onChange={(e) => setBillType(e.target.value)}
                >
                  <option value="SHOP_BILL">Direct Bill</option>
                  <option value="SHOP_QUOTATION">Quotation</option>
                </select>
              </div>

              {billType === 'SHOP_BILL' && (
                <div className="form-group">
                  <label className="form-label">Bill Format / Business Name</label>
                  <select 
                    className="form-select"
                    value={businessName} 
                    onChange={(e) => setBusinessName(e.target.value)}
                  >
                    <option value="PRASHANSHA_ELECTRICAL">Prashansha Electrical Bill</option>
                    <option value="PAWARA_ELECTRICAL">Pawara Electrical Bill</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Customer Name (Walk-In)</label>
                <input 
                  className="form-input"
                  type="text" 
                  placeholder="e.g. Ramesh Chandra" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Address</label>
                <input 
                  className="form-input"
                  type="text" 
                  placeholder="e.g. Pathardi Phata, Nashik" 
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input 
                  className="form-input"
                  type="date" 
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                />
              </div>
            </div>

            {/* Items table */}
            <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--text-main)' }}>Bill Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {items.map((item, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: '12px',
                  alignItems: 'end'
                }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Item Name / Description</label>
                    <input 
                      className="form-input"
                      type="text" 
                      placeholder="e.g. LED Bulb 12W" 
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Quantity</label>
                    <input 
                      className="form-input"
                      type="number" 
                      placeholder="Qty" 
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Selling Price (₹)</label>
                    <input 
                      className="form-input"
                      type="number" 
                      placeholder="Sell Price" 
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      Cost Price (₹) 
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)' }}>(Hidden on Print)</span>
                    </label>
                    <input 
                      className="form-input"
                      type="number" 
                      placeholder="Cost" 
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn-danger btn-small"
                    style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleAddItem}
              style={{ marginBottom: '30px' }}
            >
              <Plus size={16} /> Add Item
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Labour / Installation Charges (₹)</label>
                <input 
                  className="form-input"
                  type="number" 
                  placeholder="0.00" 
                  value={labourCharge}
                  onChange={(e) => setLabourCharge(e.target.value)}
                />
              </div>

              {/* Total Summary */}
              <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.01)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Items Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Labour Charge:</span>
                  <span>₹{labourVal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0, 0, 0, 0.08)', paddingTop: '8px', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
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

      {/* Detail / Print Preview View */}
      {activeBillDetail && (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Action Row - Hidden when printing */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '15px', marginBottom: '25px' }}>
            <button className="btn-secondary" onClick={() => setActiveBillDetail(null)}>
              ← Back
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              {activeBillDetail.billType === 'SHOP_QUOTATION' && (
                <button 
                  className="btn-primary" 
                  onClick={() => handleConvertQuotation(activeBillDetail.id)}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                >
                  Convert to Bill
                </button>
              )}
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={18} /> Print Invoice
              </button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
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
                {getBusinessNameDisplay(activeBillDetail)}
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
                Nashik Maharashtra-422010 Mob.:+919422761843
              </p>
            </div>

            {/* Thick dividing line */}
            <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '10px 0 15px 0' }} />

            {/* Metadata (To, Date, Bill No) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start' }}>
              {/* Left side: Client To details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '55%', color: '#000' }}>
                {/* Line 1: To, [Customer Name] */}
                <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: '24px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '8px', whiteSpace: 'nowrap' }}>To,</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', paddingBottom: '2px', fontWeight: 'bold', fontSize: '1rem' }}>
                    {activeBillDetail.customerName || activeBillDetail.customer?.name || ''}
                  </div>
                </div>
                {/* Line 2: [Address] */}
                <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: '24px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '8px', visibility: 'hidden', whiteSpace: 'nowrap' }}>To,</span>
                  <div style={{ flex: 1, borderBottom: '1px solid #000', paddingBottom: '2px', fontSize: '0.95rem' }}>
                    {activeBillDetail.customerAddress || activeBillDetail.customer?.address || ''}
                  </div>
                </div>
              </div>

              {/* Right side: Date and Bill number */}
              <div style={{ textAlign: 'right', minWidth: '200px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong style={{ fontWeight: 'bold' }}>Date : </strong>
                  <span>{new Date(activeBillDetail.createdAt).toLocaleDateString('en-GB')}</span>
                </div>
                {activeBillDetail.billType !== 'SHOP_QUOTATION' && (
                  <div>
                    <strong style={{ fontWeight: 'bold' }}>Bill no : </strong>
                    <span>{activeBillDetail.id || '80'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quotation Centered Title */}
            {activeBillDetail.billType === 'SHOP_QUOTATION' && (
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h3 style={{ 
                  textTransform: 'uppercase', 
                  letterSpacing: '2px', 
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  fontSize: '1.1rem'
                }}>
                  QUOTATION
                </h3>
              </div>
            )}

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
                {activeBillDetail.items && activeBillDetail.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}.</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px' }}>{item.itemName}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Labour Charge if non-zero */}
                {activeBillDetail.labourCharge > 0 && (
                  <tr>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{activeBillDetail.items.length + 1}.</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px' }}>Labour & Service Charges</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>1</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{activeBillDetail.labourCharge.toFixed(2)}</td>
                    <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{activeBillDetail.labourCharge.toFixed(2)}</td>
                  </tr>
                )}
                {/* Total Row */}
                <tr>
                  <td colSpan="3" style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px' }}></td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '2px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{activeBillDetail.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Note, Bank Details, and Proprietor block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'flex-end', color: '#000' }}>
              {/* Left side: Bank Details */}
              <div style={{ fontSize: '0.85rem', textAlign: 'left', lineHeight: '1.6' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>Bank Details :</strong>
                <div><strong>Bank Name</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Panjab National Bank</div>
                <div><strong>A/C No.</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 0849209000000059</div>
                <div><strong>Branch-IFS Code</strong> : PUNB0084920</div>
              </div>

              {/* Right side: Proprietor signature */}
              <div style={{ textAlign: 'center', minWidth: '220px' }}>
                <strong style={{ display: 'block', textTransform: 'uppercase', marginBottom: '50px', fontSize: '0.95rem', fontWeight: 'bold' }}>
                  {getBusinessNameDisplay(activeBillDetail)}
                </strong>
                <span style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Proprietor
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && !activeBillDetail && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Invoice History</h3>
          </div>

          <div className="data-table-container">
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
                {pastBills.length > 0 ? (
                  pastBills.map((b) => (
                    <tr key={b.id}>
                      <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{b.billNumber}</strong>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: b.billType === 'SHOP_QUOTATION' ? 'rgba(99,102,241,0.08)' : 'rgba(139,92,246,0.08)',
                          color: b.billType === 'SHOP_QUOTATION' ? '#4f46e5' : '#4c1d95',
                          border: b.billType === 'SHOP_QUOTATION' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(139,92,246,0.2)'
                        }}>
                          {b.billType === 'SHOP_QUOTATION' ? 'QUOTATION' : 'BILL'}
                        </span>
                      </td>
                      <td>{b.customerName || 'Walk-In'}</td>
                      <td>₹{b.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${
                          b.status === 'QUOTATION' ? 'badge-quotation' : 
                          b.status === 'PAID' ? 'badge-paid' : 'badge-completed'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="actions-cell" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className="btn-secondary btn-small"
                          onClick={() => setActiveBillDetail(b)}
                        >
                          View & Print
                        </button>
                        <button 
                          className="btn-secondary btn-small"
                          onClick={() => handleEditBill(b)}
                          title="Edit Invoice"
                          style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit size={14} />
                        </button>
                        {b.billType === 'SHOP_QUOTATION' && (
                          <button 
                            className="btn-primary btn-small"
                            onClick={() => handleConvertQuotation(b.id)}
                            style={{ background: '#10b981' }}
                          >
                            Convert
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No shop bills or quotations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
