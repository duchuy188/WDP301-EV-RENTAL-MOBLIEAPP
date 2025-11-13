import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, FileText, CreditCard, AlertCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeStore } from '@/store/themeStore';
import { bookingAPI } from '@/api/bookingAPI';
import { PaymentMethod } from '@/types/payment';

export default function BookingScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  
  // Vehicle info from params
  const vehicleBrand = params.brand as string;
  const vehicleModel = params.model as string;
  const vehicleColor = params.color as string;
  const stationId = params.stationId as string;
  const stationName = params.stationName as string;
  const pricePerDay = params.pricePerDay ? parseFloat(params.pricePerDay as string) : 0;
  const depositPercentage = params.depositPercentage ? parseFloat(params.depositPercentage as string) : 50; // Default 50% for >= 3 days

  // Booking form state
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  
  // Set default pickup time to at least 1 hour from now
  const getDefaultPickupTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0); // Round to the hour
    now.setSeconds(0);
    return now;
  };
  const [pickupTime, setPickupTime] = useState(getDefaultPickupTime());
  const [specialRequests, setSpecialRequests] = useState('');
  const [notes, setNotes] = useState('');
  
  // Payment state - Always VNPay
  const paymentMethod: PaymentMethod = 'vnpay'; // Fixed to VNPay only
  const HOLDING_FEE = 50000; // 50,000 VND
  
  // DatePicker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showPickupTimePicker, setShowPickupTimePicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForAPI = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const calculateTotalDays = (): number => {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const calculateTotalPrice = (): number => {
    return calculateTotalDays() * pricePerDay;
  };

  const calculateDepositAmount = (): number => {
    if (calculateTotalDays() < 3) return 0;
    return calculateTotalPrice() * (depositPercentage / 100);
  };

  const requiresDeposit = (): boolean => {
    return calculateTotalDays() >= 3 && depositPercentage > 0;
  };

  const handleBooking = async () => {
    // Validation
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    // Check if start date is in the past
    if (selectedStartDate < today) {
      Alert.alert('Lỗi', 'Ngày nhận xe không thể là ngày trong quá khứ');
      return;
    }
    
    // Check if start date is today and pickup time is in the past
    if (selectedStartDate.getTime() === today.getTime()) {
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const selectedTime = pickupTime.getHours() * 60 + pickupTime.getMinutes();
      const oneHourFromNow = currentTime + 60; // Require at least 1 hour advance booking
      
      if (selectedTime < oneHourFromNow) {
        Alert.alert(
          'Lỗi', 
          'Giờ nhận xe phải ít nhất 1 tiếng sau thời điểm hiện tại'
        );
        return;
      }
    }
    
    if (endDate <= startDate) {
      Alert.alert('Lỗi', 'Ngày trả xe phải sau ngày nhận xe');
      return;
    }

    try {
      setIsLoading(true);
      
      const bookingData = {
        brand: vehicleBrand,
        model: vehicleModel,
        color: vehicleColor,
        station_id: stationId,
        start_date: formatDateForAPI(startDate),
        end_date: formatDateForAPI(endDate),
        pickup_time: formatTimeForAPI(pickupTime),
        return_time: "23:59", // Default return time at end of day
        special_requests: specialRequests || undefined,
        notes: notes || undefined,
      };

      
      
      const response = await bookingAPI.postBooking(bookingData);
      

      if (response.requiresKYC) {
        Alert.alert(
          'Yêu cầu xác thực',
          'Bạn cần hoàn thành xác thực KYC để tiếp tục đặt xe',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xác thực ngay', 
              onPress: () => router.push('/verify-documents')
            }
          ]
        );
        return;
      }

      // Handle requiresPayment flag (backend returns payment URL)
      const responseData: any = response;
      
      if (responseData.requiresPayment && responseData.data) {
        // Backend requires payment first before creating booking
        const { holding_fee, pending_booking_id, temp_id } = responseData.data;
        
        if (holding_fee && holding_fee.payment_url) {
          // Navigate to VNPay WebView with the provided payment URL
          router.push({
            pathname: '/vnpay-payment',
            params: {
              paymentUrl: holding_fee.payment_url,
              bookingId: temp_id || pending_booking_id, // ✅ Prioritize temp_id (starts with 'PB')
              amount: holding_fee.amount.toString()
            }
          });
          return;
        }
      }

      // Handle normal booking response (booking created immediately)
      const createdBooking = response.booking || responseData.data?.booking || responseData.data || responseData;
      
      // Check if booking was created successfully
      if (!createdBooking || !createdBooking._id) {
        Alert.alert(
          'Lỗi',
          'Không thể tạo đơn đặt xe. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Booking successful - show success message
      const bookingId = createdBooking._id;
      const bookingCode = createdBooking.code;

      Alert.alert(
        'Đặt xe thành công! 🎉',
        `Mã đặt xe: ${bookingCode}\n\nVui lòng đến trạm để nhận xe.`,
        [
          { 
            text: 'Xem chi tiết', 
            onPress: () => {
              router.replace({
                pathname: '/booking-details',
                params: { id: bookingId }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.message || error.message || 'Không thể đặt xe';
      Alert.alert('Đặt xe thất bại', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Đặt xe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Vehicle Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin xe</Text>
            <View style={styles.infoCard}>
              <Text style={styles.vehicleName}>{vehicleBrand} {vehicleModel}</Text>
              <Text style={styles.vehicleDetail}>Màu sắc: {vehicleColor}</Text>
              <View style={styles.stationRow}>
                <MapPin size={16} color={colors.primary} />
                <Text style={styles.stationText}>{stationName}</Text>
              </View>
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian thuê</Text>
            
            {/* Start Date */}
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Calendar size={20} color={colors.primary} />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Ngày nhận xe</Text>
                <Text style={styles.dateTimeValue}>{formatDate(startDate)}</Text>
              </View>
            </TouchableOpacity>

            {/* End Date */}
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Calendar size={20} color={colors.primary} />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Ngày trả xe</Text>
                <Text style={styles.dateTimeValue}>{formatDate(endDate)}</Text>
              </View>
            </TouchableOpacity>

            {/* Pickup Time */}
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowPickupTimePicker(true)}
            >
              <Clock size={20} color={colors.primary} />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Giờ nhận xe</Text>
                <Text style={styles.dateTimeValue}>{formatTime(pickupTime)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Special Requests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yêu cầu đặc biệt (không bắt buộc)</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                placeholder="VD: Cần thêm phụ kiện sạc"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú (không bắt buộc)</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Thêm ghi chú của bạn"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán phí giữ chỗ</Text>
            <Text style={styles.sectionDescription}>
              Phí giữ chỗ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(HOLDING_FEE)}
            </Text>
            
            {/* VNPay Option */}
            <View style={[styles.paymentOption, styles.paymentOptionSelected, { borderColor: colors.primary }]}>
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.paymentIcon, { backgroundColor: colors.primary }]}>
                  <CreditCard size={20} color="#fff" />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: colors.primary, fontWeight: '700' }]}>
                    Thanh toán VNPay
                  </Text>
                  <Text style={styles.paymentDescription}>
                    Thanh toán ngay qua VNPay
                  </Text>
                </View>
              </View>
              <View style={[styles.radioButton, styles.radioButtonSelected, { borderColor: colors.primary }]}>
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              </View>
            </View>

            {/* Warning Note */}
            <View style={styles.holdingFeeWarning}>
              <AlertCircle size={18} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.holdingFeeWarningText}>
                  Lưu ý: Nếu hủy đặt xe sau khi thanh toán, bạn sẽ mất 50.000đ phí giữ chỗ
                </Text>
                <Text style={[styles.holdingFeeWarningText, { marginTop: 4 }]}>
                  • Bạn được quyền chỉnh sửa đặt xe 1 lần duy nhất (trước 24h nhận xe)
                </Text>
              </View>
            </View>
          </View>

          {/* Price Summary */}
          <View style={[styles.section, styles.priceSummary]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Số ngày thuê:</Text>
              <Text style={styles.priceValue}>{calculateTotalDays()} ngày</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá thuê/ngày:</Text>
              <Text style={styles.priceValue}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricePerDay)}
              </Text>
            </View>
            {requiresDeposit() && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Đặt cọc ({depositPercentage}%):</Text>
                <Text style={[styles.priceValue, { color: '#F59E0B', fontWeight: '700' }]}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateDepositAmount())}
                </Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotalPrice())}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.primary }]}
          onPress={handleBooking}
          disabled={isLoading}
        >
          <Text style={styles.bookButtonText}>
            {isLoading ? 'Đang xử lý...' : 'Xác nhận đặt xe'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DateTimePickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
              
              // If selected date is today, ensure pickup time is at least 1 hour from now
              const today = new Date();
              const isToday = selectedDate.getDate() === today.getDate() &&
                            selectedDate.getMonth() === today.getMonth() &&
                            selectedDate.getFullYear() === today.getFullYear();
              
              if (isToday) {
                const minPickupTime = new Date();
                minPickupTime.setHours(minPickupTime.getHours() + 1);
                minPickupTime.setMinutes(0);
                minPickupTime.setSeconds(0);
                setPickupTime(minPickupTime);
              }
            }
          }}
          minimumDate={new Date()}
          accentColor={colors.primary}
          themeVariant="light"
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
          minimumDate={startDate}
          accentColor={colors.primary}
          themeVariant="light"
        />
      )}

      {showPickupTimePicker && (
        <DateTimePicker
          value={pickupTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowPickupTimePicker(false);
            if (selectedTime) {
              // Validate if start date is today
              const today = new Date();
              const isToday = startDate.getDate() === today.getDate() &&
                            startDate.getMonth() === today.getMonth() &&
                            startDate.getFullYear() === today.getFullYear();
              
              if (isToday) {
                const currentTime = today.getHours() * 60 + today.getMinutes();
                const selectedTimeMinutes = selectedTime.getHours() * 60 + selectedTime.getMinutes();
                const oneHourFromNow = currentTime + 60;
                
                if (selectedTimeMinutes < oneHourFromNow) {
                  Alert.alert(
                    'Lỗi',
                    'Giờ nhận xe phải ít nhất 1 tiếng sau thời điểm hiện tại',
                    [{ text: 'OK' }]
                  );
                  return;
                }
              }
              
              setPickupTime(selectedTime);
            }
          }}
          accentColor={colors.primary}
          themeVariant="light"
        />
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
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  vehicleDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  dateTimeButton: {
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
  dateTimeContent: {
    marginLeft: 12,
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    marginLeft: 12,
    paddingVertical: 8,
  },
  priceSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Payment Method Styles
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentOptionSelected: {
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  holdingFeeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  holdingFeeWarningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '500',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioButtonSelected: {
    borderWidth: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

