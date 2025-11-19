import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader,
  Eye,
  Download,
  AlertTriangle,
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useThemeStore } from '@/store/themeStore';
import { bookingAPI } from '@/api/bookingAPI';
import { contractAPI } from '@/api/contractAPI';
import { rentalAPI } from '@/api/rentalsAPI';
import { reportsAPI } from '@/api/reportsAPI';

interface BookingDetail {
  _id: string;
  code: string;
  user_id: {
    _id: string;
    fullname: string;
    email: string;
    phone: string;
    kycStatus: string;
  };
  vehicle_id: {
    _id: string;
    license_plate: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    price_per_day: number;
    images: string[];
  };
  station_id: {
    _id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    opening_time: string;
    closing_time: string;
  };
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  status: string;
  booking_type: string;
  price_per_day: number;
  total_days: number;
  total_price: number;
  deposit_amount: number;
  late_fee: number;
  damage_fee: number;
  other_fees: number;
  final_amount: number;
  special_requests?: string;
  notes?: string;
  cancellation_reason?: string;
  qr_code?: string;
  qr_expires_at?: string;
  qr_used_at?: string;
  contract_id?: string;
  createdAt: string;
  updatedAt: string;
  payments?: {
    _id: string;
    amount: number;
    payment_method: string;
    status: string;
    payment_type: string;
  }[];
}

