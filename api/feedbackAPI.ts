import type { Feedback, FeedbackResponse } from '@/types/feedback';
import apiClient, { API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const feedbackAPI = {
  // Create a new feedback for a rental. Accept either a JSON payload or FormData with files.
  createFeedback: async (payload?: Record<string, any> | FormData): Promise<Feedback> => {
    // If caller passed FormData (files), use fetch API instead of axios (React Native compatibility)
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      if (__DEV__) {
        console.log('[createFeedback] Uploading with FormData using fetch API');
        console.log('[createFeedback] API URL:', `${API_BASE_URL}/feedback`);
      }

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      
      if (__DEV__) {
        console.log('[createFeedback] Token:', token ? 'exists' : 'missing');
      }

      try {
        // Tạo timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
        });

        // Fetch promise
        const fetchPromise = fetch(`${API_BASE_URL}/feedback`, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            // KHÔNG set Content-Type, để browser tự set với boundary
          },
          body: payload,
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (__DEV__) {
          console.log('[createFeedback] Response status:', response.status);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (__DEV__) {
            console.error('[createFeedback] Error response:', errorData);
          }
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        if (__DEV__) {
          console.log('[createFeedback] Success:', result);
        }
        return result.data || result;
      } catch (error: any) {
        if (__DEV__) {
          console.error('[createFeedback] Fetch error:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n')[0]
          });
        }
        throw error;
      }
    }

    // Otherwise send JSON body (payload may be undefined)
    if (__DEV__) {
      console.log('[createFeedback] Sending JSON payload');
    }
    const response = await apiClient.post<Feedback>('/feedback', payload ?? {});
    return response.data;
  },

  // Get feedbacks for current customer with pagination
  getFeedbacks: async (params?: { 
    type?: string; 
    status?: string; 
    page?: number; 
    limit?: number;
  }): Promise<FeedbackResponse> => {
    const response = await apiClient.get<FeedbackResponse>('/feedback/customer', { params });
    return response.data;
  },

  // Get feedback for a specific rental
  getFeedbackByRental: async (rentalId: string): Promise<Feedback | null> => {
    try {
      if (__DEV__) {
        console.log('[getFeedbackByRental] Checking feedback for rental:', rentalId);
      }
      
      // Get all feedbacks của customer và tìm feedback cho rental này
      const response = await apiClient.get<FeedbackResponse>('/feedback/customer', {
        params: { limit: 100 } // Lấy nhiều để chắc chắn có
      });

      if (__DEV__) {
        console.log('[getFeedbackByRental] Total feedbacks:', response.data?.data?.feedbacks?.length || 0);
      }

      if (response.data?.data?.feedbacks && response.data.data.feedbacks.length > 0) {
        // Tìm feedback cho rental này
        const feedback = response.data.data.feedbacks.find((f: Feedback) => {
          const rentalIdInFeedback = typeof f.rental_id === 'string' 
            ? f.rental_id 
            : (f.rental_id as any)?._id;
          
          if (__DEV__) {
            console.log('[getFeedbackByRental] Comparing:', {
              rentalIdInFeedback,
              targetRentalId: rentalId,
              match: rentalIdInFeedback === rentalId
            });
          }
          
          return rentalIdInFeedback === rentalId;
        });

        if (__DEV__) {
          console.log('[getFeedbackByRental] Found feedback:', feedback ? 'YES' : 'NO');
        }

        return feedback || null;
      }

      if (__DEV__) {
        console.log('[getFeedbackByRental] No feedbacks found');
      }
      return null;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[getFeedbackByRental] Error:', error?.message);
      }
      // Nếu 404 (chưa có feedback) thì return null
      if (error?.response?.status === 404) {
        return null;
      }
      // Các lỗi khác cũng return null để không block UI
      return null;
    }
  }
};
 