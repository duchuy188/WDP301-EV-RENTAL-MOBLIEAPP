import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Image,
  Dimensions
} from 'react-native';
import { Search, MapPin, Battery, Clock, Star, Filter } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { useVehicleStore, Vehicle } from '@/store/vehicleStore';
import { useAuthStore } from '@/store/authStore';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const { vehicles, setSelectedVehicle, bookVehicle } = useVehicleStore();
  const { user } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('TP.HCM');

  const handleBookVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    const pickupTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    await bookVehicle(vehicle.id, pickupTime);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const VehicleCard = ({ vehicle, index }: { vehicle: Vehicle; index: number }) => (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(index * 100)}
      style={[styles.vehicleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
      
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={[styles.vehicleName, { color: colors.text }]}>{vehicle.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={[styles.rating, { color: colors.textSecondary }]}>4.8</Text>
          </View>
        </View>
        
        <Text style={[styles.vehicleType, { color: colors.textSecondary }]}>{vehicle.type}</Text>
        
        <View style={styles.vehicleDetails}>
          <View style={styles.detailItem}>
            <Battery size={16} color={colors.secondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {vehicle.batteryLevel}%
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={16} color={colors.secondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {vehicle.range}km
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Clock size={16} color={colors.secondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Có sẵn
            </Text>
          </View>
        </View>
        
        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatPrice(vehicle.pricePerHour)}/giờ
            </Text>
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {vehicle.location.address.split(',')[0]}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: colors.primary }]}
            onPress={() => handleBookVehicle(vehicle)}
          >
            <Text style={styles.bookButtonText}>Đặt xe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: colors.surface,
    },
    greeting: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 4,
      fontFamily: 'Inter-Bold',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      gap: 12,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    filterButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationSelector: {
      marginTop: 16,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
      fontFamily: 'Inter-Medium',
    },
    mapContainer: {
      height: 200,
      backgroundColor: colors.border,
      margin: 20,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapPlaceholder: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    seeAllText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    vehicleCard: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    vehicleImage: {
      width: '100%',
      height: 180,
      backgroundColor: colors.border,
    },
    vehicleInfo: {
      padding: 16,
    },
    vehicleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    vehicleName: {
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rating: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
    vehicleType: {
      fontSize: 14,
      marginBottom: 12,
      fontFamily: 'Inter-Regular',
    },
    vehicleDetails: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    price: {
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
    },
    location: {
      fontSize: 12,
      marginTop: 2,
      fontFamily: 'Inter-Regular',
    },
    bookButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <Text style={styles.greeting}>Chào mừng trở lại,</Text>
        <Text style={styles.welcomeText}>{user?.name || 'Khách hàng'}</Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm xe điện..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.locationSelector}>
          <TouchableOpacity style={styles.locationRow}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.locationText}>{selectedLocation}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.mapContainer}>
          <MapPin size={32} color={colors.textSecondary} />
          <Text style={styles.mapPlaceholder}>Bản đồ xe có sẵn gần bạn</Text>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Xe có sẵn</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {vehicles.map((vehicle, index) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
        ))}
      </ScrollView>
    </View>
  );
}