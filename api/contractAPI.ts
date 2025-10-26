import apiClient from './config';
import { ContractsApiResponse } from '../types/contracts';

// Get contracts with filters
export const getContracts = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  station_id?: string;
  search?: string;
  sort?: string;
  order?: string;
}): Promise<ContractsApiResponse> => {
  const response = await apiClient.get<ContractsApiResponse>('/contracts', {
    params,
  });
  
  return response.data;
};

// Get single contract by ID
export const getContractById = async (id: string): Promise<{ success: boolean; message: string; data: { contract: any } }> => {
  const response = await apiClient.get<{ success: boolean; message: string; data: { contract: any } }>(`/contracts/${id}`);
  return response.data;
};

// Download contract PDF
export const downloadContractPDF = async (id: string): Promise<Blob> => {
  const response = await apiClient.get<Blob>(`/contracts/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
};

// View contract online (HTML version)
export const getContractViewUrl = async (id: string): Promise<string> => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('token');
  return `${apiClient.defaults.baseURL}/contracts/${id}/view?token=${token}`;
};

// Get PDF URL (for embedding or direct view)
export const getContractPDFUrl = async (id: string): Promise<string> => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('token');
  return `${apiClient.defaults.baseURL}/contracts/${id}/pdf?token=${token}`;
};

// Get contract HTML content (for inline display)
export const getContractHtml = async (id: string): Promise<string> => {
  const response = await apiClient.get<string>(`/contracts/${id}/view`, {
    responseType: 'text',
  });
  return response.data;
};

export const contractAPI = {
  getContracts,
  getContractById,
  downloadContractPDF,
  getContractViewUrl,
  getContractPDFUrl,
  getContractHtml,
};