export default function BookingDetailsScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [rentalId, setRentalId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [hasPendingReport, setHasPendingReport] = useState(false);
  const [checkingReport, setCheckingReport] = useState(false);
  const [hasAnyReport, setHasAnyReport] = useState(false);

  // Auto-refresh when screen is focused (e.g., after editing booking)
  useFocusEffect(
    useCallback(() => {
      loadBookingDetails();
    }, [bookingId])
  );

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBooking(bookingId);
      setBooking(response.booking);
      setCanCancel(response.canCancel || false);
      
      // Check if can edit
      const editAllowed = checkCanEditBooking(response.booking);
      setCanEdit(editAllowed);
      
      
      
      
      
      
      
      
      // If booking has contract_id, use it
      if (response.booking.contract_id) {
        setContractId(response.booking.contract_id);
      } else {
        // Otherwise, try to find contract - pass booking data directly
        loadContractByBookingData(response.booking);
      }

      // Try to find rental for this booking
      loadRentalByBooking(response.booking);
      
      // Check if there's any pending report
      if (response.booking._id) {
        checkPendingReportForBooking(response.booking._id);
      }
    } catch (error) {
      
      Alert.alert('Lỗi', 'Không thể tải thông tin đặt xe');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadRentalByBooking = async (bookingData: any) => {
    try {
      // Get all rentals and find by booking_id
      const response = await rentalAPI.getRentals();
      
      
      if (response.rentals && response.rentals.length > 0) {
        const bookingIdToFind = bookingData._id;
        
        const matchingRental = response.rentals.find((rental: any) => {
          const rentalBookingId = typeof rental.booking_id === 'string' 
            ? rental.booking_id 
            : rental.booking_id?._id;
          return rentalBookingId === bookingIdToFind;
        });
        
        if (matchingRental) {
          setRentalId(matchingRental._id);
          
        } else {
          
        }
      }
    } catch (error) {
      
    }
  };

  const checkPendingReportForBooking = async (bookingIdToCheck: string) => {
    try {
      setCheckingReport(true);
      // Get all user reports and filter by this booking
      const response = await reportsAPI.getUserReports();
      
      // API trả về { success: true, data: [...] }
      const allReports = response.data || [];
      const bookingReports = allReports.filter((report: any) => {
        const reportBookingId = typeof report.booking_id === 'string'
          ? report.booking_id
          : report.booking_id?._id;
        return reportBookingId === bookingIdToCheck;
      });
      
      setHasAnyReport(bookingReports.length > 0);
      
      // Kiểm tra pending reports
      const pendingReports = bookingReports.filter((report: any) => report.status === 'pending');
      setHasPendingReport(pendingReports.length > 0);
    } catch (error: any) {
      // Nếu API lỗi hoặc chưa có endpoint, cho phép báo cáo (không ẩn nút)
      // Chỉ log nếu không phải lỗi 404 hoặc 500
      if (error?.response?.status !== 404 && error?.response?.status !== 500) {
        console.log('[CHECK REPORT]', 'Error checking reports:', error);
      }
      setHasPendingReport(false); // Cho phép báo cáo nếu API lỗi
    } finally {
      setCheckingReport(false);
    }
  };

  const loadContractByBookingData = async (bookingData: any) => {
    try {
      setLoadingContract(true);
      
      // Get all contracts and find by customer + vehicle + station
      const response = await contractAPI.getContracts({ limit: 100 });
      
      
      
      if (response.data?.contracts && response.data.contracts.length > 0) {
        const userId = bookingData.user_id?._id || bookingData.user_id;
        const vehicleId = bookingData.vehicle_id?._id || bookingData.vehicle_id;
        const stationId = bookingData.station_id?._id || bookingData.station_id;
        
        
        
        
        
        
        // Find contract matching customer, vehicle, and station
        const matchingContract = response.data.contracts.find(
          (contract: any) => {
            const matchCustomer = contract.customer?._id === userId;
            const matchVehicle = contract.vehicle?._id === vehicleId;
            const matchStation = contract.station?._id === stationId;
            
            
            
            return matchCustomer && matchVehicle && matchStation;
          }
        );
        
        if (matchingContract) {
          setContractId(matchingContract._id);
          
          
          
          
        } else {
          
        }
      }
    } catch (error) {
      
    } finally {
      setLoadingContract(false);
    }
  };

  // Check if booking can be edited
  const checkCanEditBooking = (bookingData: any): boolean => {
    // 1. Must be online booking
    if (bookingData.booking_type !== 'online') {
      
      return false;
    }

    // 2. Must have paid holding fee
    const holdingFee = bookingData.holding_fee;
    if (!holdingFee || holdingFee.status !== 'paid') {
      
      return false;
    }

    // 3. Must be in pending status
    if (bookingData.status !== 'pending') {
      
      return false;
    }

    // 4. Edit count must be less than 1
    const editCount = bookingData.edit_count || 0;
    if (editCount >= 1) {
      
      return false;
    }

    // 5. Must be at least 24 hours before pickup
    const now = new Date();
    
    // Parse start_date properly from "DD/MM/YYYY HH:mm:ss" format
    let pickupDate: Date;
    if (bookingData.start_date && typeof bookingData.start_date === 'string') {
      const dateStr = bookingData.start_date;
      
      // Check if it's in "DD/MM/YYYY HH:mm:ss" format
      if (dateStr.includes('/')) {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/').map(Number);
        pickupDate = new Date(year, month - 1, day); // month is 0-indexed
        
        // Set time from pickup_time if available, otherwise from date string
        if (bookingData.pickup_time) {
          const [hours, minutes] = bookingData.pickup_time.split(':').map(Number);
          pickupDate.setHours(hours, minutes, 0, 0);
        } else if (timePart) {
          const [hours, minutes] = timePart.split(':').map(Number);
          pickupDate.setHours(hours, minutes, 0, 0);
        }
      } else {
        // Fallback to regular Date parsing
        pickupDate = new Date(bookingData.start_date);
        if (bookingData.pickup_time) {
          const [hours, minutes] = bookingData.pickup_time.split(':').map(Number);
          pickupDate.setHours(hours, minutes, 0, 0);
        }
      }
    } else {
      pickupDate = new Date(bookingData.start_date);
      if (bookingData.pickup_time) {
        const [hours, minutes] = bookingData.pickup_time.split(':').map(Number);
        pickupDate.setHours(hours, minutes, 0, 0);
      }
    }

    const hoursDiff = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log('[EDIT CHECK]', {
      now: now.toISOString(),
      pickupDate: pickupDate.toISOString(),
      hoursDiff: hoursDiff.toFixed(2),
      canEdit: hoursDiff >= 24
    });
    
    if (hoursDiff < 24) {
      
      return false;
    }

    
    return true;
  };

  const handleEditBooking = () => {
    if (!booking) return;

    router.push({
      pathname: '/edit-booking',
      params: { id: booking._id }
    });
  };

  const handleCancelBooking = () => {
    setCancelReason('');
    setShowCancelModal(true);
  };

  // Format date from "DD/MM/YYYY HH:mm:ss" to "DD/MM/YYYY"
  const formatDateOnly = (dateStr: string): string => {
    if (!dateStr) return '';
    // Split by space and take only the date part
    return dateStr.split(' ')[0];
  };

  const confirmCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do hủy');
      return;
    }

    try {
      setCanceling(true);
      setShowCancelModal(false);
      await bookingAPI.cancelBooking(bookingId, { reason: cancelReason.trim() });
      Alert.alert('Thành công', 'Đã hủy đặt xe thành công', [
        { text: 'OK', onPress: () => router.push('/(tabs)/history') },
      ]);
    } catch (error: any) {
      
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy đặt xe');
    } finally {
      setCanceling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#3B82F6';
      case 'active':
        return colors.primary;
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'active':
        return 'Đang thuê';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader size={20} color="#F59E0B" />;
      case 'confirmed':
        return <CheckCircle2 size={20} color="#3B82F6" />;
      case 'active':
        return <CheckCircle2 size={20} color={colors.primary} />;
      case 'completed':
        return <CheckCircle2 size={20} color="#10B981" />;
      case 'cancelled':
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <AlertCircle size={20} color="#6B7280" />;
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getTotalPrice = (): number => {
    if (!booking) return 0;
    
    // Ưu tiên tính từ payments nếu có
    if (booking.payments && booking.payments.length > 0) {
      const total = booking.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      return total;
    }
    
    // Nếu không có payments, thử tính từ các phí
    if (booking.total_price > 0 || booking.deposit_amount > 0 || booking.late_fee > 0 || booking.damage_fee > 0) {
      const total = (booking.total_price || 0) + (booking.late_fee || 0) + (booking.damage_fee || 0) + (booking.other_fees || 0);
      
      return total;
    }
    
    
    return 0;
  };

  const getDepositAmount = (): number => {
    if (!booking) return 0;
    
    // Nếu API trả về deposit_amount > 0, dùng luôn
    if (booking.deposit_amount && booking.deposit_amount > 0) {
      return booking.deposit_amount;
    }
    
    // Nếu thuê >= 3 ngày, tính 50% tổng giá
    if (booking.total_days >= 3) {
      return booking.total_price * 0.5;
    }
    
    return 0;
  };

  const translateCancellationReason = (reason: string): string => {
    const translations: { [key: string]: string } = {
      'Auto-cancelled due to expiration': 'Tự động hủy do hết hạn',
      'Cancelled by user': 'Người dùng hủy',
      'Cancelled by admin': 'Quản trị viên hủy',
      'Payment not completed': 'Chưa hoàn thành thanh toán',
      'Vehicle not available': 'Xe không khả dụng',
      'Station closed': 'Trạm đóng cửa',
      'User request': 'Theo yêu cầu của khách hàng',
    };
    return translations[reason] || reason;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Đang tải...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy thông tin đặt xe</Text>
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
        <Text style={styles.headerTitle}>Chi tiết đặt xe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Booking Code & Status */}
          <View style={styles.codeSection}>
            <Text style={styles.bookingCode}>{booking.code}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
              {getStatusIcon(booking.status)}
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {getStatusText(booking.status)}
              </Text>
            </View>
          </View>

          {/* QR Code */}
          {booking.qr_code && booking.status !== 'cancelled' && (
            <View style={styles.qrSection}>
              <Text style={styles.sectionTitle}>Mã QR nhận xe</Text>
              <View style={styles.qrContainer}>
                <QRCode
                  value={booking.qr_code}
                  size={200}
                  color="#000"
                  backgroundColor="#fff"
                />
                <Text style={styles.qrCode}>{booking.qr_code}</Text>
              </View>
            </View>
          )}

          {/* Vehicle Info */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <FontAwesome5 name="motorcycle" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Thông tin xe</Text>
            </View>
            <View style={styles.vehicleCard}>
              {booking.vehicle_id.images && booking.vehicle_id.images.length > 0 && (
                <Image
                  source={{ uri: booking.vehicle_id.images[0] }}
                  style={styles.vehicleImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleNameRow}>
                  <FontAwesome5 name="motorcycle" size={18} color={colors.primary} />
                  <Text style={styles.vehicleName}>
                    {booking.vehicle_id.brand} {booking.vehicle_id.model}
                  </Text>
                </View>
                <Text style={styles.vehicleDetail}>
                  Biển số: {booking.vehicle_id.license_plate}
                </Text>
                <Text style={styles.vehicleDetail}>
                  Màu: {booking.vehicle_id.color} • Năm: {booking.vehicle_id.year}
                </Text>
              </View>
            </View>
          </View>

          {/* Station Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trạm thuê xe</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MapPin size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.stationName}>{booking.station_id.name}</Text>
                  <Text style={styles.stationAddress}>{booking.station_id.address}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Phone size={20} color={colors.primary} />
                <Text style={styles.contactText}>{booking.station_id.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Clock size={20} color={colors.primary} />
                <Text style={styles.contactText}>
                  {booking.station_id.opening_time} - {booking.station_id.closing_time}
                </Text>
              </View>
            </View>
          </View>

          {/* Rental Period */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian thuê</Text>
            <View style={styles.timeCard}>
              <View style={styles.timeRow}>
                <Calendar size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.timeLabel}>Ngày nhận xe</Text>
                  <Text style={styles.timeValue}>
                    {formatDateOnly(booking.start_date)} • {booking.pickup_time}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.timeRow}>
                <Calendar size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.timeLabel}>Ngày trả xe</Text>
                  <Text style={styles.timeValue}>
                    {formatDateOnly(booking.end_date)} • {booking.return_time}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Price Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết giá</Text>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Số ngày thuê:</Text>
                <Text style={styles.priceValue}>{booking.total_days} ngày</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Giá thuê/ngày:</Text>
                <Text style={styles.priceValue}>{formatPrice(booking.price_per_day)}</Text>
              </View>
              {getDepositAmount() > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Đặt cọc (50%):</Text>
                  <Text style={[styles.priceValue, { color: '#F59E0B', fontWeight: '700' }]}>
                    {formatPrice(getDepositAmount())}
                  </Text>
                </View>
              )}
              {booking.late_fee > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Phí trễ hạn:</Text>
                  <Text style={[styles.priceValue, { color: '#EF4444' }]}>
                    {formatPrice(booking.late_fee)}
                  </Text>
                </View>
              )}
              {booking.damage_fee > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Phí hư hỏng:</Text>
                  <Text style={[styles.priceValue, { color: '#EF4444' }]}>
                    {formatPrice(booking.damage_fee)}
                  </Text>
                </View>
              )}
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  {formatPrice(getTotalPrice())}
                </Text>
              </View>
            </View>
          </View>

          {/* Payments Details */}
          {booking.payments && booking.payments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💳 Lịch sử thanh toán</Text>
              <View style={styles.paymentsCard}>
                {booking.payments.map((payment, idx) => (
                  <View key={payment._id || idx} style={styles.paymentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentMethod}>
                        {payment.payment_method === 'vnpay' ? 'VNPay' : 
                         payment.payment_method === 'cash' ? 'Tiền mặt' :
                         payment.payment_method === 'momo' ? 'MoMo' : 
                         payment.payment_method}
                      </Text>
                      <Text style={styles.paymentType}>
                        {payment.payment_type === 'rental_fee' ? 'Tiền thuê xe' :
                         payment.payment_type === 'additional_fee' ? 'Phí phát sinh' :
                         payment.payment_type === 'deposit' ? 'Đặt cọc' :
                         payment.payment_type}
                      </Text>
                    </View>
                    <Text style={[
                      styles.paymentAmount,
                      { color: payment.status === 'completed' ? '#10B981' : '#F59E0B' }
                    ]}>
                      {formatPrice(payment.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contract Actions - Placed after Price Details */}
          {contractId && ['confirmed', 'active', 'completed'].includes(booking.status) ? (
            <View style={styles.section}>
              <View style={styles.contractActions}>
                <TouchableOpacity
                  style={[styles.contractButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push({
                    pathname: '/contract-view',
                    params: { id: contractId, mode: 'html' }
                  })}
                >
                  <FileText size={20} color="#fff" />
                  <Text style={styles.contractButtonText}>Xem hợp đồng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contractButton, { backgroundColor: '#10B981' }]}
                  onPress={() => {
                    if (rentalId) {
                      router.push({
                        pathname: '/rental-details',
                        params: { id: rentalId }
                      });
                    } else {
                      Alert.alert('Thông báo', 'Chưa có thông tin thuê xe. Bạn cần nhận xe trước.');
                    }
                  }}
                >
                  <Eye size={20} color="#fff" />
                  <Text style={styles.contractButtonText}>Xem Chi tiết thuê xe</Text>
                </TouchableOpacity>
              </View>
              
              {/* Rebook Button for Completed Bookings */}
              {booking.status === 'completed' && (
                <TouchableOpacity
                  style={[styles.rebookButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    router.push({
                      pathname: '/booking',
                      params: {
                        brand: booking.vehicle_id.brand,
                        model: booking.vehicle_id.model,
                        color: booking.vehicle_id.color,
                        stationId: booking.station_id._id,
                        stationName: booking.station_id.name,
                        pricePerDay: booking.price_per_day.toString(),
                        depositPercentage: '50', // Always 50% for >= 3 days rental
                      }
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <FontAwesome5 name="redo" size={18} color="#fff" />
                  <Text style={styles.rebookButtonText}>Thuê xe lại</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : loadingContract ? (
            <View style={styles.section}>
              <View style={[styles.contractInfo, { backgroundColor: '#E0F2FE' }]}>
                <ActivityIndicator size="small" color="#0284C7" />
                <Text style={[styles.contractInfoText, { color: '#075985' }]}>
                  Đang tìm hợp đồng...
                </Text>
              </View>
            </View>
          ) : booking.status === 'pending' ? (
            <View style={styles.section}>
              <View style={[styles.contractInfo, { backgroundColor: '#FEF3C7' }]}>
                <FileText size={20} color="#F59E0B" />
                <Text style={[styles.contractInfoText, { color: '#92400E' }]}>
                  Hợp đồng sẽ có sau khi đơn được xác nhận
                </Text>
              </View>
            </View>
          ) : ['confirmed', 'active', 'completed'].includes(booking.status) ? (
            <View style={styles.section}>
              <View style={[styles.contractInfo, { backgroundColor: '#FEF3C7' }]}> 
                <AlertCircle size={20} color="#F59E0B" />
                <Text style={[styles.contractInfoText, { color: '#92400E' }]}> 
                  Hợp đồng đang được xử lý, vui lòng thử lại sau
                </Text>
              </View>
            </View>
          ) : null}

          {/* Report Issue Button for Confirmed Bookings - Chỉ hiện nếu chưa có báo cáo pending */}
          {booking.status === 'confirmed' && !hasPendingReport && !checkingReport && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.reportButton, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  router.push({
                    pathname: '/submit-report',
                    params: {
                      bookingId: booking._id,
                      rentalId: rentalId || '',
                    }
                  });
                }}
                activeOpacity={0.8}
              >
                <AlertTriangle size={20} color="#fff" />
                <Text style={styles.reportButtonText}>Báo cáo sự cố</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* View Reports Button - Hiện nếu đã có báo cáo */}
          {hasAnyReport && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.viewReportsButton, { backgroundColor: '#3B82F6' }]}
                onPress={() => {
                  router.push('/my-reports');
                }}
                activeOpacity={0.8}
              >
                <Eye size={20} color="#fff" />
                <Text style={styles.viewReportsButtonText}>Xem báo cáo sự cố</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notes */}
          {(booking.special_requests || booking.notes) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ghi chú</Text>
              <View style={styles.notesCard}>
                {booking.special_requests && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.notesLabel}>Yêu cầu đặc biệt:</Text>
                    <Text 
                      style={styles.notesText}
                      numberOfLines={expandedNotes ? undefined : 3}
                    >
                      {booking.special_requests}
                    </Text>
                    {booking.special_requests.length > 100 && (
                      <TouchableOpacity 
                        onPress={() => setExpandedNotes(!expandedNotes)}
                        style={{ marginTop: 4 }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                          {expandedNotes ? 'Thu gọn' : '...xem thêm'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {booking.notes && (
                  <View>
                    <Text style={styles.notesLabel}>Ghi chú:</Text>
                    <Text 
                      style={styles.notesText}
                      numberOfLines={expandedNotes ? undefined : 3}
                    >
                      {booking.notes}
                    </Text>
                    {booking.notes.length > 100 && (
                      <TouchableOpacity 
                        onPress={() => setExpandedNotes(!expandedNotes)}
                        style={{ marginTop: 4 }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                          {expandedNotes ? 'Thu gọn' : '...xem thêm'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Cancel Reason */}
          {booking.cancellation_reason && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lý do hủy</Text>
              <View style={[styles.notesCard, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.notesText, { color: '#991B1B' }]}>
                  {translateCancellationReason(booking.cancellation_reason)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit and Cancel Buttons */}
      {(canEdit || canCancel) && (
        <View style={styles.bottomContainer}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={handleEditBooking}
            >
              <Text style={styles.editButtonText}>Chỉnh sửa đặt xe</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: '#EF4444', marginTop: canEdit ? 12 : 0 }]}
              onPress={handleCancelBooking}
              disabled={canceling}
            >
              <Text style={[styles.cancelButtonText, { color: '#EF4444' }]}>
                {canceling ? 'Đang hủy...' : 'Hủy đặt xe'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Cancel Reason Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Hủy đặt xe
            </Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Vui lòng cho biết lý do hủy đặt xe:
            </Text>

            {/* Warning about holding fee */}
            <View style={styles.warningBox}>
              <AlertCircle size={18} color="#F59E0B" />
              <Text style={styles.warningBoxText}>
                Nếu hủy thì bạn sẽ mất 50.000đ phí giữ chỗ
              </Text>
            </View>
            
            <TextInput
              style={[styles.reasonInput, { 
                color: colors.text, 
                borderColor: colors.border,
                backgroundColor: colors.background
              }]}
              placeholder="Nhập lý do hủy (bắt buộc)"
              placeholderTextColor={colors.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Không</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={confirmCancelBooking}
              >
                <Text style={styles.confirmModalButtonText}>Hủy đặt xe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  codeSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingCode: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  qrSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  qrCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  qrExpiry: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
  },
  vehicleInfo: {
    padding: 16,
  },
  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  vehicleDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  contactText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 12,
  },
  timeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  priceCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
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
  paymentsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentMethod: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  paymentType: {
    fontSize: 13,
    color: '#6B7280',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    flexShrink: 1,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  contractActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contractButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  contractButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  rebookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  contractInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  contractInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  warningBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 18,
    fontWeight: '600',
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmModalButton: {
    backgroundColor: '#EF4444',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  viewReportsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});