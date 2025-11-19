// Types cho Report API

export type IssueType = 
  | 'vehicle_breakdown'  // Xe hỏng
  | 'battery_issue'      // Vấn đề pin
  | 'accident'           // Tai nạn
  | 'other';             // Khác

export type ReportStatus = 'pending' | 'resolved';

export interface CreateReportRequest {
  rental_id: string;
  issue_type: IssueType;
  description: string;
  images?: string[]; // URLs ảnh chụp sự cố
}

export interface Report {
  _id: string;
  code: string;
  rental_id: string;
  booking_id: string;
  user_id: string;
  vehicle_id: string;
  station_id: string;
  issue_type: IssueType;
  description: string;
  images: string[];
  status: ReportStatus;
  resolution_notes: string;
  resolved_at: string | null;
  resolved_by: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportResponse {
  success: boolean;
  message: string;
  data: Report;
}

export interface ReportListResponse {
  success: boolean;
  message?: string;
  data: Report[]; // API trả về array trực tiếp, không có nested object
}

export interface ReportDetailResponse {
  success: boolean;
  message: string;
  data: Report;
}