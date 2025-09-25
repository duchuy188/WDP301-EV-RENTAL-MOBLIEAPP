import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Battery, Clock, Star, Filter, Search } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { Vehicle } from '@/types';

export default function BookingScreen() {
  const { colors } = useTheme();
  const { vehicles, stations, bookVehicle } = useAppStore();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBookVehicle = async (vehicle: Vehicle) => {
    Alert.alert(
      'Xác nhận đặt xe',
      `Bạn muốn đặt ${vehicle.name}?\nGiá: ${vehicle.pricePerHour.toLocaleString('vi-VN')}đ/giờ`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt xe',
          onPress: async () => {
            const success = await bookVehicle(vehicle.id);
            if (success) {
              Alert.alert('Thành công', 'Đã đặt xe thành công! Vui lòng đến điểm nhận xe để check-in.');
            }
          }
        }
      ]
    );
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.isAvailable && 
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => (
    <Card style={styles.vehicleCard}>
      <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <ThemedText type="subtitle" style={styles.vehicleName}>
            {vehicle.name}
          </ThemedText>
          <View style={styles.batteryContainer}>
            <Battery size={16} color={colors.success} />
            <ThemedText style={[styles.batteryText, { color: colors.success }]}>
              {vehicle.batteryLevel}%
            </ThemedText>
          </View>
        </View>
        
        <ThemedText style={[styles.vehicleModel, { color: colors.textSecondary }]}>
          {vehicle.brand} • {vehicle.model}
        </ThemedText>
        
        <View style={styles.locationContainer}>
          <MapPin size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.locationText, { color: colors.textSecondary }]}>
            {vehicle.location.address}
          </ThemedText>
        </View>
        
        <View style={styles.priceContainer}>
          <ThemedText type="subtitle" style={[styles.price, { color: colors.primary }]}>
            {vehicle.pricePerHour.toLocaleString('vi-VN')}đ
          </ThemedText>
          <ThemedText style={[styles.priceUnit, { color: colors.textSecondary }]}>
            /giờ
          </ThemedText>
        </View>
        
        <View style={styles.featuresContainer}>
          {vehicle.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={[styles.featureTag, { backgroundColor: colors.surfaceVariant }]}>
              <ThemedText style={styles.featureText}>{feature}</ThemedText>
            </View>
          ))}
        </View>
        
        <Button
          title="Đặt xe"
          onPress={() => handleBookVehicle(vehicle)}
          fullWidth
          style={styles.bookButton}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Đặt xe điện</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Chọn xe phù hợp với nhu cầu của bạn
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm kiếm xe..."
          leftIcon={<Search size={20} color={colors.textSecondary} />}
          style={styles.searchInput}
        />
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.surface }]}>
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.primary }]}>
            {stations.reduce((total, station) => total + station.availableVehicles, 0)}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Xe khả dụng
          </ThemedText>
        </Card>
        <Card style={styles.statCard}>
          <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.primary }]}>
            {stations.length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Điểm thuê
          </ThemedText>
        </Card>
        <Card style={styles.statCard}>
          <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.primary }]}>
            <Clock size={16} color={colors.primary} />
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            24/7
          </ThemedText>
        </Card>
      </View>

      <ScrollView 
        style={styles.vehiclesList}
        showsVerticalScrollIndicator={false}
      >
        {filteredVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  vehiclesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  vehicleCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  vehicleImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
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
    flex: 1,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleModel: {
    fontSize: 14,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: 14,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  featureTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookButton: {
    marginTop: 8,
  },
});