import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Check, AlertTriangle, Loader, ShieldAlert } from 'lucide-react';

export default function ResetPassword() {
  const { validateResetToken, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [tokenChecking, setTokenChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (!queryToken || !queryToken.trim()) {
      setTokenChecking(false);
      setTokenValid(false);
      setError('Password reset token is missing or invalid.');
      return;
    }

    const trimmedToken = queryToken.trim();
    setToken(trimmedToken);

    // Pre-validate token with backend
    const checkToken = async () => {
      try {
        const result = await validateResetToken(trimmedToken);
        if (result && result.valid) {
          setTokenValid(true);
          setError('');
        } else {
          setTokenValid(false);
          setError('This password reset link is invalid or has expired.');
        }
      } catch (err) {
        setTokenValid(false);
        setError('Unable to verify reset link. It may be invalid or expired.');
      } finally {
        setTokenChecking(false);
      }
    };

    checkToken();
  }, [searchParams]);

  // Auto-dismiss transient errors after 10 seconds (only if token itself is valid)
  useEffect(() => {
    if (error && tokenValid) {
      const timer = setTimeout(() => setError(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [error, tokenValid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Reset token is missing.');
      return;
    }
    if (!newPassword || newPassword.trim().length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess('Your password has been successfully reset! You can now sign in.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
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
            background: tokenValid ? 'rgba(139, 92, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${tokenValid ? 'rgba(139, 92, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            marginBottom: '15px'
          }}>
            {tokenChecking ? (
              <Loader size={28} className="spin" color="#8b5cf6" />
            ) : tokenValid ? (
              <Lock size={28} color="#8b5cf6" />
            ) : (
              <ShieldAlert size={28} color="#ef4444" />
            )}
          </div>
          <h2>Reset Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>
            {tokenChecking
              ? 'Verifying password reset link...'
              : tokenValid
                ? 'Choose a secure new password for your account (minimum 8 characters).'
                : 'Invalid or expired password reset link.'}
          </p>
        </div>

        {/* Loading state during token validation */}
        {tokenChecking && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Loader size={32} className="spin" style={{ margin: '0 auto 15px', display: 'block', color: 'var(--primary-color)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Validating reset token security...</p>
          </div>
        )}

        {/* Invalid / Expired Token State */}
        {!tokenChecking && !tokenValid && (
          <div>
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              marginBottom: '25px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={24} />
              <span>{error || 'This password reset link is invalid or has expired.'}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Password reset links expire after 1 hour and can only be used once.
              </span>
            </div>

            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Success State */}
        {!tokenChecking && tokenValid && success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '20px',
            borderRadius: '8px',
            fontSize: '0.95rem',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
              <Check size={24} />
              <strong>Success!</strong>
            </div>
            <p style={{ margin: '0 0 15px 0' }}>{success}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Reset Password Form (Only visible when token is valid and not yet successful) */}
        {!tokenChecking && tokenValid && !success && (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                marginBottom: '20px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                className="form-input"
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                className="form-input"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button
              className="btn-primary"
              type="submit"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <Loader size={20} className="spin" /> : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                width: '100%',
                marginTop: '15px',
                textAlign: 'center'
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
