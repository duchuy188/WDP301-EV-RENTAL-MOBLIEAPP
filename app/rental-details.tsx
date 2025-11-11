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
  Modal,
  Dimensions,
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
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Car,
  Gauge,
  Battery,
  Sparkles,
  Hash,
  CreditCard,
  UserCheck,
  Camera,
  Star,
  Eye,
  X,
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { rentalAPI } from '@/api/rentalsAPI';
import { feedbackAPI } from '@/api/feedbackAPI';
import { Rental } from '@/types/rentals';
import { Feedback } from '@/types/feedback';

export default function RentalDetailsScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const rentalId = params.id as string;

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [expandedBeforeNotes, setExpandedBeforeNotes] = useState(false);
  const [expandedAfterNotes, setExpandedAfterNotes] = useState(false);

  useEffect(() => {
    loadRentalDetails();
  }, [rentalId]);

  // Reload feedback khi quay lại trang (sau khi submit feedback)
  useFocusEffect(
    React.useCallback(() => {
      checkExistingFeedback();
    }, [rentalId])
  );

  const loadRentalDetails = async () => {
    try {
      setLoading(true);
      const response = await rentalAPI.getRentalById(rentalId);
      
      const rentalData = response.data || response.rental || response;
      
      
      if (rentalData.payments && rentalData.payments.length > 0) {
        const total = rentalData.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        
      }
      setRental(rentalData);
    } catch (error) {
      
      Alert.alert('Lỗi', 'Không thể tải thông tin thuê xe');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkExistingFeedback = async () => {
    try {
      setLoadingFeedback(true);
      
      const feedback = await feedbackAPI.getFeedbackByRental(rentalId);
      
      
      
      
      
      setExistingFeedback(feedback);
    } catch (error) {
      
      setExistingFeedback(null);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'payment':
        return 'Thanh toán';
      case 'vehicle':
        return 'Xe';
      case 'staff':
        return 'Nhân viên';
      case 'service':
        return 'Dịch vụ';
      case 'other':
        return 'Khác';
      default:
        return category;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'Xuất sắc';
      case 'good':
        return 'Tốt';
      case 'fair':
        return 'Khá';
      case 'poor':
        return 'Kém';
      default:
        return condition;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'pending_payment':
        return '#F59E0B';
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
      case 'active':
        return 'Đang thuê';
      case 'pending_payment':
        return 'Chờ thanh toán';
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
      case 'active':
      case 'pending_payment':
        return <Clock size={20} color="#F59E0B" />;
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'vnpay':
        return 'VNPay';
      case 'cash':
        return 'Tiền mặt';
      case 'momo':
        return 'MoMo';
      case 'bank_transfer':
        return 'Chuyển khoản';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Đang tải...</Text>
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy thông tin thuê xe</Text>
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
        <Text style={styles.headerTitle}>Chi tiết thuê xe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Code & Status */}
          <View style={styles.codeSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Hash size={20} color="#6B7280" />
              <Text style={styles.rentalCode}>{rental.code}</Text>
            </View>
            {rental.booking_id && typeof rental.booking_id !== 'string' && rental.booking_id.code && (
              <TouchableOpacity
                onPress={() => {
                  const bookingId = typeof rental.booking_id === 'string' ? rental.booking_id : rental.booking_id._id;
                  if (bookingId) {
                    router.push({
                      pathname: '/booking-details',
                      params: { id: bookingId }
                    });
                  }
                }}
                style={{ marginBottom: 8 }}
              >
                <Text style={styles.bookingLink}>📋 Booking: {rental.booking_id.code}</Text>
              </TouchableOpacity>
            )}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rental.status) + '20' }]}>
              {getStatusIcon(rental.status)}
              <Text style={[styles.statusText, { color: getStatusColor(rental.status) }]}>
                {getStatusText(rental.status)}
              </Text>
            </View>
          </View>

          {/* Thông tin chi tiết */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Thông tin chi tiết</Text>
            
            {/* Người thuê */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <User size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.infoLabel}>Người thuê</Text>
                  <Text style={styles.infoValue}>
                    {typeof rental.user_id === 'string' ? rental.user_id : rental.user_id?.fullname ?? '-'}
                  </Text>
                  {typeof rental.user_id !== 'string' && rental.user_id?.email && (
                    <Text style={styles.infoSubValue}>{rental.user_id.email}</Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Xe */}
              <View style={styles.infoRow}>
                <FontAwesome5 name="motorcycle" size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.infoLabel}>Xe</Text>
                  <Text style={styles.infoValue}>
                    {typeof rental.vehicle_id === 'string' 
                      ? rental.vehicle_id 
                      : rental.vehicle_id?.name ?? rental.vehicle_id?.license_plate ?? '-'}
                  </Text>
                  {typeof rental.vehicle_id !== 'string' && rental.vehicle_id?.model && (
                    <Text style={styles.infoSubValue}>{rental.vehicle_id.model}</Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Trạm */}
              <View style={styles.infoRow}>
                <MapPin size={20} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.infoLabel}>Trạm thuê xe</Text>
                  <Text style={styles.infoValue}>
                    {typeof rental.station_id === 'string' ? rental.station_id : rental.station_id?.name ?? '-'}
                  </Text>
                  {typeof rental.station_id !== 'string' && rental.station_id?.address && (
                    <Text style={styles.infoSubValue}>{rental.station_id.address}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Thời gian thuê */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕐 Thời gian thuê</Text>
            <View style={styles.timeCard}>
              <View style={styles.timeRow}>
                <Calendar size={20} color="#10B981" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.timeLabel}>Bắt đầu</Text>
                  <Text style={styles.timeValue}>{formatDate(rental.actual_start_time)}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.timeRow}>
                <Calendar size={20} color="#EF4444" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.timeLabel}>Kết thúc</Text>
                  <Text style={styles.timeValue}>{formatDate(rental.actual_end_time)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Nhân viên xử lý */}
          {(rental.pickup_staff_id || rental.return_staff_id) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Nhân viên xử lý</Text>
              <View style={styles.infoCard}>
                {rental.pickup_staff_id && (
                  <>
                    <View style={styles.infoRow}>
                      <UserCheck size={20} color="#10B981" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.infoLabel}>Nhân viên nhận xe</Text>
                        <Text style={styles.infoValue}>
                          {typeof rental.pickup_staff_id === 'string' 
                            ? rental.pickup_staff_id 
                            : rental.pickup_staff_id?.fullname ?? '-'}
                        </Text>
                      </View>
                    </View>
                    {rental.return_staff_id && <View style={styles.divider} />}
                  </>
                )}
                {rental.return_staff_id && (
                  <View style={styles.infoRow}>
                    <UserCheck size={20} color="#EF4444" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.infoLabel}>Nhân viên trả xe</Text>
                      <Text style={styles.infoValue}>
                        {typeof rental.return_staff_id === 'string' 
                          ? rental.return_staff_id 
                          : rental.return_staff_id?.fullname ?? '-'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Tổng phí */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Tổng phí</Text>
            <View style={styles.priceCard}>
              <View style={styles.totalPriceRow}>
                <CreditCard size={24} color={colors.primary} />
                <Text style={[styles.totalPrice, { color: colors.primary }]}>
                  {(() => {
                    // Ưu tiên 1: Từ payments
                    if (rental.payments && rental.payments.length > 0) {
                      const total = rental.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                      return formatPrice(total);
                    }
                    
                    // Ưu tiên 2: Từ booking_id.total_price
                    if (typeof rental.booking_id !== 'string' && rental.booking_id?.total_price) {
                      return formatPrice(rental.booking_id.total_price);
                    }
                    
                    // Ưu tiên 3: Từ total_fees
                    if (rental.total_fees > 0) {
                      return formatPrice(rental.total_fees);
                    }
                    
                    // Ưu tiên 4: Tính từ các phí
                    const calculatedTotal = (rental.late_fee || 0) + (rental.damage_fee || 0) + (rental.other_fees || 0);
                    return formatPrice(calculatedTotal);
                  })()}
                </Text>
              </View>

              {/* Chi tiết phí */}
              {(typeof rental.booking_id !== 'string' && rental.booking_id?.total_price) && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.priceDetailRow}>
                    <Text style={styles.priceDetailLabel}>Tiền thuê xe:</Text>
                    <Text style={styles.priceDetailValue}>
                      {formatPrice(rental.booking_id.total_price)}
                    </Text>
                  </View>
                </View>
              )}
              
              {rental.payments && rental.payments.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  {rental.payments.map((payment, idx) => (
                    <View key={payment._id || idx} style={styles.paymentRow}>
                      <Text style={styles.paymentMethod}>{getPaymentMethodLabel(payment.payment_method)}</Text>
                      <Text style={[
                        styles.paymentAmount,
                        { color: payment.status === 'completed' ? '#10B981' : '#F59E0B' }
                      ]}>
                        {formatPrice(payment.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {(rental.late_fee > 0 || rental.damage_fee > 0 || rental.other_fees > 0) && (
                <>
                  <View style={styles.divider} />
                  {rental.late_fee > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Phí trễ hạn:</Text>
                      <Text style={[styles.priceValue, { color: '#EF4444' }]}>
                        {formatPrice(rental.late_fee)}
                      </Text>
                    </View>
                  )}
                  {rental.damage_fee > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Phí hư hỏng:</Text>
                      <Text style={[styles.priceValue, { color: '#EF4444' }]}>
                        {formatPrice(rental.damage_fee)}
                      </Text>
                    </View>
                  )}
                  {rental.other_fees > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Phí khác:</Text>
                      <Text style={[styles.priceValue, { color: '#EF4444' }]}>
                        {formatPrice(rental.other_fees)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Tình trạng xe */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <FontAwesome5 name="motorcycle" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Tình trạng xe</Text>
            </View>
            <View style={styles.conditionContainer}>
              {/* Lúc nhận */}
              <View style={styles.conditionCard}>
                <View style={styles.conditionHeader}>
                  <Sparkles size={16} color="#F59E0B" />
                  <Text style={styles.conditionTitle}>Lúc nhận</Text>
                </View>
                <View style={styles.conditionRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Gauge size={16} color="#6B7280" />
                    <Text style={styles.conditionLabel}>Km:</Text>
                  </View>
                  <Text style={styles.conditionValue}>{rental.vehicle_condition_before?.mileage ?? '-'}</Text>
                </View>
                <View style={styles.conditionRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Battery size={16} color="#6B7280" />
                    <Text style={styles.conditionLabel}>Pin:</Text>
                  </View>
                  <Text style={styles.conditionValue}>{rental.vehicle_condition_before?.battery_level ?? '-'}%</Text>
                </View>
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Ngoại thất:</Text>
                  <Text style={styles.conditionValue}>
                    {rental.vehicle_condition_before?.exterior_condition 
                      ? getConditionLabel(rental.vehicle_condition_before.exterior_condition) 
                      : '-'}
                  </Text>
                </View>
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Nội thất:</Text>
                  <Text style={styles.conditionValue}>
                    {rental.vehicle_condition_before?.interior_condition 
                      ? getConditionLabel(rental.vehicle_condition_before.interior_condition) 
                      : '-'}
                  </Text>
                </View>
                
                {/* Ghi chú lúc nhận */}
                {rental.vehicle_condition_before?.notes && (
                  <View style={[styles.notesCard, { backgroundColor: '#F9FAFB', marginTop: 12, width: '100%' }]}>
                    <Text style={styles.notesLabel}>Ghi chú:</Text>
                    <Text 
                      style={styles.notesText} 
                      numberOfLines={expandedBeforeNotes ? undefined : 3}
                    >
                      {rental.vehicle_condition_before.notes}
                    </Text>
                    {rental.vehicle_condition_before.notes.length > 100 && (
                      <TouchableOpacity 
                        onPress={() => setExpandedBeforeNotes(!expandedBeforeNotes)}
                        style={{ marginTop: 4 }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                          {expandedBeforeNotes ? 'Thu gọn' : '...xem thêm'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                {/* Ảnh lúc nhận */}
                {rental.images_before && rental.images_before.length > 0 && (
                  <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Camera size={14} color="#6B7280" />
                      <Text style={[styles.conditionLabel, { marginLeft: 6 }]}>Ảnh nhận xe</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {rental.images_before.map((img, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            setSelectedImages(rental.images_before || []);
                            setSelectedImageIndex(idx);
                            setImageModalVisible(true);
                          }}
                          style={styles.imageContainer}
                        >
                          <Image
                            source={{ uri: img }}
                            style={styles.vehicleImage}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlay}>
                            <Eye size={32} color="#fff" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Lúc trả */}
              <View style={styles.conditionCard}>
                <View style={styles.conditionHeader}>
                  <Sparkles size={16} color="#10B981" />
                  <Text style={styles.conditionTitle}>Lúc trả</Text>
                </View>
                <View style={styles.conditionRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Gauge size={16} color="#6B7280" />
                    <Text style={styles.conditionLabel}>Km:</Text>
                  </View>
                  <Text style={styles.conditionValue}>{rental.vehicle_condition_after?.mileage ?? '-'}</Text>
                </View>
                <View style={styles.conditionRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Battery size={16} color="#6B7280" />
                    <Text style={styles.conditionLabel}>Pin:</Text>
                  </View>
                  <Text style={styles.conditionValue}>{rental.vehicle_condition_after?.battery_level ?? '-'}%</Text>
                </View>
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Ngoại thất:</Text>
                  <Text style={styles.conditionValue}>
                    {rental.vehicle_condition_after?.exterior_condition 
                      ? getConditionLabel(rental.vehicle_condition_after.exterior_condition) 
                      : '-'}
                  </Text>
                </View>
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Nội thất:</Text>
                  <Text style={styles.conditionValue}>
                    {rental.vehicle_condition_after?.interior_condition 
                      ? getConditionLabel(rental.vehicle_condition_after.interior_condition) 
                      : '-'}
                  </Text>
                </View>
                
                {/* Ghi chú lúc trả */}
                {rental.vehicle_condition_after?.notes && (
                  <View style={[styles.notesCard, { backgroundColor: '#F9FAFB', marginTop: 12, width: '100%' }]}>
                    <Text style={styles.notesLabel}>Ghi chú:</Text>
                    <Text 
                      style={styles.notesText} 
                      numberOfLines={expandedAfterNotes ? undefined : 3}
                    >
                      {rental.vehicle_condition_after.notes}
                    </Text>
                    {rental.vehicle_condition_after.notes.length > 100 && (
                      <TouchableOpacity 
                        onPress={() => setExpandedAfterNotes(!expandedAfterNotes)}
                        style={{ marginTop: 4 }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                          {expandedAfterNotes ? 'Thu gọn' : '...xem thêm'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                {/* Ảnh lúc trả */}
                {rental.images_after && rental.images_after.length > 0 && (
                  <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Camera size={14} color="#6B7280" />
                      <Text style={[styles.conditionLabel, { marginLeft: 6 }]}>Ảnh trả xe</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {rental.images_after.map((img, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            setSelectedImages(rental.images_after || []);
                            setSelectedImageIndex(idx);
                            setImageModalVisible(true);
                          }}
                          style={styles.imageContainer}
                        >
                          <Image
                            source={{ uri: img }}
                            style={styles.vehicleImage}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlay}>
                            <Eye size={32} color="#fff" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Ghi chú */}
          {(rental.staff_notes || rental.customer_notes) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Ghi chú</Text>
              {rental.staff_notes && (
                <View style={[styles.notesCard, { backgroundColor: '#FEF3C7', marginBottom: 8 }]}>
                  <Text style={styles.notesLabel}>Nhân viên</Text>
                  <Text style={styles.notesText}>{rental.staff_notes}</Text>
                </View>
              )}
              {rental.customer_notes && (
                <View style={[styles.notesCard, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={styles.notesLabel}>Khách hàng</Text>
                  <Text style={styles.notesText}>{rental.customer_notes}</Text>
                </View>
              )}
            </View>
          )}

          {/* Button đánh giá - Chỉ hiện khi completed */}
          {rental.status === 'completed' && !loadingFeedback && (
            <View style={styles.section}>
              {existingFeedback ? (
                // Đã có feedback - hiển thị button xem
                <TouchableOpacity
                  style={[
                    styles.reviewButton,
                    { 
                      backgroundColor: existingFeedback.type === 'rating' ? '#3B82F6' : '#EF4444'
                    }
                  ]}
                  onPress={() => {
                    setFeedbackModalVisible(true);
                  }}
                >
                  <Eye size={20} color="#fff" />
                  <Text style={styles.reviewButtonText}>
                    {existingFeedback.type === 'rating' ? 'Xem đánh giá của bạn' : 'Xem khiếu nại của bạn'}
                  </Text>
                </TouchableOpacity>
              ) : (
                // Chưa có feedback - hiển thị button đánh giá
                <TouchableOpacity
                  style={[styles.reviewButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Alert.alert(
                      '⭐ Đánh giá',
                      'Bạn muốn đánh giá chuyến thuê xe này?',
                      [
                        { text: 'Để sau', style: 'cancel' },
                        { 
                          text: 'Đánh giá ngay',
                          onPress: () => {
                            router.push({
                              pathname: '/submit-feedback',
                              params: { rentalId: rental._id }
                            });
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Star size={20} color="#fff" />
                  <Text style={styles.reviewButtonText}>Đánh giá chuyến thuê xe</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Feedback Detail Modal */}
      <Modal
        visible={feedbackModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={styles.feedbackModalContainer}>
            {/* Header */}
            <View style={styles.feedbackModalHeader}>
              <Text style={styles.feedbackModalTitle}>
                {existingFeedback?.type === 'rating' ? '⭐ Đánh giá của bạn' : '🚨 Khiếu nại của bạn'}
              </Text>
              <TouchableOpacity
                onPress={() => setFeedbackModalVisible(false)}
                style={styles.feedbackModalCloseButton}
              >
                <X size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.feedbackModalContent}>
              {existingFeedback?.type === 'rating' ? (
                // Rating details
                <View>
                  {/* Overall Rating */}
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>Đánh giá tổng thể</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={32}
                          color="#FCD34D"
                          fill={star <= (existingFeedback.overall_rating || 0) ? '#FCD34D' : 'transparent'}
                        />
                      ))}
                      <Text style={{ fontSize: 18, fontWeight: '700', marginLeft: 8 }}>
                        {existingFeedback.overall_rating}/5
                      </Text>
                    </View>
                  </View>

                  {/* Other ratings */}
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackSectionTitle}>Chi tiết đánh giá</Text>
                    {existingFeedback.staff_service && (
                      <View style={styles.ratingDetailRow}>
                        <Text style={styles.ratingDetailLabel}>Dịch vụ nhân viên:</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              color={star <= (existingFeedback.staff_service || 0) ? '#FCD34D' : '#D1D5DB'}
                              fill={star <= (existingFeedback.staff_service || 0) ? '#FCD34D' : 'transparent'}
                            />
                          ))}
                          <Text style={{ fontSize: 14, marginLeft: 4 }}>{existingFeedback.staff_service}/5</Text>
                        </View>
                      </View>
                    )}
                    {existingFeedback.vehicle_condition && (
                      <View style={styles.ratingDetailRow}>
                        <Text style={styles.ratingDetailLabel}>Tình trạng xe:</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              color={star <= (existingFeedback.vehicle_condition || 0) ? '#FCD34D' : '#D1D5DB'}
                              fill={star <= (existingFeedback.vehicle_condition || 0) ? '#FCD34D' : 'transparent'}
                            />
                          ))}
                          <Text style={{ fontSize: 14, marginLeft: 4 }}>{existingFeedback.vehicle_condition}/5</Text>
                        </View>
                      </View>
                    )}
                    {existingFeedback.station_cleanliness && (
                      <View style={styles.ratingDetailRow}>
                        <Text style={styles.ratingDetailLabel}>Vệ sinh trạm:</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              color={star <= (existingFeedback.station_cleanliness || 0) ? '#FCD34D' : '#D1D5DB'}
                              fill={star <= (existingFeedback.station_cleanliness || 0) ? '#FCD34D' : 'transparent'}
                            />
                          ))}
                          <Text style={{ fontSize: 14, marginLeft: 4 }}>{existingFeedback.station_cleanliness}/5</Text>
                        </View>
                      </View>
                    )}
                    {existingFeedback.checkout_process && (
                      <View style={styles.ratingDetailRow}>
                        <Text style={styles.ratingDetailLabel}>Quy trình nhận/trả xe:</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              color={star <= (existingFeedback.checkout_process || 0) ? '#FCD34D' : '#D1D5DB'}
                              fill={star <= (existingFeedback.checkout_process || 0) ? '#FCD34D' : 'transparent'}
                            />
                          ))}
                          <Text style={{ fontSize: 14, marginLeft: 4 }}>{existingFeedback.checkout_process}/5</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Comment */}
                  {existingFeedback.comment && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Nhận xét của bạn</Text>
                      <Text style={styles.feedbackCommentText}>{existingFeedback.comment}</Text>
                    </View>
                  )}

                  {/* Images */}
                  {existingFeedback.images && existingFeedback.images.length > 0 && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Hình ảnh ({existingFeedback.images.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {existingFeedback.images.map((img, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => {
                              setSelectedImages(existingFeedback.images || []);
                              setSelectedImageIndex(idx);
                              setFeedbackModalVisible(false);
                              setImageModalVisible(true);
                            }}
                            style={styles.imageContainer}
                          >
                            <Image
                              source={{ uri: img }}
                              style={{ width: 100, height: 100, borderRadius: 8 }}
                            />
                            <View style={styles.imageOverlay}>
                              <Eye size={32} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ) : (
                // Complaint details
                <View>
                  {existingFeedback?.title && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Tiêu đề</Text>
                      <Text style={styles.feedbackCommentText}>{existingFeedback.title}</Text>
                    </View>
                  )}
                  
                  {existingFeedback?.description && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Mô tả</Text>
                      <Text style={styles.feedbackCommentText}>{existingFeedback.description}</Text>
                    </View>
                  )}

                  {existingFeedback?.category && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Danh mục</Text>
                      <Text style={styles.feedbackCommentText}>{getCategoryLabel(existingFeedback.category)}</Text>
                    </View>
                  )}

                  {existingFeedback?.staff_role && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Loại nhân viên</Text>
                      <Text style={styles.feedbackCommentText}>
                        {existingFeedback.staff_role === 'pickup' ? 'Nhân viên nhận xe' : 'Nhân viên trả xe'}
                      </Text>
                    </View>
                  )}

                  {existingFeedback?.comment && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Ghi chú</Text>
                      <Text style={styles.feedbackCommentText}>{existingFeedback.comment}</Text>
                    </View>
                  )}

                  {existingFeedback?.status && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Trạng thái</Text>
                      <Text style={[styles.feedbackCommentText, { 
                        color: existingFeedback.status === 'resolved' ? '#10B981' : '#F59E0B',
                        fontWeight: '600'
                      }]}>
                        {existingFeedback.status === 'resolved' ? 'Đã giải quyết' : 'Đang xử lý'}
                      </Text>
                    </View>
                  )}

                  {existingFeedback?.response && (
                    <View style={[styles.feedbackSection, { backgroundColor: '#D1FAE5', padding: 12, borderRadius: 8 }]}>
                      <Text style={[styles.feedbackSectionTitle, { color: '#065F46' }]}>Phản hồi từ hệ thống</Text>
                      <Text style={[styles.feedbackCommentText, { color: '#047857' }]}>{existingFeedback.response}</Text>
                    </View>
                  )}

                  {/* Images */}
                  {existingFeedback?.images && existingFeedback.images.length > 0 && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>Hình ảnh ({existingFeedback.images.length})</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {existingFeedback.images.map((img, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => {
                              setSelectedImages(existingFeedback.images || []);
                              setSelectedImageIndex(idx);
                              setFeedbackModalVisible(false);
                              setImageModalVisible(true);
                            }}
                            style={styles.imageContainer}
                          >
                            <Image
                              source={{ uri: img }}
                              style={{ width: 100, height: 100, borderRadius: 8 }}
                            />
                            <View style={styles.imageOverlay}>
                              <Eye size={32} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Created date */}
              {existingFeedback?.createdAt && (
                <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
                    Đánh giá vào: {formatDate(existingFeedback.createdAt)}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Close button - Fixed position */}
          <TouchableOpacity
            style={styles.closeButtonInImage}
            onPress={() => setImageModalVisible(false)}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Image counter - Fixed position */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              Ảnh {selectedImageIndex + 1}/{selectedImages.length}
            </Text>
          </View>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get('window').width
              );
              setSelectedImageIndex(newIndex);
            }}
            contentOffset={{ x: selectedImageIndex * Dimensions.get('window').width, y: 0 }}
          >
            {selectedImages.map((img, idx) => (
              <View key={idx} style={styles.modalImageContainer}>
                <Image
                  source={{ uri: img }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
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
  rentalCode: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
    letterSpacing: 2,
  },
  bookingLink: {
    fontSize: 14,
    color: '#3B82F6',
    textAlign: 'center',
    textDecorationLine: 'underline',
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
    marginBottom: 12,
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
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  infoSubValue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
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
  priceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  totalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  priceDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  conditionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 0,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  conditionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  conditionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  vehicleImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  notesCard: {
    padding: 12,
    borderRadius: 12,
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
  reviewButton: {
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
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  closeButtonInImage: {
    position: 'absolute',
    top: '35%',
    right: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageCounter: {
    position: 'absolute',
    top: '35%',
    left: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    zIndex: 10,
  },
  imageCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalImage: {
    width: Dimensions.get('window').width - 60,
    height: Dimensions.get('window').height * 0.7,
    borderRadius: 12,
  },
  feedbackModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feedbackModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  feedbackModalCloseButton: {
    padding: 4,
  },
  feedbackModalContent: {
    padding: 20,
  },
  feedbackSection: {
    marginBottom: 20,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  feedbackCommentText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  ratingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ratingDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
});
