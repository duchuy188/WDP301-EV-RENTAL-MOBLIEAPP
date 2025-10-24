import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/api/authAPI';
import { profile } from '@/types/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  profileImage?: string;
  role?: string;
  address?: string;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setUser: (user: any) => Promise<void>;
  setToken: (token: string) => Promise<void>;
}

interface RegisterData {
  fullname: string;
  email: string;
  phone?: string;
  password: string;
}

// Helper function to convert profile to User
const profileToUser = (profile: profile): User => ({
  id: profile.id,
  name: profile.fullname,
  email: profile.email,
  phone: profile.phone || '',
  profileImage: profile.avatar,
  role: profile.role,
  address: profile.address,
  isActive: profile.isActive,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  token: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Call API login
      const response = await authAPI.login({ email, password });
      
      // Lưu token vào AsyncStorage
      const token = response.token || response.data?.token;
      const userData = response.data?.user;
      
      if (token) {
        await AsyncStorage.setItem('token', token);
        set({ token });
      }
      
      if (response.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Nếu có user data trong response, lưu luôn
      if (userData) {
        const user = profileToUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        // Nếu không có, load profile sau
        await get().loadProfile();
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || error.message || 'Đăng nhập thất bại');
    }
  },

  register: async (userData: RegisterData) => {
    set({ isLoading: true });
    try {
      // Call API register - Backend chỉ tạo tài khoản, không trả token
      const response = await authAPI.register(userData);
      
      if (__DEV__) {
        console.log('[authStore] Register response:', response);
      }
      
      // Đăng ký thành công - User cần đăng nhập riêng để lấy token
      set({ isLoading: false });
      
      // Note: Backend không trả token khi đăng ký
      // User sẽ cần đăng nhập sau khi đăng ký thành công
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || error.message || 'Đăng ký thất bại');
    }
  },

  loadProfile: async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        const user = profileToUser(response.data);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      // Call API logout
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout API error:', error);
    } finally {
      // Clear local data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, token: null });
    }
  },

  checkAuthState: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        set({ user, isAuthenticated: true, token });
        
        // Optionally refresh profile from server
        try {
          await get().loadProfile();
        } catch (error) {
          console.warn('Could not refresh profile:', error);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    }
  },

  setUser: async (userData: any) => {
    try {
      const user: User = {
        id: userData.uid || userData.id || '',
        name: userData.name || userData.displayName || '',
        email: userData.email || '',
        phone: userData.phone || userData.phoneNumber || '',
        profileImage: userData.profileImage || userData.photoURL || '',
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Error setting user:', error);
    }
  },

  setToken: async (token: string) => {
    try {
      await AsyncStorage.setItem('token', token);
      set({ token });
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },
}));