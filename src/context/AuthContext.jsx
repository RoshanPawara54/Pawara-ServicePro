import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, validateToken, forgotPassword as apiForgotPassword, resetPassword as apiResetPassword } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await validateToken();
        setUser({
          token,
          role: data.role,
          username: data.username,
          customerId: data.customerId || null,
          customerName: data.customerName || null,
          customerStatus: data.customerStatus || null,
        });
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('customerId');
        localStorage.removeItem('customerName');
        localStorage.removeItem('customerStatus');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (username, password) => {
    const data = await loginUser(username, password);

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', data.username);
    if (data.customerId) {
      localStorage.setItem('customerId', data.customerId);
      localStorage.setItem('customerName', data.customerName);
      localStorage.setItem('customerStatus', data.customerStatus || 'ACTIVE');
    }

    const userData = {
      token: data.token,
      role: data.role,
      username: data.username,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      customerStatus: data.customerStatus || null,
    };

    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('customerId');
    localStorage.removeItem('customerName');
    setUser(null);
  };

  const forgotPassword = async (email) => {
    return await apiForgotPassword(email);
  };

  const resetPassword = async (token, newPassword) => {
    return await apiResetPassword(token, newPassword);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
