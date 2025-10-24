import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// API base URL - thay đổi URL này theo backend của bạn
// Sử dụng 10.0.2.2 cho Android Emulator (thay vì localhost)
// Sử dụng localhost cho iOS Simulator
// Sử dụng IP máy thật cho Physical Device
export const API_BASE_URL = 'http://10.0.2.2:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
    }

    // If sending FormData, ensure we don't have a manually set Content-Type
    const isFormData = (val: any): val is FormData => typeof FormData !== 'undefined' && val instanceof FormData;
    if (config.headers) {
      if (isFormData(config.data)) {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      } else {
        // For JSON payloads, set Content-Type only if not already specified
        if (!config.headers['Content-Type'] && !config.headers['content-type']) {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }

    // DEBUG: Log request in development
    if (__DEV__) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        headers: config.headers,
        data: isFormData(config.data) ? '[FormData]' : config.data,
      });
    }

    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: any) => {
    // DEBUG: Log successful response in development
    if (__DEV__) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error: any) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    // DEBUG: Log error in development
    if (__DEV__) {
      // 404 không phải là lỗi nghiêm trọng trong một số trường hợp (chatbot history, etc.)
      if (status === 404) {
        console.log('ℹ️  API Not Found (404):', {
          url,
          message: error.response?.data?.message || 'Resource not found',
        });
      } else {
        console.error('❌ API Error:', {
          status,
          url,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
        });
      }
    }

    if (status === 401) {
      // Token expired or invalid - clear local auth data
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('refreshToken');
        // Navigate to login screen
        router.replace('/(auth)/login');
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;