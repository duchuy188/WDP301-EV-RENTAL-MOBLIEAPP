import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/authAPI';
import type { AuthResponse, profile } from '@/types/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  // only fullname, email, password required
}

const mapProfileToUser = (p: profile | any, emailFallback?: string): User => ({
  id: p?.id ?? '',
  name: p?.fullname ?? p?.name ?? '',
  email: p?.email ?? emailFallback ?? '',
  phone: p?.phone ?? '',
  licenseNumber: p?.licenseNumber ?? '',
  profileImage: p?.avatar ?? p?.profileImage ?? '',
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  // Real login using API
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res: AuthResponse = await authAPI.login({ email, password });

      // Normalize token/refreshToken
  const token = (res as any)?.token ?? (res as any)?.data?.token;
  const refreshToken = (res as any)?.refreshToken ?? (res as any)?.data?.refreshToken;

      // Persist token FIRST (before calling any authenticated endpoints)
      if (token) await AsyncStorage.setItem('token', token);
      if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);

      // Try to extract user profile from response
      let profileData: profile | null = null;
      if (res?.data && (res.data as any).user) {
        profileData = (res.data as any).user;
      } else if (res?.data && (res.data as any).id) {
        profileData = res.data as any;
      }

      // If we still don't have profile, try fetching it from profile endpoint
      if (!profileData && token) {
        try {
          const pRes = await authAPI.getProfile();
          if (pRes && pRes.success) profileData = pRes.data;
        } catch (e) {
          // ignore
        }
      }

      const user = mapProfileToUser(profileData ?? { email }, email);

      // Persist user
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Login with Google idToken (sent from client-side Google auth)
  googleLogin: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const res: AuthResponse = await authAPI.googleLogin(idToken);

      const token = (res as any)?.token ?? (res as any)?.data?.token;
      const refreshToken = (res as any)?.refreshToken ?? (res as any)?.data?.refreshToken;

      // Persist token FIRST (before calling any authenticated endpoints)
      if (token) await AsyncStorage.setItem('token', token);
      if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);

      // Extract profile if provided
      let profileData: profile | null = null;
      if (res?.data && (res.data as any).user) {
        profileData = (res.data as any).user;
      } else if (res?.data && (res.data as any).id) {
        profileData = res.data as any;
      }

      // If no profile returned, try to fetch profile from server (if token present)
      if (!profileData && token) {
        try {
          const pRes = await authAPI.getProfile();
          if (pRes && pRes.success) profileData = pRes.data;
        } catch (e) {
          // ignore
        }
      }

      const user = mapProfileToUser(profileData ?? { email: '' });

      // Persist user
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Register using backend API and persist tokens + user
  register: async (userData: RegisterData) => {
    set({ isLoading: true });
    try {
      // Map local RegisterData -> API RegisterRequest shape
      const payload = {
        email: userData.email,
        password: userData.password,
        fullname: userData.name,
      };

      const res: AuthResponse = await authAPI.register(payload as any);

      const token = (res as any)?.token ?? (res as any)?.data?.token;
      const refreshToken = (res as any)?.refreshToken ?? (res as any)?.data?.refreshToken;

      // Persist token FIRST (before calling any authenticated endpoints)
      if (token) await AsyncStorage.setItem('token', token);
      if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);

      // Extract profile if provided
      let profileData: profile | null = null;
      if (res?.data && (res.data as any).user) {
        profileData = (res.data as any).user;
      } else if (res?.data && (res.data as any).id) {
        profileData = res.data as any;
      }

      // If no profile in register response, try to fetch it
      if (!profileData && token) {
        try {
          const pRes = await authAPI.getProfile();
          if (pRes && pRes.success) profileData = pRes.data;
        } catch (e) {
          // ignore
        }
      }

      const user = mapProfileToUser(profileData ?? { email: userData.email }, userData.email);

      // Persist user
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
    } catch (e) {
      // ignore
    }
    set({ user: null, isAuthenticated: false });
  },

  checkAuthState: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        set({ user, isAuthenticated: true });
        return;
      }

      if (token) {
        // If token exists but no user cached, try to fetch profile
        try {
          const pRes = await authAPI.getProfile();
          if (pRes && pRes.success) {
            const user = mapProfileToUser(pRes.data);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            set({ user, isAuthenticated: true });
            return;
          }
        } catch (e) {
          // ignore and fallthrough
        }
      }
    } catch (error) {
      
    }
  },
}));