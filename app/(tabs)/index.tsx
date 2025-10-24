import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  Search,
  MapPin,
  Battery,
  Clock,
  Star,
  Filter,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { useAuthStore } from '@/store/authStore';
import { stationAPI } from '@/api/stationAP';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { Station } from '@/types/station';
import { VehicleListItem } from '@/types/vehicles';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('TP.HCM');
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  useEffect(() => {
    loadStations();
    loadVehicles();
  }, []);

  useEffect(() => {
    if (selectedStation) loadVehicles(selectedStation._id);
  }, [selectedStation]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await stationAPI.getStation({
        status: 'active',
        limit: 50,
      });
      setStations(response.stations || []);
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async (stationId?: string) => {
    try {
      setLoadingVehicles(true);
      const response = await vehiclesAPI.getVehicles(
        stationId ? { station_id: stationId } : undefined
      );
      setVehicles(response.vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);

  // ----- STATION CARD -----
  const StationCard = ({ station, isSelected }: { station: Station; isSelected: boolean }) => (
    <TouchableOpacity
      style={[
        styles.stationCard,
        {
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: isSelected ? colors.primary : '#E8E8E8',
        },
      ]}
      activeOpacity={0.8}
      onPress={() => setSelectedStation(isSelected ? null : station)}
    >
      <View
        style={[
          styles.stationIcon,
          { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#F2F4F7' },
        ]}
      >
        <MapPin size={20} color={isSelected ? '#fff' : colors.primary} />
      </View>

      <View style={styles.stationInfo}>
        <Text
          style={[
            styles.stationName,
            { color: isSelected ? '#fff' : colors.text },
          ]}
        >
          {station.name}
        </Text>
        <Text
          style={[
            styles.stationAddress,
            { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
          ]}
        >
          {station.district || station.address}
        </Text>
        <Text
          style={[
            styles.stationVehicles,
            { color: isSelected ? '#fff' : colors.secondary },
          ]}
        >
          {station.available_vehicles} xe có sẵn
        </Text>
      </View>
      <ChevronRight size={20} color={isSelected ? '#fff' : colors.textSecondary} />
    </TouchableOpacity>
  );

  // ----- VEHICLE CARD -----
  const VehicleCard = ({ vehicle, index }: { vehicle: VehicleListItem; index: number }) => {
    const imageUri =
      vehicle.sample_image ||
      vehicle.color_images?.[0]?.images?.[0] ||
      vehicle.images?.[0];
    const vehicleName = `${vehicle.brand} ${vehicle.model}`;
    return (
      <AnimatedTouchableOpacity
        entering={FadeInDown.delay(index * 60)}
        style={[styles.vehicleCard, { backgroundColor: colors.surface }]}
        activeOpacity={0.8}
      >
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.vehicleImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleName, { color: colors.text }]} numberOfLines={1}>
            {vehicleName}
          </Text>
          <Text style={styles.vehicleSub}>
            ⚡ {vehicle.battery_capacity} kWh • {vehicle.max_range} km
          </Text>
          <Text style={[styles.vehiclePrice, { color: colors.primary }]}>
            {formatPrice(vehicle.price_per_day)}/ngày
          </Text>
        </View>
      </AnimatedTouchableOpacity>
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
              placeholder="Tìm kiếm xe điện..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.locationRow}>
          <MapPin size={18} color={colors.primary} />
          <Text style={styles.locationText}>{selectedLocation}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* BODY */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* STATIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trạm xe điện</Text>
          {selectedStation && (
            <TouchableOpacity onPress={() => setSelectedStation(null)}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
        ) : (
          <View style={styles.stationsContainer}>
            {stations.slice(0, selectedStation ? stations.length : 3).map((station) => (
              <StationCard
                key={station._id}
                station={station}
                isSelected={selectedStation?._id === station._id}
              />
            ))}
            {!selectedStation && stations.length > 3 && (
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  Xem thêm {stations.length - 3} trạm ⬇️
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* VEHICLES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedStation ? `Xe tại ${selectedStation.name}` : 'Xe có sẵn'}
          </Text>
        </View>

        {loadingVehicles ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
        ) : (
          <FlatList
            data={vehicles}
            renderItem={({ item, index }) => (
              <VehicleCard vehicle={item} index={index} />
            )}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            columnWrapperStyle={styles.vehicleRow}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: { fontSize: 15, color: '#6B7280' },
  welcomeText: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8 },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  locationText: { marginLeft: 6, fontWeight: '600', color: '#111827' },

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
  seeAllButton: { alignItems: 'center', marginVertical: 8 },

  // Vehicle
  vehicleRow: { justifyContent: 'space-between', paddingHorizontal: 12 },
  vehicleCard: {
    width: (width - 48) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  vehicleImage: { width: '100%', height: 120 },
  vehicleInfo: { padding: 10 },
  vehicleName: { fontSize: 14, fontWeight: '700' },
  vehicleSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  vehiclePrice: { fontSize: 15, fontWeight: '700', marginTop: 6 },
});
