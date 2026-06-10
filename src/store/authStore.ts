import { create } from 'zustand';
import api from '../api/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImageUrl?: string;
  country?: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  adminRole: 'SUPER_ADMIN' | 'ADMIN' | 'ANALYST' | 'OPERATIONS' | 'SUPPORT' | 'READ_ONLY';
  isSuspended: boolean;
}

interface AuthState {
  user: User | null;
  adminProfile: AdminProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  adminProfile: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;

      // Save token temporarily so requests can go through
      localStorage.setItem('zap_admin_token', token);
      localStorage.setItem('zap_admin_user', JSON.stringify(user));

      try {
        const meResponse = await api.get('/admin/rbac/me');
        const { adminProfile, user: verifiedUser } = meResponse.data.data;

        set({
          user: verifiedUser,
          adminProfile,
          token,
          isLoading: false,
        });

        localStorage.setItem('zap_admin_user', JSON.stringify(verifiedUser));
        return true;
      } catch (err: any) {
        localStorage.removeItem('zap_admin_token');
        localStorage.removeItem('zap_admin_user');
        set({
          error: err.response?.data?.message || 'Access denied. You do not have admin permissions.',
          isLoading: false,
        });
        return false;
      }
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Login failed. Please check your credentials.',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zap_admin_token');
      localStorage.removeItem('zap_admin_user');
    }
    set({ user: null, adminProfile: null, token: null });
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('zap_admin_token');
    const storedUser = localStorage.getItem('zap_admin_user');

    if (!token || !storedUser) {
      set({ user: null, adminProfile: null, token: null });
      return false;
    }

    try {
      set({ token, user: JSON.parse(storedUser) });
      const meResponse = await api.get('/admin/rbac/me');
      const { adminProfile, user } = meResponse.data.data;

      set({
        user,
        adminProfile,
        token,
        isLoading: false,
      });

      localStorage.setItem('zap_admin_user', JSON.stringify(user));
      return true;
    } catch (err) {
      localStorage.removeItem('zap_admin_token');
      localStorage.removeItem('zap_admin_user');
      set({ user: null, adminProfile: null, token: null });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
