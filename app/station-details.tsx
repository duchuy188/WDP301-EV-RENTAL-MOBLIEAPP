import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MapPin, Clock, Phone, Mail, ArrowLeft, Navigation as NavigationIcon } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { useThemeStore } from '@/store/themeStore';
import { stationAPI } from '@/api/stationAP';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { StationWithDistance } from '@/types/station';
import { VehicleListItem } from '@/types/vehicles';
import { getDistrictCoordinates } from '@/utils/districtCoordinates';

const { width } = Dimensions.get('window');

export default function StationDetailsScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const stationId = params.id as string;
  const distance = params.distance ? parseFloat(params.distance as string) : undefined;

  const [station, setStation] = useState<StationWithDistance | null>(null);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Filter states
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(5000000);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPriceValue, setMaxPriceValue] = useState<number>(5000000);

  useEffect(() => {
    loadStationDetails();
    loadVehicles();
  }, [stationId]);

  useEffect(() => {
    applyFilters();
  }, [selectedType, selectedBrand, maxPriceValue, vehicles]);

  useEffect(() => {
    if (vehicles.length > 0) {
      const highest = Math.max(...vehicles.map(v => v.price_per_day || 0));
      const lowest = Math.min(...vehicles.map(v => v.price_per_day || 0));
      const roundedMax = Math.ceil(highest / 100000) * 100000;
      setMaxPrice(roundedMax);
      setMinPrice(lowest);
      setMaxPriceValue(roundedMax);
      
      // Nếu chỉ có 1 loại xe, tự động select loại đó
      const uniqueTypes = Array.from(new Set(vehicles.map(v => v.type).filter(Boolean)));
      if (uniqueTypes.length === 1) {
        setSelectedType(uniqueTypes[0]);
      }
      
      // Nếu chỉ có 1 model xe, tự động select model đó
      const uniqueModels = Array.from(new Set(vehicles.map(v => v.model).filter(Boolean)));
      if (uniqueModels.length === 1) {
        setSelectedBrand(uniqueModels[0]);
      }
    }
  }, [vehicles]);

  const geocodeAddress = async (
    address: string, 
    district?: string, 
    city?: string
  ): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const districtCoords = getDistrictCoordinates(district, city);
      if (districtCoords) {
        return districtCoords;
      }
      
      const fullAddress = address.includes('TP.HCM') || address.includes('Việt Nam') 
        ? address 
        : `${address}, TP.HCM, Việt Nam`;
      
      const results = await Location.geocodeAsync(fullAddress);
      
      if (results && results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const loadStationDetails = async () => {
    try {
      setLoading(true);
      const response = await stationAPI.getStationById(stationId);
      let stationData = response.station;
      
      if (!stationData.latitude || !stationData.longitude) {
        const coords = await geocodeAddress(
          stationData.address || '', 
          stationData.district, 
          stationData.city
        );
        if (coords) {
          stationData = {
            ...stationData,
            latitude: coords.latitude,
            longitude: coords.longitude,
          };
        }
      }
      
      setStation({ ...stationData, distance });
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await vehiclesAPI.getVehicles({ station_id: stationId });
      const vehiclesList = response.vehicles || [];
      setVehicles(vehiclesList);
      setFilteredVehicles(vehiclesList);
    } catch (error) {
      
      setVehicles([]);
      setFilteredVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    if (selectedType !== 'all') {
      filtered = filtered.filter(v => v.type?.toLowerCase() === selectedType.toLowerCase());
    }

    filtered = filtered.filter(v => {
      const price = v.price_per_day || 0;
      return price >= 0 && price <= maxPriceValue;
    });

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(v => v.model?.toLowerCase() === selectedBrand.toLowerCase());
    }

    setFilteredVehicles(filtered);
  };

  // Mapping loại xe sang tiếng Việt
  const typeTranslations: { [key: string]: string } = {
    'scooter': 'Xe tay ga',
    'motorcycle': 'Xe mô tô',

  };

  const translateType = (type: string): string => {
    return typeTranslations[type.toLowerCase()] || type;
  };

  // Lấy unique types, models
  const uniqueTypes = Array.from(new Set(vehicles.map(v => v.type).filter(Boolean)));
  const uniqueModels = Array.from(new Set(vehicles.map(v => v.model).filter(Boolean)));
  
  // Chỉ thêm "all" nếu có từ 2 options trở lên
  const vehicleTypes = uniqueTypes.length > 1 ? ['all', ...uniqueTypes] : uniqueTypes;
  const vehicleModels = uniqueModels.length > 1 ? ['all', ...uniqueModels] : uniqueModels;

  const handleCall = () => {
    if (station?.phone) {
      Linking.openURL(`tel:${station.phone}`);
    }
  };

  const handleEmail = () => {
    if (station?.email) {
      Linking.openURL(`mailto:${station.email}`);
    }
  };

  const handleNavigate = () => {
    if (station?.latitude && station?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
      Linking.openURL(url);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!station) {
    return (
      <View style={[styles.container, { backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Không tìm thấy thông tin trạm</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {station?.name || 'Chi tiết trạm'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {station?.images && station.images.length > 0 && (
          <View style={styles.imageCarouselContainer}>
            <FlatList
              ref={flatListRef}
              data={station.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
              keyExtractor={(item, index) => `image-${index}`}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.stationImage}
                  resizeMode="cover"
                />
              )}
            />
            {station.images.length > 1 && (
              <View style={styles.paginationContainer}>
                {station.images.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>
            )}
            {station.images.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {`${currentImageIndex + 1}/${station.images.length}`}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.stationName}>{station?.name || 'Trạm xe điện'}</Text>
            {station?.distance && station.distance > 0 && (
              <View style={[styles.distanceBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.distanceBadgeText}>{`📍 ${station.distance.toFixed(1)} km`}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <MapPin size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa chỉ</Text>
              <Text style={styles.infoValue}>
                {[station?.address, station?.district, station?.city].filter(Boolean).join(', ') || 'Chưa có thông tin'}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Clock size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Giờ hoạt động</Text>
              <Text style={styles.infoValue}>
                {`${station?.opening_time || '00:00'} - ${station?.closing_time || '23:59'}`}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.infoCard} onPress={handleCall}>
            <View style={styles.iconContainer}>
              <Phone size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Liên hệ</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                {station?.phone || 'Chưa có'}
              </Text>
            </View>
          </TouchableOpacity>

          {station?.email && (
            <TouchableOpacity style={styles.infoCard} onPress={handleEmail}>
              <View style={styles.iconContainer}>
                <Mail size={24} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.primary }]}>
                  {station.email}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.vehicleStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{String(station?.available_vehicles ?? 0)}</Text>
              <Text style={styles.statLabel}>Xe có sẵn</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{String(station?.rented_vehicles ?? 0)}</Text>
              <Text style={styles.statLabel}>Đang thuê</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{String(station?.max_capacity ?? 0)}</Text>
              <Text style={styles.statLabel}>Sức chứa</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{String(station?.maintenance_vehicles ?? 0)}</Text>
              <Text style={styles.statLabel}>Đang bảo trì</Text>
            </View>
          </View>

          {station?.latitude && station?.longitude && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vị trí trên bản đồ</Text>
              <View style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: station.latitude,
                    longitude: station.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  zoomControlEnabled={true}
                  showsMyLocationButton={true}
                  showsUserLocation={true}
                >
                  <Marker
                    coordinate={{
                      latitude: station.latitude,
                      longitude: station.longitude,
                    }}
                    pinColor={colors.primary}
                  />
                </MapView>
              </View>
            </View>
          )}

          {station?.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{station.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {`Xe có sẵn (${filteredVehicles.length}/${vehicles.length})`}
            </Text>

            {vehicles.length > 0 && (
              <View style={styles.filtersContainer}>
                {vehicleTypes.length > 0 && (
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Loại xe:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {vehicleTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.filterChip,
                            selectedType === type && [styles.filterChipActive, { backgroundColor: colors.primary }]
                          ]}
                          onPress={() => setSelectedType(type)}
                        >
                          <Text style={[
                            styles.filterChipText,
                            selectedType === type && styles.filterChipTextActive
                          ]}>
                            {type === 'all' ? 'Tất cả' : translateType(type)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.filterSection}>
                  <View style={styles.priceHeader}>
                    <Text style={styles.filterLabel}>Giá thuê:</Text>
                    <Text style={[styles.priceValue, { color: colors.primary }]}>
                      {`0đ - ${formatPrice(maxPriceValue)}`}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={maxPrice}
                    value={maxPriceValue}
                    onValueChange={setMaxPriceValue}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor={colors.primary}
                    step={50000}
                  />
                  <View style={styles.priceLabels}>
                    <Text style={styles.priceLabelText}>0đ</Text>
                    <Text style={styles.priceLabelText}>{formatPrice(maxPrice)}</Text>
                  </View>
                </View>

                {vehicleModels.length > 0 && (
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Mẫu xe:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {vehicleModels.map((model) => (
                        <TouchableOpacity
                          key={model}
                          style={[
                            styles.filterChip,
                            selectedBrand === model && [styles.filterChipActive, { backgroundColor: colors.primary }]
                          ]}
                          onPress={() => setSelectedBrand(model)}
                        >
                          <Text style={[
                            styles.filterChipText,
                            selectedBrand === model && styles.filterChipTextActive
                          ]}>
                            {model === 'all' ? 'Tất cả' : model}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
            
            {loadingVehicles ? (
              <ActivityIndicator style={styles.loadingIndicator} color={colors.primary} />
            ) : filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle, index) => {
                const imageUri = vehicle?.sample_image || vehicle?.color_images?.[0]?.images?.[0] || vehicle?.images?.[0];
                const vehicleName = [vehicle?.brand, vehicle?.model].filter(Boolean).join(' ').trim() || 'Xe điện';
                return (
                  <TouchableOpacity
                    key={`${vehicle?.sample_vehicle_id}-${index}`}
                    style={styles.vehicleCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      router.push({
                        pathname: '/vehicle-details',
                        params: { id: vehicle?.sample_vehicle_id }
                      });
                    }}
                  >
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.vehicleImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.vehicleImage, styles.placeholderImage]}>
                        <Text style={styles.placeholderText}>Xe</Text>
                      </View>
                    )}
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleModel} numberOfLines={1}>
                        {vehicleName}
                      </Text>
                      <Text style={styles.vehicleSpecs}>
                        {`⚡ ${vehicle?.battery_capacity ?? 0} kWh · ${vehicle?.max_range ?? 0} km`}
                      </Text>
                      <View style={styles.vehicleFooter}>
                        <Text style={[styles.vehiclePrice, { color: colors.primary }]}>
                          {`${formatPrice(vehicle?.price_per_day ?? 0)}/ngày`}
                        </Text>
                        <Text style={styles.vehicleAvailable}>
                          {`${vehicle?.available_quantity ?? vehicle?.total_available_quantity ?? 0} xe`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : vehicles.length > 0 ? (
              <View style={styles.emptyVehicles}>
                <Text style={styles.emptyVehiclesText}>Không có xe phù hợp với bộ lọc</Text>
              </View>
            ) : (
              <View style={styles.emptyVehicles}>
                <Text style={styles.emptyVehiclesText}>Hiện tại chưa có xe nào tại trạm này</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {station?.latitude && station?.longitude && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.navigateButton, { backgroundColor: colors.primary }]}
            onPress={handleNavigate}
          >
            <NavigationIcon size={24} color="#fff" />
            <Text style={styles.navigateButtonText}>Chỉ đường đến trạm</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  imageCarouselContainer: {
    position: 'relative',
  },
  stationImage: {
    width: width,
    height: 250,
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#16A34A',
    width: 20,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  content: { padding: 20 },
  section: { marginBottom: 20 },
  stationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  distanceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  distanceBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  vehicleStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  map: { flex: 1 },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterSection: { marginBottom: 12 },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: { borderColor: 'transparent' },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: { color: '#fff' },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  priceLabelText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleImage: {
    width: 120,
    height: 100,
  },
  placeholderImage: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  vehicleInfo: {
    flex: 1,
    padding: 12,
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleSpecs: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehiclePrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  vehicleAvailable: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  emptyVehicles: {
    padding: 40,
    alignItems: 'center',
  },
  emptyVehiclesText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
