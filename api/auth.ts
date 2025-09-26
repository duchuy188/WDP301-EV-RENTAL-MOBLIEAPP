import api from './index';

export const register = async (data: { fullname: string; email: string; password: string }) => {
  return api.post('/api/auth/register', data);
};

export const login = async (data: { email: string; password: string }) => {
  return api.post('/api/auth/login', data);
};

export const logout = async () => {
  return api.post('/api/auth/logout');
};

export const forgotPassword = async (data: { email: string }) => {
  return api.post('/api/auth/forgot-password', data);
};
