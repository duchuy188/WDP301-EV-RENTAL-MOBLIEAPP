import api from './index';

export const getVehicles = async () => {
  return api.get('/api/vehicles');
};