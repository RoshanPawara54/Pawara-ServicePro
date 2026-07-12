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
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>Aggregating business revenue reports...</div>;
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Revenue Category Breakdown */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>
            Revenue Sources
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
              <div>
                <strong>Electrical Shop Sales</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Direct counter invoices</p>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>₹{data?.totalShopRevenue.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
              <div>
                <strong>Maintenance Service Contracts</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Monthly recurring payments</p>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>₹{data?.totalContractRevenue.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
              <div>
                <strong>Maintenance Material Bills</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Additional items not covered by contract</p>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>₹{data?.totalMaterialBillRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>
            Monthly Analytics
          </h3>
          <div className="data-table-container">
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
        </div>
      </div>
    </div>
  );
}
