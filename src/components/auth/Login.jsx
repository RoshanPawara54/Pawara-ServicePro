import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Mail, Lock, Sparkles, Loader } from 'lucide-react';

export default function Login() {
  const { login, forgotPassword } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your username or email');
      return;
    }
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    try {
      const data = await forgotPassword(forgotEmail);
      setForgotSuccess(data.message || 'Password reset requested successfully!');
    } catch (err) {
      setForgotError(err.message || 'Failed to request password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            marginBottom: '15px'
          }}>
            <Sparkles size={28} color="#8b5cf6" />
          </div>
          <h2>Pawara ServicePro</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>
            Unified Management & Customer Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '40px' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '25px' }}>
            <button
              type="button"
              onClick={() => {
                setForgotEmail('');
                setForgotError('');
                setForgotSuccess('');
                setShowForgotModal(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}
            >
              Forgot password?
            </button>
          </div>

          <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <Loader size={20} className="spin" /> : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          <div>Default Admin: <strong>admin</strong> / <strong>123</strong></div>
          <div style={{ marginTop: '4px' }}>Customer Demo: <strong>saihospital</strong> / <strong>123</strong></div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '30px' }}>
            <h3 style={{ marginBottom: '10px' }}>Reset Your Password</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Enter your account username or registered email address.
            </p>

            {forgotError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '15px'
              }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '15px'
              }}>
                {forgotSuccess}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgotEmail">Username or Email</label>
                <input
                  id="forgotEmail"
                  className="form-input"
                  type="text"
                  placeholder="e.g. saihospital or admin"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={forgotLoading}
                />
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '20px'
              }}>
                <span style={{ fontWeight: '600', color: 'var(--color-warning)', display: 'block', marginBottom: '5px' }}>
                  ℹ️ recovery note:
                </span>
                For offline recovery, please reach out directly to the business Owner to request a password override.
                In development mode, checking the backend console output prints the reset URL.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={() => setShowForgotModal(false)}
                  disabled={forgotLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-small"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <Loader size={16} className="spin" /> : 'Get Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
