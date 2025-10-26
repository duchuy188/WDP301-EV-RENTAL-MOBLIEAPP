// Tọa độ trung tâm các quận/huyện TP.HCM
export const DISTRICT_COORDINATES: { [key: string]: { latitude: number; longitude: number } } = {
  // TP.HCM
  'Quận 1': { latitude: 10.7756, longitude: 106.7008 },
  'Quận 2': { latitude: 10.7896, longitude: 106.7442 },
  'Quận 3': { latitude: 10.7866, longitude: 106.6782 },
  'Quận 4': { latitude: 10.7609, longitude: 106.7029 },
  'Quận 5': { latitude: 10.7558, longitude: 106.6633 },
  'Quận 6': { latitude: 10.7482, longitude: 106.6343 },
  'Quận 7': { latitude: 10.7333, longitude: 106.7198 },
  'Quận 8': { latitude: 10.7347, longitude: 106.6739 },
  'Quận 9': { latitude: 10.8503, longitude: 106.7891 },
  'Quận 10': { latitude: 10.7731, longitude: 106.6691 },
  'Quận 11': { latitude: 10.7631, longitude: 106.6508 },
  'Quận 12': { latitude: 10.8635, longitude: 106.6509 },
  'Thủ Đức': { latitude: 10.8505, longitude: 106.7717 },
  'Bình Thạnh': { latitude: 10.8034, longitude: 106.7104 },
  'Tân Bình': { latitude: 10.7994, longitude: 106.6530 },
  'Tân Phú': { latitude: 10.7868, longitude: 106.6295 },
  'Phú Nhuận': { latitude: 10.7983, longitude: 106.6833 },
  'Gò Vấp': { latitude: 10.8376, longitude: 106.6759 },
  
  // Bình Dương
  'Bình Dương': { latitude: 10.9804, longitude: 106.6519 },
  'Thủ Dầu Một': { latitude: 10.9804, longitude: 106.6519 },
  'Dĩ An': { latitude: 10.9063, longitude: 106.7652 },
  'Thuận An': { latitude: 10.8963, longitude: 106.7139 },
};

export const getDistrictCoordinates = (district?: string, city?: string): { latitude: number; longitude: number } | null => {
  if (!district) return null;
  
  // Normalize district name
  const normalizedDistrict = district.trim();
  
  // Try exact match first
  if (DISTRICT_COORDINATES[normalizedDistrict]) {
    return DISTRICT_COORDINATES[normalizedDistrict];
  }
  
  // Try fuzzy match
  const districtKey = Object.keys(DISTRICT_COORDINATES).find(key => 
    normalizedDistrict.includes(key) || key.includes(normalizedDistrict)
  );
  
  if (districtKey) {
    return DISTRICT_COORDINATES[districtKey];
  }
  
  // Default TP.HCM center if in TP.HCM
  if (city?.includes('TP.HCM') || city?.includes('Hồ Chí Minh')) {
    return { latitude: 10.7756, longitude: 106.7008 }; // Quận 1
  }
  
  return null;
};



