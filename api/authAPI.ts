import apiClient from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  profile, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  UpdateProfileRequest
} from '@/types/auth';

// Auth API functions
export const authAPI = {
  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Register
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
 refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<{ success: boolean; data: profile }> => {
    try {
      const response = await apiClient.get<any>('/auth/profile');
      
      // Kiểm tra nếu response.data là object user trực tiếp (không có success field)
      if (response.data && response.data.id) {
        return {
          success: true,
          data: response.data as profile
        };
      }
      
      // Nếu có success field thì return như bình thường
      if (response.data.success !== undefined) {
        return response.data as { success: boolean; data: profile };
      }
      
      // Fallback: nếu có data thì coi như thành công
      if (response.data) {
        return {
          success: true,
          data: response.data as profile
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      throw error;
    }
  },

  // Update profile - backend support PUT với FormData
  updateProfile: async (data: UpdateProfileRequest): Promise<{ success: boolean; message: string; data: profile }> => {
    const normalize = (payload: any) => {
      if (!payload) throw new Error('Response rỗng');
      if (payload.id && !payload.data && !payload.profile) {
        return { success: true, message: payload.message || 'OK', data: payload };
      }
      if (payload.data && payload.data.id) {
        return { success: payload.success !== false, message: payload.message || 'OK', data: payload.data };
      }
      if (payload.profile && payload.profile.id) {
        return { success: true, message: payload.message || 'OK', data: payload.profile };
      }
      throw new Error('Response không hợp lệ');
    };

    try {
      // Kiểm tra có file upload không
      const hasFileUpload = data.avatar && typeof data.avatar === 'object' && 'uri' in data.avatar;

      if (hasFileUpload) {
        // Dùng fetch API thay vì axios cho FormData upload vì axios có issue với React Native
        const imageFile = data.avatar as any;
        const formData = new FormData();
        formData.append('fullname', data.fullname || '');
        formData.append('phone', data.phone || '');
        formData.append('address', data.address || '');
        formData.append('avatar', {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.name || 'avatar.jpg',
        } as any);


        // Get token từ AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const token = await AsyncStorage.getItem('token');
        
        const response = await fetch(`${apiClient.defaults.baseURL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            // KHÔNG set Content-Type, để browser tự set với boundary
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return normalize(result);
      } else {
        // Gửi JSON khi không có file, hoặc avatar là URL string
        const payload: any = {};
        if (data.fullname !== undefined) payload.fullname = data.fullname;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.address !== undefined) payload.address = data.address;
        if (typeof data.avatar === 'string' && data.avatar) payload.avatar = data.avatar;


        const response = await apiClient.put('/auth/profile', payload);
        return normalize(response.data);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const raw = error?.response?.data;
      let message = 'Cập nhật hồ sơ thất bại';
      if (typeof raw === 'string') {
        if (!raw.startsWith('<')) message = raw;
      } else if (raw?.message) {
        message = raw.message;
      } else if (status === 500 && raw?.error) {
        message = raw.error;
      } else if (error.message && error.message.includes('Network')) {
        message = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.message) {
        message = error.message;
      }
      throw new Error(message + (status ? ` (HTTP ${status})` : ''));
    }
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      // Lấy token để gửi kèm nếu server cần
      const token = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      // Gửi request với token và refresh token nếu có
      const response = await apiClient.post('/auth/logout', {
        token,
        refreshToken
      });
      return response.data;
    } catch (error) {
      // Không throw để không làm crash logout process
      return { success: false, message: 'Logout API failed but local cleanup will continue' };
    }
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const response = await apiClient.post(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerificationEmail: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Google login
  googleLogin: async (idToken: string) => {
  
  const response = await apiClient.post('/auth/login/google', { idToken });
  return response.data;
  }
};
