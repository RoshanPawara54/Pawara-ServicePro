import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, BarChart2, TrendingUp, TrendingDown, Layers, HelpCircle, Activity } from 'lucide-react';

export default function RevenueAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRevenue = async () => {
    try {
      const res = await api.get('/api/owner/revenue');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '15px' }}>
        <div className="spin-loader" />
        <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Loading...</span>
      </div>
    );
  }

  if (error) {
    return <div className="glass-card" style={{ color: 'var(--color-danger)' }}>Error: {error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1>Revenue & Gross Profit Report</h1>
        <p style={{ color: 'var(--text-muted)' }}>Financial statement for Pawara Electrical Shop & Prashansa Electrical Services</p>
      </div>

      {/* Main Stats Row */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '35px' }}>
        
        {/* Total Revenue */}
        <div className="stat-card" style={{
          background: 'rgba(139, 92, 246, 0.05)',
          borderColor: 'rgba(139, 92, 246, 0.15)',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>TOTAL REVENUE</span>
            <TrendingUp size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-val" style={{ color: 'var(--text-main)' }}>
            ₹{data?.totalRevenue.toFixed(2)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Shop Sales + Maintenance Invoices
          </p>
        </div>

        {/* Material Cost */}
        <div className="stat-card" style={{
          background: 'rgba(244, 63, 94, 0.03)',
          borderColor: 'rgba(244, 63, 94, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>MATERIAL COST</span>
            <TrendingDown size={18} color="var(--color-danger)" />
          </div>
          <div className="stat-val" style={{ color: 'var(--text-main)' }}>
            ₹{data?.totalMaterialCost.toFixed(2)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Aggregated cost price of items
          </p>
        </div>

        {/* Gross Profit */}
        <div className="stat-card" style={{
          background: 'rgba(16, 185, 129, 0.05)',
          borderColor: 'rgba(16, 185, 129, 0.15)',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>GROSS PROFIT</span>
            <Layers size={18} color="var(--color-success)" />
          </div>
          <div className="stat-val" style={{ color: 'var(--color-success)' }}>
            ₹{data?.grossProfit.toFixed(2)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Revenue minus Material Costs
          </p>
        </div>
      </div>

      <div className="revenue-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Revenue Category Breakdown */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>
            Revenue Sources
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Electrical Shop Sales */}
            <div className="rev-source-card">
              <div className="rev-source-left">
                <span className="rev-source-badge rev-source-badge--shop">🏪 Shop</span>
                <div className="rev-source-info">
                  <strong className="rev-source-name">Electrical Shop Sales</strong>
                  <p className="rev-source-desc">Direct counter invoices</p>
                </div>
              </div>
              <span className="rev-source-amount">₹{data?.totalShopRevenue.toFixed(2)}</span>
            </div>

            {/* Maintenance Service Contracts */}
            <div className="rev-source-card">
              <div className="rev-source-left">
                <span className="rev-source-badge rev-source-badge--contract">📋 Contract</span>
                <div className="rev-source-info">
                  <strong className="rev-source-name">Maintenance Service Contracts</strong>
                  <p className="rev-source-desc">Monthly recurring payments</p>
                </div>
              </div>
              <span className="rev-source-amount">₹{data?.totalContractRevenue.toFixed(2)}</span>
            </div>

            {/* Maintenance Material Bills */}
            <div className="rev-source-card">
              <div className="rev-source-left">
                <span className="rev-source-badge rev-source-badge--material">🔧 Materials</span>
                <div className="rev-source-info">
                  <strong className="rev-source-name">Maintenance Material Bills</strong>
                  <p className="rev-source-desc">Additional items not covered by contract</p>
                </div>
              </div>
              <span className="rev-source-amount">₹{data?.totalMaterialBillRevenue.toFixed(2)}</span>
            </div>

          </div>
        </div>

        {/* Monthly Breakdown — Desktop: table, Mobile: cards */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>
            Monthly Analytics
          </h3>

          {/* Desktop Table */}
          <div className="data-table-container monthly-table-desktop">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Revenue</th>
                  <th>Cost Margin</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {data?.monthlyBreakdown && data.monthlyBreakdown.length > 0 ? (
                  data.monthlyBreakdown.map((row, idx) => (
                    <tr key={idx}>
                      <td><strong>{row.month}</strong></td>
                      <td>₹{row.revenue.toFixed(2)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>₹{row.cost.toFixed(2)}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                        ₹{row.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '15px' }}>
                      No statements found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="monthly-cards-mobile">
            {data?.monthlyBreakdown && data.monthlyBreakdown.length > 0 ? (
              data.monthlyBreakdown.map((row, idx) => (
                <div key={idx} className="monthly-card">
                  <div className="monthly-card-header">
                    <strong className="monthly-card-month">{row.month}</strong>
                    <span className="monthly-card-profit">₹{row.profit.toFixed(2)}</span>
                  </div>
                  <div className="monthly-card-body">
                    <div className="monthly-card-row">
                      <span className="monthly-card-label">Revenue</span>
                      <span className="monthly-card-val monthly-card-val--revenue">₹{row.revenue.toFixed(2)}</span>
                    </div>
                    <div className="monthly-card-row">
                      <span className="monthly-card-label">Cost Margin</span>
                      <span className="monthly-card-val monthly-card-val--cost">₹{row.cost.toFixed(2)}</span>
                    </div>
                    <div className="monthly-card-divider" />
                    <div className="monthly-card-row">
                      <span className="monthly-card-label">Net Profit</span>
                      <span className="monthly-card-val monthly-card-val--profit">₹{row.profit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '25px', fontSize: '0.9rem' }}>
                No statements found.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
