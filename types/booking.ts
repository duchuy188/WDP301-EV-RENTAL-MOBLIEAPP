// Gửi yêu cầu đặt xe
export interface BookingRequest {
    brand: string;
    model: string;
    vehicle_id?: string; 
    color: string;
    station_id: string;
    start_date: string;      // yyyy-mm-dd
    end_date: string;        // yyyy-mm-dd
    pickup_time: string;     // HH:mm
    return_time: string;     // HH:mm
    special_requests?: string;
    notes?: string;
    reason_for_change?: string;  // Lý do thay đổi khi edit booking
  }
  
// Vehicle info embedded trong booking
export interface BookingVehicle {
  _id: string;
  license_plate: string;
  name: string;
  brand: string;
  model: string;
  color: string;
  images?: string[];
  deposit_percentage?: number; // % đặt cọc của xe
}
  
  // Station info embedded trong booking
  export interface BookingStation {
    _id: string;
    name: string;
    address: string;
    phone: string;
  }
  
  // Holding Fee Info
  export interface HoldingFee {
    amount: number;
    status: 'unpaid' | 'paid';
    payment_method: 'vnpay' | 'cash' | '';
    paid_at?: string | null;
    payment_id?: string | null;
  }

  // Thông tin chi tiết booking trả về từ API
  export interface Booking {
    _id: string;
    code: string;
    user_id: string;
    vehicle_id: BookingVehicle;
    station_id: BookingStation;
    start_date: string;
    end_date: string;
    pickup_time: string;
    return_time: string;
    status: string;
    booking_type: string;
    price_per_day: number;
    total_days: number;
    total_price: number;
    deposit_amount: number;
    holding_fee?: HoldingFee;
    edit_count?: number; // Số lần đã edit (max 1)
    late_fee: number;
    damage_fee: number;
    other_fees: number;
    final_amount: number;
    special_requests?: string;
    notes?: string;
    cancellation_reason?: string ;
    cancelled_at?: string ;
    cancelled_by?: string ;
    confirmed_at?: string ;
    confirmed_by?: string ;
    qr_code?: string ;
    qr_expires_at?: string ;
    qr_used_at?: string ;
    created_by?: string ;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }
  
  // Kết quả trả về khi đặt xe thành công
  export interface BookingResponse {
    message: string;
    booking: Booking;
    requiresKYC: boolean;
    canEdit?: boolean; // Có thể edit booking này không
    canCancel?: boolean; // Có thể cancel không
  }
  
  // Alternative vehicles khi edit booking mà hết xe
  export interface AlternativeVehicle {
    _id: string;
    brand: string;
    model: string;
    color: string;
    price_per_day: number;
    images?: string[];
    available_count: number;
  }
  
  // Response khi update booking
  export interface UpdateBookingResponse {
    message: string;
    booking: Booking;
    alternativeVehicles?: AlternativeVehicle[]; // Nếu hết xe gốc
  }
  
  export interface BookingPagination {
    current: number;
    total: number;
    count: number;
    totalRecords: number;
  }
  
  export interface BookingListResponse {
    message: string;
    bookings: Booking[];
    pagination: BookingPagination;
    totalSpent?: number;
    totalCompleted?: number;
  }