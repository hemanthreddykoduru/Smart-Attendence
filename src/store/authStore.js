import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  signUp: async (userData) => {
    set({ loading: true });
    try {
      await authAPI.register(userData);
      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  signOut: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
      set({ user, token });
      return true;
    }
    return false;
  },
}));

export default useAuthStore;