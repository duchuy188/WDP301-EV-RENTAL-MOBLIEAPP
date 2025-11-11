import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';


// export const API_BASE_URL = 'http://10.0.2.2:5000/api';
export const API_BASE_URL = 'http://192.168.102.8:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000 // 60 seconds for image upload and OCR processing
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


    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error: any) => {
    const status = error.response?.status;
    const url = error.config?.url;
    

    if (status === 401) {
      // Skip redirect for login/register/forgot-password/change-password endpoints
      // (these endpoints naturally return 401 for invalid credentials)
      const isAuthEndpoint = url?.includes('/auth/login') || 
                            url?.includes('/auth/register') || 
                            url?.includes('/auth/forgot-password') ||
                            url?.includes('/auth/reset-password') ||
                            url?.includes('/auth/change-password');
      
      if (!isAuthEndpoint) {
        // Token expired or invalid - clear local auth data
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('refreshToken');
          // Navigate to login screen
          router.replace('/(auth)/login');
        } catch (e) {
          
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;