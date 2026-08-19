import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  LogOut,
  Trash2,
  Lock,
  ChevronRight,
  Shield,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Phone,
  Mail
} from 'lucide-react';

export default function OwnerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Load saved personal info from localStorage or default
  const defaultInfo = {
    name: 'Jankiram Resala Pawara',
    email: 'jankirampawara@gmail.com',
    mobile: '+919657743212'
  };

  const [personalInfo, setPersonalInfo] = useState(() => {
    const saved = localStorage.getItem('owner_personal_info');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return defaultInfo;
  });

  // Edit Personal Info Modal State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState(personalInfo);
  const [infoSuccess, setInfoSuccess] = useState('');

  // Change Password Modal State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Handlers for Personal Info
  const handleOpenEditInfo = () => {
    setEditForm(personalInfo);
    setInfoSuccess('');
    setIsEditingInfo(true);
  };

  const handleSaveInfo = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    setPersonalInfo(editForm);
    localStorage.setItem('owner_personal_info', JSON.stringify(editForm));
    setIsEditingInfo(false);
    setInfoSuccess('Personal information updated successfully!');
    setTimeout(() => setInfoSuccess(''), 4000);
  };

  // Handlers for Change Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        username: user?.username || 'admin',
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="owner-profile-container">

      {/* ── Top Bar / Header ── */}
      <div className="opp-header-title">
        <h2>Profile</h2>
      </div>

      {/* ── Avatar & Admin Info ── */}
      <div className="opp-avatar-section">
        <div className="opp-avatar-circle">
          <User size={54} color="#111111" strokeWidth={1.8} />
        </div>
        <h1 className="opp-admin-name">{user?.username?.toUpperCase() || 'ADMIN'}</h1>
        <div className="opp-badge-row">
          <span className="opp-owner-badge">
            <Shield size={13} style={{ marginRight: '4px' }} /> Owner Account
          </span>
        </div>
        <p className="opp-company-name">Prashansa Electrical Services</p>
      </div>

      {/* ── Divider ── */}
      <hr className="opp-divider" />

      {/* Success Notification */}
      {infoSuccess && (
        <div className="opp-alert-success">
          <Check size={16} />
          <span>{infoSuccess}</span>
        </div>
      )}

      {/* ── ACCOUNT SECTION ── */}
      <div className="opp-account-wrapper">
        <h3 className="opp-section-heading">ACCOUNT</h3>

        {/* 👤 Personal Information Card */}
        <div className="opp-card opp-personal-info-card">
          <div className="opp-card-header">
            <div className="opp-card-title-group">
              <div className="opp-icon-badge">
                <User size={18} />
              </div>
              <span className="opp-card-title">Personal Information</span>
            </div>
            <button
              type="button"
              className="opp-edit-btn"
              onClick={handleOpenEditInfo}
              title="Edit Personal Info"
            >
              <Edit2 size={14} /> Edit
            </button>
          </div>

          <div className="opp-info-body">
            <div className="opp-info-row">
              <span className="opp-info-label">Name</span>
              <span className="opp-info-value">{personalInfo.name}</span>
            </div>
            <div className="opp-info-row">
              <span className="opp-info-label">Email</span>
              <span className="opp-info-value opp-info-link">{personalInfo.email}</span>
            </div>
            <div className="opp-info-row">
              <span className="opp-info-label">Mobile No.</span>
              <span className="opp-info-value">{personalInfo.mobile}</span>
            </div>
          </div>
        </div>

        {/* 🔒 Change Password Item */}
        <button
          type="button"
          className="opp-card opp-action-card"
          onClick={() => {
            setIsChangingPassword(true);
            setPasswordError('');
            setPasswordSuccess('');
          }}
        >
          <div className="opp-card-title-group">
            <div className="opp-icon-badge opp-icon-lock">
              <Lock size={18} />
            </div>
            <span className="opp-card-title">Change Password</span>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </button>

        {/* 🗑️ Trash Module Item */}
        <button
          type="button"
          className="opp-card opp-action-card"
          onClick={() => navigate('/trash')}
        >
          <div className="opp-card-title-group">
            <div className="opp-icon-badge opp-icon-trash">
              <Trash2 size={18} />
            </div>
            <span className="opp-card-title">Trash module</span>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </button>

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

      {/* ── EDIT PERSONAL INFO MODAL ── */}
      {isEditingInfo && (
        <div className="opp-modal-overlay" onClick={() => setIsEditingInfo(false)}>
          <div className="opp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="opp-modal-header">
              <h3>Edit Personal Information</h3>
              <button
                type="button"
                className="opp-modal-close"
                onClick={() => setIsEditingInfo(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="opp-modal-form">
              <div className="opp-form-field">
                <label>Full Name</label>
                <div className="opp-input-wrapper">
                  <User size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="opp-form-field">
                <label>Email Address</label>
                <div className="opp-input-wrapper">
                  <Mail size={16} color="var(--text-muted)" />
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="opp-form-field">
                <label>Mobile Number</label>
                <div className="opp-input-wrapper">
                  <Phone size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>

              <div className="opp-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditingInfo(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#111111', borderColor: '#111111' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {isChangingPassword && (
        <div className="opp-modal-overlay" onClick={() => setIsChangingPassword(false)}>
          <div className="opp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="opp-modal-header">
              <h3>Change Password</h3>
              <button
                type="button"
                className="opp-modal-close"
                onClick={() => setIsChangingPassword(false)}
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="opp-alert-danger">
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="opp-alert-success">
                <Check size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="opp-modal-form">
              <div className="opp-form-field">
                <label>Current Password</label>
                <div className="opp-input-wrapper">
                  <Lock size={16} color="var(--text-muted)" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="opp-pw-toggle"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="opp-form-field">
                <label>New Password</label>
                <div className="opp-input-wrapper">
                  <Lock size={16} color="var(--text-muted)" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password (min. 4 chars)"
                  />
                  <button
                    type="button"
                    className="opp-pw-toggle"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="opp-form-field">
                <label>Confirm New Password</label>
                <div className="opp-input-wrapper">
                  <Lock size={16} color="var(--text-muted)" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-type new password"
                  />
                </div>
              </div>

              <div className="opp-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsChangingPassword(false)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passwordLoading}
                  style={{ background: '#111111', borderColor: '#111111' }}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

