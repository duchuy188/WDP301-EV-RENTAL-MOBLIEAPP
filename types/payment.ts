// VNPay Payment Request
export interface VNPayPaymentRequest {
  booking_id: string;
  amount: number;
  order_description: string;
  bank_code?: string; // Optional: Mã ngân hàng (NCB, VNPAYQR, etc.)
  language?: 'vn' | 'en'; // Default: 'vn'
}

// VNPay Payment Response
export interface VNPayPaymentResponse {
  success: boolean;
  message: string;
  payment_url: string;
  booking_id: string;
  amount: number;
}

// Payment Verification Response
export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  booking_id?: string;
  transaction_id?: string;
  amount?: number;
  payment_status?: 'paid' | 'failed' | 'pending';
  error_code?: string;
}

// Payment Info in Booking
export interface HoldingFeeInfo {
  amount: number;
  status: 'unpaid' | 'paid';
  payment_method: 'vnpay' | 'cash' | '';
  paid_at?: string | null;
  payment_id?: string | null;
}

// Payment Methods
export type PaymentMethod = 'vnpay' | 'cash';

export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}


