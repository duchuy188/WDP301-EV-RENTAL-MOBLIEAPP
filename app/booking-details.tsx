import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
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
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useThemeStore } from '@/store/themeStore';
import { bookingAPI } from '@/api/bookingAPI';
import { contractAPI } from '@/api/contractAPI';

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
}

export default function BookingDetailsScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBooking(bookingId);
      setBooking(response.booking);
      setCanCancel(response.canCancel || false);
      console.log('Booking details:', response);
      console.log('Contract ID from booking:', response.booking.contract_id);
      console.log('Booking status:', response.booking.status);
      
      // If booking has contract_id, use it
      if (response.booking.contract_id) {
        setContractId(response.booking.contract_id);
      } else {
        // Otherwise, try to find contract - pass booking data directly
        loadContractByBookingData(response.booking);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đặt xe');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadContractByBookingData = async (bookingData: any) => {
    try {
      setLoadingContract(true);
      
      // Get all contracts and find by customer + vehicle + station
      const response = await contractAPI.getContracts({ limit: 100 });
      console.log('🔍 Searching contract for booking:', bookingData.code);
      console.log('Total contracts:', response.data?.contracts?.length || 0);
      
      if (response.data?.contracts && response.data.contracts.length > 0) {
        const userId = bookingData.user_id?._id || bookingData.user_id;
        const vehicleId = bookingData.vehicle_id?._id || bookingData.vehicle_id;
        const stationId = bookingData.station_id?._id || bookingData.station_id;
        
        console.log('🔎 Looking for contract with:');
        console.log('  - Customer ID:', userId);
        console.log('  - Vehicle ID:', vehicleId);
        console.log('  - Station ID:', stationId);
        
        // Find contract matching customer, vehicle, and station
        const matchingContract = response.data.contracts.find(
          (contract: any) => {
            const matchCustomer = contract.customer?._id === userId;
            const matchVehicle = contract.vehicle?._id === vehicleId;
            const matchStation = contract.station?._id === stationId;
            
            console.log(`Checking contract ${contract.code}:`, {
              matchCustomer,
              matchVehicle,
              matchStation,
              contractCustomer: contract.customer?._id,
              contractVehicle: contract.vehicle?._id,
              contractStation: contract.station?._id,
            });
            
            return matchCustomer && matchVehicle && matchStation;
          }
        );
        
        if (matchingContract) {
          setContractId(matchingContract._id);
          console.log('✅ Found contract!');
          console.log('  - Contract ID:', matchingContract._id);
          console.log('  - Contract Code:', matchingContract.code);
          console.log('  - Status:', matchingContract.status);
        } else {
          console.log('❌ No matching contract found');
        }
      }
    } catch (error) {
      console.error('❌ Error loading contract:', error);
    } finally {
      setLoadingContract(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Hủy đặt xe',
      'Bạn có chắc chắn muốn hủy đặt xe này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đặt xe',
          style: 'destructive',
          onPress: confirmCancelBooking,
        },
      ]
    );
  };

  const confirmCancelBooking = async () => {
    try {
      setCanceling(true);
      await bookingAPI.cancelBooking(bookingId, { reason: 'Khách hàng yêu cầu hủy' });
      Alert.alert('Thành công', 'Đã hủy đặt xe thành công', [
        { text: 'OK', onPress: () => router.push('/(tabs)/history') },
      ]);
    } catch (error: any) {
      console.error('Error canceling booking:', error);
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

  const getDepositAmount = (): number => {
    if (!booking) return 0;
    
    // Nếu API trả về deposit_amount > 0, dùng luôn
    if (booking.deposit_amount && booking.deposit_amount > 0) {
      return booking.deposit_amount;
    }
    
    // Nếu thuê >= 2 ngày, tính 50% tổng giá
    if (booking.total_days >= 2) {
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
          onPress={() => router.push('/(tabs)/history')}
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

          {/* Contract Actions - Placed prominently */}
          {contractId && ['confirmed', 'active', 'completed'].includes(booking.status) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📄 Hợp đồng thuê xe</Text>
              <View style={styles.contractActions}>
                <TouchableOpacity
                  style={[styles.contractButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push({
                    pathname: '/contract-view',
                    params: { id: contractId, mode: 'html' }
                  })}
                >
                  <Eye size={20} color="#fff" />
                  <Text style={styles.contractButtonText}>Xem hợp đồng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contractButton, { backgroundColor: '#10B981' }]}
                  onPress={() => router.push({
                    pathname: '/contract-view',
                    params: { id: contractId, mode: 'pdf' }
                  })}
                >
                  <Download size={20} color="#fff" />
                  <Text style={styles.contractButtonText}>Tải PDF</Text>
                </TouchableOpacity>
              </View>
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
              {/* Test button - Remove this later */}
              <TouchableOpacity
                style={[styles.contractButton, { backgroundColor: '#6366F1', marginTop: 12 }]}
                onPress={() => {
                  Alert.alert(
                    'Test xem PDF',
                    'Sẽ mở PDF mẫu từ hệ thống',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Xem',
                        onPress: () => router.push({
                          pathname: '/contract-view',
                          params: { id: '68fde17bab91b59ebb0b8412', mode: 'pdf' }
                        })
                      }
                    ]
                  );
                }}
              >
                <FileText size={20} color="#fff" />
                <Text style={styles.contractButtonText}>🧪 Test xem PDF mẫu</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
                {booking.qr_expires_at && (
                  <Text style={styles.qrExpiry}>Hết hạn: {booking.qr_expires_at}</Text>
                )}
              </View>
            </View>
          )}

          {/* Vehicle Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin xe</Text>
            <View style={styles.vehicleCard}>
              {booking.vehicle_id.images && booking.vehicle_id.images.length > 0 && (
                <Image
                  source={{ uri: booking.vehicle_id.images[0] }}
                  style={styles.vehicleImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {booking.vehicle_id.brand} {booking.vehicle_id.model}
                </Text>
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
                    {booking.start_date} • {booking.pickup_time}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.timeRow}>
                <Calendar size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.timeLabel}>Ngày trả xe</Text>
                  <Text style={styles.timeValue}>
                    {booking.end_date} • {booking.return_time}
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
                  {formatPrice(booking.total_price)}
                </Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {(booking.special_requests || booking.notes) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ghi chú</Text>
              <View style={styles.notesCard}>
                {booking.special_requests && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.notesLabel}>Yêu cầu đặc biệt:</Text>
                    <Text style={styles.notesText}>{booking.special_requests}</Text>
                  </View>
                )}
                {booking.notes && (
                  <View>
                    <Text style={styles.notesLabel}>Ghi chú:</Text>
                    <Text style={styles.notesText}>{booking.notes}</Text>
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

      {/* Cancel Button */}
      {canCancel && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: '#EF4444' }]}
            onPress={handleCancelBooking}
            disabled={canceling}
          >
            <Text style={[styles.cancelButtonText, { color: '#EF4444' }]}>
              {canceling ? 'Đang hủy...' : 'Hủy đặt xe'}
            </Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
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
  notesCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
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
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
});

