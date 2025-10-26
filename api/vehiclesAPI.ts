

import { VehiclesResponse, Vehicle, VehicleFilterParams } from '@/types/vehicles';
import apiClient from './config';


export const vehiclesAPI = {
  getVehicles: async (params?: VehicleFilterParams): Promise<VehiclesResponse> => {
    const response = await apiClient.get<VehiclesResponse>('/vehicles', { params });
    return response.data;
  },
  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  }
};