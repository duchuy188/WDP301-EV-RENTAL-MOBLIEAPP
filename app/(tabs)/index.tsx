import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  MapPin,
  ChevronRight,
  Map,
  List,
  Navigation,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { stationAPI } from '@/api/stationAP';
import { Station, StationWithDistance } from '@/types/station';
import { getDistrictCoordinates } from '@/utils/districtCoordinates';
import { includesIgnoreAccents } from '@/utils/textUtils';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Vị trí hiện tại');
  const [stations, setStations] = useState<StationWithDistance[]>([]);
  const [filteredStations, setFilteredStations] = useState<StationWithDistance[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [distancesCalculated, setDistancesCalculated] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadStations();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (userLocation && stations.length > 0 && !distancesCalculated) {
      
      calculateDistances();
    }
  }, [userLocation, stations.length]);

  useEffect(() => {
    filterStations();
  }, [searchText, stations]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location);
        
        
        
        // Lấy địa chỉ từ tọa độ
        try {
          const address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (address[0]) {
            // Hiển thị thành phố hoặc quận/huyện
            const locationText = address[0].city || address[0].district || address[0].subregion || 'Vị trí hiện tại';
            setSelectedLocation(locationText);
          }
        } catch (error) {
          
          setSelectedLocation('Vị trí hiện tại');
        }
      } else {
        
      }
    } catch (error) {
      
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula để tính khoảng cách giữa 2 điểm trên Trái đất
    const R = 6371; // Bán kính Trái đất (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDistances = () => {
    if (!userLocation) {
      
      return;
    }

    
    

    const stationsWithDistance = stations.map((station) => {
      if (station.latitude && station.longitude) {
        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          station.latitude,
          station.longitude
        );
        return { ...station, distance };
      }
      return station;
    });

    // Đếm số trạm có distance
    const stationsWithDistanceCount = stationsWithDistance.filter(s => s.distance).length;
    

    // Sắp xếp theo khoảng cách gần nhất
    const sorted = stationsWithDistance.sort((a, b) => {
      if (!a.distance) return 1;
      if (!b.distance) return -1;
      return a.distance - b.distance;
    });


    setStations(sorted);
    setDistancesCalculated(true);
  };

  const geocodeAddress = async (
    address: string, 
    district?: string, 
    city?: string
  ): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      // Thử dùng tọa độ quận/huyện trước (nhanh và chính xác hơn)
      const districtCoords = getDistrictCoordinates(district, city);
      if (districtCoords) {
        
        return districtCoords;
      }
      
      // Fallback: thử geocode địa chỉ đầy đủ
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

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await stationAPI.getStation({
        status: 'active',
        limit: 50,
      });
      
      const apiStations = response.stations || [];
      
      
      // Tự động chuyển address thành GPS nếu chưa có
      const stationsWithGPS = await Promise.all(
        apiStations.map(async (station) => {
          // Nếu đã có GPS thì giữ nguyên
          if (station.latitude && station.longitude) {
            return station;
          }
          
          // Nếu chưa có GPS, dùng district hoặc address để geocode
          if (station.district || station.address) {
            
            const coords = await geocodeAddress(
              station.address || '', 
              station.district, 
              station.city
            );
            
            if (coords) {
              
              return {
                ...station,
                latitude: coords.latitude,
                longitude: coords.longitude,
              };
            }
          }
          
          
          return station;
        })
      );
      
      const stationsWithGPSCount = stationsWithGPS.filter(s => s.latitude && s.longitude).length;
      
      
      setStations(stationsWithGPS);
      setDistancesCalculated(false);
    } catch (error) {
      
      setStations([]);
      setDistancesCalculated(false);
    } finally {
      setLoading(false);
    }
  };

  const centerMapOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  };

  const filterStations = () => {
    if (!searchText.trim()) {
      setFilteredStations(stations);
      return;
    }

    const searchTerm = searchText.trim();
    const filtered = stations.filter((station) => {
      return (
        includesIgnoreAccents(station.name, searchTerm) ||
        includesIgnoreAccents(station.address || '', searchTerm) ||
        includesIgnoreAccents(station.district || '', searchTerm) ||
        includesIgnoreAccents(station.city || '', searchTerm)
      );
    });
    setFilteredStations(filtered);
  };

  // Hiển thị tất cả trạm luôn
  const displayedStations = filteredStations;

  // ----- STATION CARD -----
  const StationCard = ({ station, isSelected, index }: { station: StationWithDistance; isSelected: boolean; index: number }) => {
    const isNearest = index === 0 && station.distance && station.distance > 0;
    
    const handlePress = () => {
      // Navigate to station details
      router.push({
        pathname: '/station-details',
        params: { 
          id: station._id,
          distance: station.distance?.toString() || '0'
        }
      });
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.stationCard,
          {
            backgroundColor: '#FFFFFF',
            borderColor: isNearest ? colors.primary : '#E8E8E8',
            borderWidth: isNearest ? 2 : 1,
          },
        ]}
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <View
          style={[
            styles.stationIcon,
            { backgroundColor: '#F2F4F7' },
          ]}
        >
          <MapPin size={20} color={colors.primary} />
        </View>

        <View style={styles.stationInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text
              style={[
                styles.stationName,
                { color: colors.text, flex: 1 },
              ]}
              numberOfLines={1}
            >
              {station.name}
            </Text>
            {station.distance !== undefined && (
              <View style={[
                styles.distanceBadge,
                {
                  backgroundColor: isNearest ? colors.primary : '#F0FDF4'
                }
              ]}>
                <Text style={[
                  styles.distanceBadgeText,
                  {
                    color: isNearest ? '#fff' : colors.primary
                  }
                ]}>
                  📍 {station.distance.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>
          
          {isNearest && (
            <View style={styles.nearestBadge}>
              <Text style={styles.nearestBadgeText}>⭐ Gần nhất</Text>
            </View>
          )}
          
          <Text
            style={[
              styles.stationAddress,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {station.address || station.district}
          </Text>
          <Text
            style={[
              styles.stationVehicles,
              { color: colors.secondary },
            ]}
          >
            {station.available_vehicles} xe có sẵn
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  // ----- UI -----
  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      {/* HEADER */}
      <Animated.View entering={FadeInUp.delay(100)} style={[styles.header]}>
        <View>
          <Text style={styles.greeting}>Chào mừng trở lại 👋</Text>
          <Text style={styles.welcomeText}>{user?.name || 'Khách hàng'}</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Nhập địa điểm hoặc tên trạm..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        <View style={styles.locationAndModeContainer}>
          <TouchableOpacity style={styles.locationRow}>
            <MapPin size={18} color="#FFFFFF" />
            <Text style={styles.locationText}>{selectedLocation}</Text>
          </TouchableOpacity>

          {/* Nút chuyển đổi giữa List và Map */}
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                viewMode === 'list' && styles.modeButtonActive,
              ]}
              onPress={() => setViewMode('list')}
            >
              <List size={18} color={viewMode === 'list' ? '#FFFFFF' : '#1B5E20'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                viewMode === 'map' && styles.modeButtonActive,
              ]}
              onPress={() => setViewMode('map')}
            >
              <Map size={18} color={viewMode === 'map' ? '#FFFFFF' : '#1B5E20'} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* BODY */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {userLocation && (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {/* Vòng tròn hiển thị bán kính xung quanh vị trí người dùng */}
              <Circle
                center={{
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                }}
                radius={5000} // 5km
                fillColor="rgba(22, 163, 74, 0.1)"
                strokeColor="rgba(22, 163, 74, 0.3)"
                strokeWidth={2}
              />

              {/* Markers cho các trạm */}
              {stations.map((station) => {
                if (!station.latitude || !station.longitude) return null;
                return (
                  <Marker
                    key={station._id}
                    coordinate={{
                      latitude: station.latitude,
                      longitude: station.longitude,
                    }}
                    pinColor={colors.primary}
                    onPress={() => setSelectedStation(station)}
                  >
                    <Callout>
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle}>{station.name}</Text>
                        <Text style={styles.calloutText}>{station.address}</Text>
                        <Text style={styles.calloutVehicles}>
                          {station.available_vehicles} xe có sẵn
                        </Text>
                        {station.distance && (
                          <Text style={[styles.calloutDistance, { color: colors.primary }]}>
                            📍 {station.distance.toFixed(1)} km từ bạn
                          </Text>
                        )}
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>
          )}

          {/* Nút Center on User */}
          <TouchableOpacity
            style={[styles.centerButton, { backgroundColor: colors.primary }]}
            onPress={centerMapOnUser}
          >
            <Navigation size={24} color="#fff" />
          </TouchableOpacity>

          {/* Card trạm đã chọn */}
          {selectedStation && (
            <Animated.View
              entering={FadeInUp}
              style={[styles.selectedStationCard, { backgroundColor: colors.surface }]}
            >
              <StationCard 
                station={selectedStation as StationWithDistance} 
                isSelected={false}
                index={filteredStations.findIndex(s => s._id === selectedStation._id)}
              />
              <TouchableOpacity
                style={[styles.viewDetailsButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  router.push({
                    pathname: '/station-details',
                    params: { 
                      id: selectedStation._id,
                      distance: selectedStation.distance?.toString() || '0'
                    }
                  });
                }}
              >
                <Text style={styles.viewDetailsText}>Xem chi tiết trạm</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* STATIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trạm xe điện</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
        ) : (
          <View style={styles.stationsContainer}>
            {displayedStations.length > 0 ? (
              <>
                {displayedStations.map((station, index) => (
                  <StationCard
                    key={station._id}
                    station={station}
                    isSelected={selectedStation?._id === station._id}
                    index={index}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <MapPin size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Không tìm thấy trạm nào</Text>
                <Text style={styles.emptySubText}>
                  Thử tìm kiếm với từ khóa khác
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#1B5E20',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: { fontSize: 14, color: '#E8F5E9' },
  welcomeText: { fontSize: 20, fontWeight: '700', marginTop: 2, color: '#FFFFFF' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8 },
  locationAndModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 6, fontWeight: '600', color: '#FFFFFF' },

  // View Mode Toggle
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#1B5E20',
  },

  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  selectedStationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  viewDetailsButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Callout
  calloutContainer: {
    padding: 10,
    minWidth: 200,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  calloutVehicles: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  seeAllText: { fontSize: 14, fontWeight: '600' },

  // Station
  stationsContainer: { paddingBottom: 12 },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stationIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stationInfo: { flex: 1 },
  stationName: { fontSize: 16, fontWeight: '700' },
  stationAddress: { fontSize: 13, marginTop: 2 },
  stationVehicles: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nearestBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  nearestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
