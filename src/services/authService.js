import api from './api';

export const loginUser = async (username, password) => {
  const response = await api.post('/api/auth/login', { username, password });
  return response.data;
};

export const validateToken = async () => {
  const response = await api.get('/api/auth/validate');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/api/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/api/auth/reset-password', { token, newPassword });
  return response.data;
};
