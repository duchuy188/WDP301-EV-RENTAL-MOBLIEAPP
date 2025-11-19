import apiClient from './config';
import { 
  CreateReportRequest, 
  CreateReportResponse, 
  ReportListResponse,
  ReportDetailResponse
} from '@/types/reports';

export const reportsAPI = {
  /**
   * Tạo báo cáo sự cố mới (USER)
   * POST /api/reports
   */
  createReport: async (data: CreateReportRequest): Promise<CreateReportResponse> => {
    const response = await apiClient.post<CreateReportResponse>('/reports', data);
    return response.data;
  },

  /**
   * Lấy danh sách báo cáo sự cố của user hiện tại
   * GET /api/reports/my-reports
   */
  getUserReports: async (params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'resolved';
  }): Promise<ReportListResponse> => {
    const response = await apiClient.get<ReportListResponse>('/reports/my-reports', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết một báo cáo sự cố
   * GET /api/reports/:id
   */
  getReportById: async (reportId: string): Promise<ReportDetailResponse> => {
    const response = await apiClient.get<ReportDetailResponse>(`/reports/${reportId}`);
    return response.data;
  },

  /**
   * Lấy danh sách báo cáo theo rental_id
   * GET /api/reports/rental/:rentalId
   */
  getReportsByRental: async (rentalId: string): Promise<ReportListResponse> => {
    const response = await apiClient.get<ReportListResponse>(`/reports/rental/${rentalId}`);
    return response.data;
  },

  /**
   * Xóa báo cáo (chỉ khi status = pending)
   * DELETE /api/reports/:id
   */
  deleteReport: async (reportId: string) => {
    const response = await apiClient.delete(`/reports/${reportId}`);
    return response.data;
  }
};