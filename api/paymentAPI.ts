import apiClient from './config';
import { VNPayPaymentRequest, VNPayPaymentResponse, PaymentVerificationResponse } from '@/types/payment';

export const paymentAPI = {
  // Tạo URL thanh toán VNPay cho holding fee
  createVNPayPayment: async (data: VNPayPaymentRequest): Promise<VNPayPaymentResponse> => {
    const response = await apiClient.post('/payments/vnpay/create', data);
    return response.data;
  },

  // Xác thực kết quả thanh toán VNPay
  verifyVNPayPayment: async (queryParams: string): Promise<PaymentVerificationResponse> => {
    const response = await apiClient.get(`/payments/vnpay/return?${queryParams}`);
    return response.data;
  },

  // Lấy thông tin thanh toán của booking
  getPaymentByBooking: async (bookingId: string) => {
    const response = await apiClient.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  // Thanh toán holding fee bằng tiền mặt tại quầy
  payCashHoldingFee: async (bookingId: string) => {
    const response = await apiClient.post(`/payments/cash/holding-fee/${bookingId}`);
    return response.data;
  }
};
