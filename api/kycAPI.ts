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
  
  if (__DEV__) {
    console.log(`📤 Uploading image to ${endpoint}:`, {
      uri: imageFile.uri,
      name: imageFile.name,
      type: imageFile.type,
    });
  }
  
  try {
    const resp = await axiosInstance.post<T>(endpoint, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (__DEV__) {
      console.log(`✅ Upload to ${endpoint} succeeded:`, resp.data);
    }
    
    return resp.data;
  } catch (err: any) {
    if (__DEV__) {
      console.error(`❌ Upload to ${endpoint} failed:`, {
        status: err?.response?.status,
        message: err?.response?.data?.message || err.message,
        data: err?.response?.data,
      });
    }
    throw new Error(err?.response?.data?.message || err.message || 'Upload failed');
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

// Submit CCCD verification
export interface CCCDSubmitData {
  frontImage: string;
  backImage: string;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
}

export const submitCCCD = async (data: CCCDSubmitData): Promise<any> => {
  const form = new FormData();
  
  // Add front image
  form.append('frontImage', {
    uri: data.frontImage,
    name: 'cccd_front.jpg',
    type: 'image/jpeg',
  } as any);
  
  // Add back image
  form.append('backImage', {
    uri: data.backImage,
    name: 'cccd_back.jpg',
    type: 'image/jpeg',
  } as any);
  
  // Add other fields
  form.append('idNumber', data.idNumber);
  form.append('fullName', data.fullName);
  form.append('dateOfBirth', data.dateOfBirth);
  
  const response = await axiosInstance.post('/kyc/identity-card', form);
  return response.data;
};

// Submit GPLX verification
export interface GPLXSubmitData {
  frontImage: string;
  backImage: string;
  licenseNumber: string;
  fullName: string;
  dateOfBirth: string;
}

export const submitGPLX = async (data: GPLXSubmitData): Promise<any> => {
  const form = new FormData();
  
  // Add front image
  form.append('frontImage', {
    uri: data.frontImage,
    name: 'gplx_front.jpg',
    type: 'image/jpeg',
  } as any);
  
  // Add back image
  form.append('backImage', {
    uri: data.backImage,
    name: 'gplx_back.jpg',
    type: 'image/jpeg',
  } as any);
  
  // Add other fields
  form.append('licenseNumber', data.licenseNumber);
  form.append('fullName', data.fullName);
  form.append('dateOfBirth', data.dateOfBirth);
  
  const response = await axiosInstance.post('/kyc/driver-license', form);
  return response.data;
};

// Export as kycAPI object
export const kycAPI = {
  uploadIdentityCardFront,
  uploadIdentityCardBack,
  uploadLicenseFront,
  uploadLicenseBack,
  getIdentityCard,
  getDriverLicense,
  getKYCStatus,
  submitCCCD,
  submitGPLX,
};