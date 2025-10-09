import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  TextInput,
  Image
} from 'react-native';
import { MapPin, Camera, CircleCheck as CheckCircle, DollarSign, Clock, Star } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { useVehicleStore } from '@/store/vehicleStore';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ReturnScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const { currentRental, completeRental } = useVehicleStore();
  const [selectedLocation, setSelectedLocation] = useState('456 Lê Lợi, Quận 3, TP.HCM');
  const [damageNotes, setDamageNotes] = useState('');
  const [photosUploaded, setPhotosUploaded] = useState(false);
  const [staffConfirmed, setStaffConfirmed] = useState(false);
  const [rating, setRating] = useState(5);

  // Mock calculation data
  const rentalData = {
    duration: '4 giờ 30 phút',
    distance: '45 km',
    baseCost: 300000,
    additionalFees: 25000,
    totalCost: 325000,
  };

  const returnLocations = [
    { id: 1, name: 'Lê Lợi, Quận 3', address: '456 Lê Lợi, Quận 3, TP.HCM', distance: '0.5km' },
    { id: 2, name: 'Nguyễn Huệ, Quận 1', address: '123 Nguyễn Huệ, Quận 1, TP.HCM', distance: '1.2km' },
    { id: 3, name: 'Võ Văn Tần, Quận 3', address: '789 Võ Văn Tần, Quận 3, TP.HCM', distance: '0.8km' },
  ];

  const handleUploadPhotos = () => {
    Alert.alert(
      'Chụp ảnh xe',
      'Chụp ảnh tình trạng xe trước khi trả',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Chụp ảnh', 
          onPress: () => {
            // Mock photo upload
            setTimeout(() => {
              setPhotosUploaded(true);
              Alert.alert('Thành công', 'Đã tải lên ảnh tình trạng xe');
            }, 1000);
          }
        }
      ]
    );
  };

  const handleStaffConfirmation = () => {
    Alert.alert(
      'Xác nhận từ nhân viên',
      'Nhân viên đã kiểm tra và xác nhận tình trạng xe',
      [
        { text: 'OK', onPress: () => setStaffConfirmed(true) }
      ]
    );
  };

  const handlePayment = async () => {
    if (!photosUploaded || !staffConfirmed) {
      Alert.alert('Chưa hoàn thành', 'Vui lòng hoàn thành tất cả các bước trước khi thanh toán');
      return;
    }

    Alert.alert(
      'Xác nhận thanh toán',
      `Tổng chi phí: ${formatPrice(rentalData.totalCost)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Thanh toán', 
          onPress: async () => {
            if (currentRental) {
              await completeRental(currentRental.id, {
                location: selectedLocation,
                totalCost: rentalData.totalCost,
                distance: 45,
              });
              Alert.alert('Thành công', 'Đã hoàn thành chuyến thuê xe!');
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
      >
        <Star
          size={32}
          color="#FFD700"
          fill={index < rating ? "#FFD700" : "transparent"}
        />
      </TouchableOpacity>
    ));
  };

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
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      fontFamily: 'Inter-Bold',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      fontFamily: 'Inter-Medium',
    },
    locationOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 8,
    },
    selectedLocation: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    unselectedLocation: {
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    locationInfo: {
      flex: 1,
      marginLeft: 12,
    },
    locationName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    locationAddress: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: 'Inter-Regular',
    },
    locationDistance: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    uploadSection: {
      alignItems: 'center',
      paddingVertical: 20,
      borderWidth: 2,
      borderColor: photosUploaded ? colors.success : colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      marginBottom: 16,
    },
    uploadText: {
      fontSize: 16,
      color: photosUploaded ? colors.success : colors.textSecondary,
      marginTop: 8,
      fontFamily: 'Inter-Regular',
    },
    notesInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      height: 100,
      textAlignVertical: 'top',
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    confirmationButton: {
      backgroundColor: staffConfirmed ? colors.success : colors.primary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    confirmationText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    costRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    costLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    costValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      marginTop: 8,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    totalValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: 'Inter-Bold',
    },
    ratingSection: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    ratingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      fontFamily: 'Inter-Medium',
    },
    starsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    paymentButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 20,
    },
    paymentButtonDisabled: {
      backgroundColor: colors.border,
    },
    paymentButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
    },
  });

  if (!currentRental) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Trả xe</Text>
          <Text style={styles.subtitle}>Chưa có chuyến thuê nào đang hoạt động</Text>
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Vui lòng đặt xe trước khi sử dụng tính năng này
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <Text style={styles.title}>Trả xe</Text>
        <Text style={styles.subtitle}>Hoàn thành chuyến thuê xe của bạn</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Return Location Selection */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn điểm trả xe</Text>
          {returnLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationOption,
                selectedLocation === location.address 
                  ? styles.selectedLocation 
                  : styles.unselectedLocation
              ]}
              onPress={() => setSelectedLocation(location.address)}
            >
              <MapPin 
                size={20} 
                color={selectedLocation === location.address ? colors.primary : colors.textSecondary} 
              />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAddress}>{location.address}</Text>
              </View>
              <Text style={styles.locationDistance}>{location.distance}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Photo Upload */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Chụp ảnh tình trạng xe</Text>
          <TouchableOpacity style={styles.uploadSection} onPress={handleUploadPhotos}>
            {photosUploaded ? (
              <CheckCircle size={32} color={colors.success} />
            ) : (
              <Camera size={32} color={colors.textSecondary} />
            )}
            <Text style={styles.uploadText}>
              {photosUploaded ? 'Đã tải lên ảnh thành công' : 'Chụp ảnh xe trước khi trả'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 8 }]}>
            Ghi chú thêm
          </Text>
          <TextInput
            style={styles.notesInput}
            value={damageNotes}
            onChangeText={setDamageNotes}
            placeholder="Ghi chú về tình trạng xe (nếu có)..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </Animated.View>

        {/* Staff Confirmation */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Xác nhận từ nhân viên</Text>
          <TouchableOpacity 
            style={styles.confirmationButton}
            onPress={handleStaffConfirmation}
          >
            {staffConfirmed ? (
              <CheckCircle size={20} color="#FFFFFF" />
            ) : (
              <Clock size={20} color="#FFFFFF" />
            )}
            <Text style={styles.confirmationText}>
              {staffConfirmed ? 'Đã xác nhận' : 'Chờ xác nhận'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Cost Summary */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt chi phí</Text>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Thời gian thuê:</Text>
            <Text style={styles.costValue}>{rentalData.duration}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Quãng đường:</Text>
            <Text style={styles.costValue}>{rentalData.distance}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Chi phí cơ bản:</Text>
            <Text style={styles.costValue}>{formatPrice(rentalData.baseCost)}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Phí phát sinh:</Text>
            <Text style={styles.costValue}>{formatPrice(rentalData.additionalFees)}</Text>
          </View>
          
          <View style={[styles.costRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>{formatPrice(rentalData.totalCost)}</Text>
          </View>
        </Animated.View>

        {/* Rating */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>Đánh giá chuyến đi</Text>
            <View style={styles.starsRow}>
              {renderStars()}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <AnimatedTouchableOpacity
        entering={FadeInDown.delay(700)}
        style={[
          styles.paymentButton,
          (!photosUploaded || !staffConfirmed) && styles.paymentButtonDisabled
        ]}
        onPress={handlePayment}
        disabled={!photosUploaded || !staffConfirmed}
      >
        <Text style={styles.paymentButtonText}>
          Thanh toán {formatPrice(rentalData.totalCost)}
        </Text>
      </AnimatedTouchableOpacity>
    </View>
  );
}