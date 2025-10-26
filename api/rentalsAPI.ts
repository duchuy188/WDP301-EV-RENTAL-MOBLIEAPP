import { RentalsData, RentalsApiResponse } from '../types/rentals';
import apiClient from './config';

export const rentalAPI = {
  // Lấy lịch sử thuê xe của user
  getRentals: async (): Promise<RentalsData> => {
    const response = await apiClient.get<RentalsApiResponse>('/rentals/user');
    return response.data.data;
  },

  // Lấy chi tiết một rental
  getRentalById: async (rentalId: string): Promise<any> => {
    const response = await apiClient.get(`/rentals/${rentalId}`);
    return response.data;
  },

  // Trả xe (customer gọi để yêu cầu trả xe)
  returnVehicle: async (rentalId: string, data: {
    customer_notes?: string;
    images?: string[];
  }): Promise<any> => {
    const response = await apiClient.post(`/rentals/${rentalId}/return`, data);
    return response.data;
  },
};