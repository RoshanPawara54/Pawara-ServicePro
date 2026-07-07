import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const customerId = localStorage.getItem('customerId');
    const customerName = localStorage.getItem('customerName');

    if (token && role && username) {
      setUser({ token, role, username, customerId, customerName });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username);
      if (data.customerId) {
        localStorage.setItem('customerId', data.customerId);
        localStorage.setItem('customerName', data.customerName);
      }

      const userData = {
        token: data.token,
        role: data.role,
        username: data.username,
        customerId: data.customerId || null,
        customerName: data.customerName || null
      };
      
      setUser(userData);
      return userData;
    } catch (err) {
      throw err;
    }
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
    try {
      const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request reset');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const apiFetch = async (url, options = {}) => {
    const token = user?.token || localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      // If unauthorized, logout
      logout();
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, forgotPassword, resetPassword, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
