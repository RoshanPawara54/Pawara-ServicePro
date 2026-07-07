import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  UserPlus, 
  FileText, 
  Trash2, 
  Plus, 
  Calendar, 
  AlertCircle, 
  Check, 
  CreditCard,
  KeyRound,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';

export default function CustomerManagement() {
  const { apiFetch } = useAuth();

  // List states
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected customer profile details
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [contract, setContract] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [customerType, setCustomerType] = useState('Hospital'); // default type
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  
  // Contract form fields
  const [hasContract, setHasContract] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState('5000');
  const [monthlyPaymentDueDate, setMonthlyPaymentDueDate] = useState('5');

  // Modal / reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordVal, setResetPasswordVal] = useState('123');
  const [credentials, setCredentials] = useState(null);

  // Record payment form states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('CONTRACT_PAYMENT');
  const [paymentAmount, setPaymentAmount] = useState('5000');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReferenceId, setPaymentReferenceId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Create material bill states
  const [showMaterialBillModal, setShowMaterialBillModal] = useState(false);
  const [selectedRequestForBill, setSelectedRequestForBill] = useState(null);
  const [labourCharge, setLabourCharge] = useState('200');
  const [billItems, setBillItems] = useState([
    { itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }
  ]);

  const fetchCustomers = async () => {
    try {
      const res = await apiFetch('http://localhost:8080/api/owner/customers');
      if (!res.ok) throw new Error('Failed to load customers list');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSelectCustomer = async (id) => {
    setSelectedCustomerId(id);
    try {
      // 1. Fetch profile details
      const profileRes = await apiFetch(`http://localhost:8080/api/owner/customers/${id}`);
      if (!profileRes.ok) throw new Error('Failed to load customer profile details');
      const profileData = await profileRes.json();
      setProfile(profileData);

      // 2. Fetch contract details
      const contractRes = await apiFetch(`http://localhost:8080/api/owner/customers/${id}/contract`);
      if (contractRes.ok) {
        const contractData = await contractRes.json();
        setContract(contractData);
        setPaymentAmount(contractData.monthlyPaymentAmount.toString());
      } else {
        setContract(null);
        setPaymentAmount('0');
      }

      // 3. Fetch credentials (username)
      const credsRes = await apiFetch(`http://localhost:8080/api/owner/customers/${id}/credentials`);
      if (credsRes.ok) {
        setCredentials(await credsRes.json());
      } else {
        setCredentials(null);
      }

      // 4. Fetch requests
      const reqsRes = await apiFetch(`http://localhost:8080/api/owner/requests`);
      if (reqsRes.ok) {
        const reqsData = await reqsRes.json();
        // filter by customerId
        setRequests(reqsData.filter(r => r.customer?.id === id));
      }

      // 5. Fetch bills
      const billsRes = await apiFetch(`http://localhost:8080/api/owner/bills`);
      if (billsRes.ok) {
        const billsData = await billsRes.json();
        // filter by customerId
        setBills(billsData.filter(b => b.customer?.id === id));
      }

      // 6. Fetch payments
      const paymentsRes = await apiFetch(`http://localhost:8080/api/owner/customers/${id}/payments`);
      if (paymentsRes.ok) {
        setPayments(await paymentsRes.json());
      }

    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Please enter a Customer Name');
      return;
    }

    setError('');
    setSuccess('');

    const payload = {
      name,
      customerType,
      contactPerson,
      phone,
      email,
      address,
      contract: hasContract ? {
        startDate,
        endDate,
        monthlyPaymentAmount: parseFloat(monthlyPaymentAmount) || 0,
        monthlyPaymentDueDate: parseInt(monthlyPaymentDueDate) || 5
      } : null
    };

    try {
      const res = await apiFetch('http://localhost:8080/api/owner/customers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create customer');
      const data = await res.json();
      
      setSuccess(`Customer created successfully! Generated username: "${data.generatedUsername}" (Password: "123")`);
      setShowAddForm(false);
      
      // Reset fields
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`http://localhost:8080/api/owner/customers/${selectedCustomerId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: resetPasswordVal })
      });
      if (!res.ok) throw new Error('Failed to reset password');
      
      setSuccess(`Password updated successfully to "${resetPasswordVal}"`);
      setShowResetModal(false);
      setResetPasswordVal('123');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`http://localhost:8080/api/owner/customers/${selectedCustomerId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          paymentType,
          amount: parseFloat(paymentAmount) || 0,
          paymentDate,
          referenceId: paymentReferenceId ? parseInt(paymentReferenceId) : null,
          notes: paymentNotes
        })
      });

      if (!res.ok) throw new Error('Failed to log payment');
      
      setSuccess('Payment logged successfully!');
      setShowPaymentModal(false);
      
      // Reset payment fields
      setPaymentNotes('');
      setPaymentReferenceId('');

      // Refresh view
      handleSelectCustomer(selectedCustomerId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteRequestDirect = async (reqId) => {
    try {
      const res = await apiFetch(`http://localhost:8080/api/owner/requests/${reqId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      if (!res.ok) throw new Error('Failed to update request status');
      
      setSuccess('Request marked as completed successfully!');
      handleSelectCustomer(selectedCustomerId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateMaterialBill = async (e) => {
    e.preventDefault();
    if (billItems.some(item => !item.itemName || parseFloat(item.quantity) <= 0 || parseFloat(item.unitPrice) < 0)) {
      setError('Please check all bill items have valid descriptions, quantities, and prices');
      return;
    }

    try {
      const res = await apiFetch('http://localhost:8080/api/owner/bills', {
        method: 'POST',
        body: JSON.stringify({
          billType: 'MAINTENANCE_MATERIAL_BILL',
          customerId: selectedCustomerId,
          maintenanceRequestId: selectedRequestForBill.id,
          labourCharge: parseFloat(labourCharge) || 0,
          status: 'UNPAID', // Customer views and pays later
          items: billItems.map(item => ({
            itemName: item.itemName,
            quantity: parseFloat(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            unitCost: parseFloat(item.unitCost) || 0
          }))
        })
      });

      if (!res.ok) throw new Error('Failed to generate material bill');
      const generatedBill = await res.json();
      
      setSuccess(`Material Bill generated successfully: ${generatedBill.billNumber}. Request marked as completed.`);
      setShowMaterialBillModal(false);
      setSelectedRequestForBill(null);
      setBillItems([{ itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }]);
      
      handleSelectCustomer(selectedCustomerId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...billItems];
    updated[index][field] = value;
    setBillItems(updated);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Maintenance Customers Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure details, contracts, bills, and payments for Prashansa Electrical Services</p>
        </div>
        {!selectedCustomerId && !showAddForm && (
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <UserPlus size={18} /> Add Customer
          </button>
        )}
        {selectedCustomerId && (
          <button className="btn-secondary" onClick={() => setSelectedCustomerId(null)}>
            ← Back to Directory
          </button>
        )}
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
          <Check size={20} />
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
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Customer Add Form */}
      {showAddForm && (
        <div className="glass-card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Register New Maintenance Customer</h3>
          <form onSubmit={handleAddCustomer}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              <div className="form-group">
                <label className="form-label">Customer Name (e.g. Hospital Name)</label>
                <input className="form-input" type="text" placeholder="e.g. Tirupati Hospital" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Type</label>
                <select className="form-select" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                  <option value="Hospital">Hospital</option>
                  <option value="School">School</option>
                  <option value="Factory">Factory</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input className="form-input" type="text" placeholder="Contact Name" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="text" placeholder="+91 xxxxx xxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="client@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Address</label>
                <input className="form-input" type="text" placeholder="Full street address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>

            {/* Contract inclusion toggle */}
            <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="contractToggle" checked={hasContract} onChange={(e) => setHasContract(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
              <label htmlFor="contractToggle" style={{ fontWeight: '500', cursor: 'pointer' }}>Create monthly maintenance contract immediately</label>
            </div>

            {hasContract && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
                <h4 style={{ marginBottom: '15px', color: 'var(--color-primary)' }}>Monthly Maintenance Contract Settings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Contract Start Date</label>
                    <input className="form-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract End Date</label>
                    <input className="form-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Contract Payment Amount (₹)</label>
                    <input className="form-input" type="number" value={monthlyPaymentAmount} onChange={(e) => setMonthlyPaymentAmount(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Due Date (Day of Month: 1-31)</label>
                    <input className="form-input" type="number" min="1" max="31" value={monthlyPaymentDueDate} onChange={(e) => setMonthlyPaymentDueDate(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Register Customer</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Customer Profile Details View */}
      {selectedCustomerId && profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Header Card */}
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span className="badge badge-quotation" style={{ marginBottom: '8px' }}>
                {profile.customerType} Type
              </span>
              <h2>{profile.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Contact Person: <strong>{profile.contactPerson || 'N/A'}</strong> | Phone: {profile.phone || 'N/A'} | Email: {profile.email || 'N/A'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Address: {profile.address || 'N/A'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              {credentials && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Portal Login: <strong style={{ color: '#fff' }}>{credentials.username}</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary btn-small" onClick={() => setShowResetModal(true)}>
                  <KeyRound size={14} /> Reset Pass
                </button>
                <button className="btn-primary btn-small" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard size={14} /> Record Payment
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
            {/* Contract Info & Payments logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Contract Card */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '15px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  Contract Status
                </h3>
                {contract ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start Date:</span>
                        <p style={{ fontWeight: '500' }}>{new Date(contract.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>End Date:</span>
                        <p style={{ fontWeight: '500' }}>{new Date(contract.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly Payment:</span>
                        <p style={{ fontWeight: '600', color: 'var(--color-primary)' }}>₹{contract.monthlyPaymentAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly Due Date:</span>
                        <p style={{ fontWeight: '500' }}>Day {contract.monthlyPaymentDueDate} of month</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem' }}>Contract Status:</span>
                      <span className={`badge ${contract.status === 'ACTIVE' ? 'badge-completed' : 'badge-unpaid'}`}>
                        {contract.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No active contract associated with this customer.
                  </div>
                )}
              </div>

              {/* Payments History Card */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '15px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  Recent Payments Log
                </h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Notes</th>
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
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.notes || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '15px' }}>
                            No logged payments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Maintenance Requests Card */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '15px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                Maintenance Requests & Action
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <div key={req.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '10px',
                      padding: '15px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className={`badge ${req.status === 'PENDING' ? 'badge-pending' : 'badge-completed'}`}>
                          {req.status}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#fff' }}>{req.description}</p>
                      
                      {req.status === 'PENDING' && (
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-secondary btn-small"
                            onClick={() => handleCompleteRequestDirect(req.id)}
                          >
                            <CheckSquare size={14} /> Mark Done
                          </button>
                          <button 
                            className="btn-primary btn-small"
                            onClick={() => {
                              setSelectedRequestForBill(req);
                              setShowMaterialBillModal(true);
                            }}
                          >
                            Generate Material Bill
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No maintenance requests submitted.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bills List Card */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '15px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              Material Bills Generated
            </h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice No</th>
                    <th>Amount</th>
                    <th>Labour Charge</th>
                    <th>Material Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length > 0 ? (
                    bills.map((b) => (
                      <tr key={b.id}>
                        <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                        <td><strong>{b.billNumber}</strong></td>
                        <td>₹{b.totalAmount.toFixed(2)}</td>
                        <td>₹{b.labourCharge.toFixed(2)}</td>
                        <td>₹{b.materialCost.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${b.status === 'PAID' ? 'badge-paid' : 'badge-unpaid'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '15px' }}>
                        No material bills generated.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Customer Directory / Grid */}
      {!selectedCustomerId && !showAddForm && (
        <div className="glass-card">
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                className="form-input" 
                type="text" 
                placeholder="Search customers by name or contact person..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Extensible Type</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        <strong style={{ color: '#fff' }}>{cust.name}</strong>
                      </td>
                      <td>
                        <span className="badge badge-quotation">{cust.customerType}</span>
                      </td>
                      <td>{cust.contactPerson || '-'}</td>
                      <td>{cust.phone || '-'}</td>
                      <td>{cust.email || '-'}</td>
                      <td className="actions-cell">
                        <button className="btn-primary btn-small" onClick={() => handleSelectCustomer(cust.id)}>
                          Open Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No customers found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {showResetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '15px' }}>Reset Client Password</h3>
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Specify New Password</label>
                <input className="form-input" type="text" value={resetPasswordVal} onChange={(e) => setResetPasswordVal(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-secondary btn-small" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary btn-small">Override Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
            <h3 style={{ marginBottom: '15px' }}>Record Customer Payment</h3>
            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">Payment Category</label>
                <select className="form-select" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                  <option value="CONTRACT_PAYMENT">Monthly Contract Payment</option>
                  <option value="MATERIAL_BILL_PAYMENT">Material Bill Payment</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input className="form-input" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
              </div>
              {paymentType === 'MATERIAL_BILL_PAYMENT' && (
                <div className="form-group">
                  <label className="form-label">Bill ID Reference (Optional)</label>
                  <input className="form-input" type="number" placeholder="Enter Bill ID" value={paymentReferenceId} onChange={(e) => setPaymentReferenceId(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" type="text" placeholder="e.g. Cash payment / Check No. 1204" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-secondary btn-small" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary btn-small">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Material Bill Modal */}
      {showMaterialBillModal && selectedRequestForBill && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '10px' }}>Generate Material Bill</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Creating invoice for maintenance task: <strong>"{selectedRequestForBill.description}"</strong>
            </p>

            <form onSubmit={handleCreateMaterialBill}>
              {/* Dynamic items input */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Materials Detail</h4>
                <button type="button" className="btn-secondary btn-small" onClick={() => setBillItems([...billItems, { itemName: '', quantity: '1', unitPrice: '0', unitCost: '0' }])}>
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {billItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                    <div>
                      <input className="form-input" type="text" placeholder="Material Name" value={item.itemName} onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)} required />
                    </div>
                    <div>
                      <input className="form-input" type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} required />
                    </div>
                    <div>
                      <input className="form-input" type="number" placeholder="Sell (₹)" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} required />
                    </div>
                    <div>
                      <input className="form-input" type="number" placeholder="Cost (₹)" value={item.unitCost} onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)} />
                    </div>
                    <button type="button" className="btn-danger btn-small" style={{ padding: '12px' }} onClick={() => setBillItems(billItems.filter((_, i) => i !== idx))} disabled={billItems.length === 1}>
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Labour Charge (₹)</label>
                <input className="form-input" type="number" value={labourCharge} onChange={(e) => setLabourCharge(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowMaterialBillModal(false); setSelectedRequestForBill(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
