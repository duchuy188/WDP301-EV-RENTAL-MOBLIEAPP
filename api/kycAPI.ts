import { KYCIdentityResponse, KYCIdentityCardResponse } from '@/types/kyc';
import axiosInstance from './config';
import type { KYCLicenseFrontResponse, KYCLicenseBackResponse, KYCStatusResponse } from '@/types/kyc';

// Interface for mobile file upload
export interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

// Generic helper to POST an image file as multipart/form-data under key 'image'
const postFile = async <T>(endpoint: string, imageFile: ImageFile): Promise<T> => {
  const form = new FormData();
  form.append('image', {
    uri: imageFile.uri,
    name: imageFile.name,
    type: imageFile.type,
  } as any);
  
  try {
    const resp = await axiosInstance.post<T>(endpoint, form);
    return resp.data;
  } catch (err: any) {
    console.error(`Upload to ${endpoint} failed:`, err?.response?.data || err.message);
    throw err;
  }
};

export const uploadIdentityCardFront = async (imageFile: ImageFile): Promise<KYCIdentityResponse> => {
  return postFile<KYCIdentityResponse>('/kyc/identity-card/front', imageFile);
};

export const uploadIdentityCardBack = async (imageFile: ImageFile): Promise<KYCIdentityCardResponse> => {
  return postFile<KYCIdentityCardResponse>('/kyc/identity-card/back', imageFile);
};

export const uploadLicenseFront = async (imageFile: ImageFile): Promise<KYCLicenseFrontResponse> => {
  return postFile<KYCLicenseFrontResponse>('/kyc/license/front', imageFile);
};

export const uploadLicenseBack = async (imageFile: ImageFile): Promise<KYCLicenseBackResponse> => {
  return postFile<KYCLicenseBackResponse>('/kyc/license/back', imageFile);
};

export const getIdentityCard = async (): Promise<KYCIdentityResponse> => {
const response = await axiosInstance.get<KYCIdentityResponse>('/kyc/identity-card');
return response.data;
  
};

export const getDriverLicense = async (): Promise<KYCLicenseFrontResponse> => {
  const response = await axiosInstance.get<KYCLicenseFrontResponse>('/kyc/driver-license');
  return response.data;
};


export const getKYCStatus = async (): Promise<KYCStatusResponse> => {
  const response = await axiosInstance.get<KYCStatusResponse>('/kyc/status');
  return response.data;
};
