
import apiClient from './config';
import { BookingListResponse, BookingRequest, BookingResponse, UpdateBookingResponse } from '@/types/booking';


export const bookingAPI = {
  postBooking: async (data: BookingRequest): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>('/bookings', data);
    return response.data;
  },
  // Lấy danh sách booking của user (có phân trang)
  getBookings: async (params?: { page?: number; limit?: number }): Promise<BookingListResponse> => {
    const response = await apiClient.get<BookingListResponse>('/bookings/user', { params });
    return response.data;
  },

  // Cancel (delete) a booking by id. Accept an optional payload (e.g. { reason })
  cancelBooking: async (id: string, payload?: { reason?: string }) => {
    const response = await apiClient.delete(`/bookings/${id}`, { 
      data: payload || { reason: 'Khách hàng yêu cầu hủy' }
    } as any);
    return response.data;
  },

  // Get detailed booking by id
  getBooking: async (id: string): Promise<BookingResponse> => {
    const response = await apiClient.get<BookingResponse>(`/bookings/${id}`);
    return response.data;
  },

  // Get user statistics (total completed, total spent)
  getUserStats: async () => {
    const response = await apiClient.get('/bookings/user/stats');
    return response.data;
  },

  // Update/Edit a booking by id
  updateBooking: async (id: string, data: Partial<BookingRequest>): Promise<UpdateBookingResponse> => {
    const response = await apiClient.put<UpdateBookingResponse>(`/bookings/${id}`, data);
    return response.data;
  },

  // Get pending bookings for current user
  getMyPendingBookings: async (): Promise<BookingListResponse> => {
    const response = await apiClient.get<BookingListResponse>('/bookings/my-pending');
    return response.data;
  },

  // Cancel a pending booking by temp_id
  cancelPendingBooking: async (tempId: string) => {
    const response = await apiClient.post(`/bookings/my-pending/${tempId}/cancel`);
    return response.data;
  },

};