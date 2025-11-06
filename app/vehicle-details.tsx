import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Battery, Gauge, Calendar, Zap, MapPin, DollarSign, CheckCircle2, Car, Palette, ChevronRight } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { Vehicle } from '@/types/vehicles';

const { width } = Dimensions.get('window');

export default function VehicleDetailsScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  useEffect(() => {
    loadVehicleDetails();
  }, [vehicleId]);

  const loadVehicleDetails = async () => {
    try {
      setLoading(true);
      const data = await vehiclesAPI.getVehicleById(vehicleId);
      setVehicle(data);
      console.log('Vehicle details:', data);
    } catch (error) {
      console.error('Error loading vehicle details:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin xe');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Đang tải thông tin xe...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy thông tin xe</Text>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 16 }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const vehicleName = `${vehicle.brand} ${vehicle.model}`;
  const currentColor = vehicle.available_colors?.[selectedColorIndex];
  const displayImages = currentColor?.images && currentColor.images.length > 0 
    ? currentColor.images 
    : vehicle.images || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết xe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
        >
          {displayImages.length > 0 ? (
            displayImages.map((imageUri, index) => (
              <Image
                key={index}
                source={{ uri: imageUri }}
                style={styles.vehicleImage}
                resizeMode="cover"
              />
            ))
          ) : (
            <View style={[styles.vehicleImage, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#9CA3AF', fontSize: 18 }}>Xe điện</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.content}>
          {/* Vehicle Name & Price */}
          <View style={styles.section}>
            <Text style={styles.vehicleName}>{vehicleName}</Text>
            <Text style={styles.vehicleYear}>{vehicle.year} • {vehicle.type}</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.vehiclePrice, { color: colors.primary }]}>
                {formatPrice(currentColor?.price_per_day || vehicle.price_per_day || 0)}
              </Text>
              <Text style={styles.pricePeriod}>/ngày</Text>
            </View>
          </View>

          {/* Available Colors */}
          {vehicle.available_colors && vehicle.available_colors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Màu sắc có sẵn</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {vehicle.available_colors.map((colorOption, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorChip,
                      selectedColorIndex === index && [styles.colorChipActive, { borderColor: colors.primary }]
                    ]}
                    onPress={() => setSelectedColorIndex(index)}
                  >
                    <Text style={[
                      styles.colorChipText,
                      selectedColorIndex === index && { color: colors.primary, fontWeight: '700' }
                    ]}>
                      {colorOption.color}
                    </Text>
                    <Text style={styles.colorQuantity}>
                      {colorOption.available_quantity} xe
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            
            <View style={styles.specCard}>
              <View style={[styles.specIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Battery size={24} color={colors.primary} />
              </View>
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>Dung lượng pin</Text>
                <Text style={styles.specValue}>{vehicle.battery_capacity} kWh</Text>
              </View>
            </View>

            <View style={styles.specCard}>
              <View style={[styles.specIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Gauge size={24} color={colors.primary} />
              </View>
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>Quãng đường tối đa</Text>
                <Text style={styles.specValue}>{vehicle.max_range} km</Text>
              </View>
            </View>

            {vehicle.max_speed && (
              <View style={styles.specCard}>
                <View style={[styles.specIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Zap size={24} color={colors.primary} />
                </View>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Tốc độ tối đa</Text>
                  <Text style={styles.specValue}>{vehicle.max_speed} km/h</Text>
                </View>
              </View>
            )}

            {vehicle.power && (
              <View style={styles.specCard}>
                <View style={[styles.specIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Zap size={24} color={colors.primary} />
                </View>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Công suất</Text>
                  <Text style={styles.specValue}>{vehicle.power} W</Text>
                </View>
              </View>
            )}

            <View style={styles.specCard}>
              <View style={[styles.specIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <DollarSign size={24} color={colors.primary} />
              </View>
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>Đặt cọc</Text>
                <Text style={styles.specValue}>{vehicle.deposit_percentage}%</Text>
              </View>
            </View>
          </View>

          {/* Station Information */}
          {currentColor?.stations && currentColor.stations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trạm có xe</Text>
              {currentColor.stations.map((station, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.stationCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push({
                      pathname: '/station-details',
                      params: { id: station._id }
                    });
                  }}
                >
                  <View style={[styles.stationIconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <MapPin size={20} color={colors.primary} />
                  </View>
                  <View style={styles.stationContent}>
                    <Text style={styles.stationName}>{station.name}</Text>
                    <Text style={styles.stationAddress}>{station.address}</Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Current station info */}
          {vehicle.current_color_info?.station && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trạm đang thuê</Text>
              <View style={styles.stationCard}>
                <View style={[styles.stationIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <MapPin size={20} color={colors.primary} />
                </View>
                <View style={styles.stationContent}>
                  <Text style={styles.stationName}>{vehicle.current_color_info.station.name}</Text>
                  <Text style={styles.stationAddress}>{vehicle.current_color_info.station.address}</Text>
                  {vehicle.current_color_info.station.phone && (
                    <Text style={styles.stationPhone}>📞 {vehicle.current_color_info.station.phone}</Text>
                  )}
                  {vehicle.current_color_info.station.opening_time && vehicle.current_color_info.station.closing_time && (
                    <Text style={styles.stationHours}>
                      🕐 {vehicle.current_color_info.station.opening_time} - {vehicle.current_color_info.station.closing_time}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Vehicle Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin khác</Text>
            
            <View style={styles.infoGrid}>
              {vehicle.current_battery !== undefined && (
                <View style={[styles.infoCard, { backgroundColor: '#F0FDF4' }]}>
                  <View style={[styles.infoCardIconContainer, { backgroundColor: '#22C55E' }]}>
                    <Battery size={24} color="#fff" />
                  </View>
                  <Text style={styles.infoCardLabel}>Pin hiện tại</Text>
                  <Text style={[styles.infoCardValue, { color: '#22C55E' }]}>
                    {vehicle.current_battery}%
                  </Text>
                </View>
              )}
              
              {vehicle.technical_status && (
                <View style={[styles.infoCard, { backgroundColor: '#FEF3C7' }]}>
                  <View style={[styles.infoCardIconContainer, { backgroundColor: '#EAB308' }]}>
                    <CheckCircle2 size={24} color="#fff" />
                  </View>
                  <Text style={styles.infoCardLabel}>Tình trạng</Text>
                  <Text style={[styles.infoCardValue, { color: '#CA8A04' }]}>
                    {vehicle.technical_status === 'good' ? 'Tốt' : 
                     vehicle.technical_status === 'fair' ? 'Khá' : 
                     vehicle.technical_status}
                  </Text>
                </View>
              )}

              {vehicle.total_available !== undefined && (
                <View style={[styles.infoCard, { backgroundColor: '#EFF6FF' }]}>
                  <View style={[styles.infoCardIconContainer, { backgroundColor: '#3B82F6' }]}>
                    <Car size={24} color="#fff" />
                  </View>
                  <Text style={styles.infoCardLabel}>Xe khả dụng</Text>
                  <Text style={[styles.infoCardValue, { color: '#2563EB' }]}>
                    {vehicle.total_available} xe
                  </Text>
                </View>
              )}

              {vehicle.total_colors !== undefined && (
                <View style={[styles.infoCard, { backgroundColor: '#FCE7F3' }]}>
                  <View style={[styles.infoCardIconContainer, { backgroundColor: '#EC4899' }]}>
                    <Palette size={24} color="#fff" />
                  </View>
                  <Text style={styles.infoCardLabel}>Màu có sẵn</Text>
                  <Text style={[styles.infoCardValue, { color: '#DB2777' }]}>
                    {vehicle.total_colors} màu
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.rentButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            // Navigate to booking screen with vehicle info
            const selectedColor = vehicle.available_colors?.[selectedColorIndex];
            const stationInfo = selectedColor?.stations?.[0] || vehicle.current_color_info?.station;
            
            if (!stationInfo) {
              Alert.alert('Lỗi', 'Không tìm thấy thông tin trạm');
              return;
            }

            router.push({
              pathname: '/booking',
              params: {
                brand: vehicle.brand,
                model: vehicle.model,
                color: selectedColor?.color || vehicle.color || '',
                stationId: stationInfo._id,
                stationName: stationInfo.name,
                pricePerDay: (selectedColor?.price_per_day || vehicle.price_per_day || 0).toString(),
                depositPercentage: '50', // Always 50% for >= 3 days rental (backend business logic)
              }
            });
          }}
        >
          <Text style={styles.rentButtonText}>Thuê xe ngay</Text>
        </TouchableOpacity>
      </View>
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
  imageGallery: {
    height: 300,
  },
  vehicleImage: {
    width: width,
    height: 300,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  vehicleName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  vehiclePrice: {
    fontSize: 32,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  colorChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipActive: {
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  colorChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  colorQuantity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  specCard: {
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
  specIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  stationCard: {
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
  stationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stationContent: {
    flex: 1,
  },
  stationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  stationPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  stationHours: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoCardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  infoCardLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    textAlign: 'center',
  },
  infoCardValue: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rentButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

