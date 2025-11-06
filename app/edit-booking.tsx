import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, FileText, AlertCircle, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeStore } from '@/store/themeStore';
import { bookingAPI } from '@/api/bookingAPI';
import { stationAPI } from '@/api/stationAP';
import { vehiclesAPI } from '@/api/vehiclesAPI';
import { Booking, AlternativeVehicle } from '@/types/booking';
import { Station } from '@/types/station';

export default function EditBookingScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedStationName, setSelectedStationName] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [notes, setNotes] = useState('');
  const [reasonForChange, setReasonForChange] = useState('');

  // DatePicker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showPickupTimePicker, setShowPickupTimePicker] = useState(false);

  // Station selection
  const [stations, setStations] = useState<Station[]>([]);
  const [showStationModal, setShowStationModal] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);

  // Vehicle/Model selection (when changing vehicle)
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [availableModels, setAvailableModels] = useState<{brand: string, model: string, color: string}[]>([]);
  
  // Alternative vehicles (if original unavailable)
  const [alternativeVehicles, setAlternativeVehicles] = useState<AlternativeVehicle[]>([]);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);

  // Price calculation
  const [pricePerDay, setPricePerDay] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(50); // Default 50% cho thuê >= 3 ngày
  const [originalDepositAmount, setOriginalDepositAmount] = useState(0); // Track original deposit from booking

  useEffect(() => {
    loadBookingDetails();
    loadStations();
  }, [bookingId]);

  useEffect(() => {
    // Recalculate when dates, price, or deposit percentage change
    calculatePricing();
  }, [startDate, endDate, pricePerDay, depositPercentage, originalDepositAmount]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBooking(bookingId);
      const bookingData = response.booking;
      setBooking(bookingData);

      // Parse dates properly from YYYY-MM-DD format
      console.log('📅 Full booking data:', bookingData);
      console.log('📅 Original dates from API:', {
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        pickup_time: bookingData.pickup_time,
        start_date_type: typeof bookingData.start_date,
        end_date_type: typeof bookingData.end_date
      });

      // Deposit percentage is ALWAYS 50% for rentals >= 3 days (backend business logic)
      // This matches backend DepositService behavior
      let vehicleDepositPercentage = 50; // Default 50% for >= 3 days rental
      
      // Only calculate from existing booking data if deposit exists
      if (bookingData.deposit_amount && bookingData.total_price > 0) {
        vehicleDepositPercentage = (bookingData.deposit_amount / bookingData.total_price) * 100;
        console.log('✅ Calculated deposit_percentage from booking data:', vehicleDepositPercentage.toFixed(2) + '%');
      } else {
        console.log('✅ Using default deposit_percentage: 50% (for >= 3 days rental)');
      }

      // Parse date from DD/MM/YYYY HH:mm:ss format
      const parseDate = (dateStr: string): Date => {
        if (!dateStr) {
          console.error('❌ Date string is empty or undefined');
          return new Date(); // Fallback to today
        }

        // Parse DD/MM/YYYY HH:mm:ss format
        // Example: "10/11/2025 07:00:00"
        const datePart = dateStr.split(' ')[0]; // Get "10/11/2025"
        const parts = datePart.split('/'); // Split by /
        
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Month is 0-indexed (0 = January)
          const year = parseInt(parts[2]);
          return new Date(year, month, day);
        }

        // Fallback: try regular Date constructor
        console.warn('⚠️ Falling back to default Date parser for:', dateStr);
        return new Date(dateStr);
      };

      const parsedStartDate = parseDate(bookingData.start_date);
      const parsedEndDate = parseDate(bookingData.end_date);

      console.log('📅 Parsed dates:', {
        parsedStartDate,
        parsedEndDate,
        isValidStart: !isNaN(parsedStartDate.getTime()),
        isValidEnd: !isNaN(parsedEndDate.getTime())
      });
      
      setStartDate(parsedStartDate);
      setEndDate(parsedEndDate);
      
      // Parse pickup time
      const [hours, minutes] = bookingData.pickup_time.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0);
      setPickupTime(timeDate);

      setSelectedStationId(bookingData.station_id._id);
      setSelectedStationName(bookingData.station_id.name);
      setSelectedModel(bookingData.vehicle_id.model);
      setSelectedBrand(bookingData.vehicle_id.brand);
      setSelectedColor(bookingData.vehicle_id.color);
      setSpecialRequests(bookingData.special_requests || '');
      setNotes(bookingData.notes || '');
      setPricePerDay(bookingData.price_per_day);
      
      // Set deposit percentage from fetched vehicle data
      setDepositPercentage(vehicleDepositPercentage);
      
      console.log('💰 Deposit data:', {
        deposit_amount: bookingData.deposit_amount,
        total_price: bookingData.total_price,
        vehicle_deposit_percentage: vehicleDepositPercentage,
        calculated_percentage: bookingData.total_price > 0 ? (bookingData.deposit_amount / bookingData.total_price * 100) : 0
      });
      
      // Set deposit amount from booking
      setOriginalDepositAmount(bookingData.deposit_amount || 0);
      if (bookingData.deposit_amount) {
        setDepositAmount(bookingData.deposit_amount);
      }

    } catch (error: any) {
      console.error('Error loading booking:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đặt xe');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    try {
      setLoadingStations(true);
      const response = await stationAPI.getStation({ status: 'active' });
      setStations(response.stations || []);
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      setLoadingStations(false);
    }
  };

  const calculatePricing = () => {
    const diffTime = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedDays = Math.max(1, days);
    setTotalDays(calculatedDays);
    
    const calculatedTotalPrice = calculatedDays * pricePerDay;
    setTotalPrice(calculatedTotalPrice);
    
    // Calculate deposit: if days >= 3, deposit = totalPrice * depositPercentage%
    if (calculatedDays >= 3) {
      const calculatedDeposit = calculatedTotalPrice * (depositPercentage / 100);
      setDepositAmount(calculatedDeposit);
    } else {
      setDepositAmount(0);
    }
  };

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

  const handleSaveChanges = async () => {
    if (!booking) return;

    // Validation: Reason for change is required
    if (!reasonForChange.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng cho biết lý do thay đổi booking');
      return;
    }

    // Validation: Must edit at least 24 hours before pickup
    const now = new Date();
    const pickupDateTime = new Date(startDate);
    pickupDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0);
    
    const hoursDiff = (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      Alert.alert(
        'Không thể chỉnh sửa',
        'Bạn phải chỉnh sửa booking trước thời gian nhận xe ít nhất 24 giờ'
      );
      return;
    }

    // Validate dates
    if (endDate <= startDate) {
      Alert.alert('Lỗi', 'Ngày trả xe phải sau ngày nhận xe');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        start_date: formatDateForAPI(startDate),
        end_date: formatDateForAPI(endDate),
        pickup_time: formatTimeForAPI(pickupTime),
        station_id: selectedStationId,
        brand: selectedBrand,
        model: selectedModel,
        color: selectedColor,
        special_requests: specialRequests || undefined,
        notes: notes || undefined,
        reason_for_change: reasonForChange.trim(),
      };

      console.log('Updating booking with:', updateData);

      const response = await bookingAPI.updateBooking(bookingId, updateData);

      // Check if backend returned alternative vehicles (original vehicle unavailable)
      if (response.alternativeVehicles && response.alternativeVehicles.length > 0) {
        setAlternativeVehicles(response.alternativeVehicles);
        setShowAlternativesModal(true);
        return; // Wait for user to choose alternative
      }

      // Success
      Alert.alert(
        'Cập nhật thành công! ✅',
        'Thông tin đặt xe đã được cập nhật',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error updating booking:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật booking';
      Alert.alert('Cập nhật thất bại', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectStation = (station: Station) => {
    setSelectedStationId(station._id);
    setSelectedStationName(station.name);
    setShowStationModal(false);
  };

  const handleSelectAlternativeVehicle = async (vehicle: AlternativeVehicle) => {
    setSelectedBrand(vehicle.brand);
    setSelectedModel(vehicle.model);
    setSelectedColor(vehicle.color);
    setPricePerDay(vehicle.price_per_day);
    setShowAlternativesModal(false);

    // Retry update with new vehicle
    await handleSaveChanges();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text>Không tìm thấy booking</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Chỉnh sửa đặt xe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Warning Banner */}
          <View style={styles.warningBanner}>
            <AlertCircle size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Bạn chỉ được phép chỉnh sửa 1 lần duy nhất. Phí giữ chỗ 50,000đ đã thanh toán sẽ được giữ nguyên.
            </Text>
          </View>

          {/* Booking Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mã đặt xe</Text>
            <View style={styles.infoCard}>
              <Text style={styles.bookingCode}>{booking.code}</Text>
            </View>
          </View>

          {/* Vehicle Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin xe</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => Alert.alert('Thông báo', 'Vui lòng chọn model xe mới nếu muốn đổi xe')}
            >
              <View style={styles.selectContent}>
                <Text style={styles.selectLabel}>Xe hiện tại</Text>
                <Text style={styles.selectValue}>
                  {selectedBrand} {selectedModel} - {selectedColor}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Station Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trạm lấy xe</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowStationModal(true)}
            >
              <MapPin size={20} color={colors.primary} />
              <View style={styles.selectContent}>
                <Text style={styles.selectLabel}>Trạm</Text>
                <Text style={styles.selectValue}>{selectedStationName}</Text>
              </View>
            </TouchableOpacity>
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
            <Text style={styles.sectionTitle}>Yêu cầu đặc biệt</Text>
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
            <Text style={styles.sectionTitle}>Ghi chú</Text>
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

          {/* Reason for Change */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Lý do thay đổi</Text>
              <Text style={{ color: '#EF4444', marginLeft: 4, fontSize: 16, fontWeight: '600' }}>*</Text>
            </View>
            <View style={styles.inputContainer}>
              <FileText size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.textInput}
                value={reasonForChange}
                onChangeText={setReasonForChange}
                placeholder="Vui lòng cho biết lý do thay đổi"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
          </View>

          {/* Price Summary */}
          <View style={[styles.section, styles.priceSummary]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Số ngày thuê:</Text>
              <Text style={styles.priceValue}>{totalDays} ngày</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá thuê/ngày:</Text>
              <Text style={styles.priceValue}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricePerDay)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Phí giữ chỗ (đã thanh toán):</Text>
              <Text style={[styles.priceValue, { color: '#10B981' }]}>
                50,000₫
              </Text>
            </View>
            {totalDays >= 3 && depositAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tiền đặt cọc ({depositPercentage.toFixed(0)}%):</Text>
                <Text style={[styles.priceValue, { color: '#F59E0B' }]}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(depositAmount)}
                </Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng tiền thuê:</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveChanges}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
            if (selectedDate) setStartDate(selectedDate);
          }}
          minimumDate={new Date()}
          accentColor={colors.primary}
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
        />
      )}

      {showPickupTimePicker && (
        <DateTimePicker
          value={pickupTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowPickupTimePicker(false);
            if (selectedTime) setPickupTime(selectedTime);
          }}
          accentColor={colors.primary}
        />
      )}

      {/* Station Selection Modal */}
      <Modal
        visible={showStationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn trạm lấy xe</Text>
              <TouchableOpacity onPress={() => setShowStationModal(false)}>
                <X size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {loadingStations ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
              ) : (
                stations.map((station) => (
                  <TouchableOpacity
                    key={station._id}
                    style={[
                      styles.stationItem,
                      selectedStationId === station._id && { backgroundColor: '#F0F9FF', borderColor: colors.primary }
                    ]}
                    onPress={() => handleSelectStation(station)}
                  >
                    <View>
                      <Text style={styles.stationName}>{station.name}</Text>
                      <Text style={styles.stationAddress}>{station.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alternative Vehicles Modal */}
      <Modal
        visible={showAlternativesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlternativesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xe gốc đã hết - Chọn xe thay thế</Text>
              <TouchableOpacity onPress={() => {
                setShowAlternativesModal(false);
                setSaving(false);
              }}>
                <X size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {alternativeVehicles.map((vehicle, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.alternativeItem}
                  onPress={() => handleSelectAlternativeVehicle(vehicle)}
                >
                  <View style={styles.alternativeInfo}>
                    <Text style={styles.alternativeName}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                    <Text style={styles.alternativeDetail}>Màu: {vehicle.color}</Text>
                    <Text style={styles.alternativeDetail}>
                      Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vehicle.price_per_day)}/ngày
                    </Text>
                    <Text style={styles.alternativeAvailable}>
                      Còn {vehicle.available_count} xe
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
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
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 18,
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
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingCode: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 2,
  },
  selectButton: {
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
  selectContent: {
    marginLeft: 12,
    flex: 1,
  },
  selectLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  stationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  alternativeItem: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  alternativeInfo: {},
  alternativeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  alternativeDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  alternativeAvailable: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
});

