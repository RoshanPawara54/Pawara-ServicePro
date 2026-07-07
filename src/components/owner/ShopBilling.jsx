import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash, FileText, Check, Printer, AlertCircle, ShoppingCart } from 'lucide-react';

export default function ShopBilling({ initialMode = 'bill' }) {
  const { apiFetch } = useAuth();
  
  const [billType, setBillType] = useState('SHOP_BILL'); // 'SHOP_BILL' or 'SHOP_QUOTATION'
  const [customerName, setCustomerName] = useState('');
  const [labourCharge, setLabourCharge] = useState('0');
  const [items, setItems] = useState([
    { itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }
  ]);

  // List of bills state
  const [pastBills, setPastBills] = useState([]);
  const [activeBillDetail, setActiveBillDetail] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'history'

  useEffect(() => {
    setBillType(initialMode === 'quotation' ? 'SHOP_QUOTATION' : 'SHOP_BILL');
  }, [initialMode]);

  const fetchPastBills = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/owner/bills');
      if (!res.ok) throw new Error('Failed to load past invoices');
      const data = await res.json();
      
      // Filter out maintenance material bills so we only show shop bills/quotations in the history here
      const shopInvoices = data.filter(b => b.billType === 'SHOP_BILL' || b.billType === 'SHOP_QUOTATION');
      setPastBills(shopInvoices);
    } catch (err) {
      setError(err.message || 'Error occurred');
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
      labourCharge: parseFloat(labourCharge) || 0,
      status: billType === 'SHOP_QUOTATION' ? 'QUOTATION' : 'BILL',
      items: items.map(item => ({
        itemName: item.itemName,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        unitCost: parseFloat(item.unitCost) || 0
      }))
    };

    try {
      const res = await apiFetch('http://localhost:8080/api/owner/bills', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create bill');
      const savedBill = await res.json();
      
      setSuccess(`${billType === 'SHOP_QUOTATION' ? 'Quotation' : 'Bill'} created successfully: ${savedBill.billNumber}`);
      setActiveBillDetail(savedBill);
      
      // Reset form
      setCustomerName('');
      setLabourCharge('0');
      setItems([{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
    } catch (err) {
      setError(err.message || 'Error occurred');
    }
  };

  const handleConvertQuotation = async (id) => {
    try {
      const res = await apiFetch(`http://localhost:8080/api/owner/bills/${id}/convert`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Failed to convert quotation');
      const updated = await res.json();
      
      setSuccess(`Quotation successfully converted to Bill: ${updated.billNumber}`);
      if (activeBillDetail && activeBillDetail.id === id) {
        setActiveBillDetail(updated);
      }
      fetchPastBills();
    } catch (err) {
      setError(err.message);
    }
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
          background: 'rgba(255, 255, 255, 0.05)',
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
              background: activeTab === 'create' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: activeTab === 'create' ? '#fff' : 'var(--text-muted)'
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
              background: activeTab === 'history' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: activeTab === 'history' ? '#fff' : 'var(--text-muted)'
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
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
            </div>

            {/* Items table */}
            <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: '#fff' }}>Bill Items</h3>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-primary" type="submit">
                <ShoppingCart size={18} />
                Generate {billType === 'SHOP_QUOTATION' ? 'Quotation' : 'Bill'}
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
                {activeBillDetail.billType === 'SHOP_QUOTATION' ? 'PRASHONSHA ELECTRICALS' : 'PAWARA ELECTRICALS'}
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
                Nashik Maharashtra-422010 Mob.:{activeBillDetail.billType === 'SHOP_QUOTATION' ? '9422761843' : '9422761843'}
              </p>
            </div>

            {/* Thick dividing line */}
            <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '10px 0 15px 0' }} />

            {/* Metadata (To, Date, Bill No) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start' }}>
              {/* Left side: Client To details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '55%' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '5px' }}>To,</span>
                  <span style={{ fontWeight: 'bold' }}>{activeBillDetail.customerName || activeBillDetail.customer?.name}</span>
                </div>
                <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', minHeight: '22px' }}>
                  <span style={{ fontSize: '0.9rem' }}>{activeBillDetail.customer?.address || 'Pathrdi Phata'}</span>
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
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}.</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{item.itemName}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Labour Charge if non-zero */}
                {activeBillDetail.labourCharge > 0 && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{activeBillDetail.items.length + 1}.</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Labour & Service Charges</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>1</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{activeBillDetail.labourCharge.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{activeBillDetail.labourCharge.toFixed(2)}</td>
                  </tr>
                )}
                {/* Total Row */}
                <tr>
                  <td colSpan="3" style={{ border: '1px solid #000', padding: '6px 8px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{activeBillDetail.totalAmount.toFixed(2)}</td>
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
                  {activeBillDetail.billType === 'SHOP_QUOTATION' ? 'PRASHONSHA ELECTRICALS' : 'PAWARA ELECTRICALS'}
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
                        <strong style={{ color: '#fff' }}>{b.billNumber}</strong>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: b.billType === 'SHOP_QUOTATION' ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.1)',
                          color: b.billType === 'SHOP_QUOTATION' ? '#818cf8' : '#a78bfa'
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
                      <td className="actions-cell" style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-secondary btn-small"
                          onClick={() => setActiveBillDetail(b)}
                        >
                          View & Print
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
