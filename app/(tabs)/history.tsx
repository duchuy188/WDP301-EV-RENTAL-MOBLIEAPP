import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Calendar, MapPin, Clock, DollarSign, TrendingUp, ChevronRight, ChevronLeft, X, CreditCard, XCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { bookingAPI } from '@/api/bookingAPI';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { colors } = useThemeStore();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalSpentAll, setTotalSpentAll] = useState(0);
  const [totalCompletedAll, setTotalCompletedAll] = useState(0);
  const [totalDistanceAll, setTotalDistanceAll] = useState(0);
  const [allLoadedBookings, setAllLoadedBookings] = useState<any[]>([]); // Store all loaded bookings across pages
  
  // Store countdown timers for each pending booking
  const [countdownTimers, setCountdownTimers] = useState<{[key: string]: number}>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Modal state for pending booking details
  const [selectedPendingBooking, setSelectedPendingBooking] = useState<any>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  // Auto-refresh when tab is focused (e.g., after creating/editing/canceling booking)
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadBookingsAndStats();
        loadPendingBookings();
      };
      loadData();
    }, [])
  );

  // Initialize countdown timers when pending bookings change
  useEffect(() => {
    if (pendingBookings.length > 0) {
      const initialTimers: {[key: string]: number} = {};
      pendingBookings.forEach(booking => {
        const bookingId = booking._id || booking.temp_id;
        if (booking.expires_at) {
          const expiresAt = new Date(booking.expires_at).getTime();
          const now = Date.now();
          const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
          initialTimers[bookingId] = secondsLeft;
        }
      });
      setCountdownTimers(initialTimers);
    } else {
      setCountdownTimers({});
    }
  }, [pendingBookings]);

  // Countdown timer - update every second
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (Object.keys(countdownTimers).length > 0) {
      timerRef.current = setInterval(() => {
        setCountdownTimers(prev => {
          const updated = {...prev};
          let hasChanges = false;
          const expiredIds: string[] = [];
          
          Object.keys(updated).forEach(key => {
            if (updated[key] > 0) {
              updated[key] -= 1;
              hasChanges = true;
              
              // Check if just expired (reached 0)
              if (updated[key] === 0) {
                expiredIds.push(key);
              }
            }
          });
          
          // Remove expired bookings from the list
          if (expiredIds.length > 0) {
            console.log('⏰ Booking(s) expired, removing from list:', expiredIds);
            setPendingBookings(current => 
              current.filter(booking => {
                const id = booking._id || booking.temp_id;
                return !expiredIds.includes(id);
              })
            );
            
            // Close modal if currently showing expired booking
            setSelectedPendingBooking(current => {
              if (current) {
                const currentId = current._id || current.temp_id;
                if (expiredIds.includes(currentId)) {
                  setShowPendingModal(false);
                  return null;
                }
              }
              return current;
            });
          }
          
          return hasChanges ? updated : prev;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [pendingBookings]);

  const loadBookingsAndStats = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL bookings to calculate stats
      const allResponse = await bookingAPI.getBookings({ 
        page: 1, 
        limit: 1000 // Get all bookings at once
      });
      
      const allBookings = allResponse.bookings || [];
      const completedBookings = allBookings.filter(b => b.status === 'completed');
      
      // Calculate stats from ALL bookings
      const totalCompleted = completedBookings.length;
      const totalSpent = completedBookings.reduce((sum, booking) => {
        return sum + (booking.final_amount || booking.total_price || 0);
      }, 0);
      
      // Calculate total distance (estimate: 30km per day)
      const totalDistance = completedBookings.reduce((sum, booking) => {
        const days = booking.total_days || 1;
        const estimatedDistance = days * 30; // 30km per day
        return sum + estimatedDistance;
      }, 0);
      
      setTotalCompletedAll(totalCompleted);
      setTotalSpentAll(totalSpent);
      setTotalDistanceAll(Math.round(totalDistance));
      setAllLoadedBookings(allBookings);
      
      // Set pagination info
      if (allResponse.pagination) {
        setTotalRecords(allResponse.pagination.totalRecords || 0);
      }
      
      // Calculate total pages based on UI pagination (10 items per page)
      const calculatedTotalPages = Math.ceil(allBookings.length / 10) || 1;
      setTotalPages(calculatedTotalPages);
      
      // Display first page
      setBookings(allBookings.slice(0, 10));
      setCurrentPage(1);
      setHasMore(allBookings.length > 10);
      
      console.log('📊 Initial load complete:', {
        totalBookings: allBookings.length,
        totalPages: Math.ceil(allBookings.length / 10),
        totalCompleted,
        totalSpent,
        displayedBookings: Math.min(10, allBookings.length)
      });
    } catch (error) {
      console.error('Error loading bookings and stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingBookings = async () => {
    try {
      setLoadingPending(true);
      console.log('🔄 Loading pending bookings from API...');
      
      // Try to call the API endpoint
      const response = await bookingAPI.getMyPendingBookings();
      console.log('📋 API Response:', response);
      
      // Handle response structure: pending_bookings array
      const allPending = response.pending_bookings || response.bookings || [];
      
      // Filter out cancelled bookings
      const pending = allPending.filter((b: any) => b.status !== 'cancelled');
      console.log('📋 Total from API:', allPending.length);
      console.log('📋 After filtering cancelled:', pending.length);
      
      if (pending.length > 0) {
        console.log('📋 First pending booking:', pending[0]);
      }
      
      setPendingBookings(pending);
    } catch (error: any) {
      console.error('❌ Error loading pending bookings:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Fallback: filter from loaded bookings
      console.log('⚠️ Fallback: filtering from loaded bookings');
      const pending = allLoadedBookings.filter(b => 
        b.status === 'pending' || b.status === 'pending_payment'
      );
      console.log('📋 Fallback found:', pending.length);
      setPendingBookings(pending);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadBookings = async (page: number = 1) => {
    console.log('📖 Changing to page:', page);
    
    // Calculate which bookings to show for this page
    const startIdx = (page - 1) * 10;
    const endIdx = startIdx + 10;
    const pageBookings = allLoadedBookings.slice(startIdx, endIdx);
    
    setBookings(pageBookings);
    setCurrentPage(page);
    setHasMore(endIdx < allLoadedBookings.length);
    
    console.log('📄 Page changed:', {
      page,
      showing: pageBookings.length,
      total: allLoadedBookings.length
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookingsAndStats();
    loadPendingBookings();
    setRefreshing(false);
  };

  const handleCancelPendingBooking = async (tempId: string) => {
    Alert.alert(
      'Hủy đặt xe',
      'Bạn có chắc chắn muốn hủy đặt xe này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đặt xe',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingBooking(true);
              
              // Cancel pending booking
              await bookingAPI.cancelPendingBooking(tempId);
              console.log('✅ Cancelled pending booking:', tempId);
              
              setShowPendingModal(false);
              setSelectedPendingBooking(null);
              
              // Remove from local state immediately
              setPendingBookings(current => current.filter(b => {
                const id = b._id || b.temp_id;
                return id !== tempId;
              }));
              
              // Refresh pending bookings from server
              await loadPendingBookings();
              
              Alert.alert('Thành công', 'Đã hủy đặt xe thành công');
            } catch (error: any) {
              console.error('❌ Error cancelling booking:', error);
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy đặt xe');
            } finally {
              setCancellingBooking(false);
            }
          }
        }
      ]
    );
  };

  const handleContinuePayment = (vnpayUrl: string, bookingData: any) => {
    try {
      setShowPendingModal(false);
      
      // Navigate to VNPay WebView screen
      router.push({
        pathname: '/vnpay-payment',
        params: {
          paymentUrl: vnpayUrl,
          bookingId: bookingData.temp_id || bookingData._id,
          amount: bookingData.holding_fee_amount || 50000,
        }
      });
    } catch (error) {
      console.error('Error navigating to payment:', error);
      Alert.alert('Lỗi', 'Không thể mở trang thanh toán');
    }
  };


  // Calculate stats from ALL loaded bookings (across all pages)
  const totalTrips = totalRecords;
  
  // Calculate from ALL loaded bookings as fallback
  const completedFromLoaded = allLoadedBookings.filter(b => b.status === 'completed').length;
  const calculatedSpent = allLoadedBookings
    .filter(b => b.status === 'completed')
    .reduce((sum, booking) => sum + (booking.final_amount || booking.total_price || 0), 0);
  
  // Use API data if available, otherwise use calculated from ALL loaded bookings
  const completedBookingsCount = totalCompletedAll || completedFromLoaded;
  const totalSpent = totalSpentAll || calculatedSpent;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return 'Hết hạn';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.abs(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes} phút ${secs} giây`;
    }
    return `${secs} giây`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_payment':
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
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'pending_payment':
        return 'Chờ thanh toán';
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'android' ? 70 : 58,
      paddingHorizontal: 20,
      paddingBottom: 12,
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
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 50,
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      width: (width - 32) / 2,
      alignItems: 'center',
    },
    statIcon: {
      width: 40,
      height: 40,
      backgroundColor: colors.primary + '20',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
      fontFamily: 'Inter-Bold',
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 10,
      marginBottom: 10,
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
    tripCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tripHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    tripVehicle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    tripStatus: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '600',
      backgroundColor: colors.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      fontFamily: 'Inter-Medium',
    },
    tripInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    tripInfoText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
      fontFamily: 'Inter-Regular',
    },
    tripCost: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: 'Inter-Bold',
    },
    tripCode: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    tripFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    paginationWrapper: {
      marginTop: 16,
      marginBottom: 12,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 20,
    },
    pageButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    pageButtonDisabled: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    pageInfo: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      minWidth: 80,
      alignItems: 'center',
    },
    pageText: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    currentPage: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: 'Inter-Bold',
    },
    pageSeparator: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    totalPage: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: 'Inter-SemiBold',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      paddingBottom: Platform.OS === 'ios' ? 34 : 85, // Extra padding to avoid tab bar
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      maxHeight: '70%',
    },
    modalSection: {
      padding: 16,
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      fontFamily: 'Inter-SemiBold',
    },
    modalInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    modalLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      flex: 1,
    },
    modalValue: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Inter-Medium',
      flex: 2,
      textAlign: 'right',
    },
    modalFooter: {
      flexDirection: 'row',
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 80, // Extra padding to avoid tab bar
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cancelButton: {
      backgroundColor: '#EF4444',
    },
    cancelButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    paymentButton: {
      backgroundColor: colors.primary,
    },
    paymentButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Lịch sử đặt xe</Text>
          <Text style={styles.subtitle}>Theo dõi hành trình thuê xe của bạn</Text>
        </Animated.View>

  <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 4, paddingTop: 16, paddingBottom: 20 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
        {/* Pending Bookings Section - Only show when has pending bookings */}
        {(loadingPending || pendingBookings.length > 0) && (
          <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
            <Text style={styles.sectionTitle}>Đặt xe đang chờ</Text>
            
            {loadingPending ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              pendingBookings.map((booking, index) => {
              // Handle both structures: regular booking and pending booking
              const bookingData = booking.booking_data || booking;
              const vehicle = bookingData.vehicle || booking.vehicle_id;
              const station = bookingData.station || booking.station_id;
              const bookingId = booking._id || booking.temp_id;
              const bookingCode = booking.code || booking.temp_id;
              
              // Get countdown from state or calculate from expires_at
              let secondsLeft = countdownTimers[bookingId];
              if (secondsLeft === undefined && booking.expires_at) {
                const expiresAt = new Date(booking.expires_at).getTime();
                const now = Date.now();
                secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
              } else if (secondsLeft === undefined) {
                secondsLeft = 0;
              }
              const isExpired = secondsLeft <= 0;
              const isUrgent = secondsLeft > 0 && secondsLeft <= 300; // Less than 5 minutes
              
              return (
                <TouchableOpacity
                  key={bookingId || index}
                  style={styles.tripCard}
                  onPress={() => {
                    setSelectedPendingBooking(booking);
                    setShowPendingModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.tripHeader}>
                    <Text style={styles.tripVehicle}>
                      {vehicle?.brand} {vehicle?.model}
                    </Text>
                    <Text style={[styles.tripStatus, { 
                      color: getStatusColor(booking.status),
                      backgroundColor: getStatusColor(booking.status) + '20'
                    }]}>
                      {getStatusText(booking.status)}
                    </Text>
                  </View>
                  
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripCode}>Mã: {bookingCode}</Text>
                  </View>
                  
                  {booking.expires_at && (
                    <View style={styles.tripInfo}>
                      <Clock size={14} color={isExpired ? '#999' : '#EF4444'} />
                      <Text style={[styles.tripInfoText, { 
                        color: isExpired ? '#999' : '#EF4444', 
                        fontWeight: '600' 
                      }]}>
                        {isExpired ? 'Hết hạn' : `Còn ${formatCountdown(secondsLeft)}`}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.tripInfo}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={styles.tripInfoText}>
                      {formatDate(bookingData.start_date || booking.start_date)} • {bookingData.pickup_time || booking.pickup_time}
                    </Text>
                  </View>
                  
                  <View style={styles.tripInfo}>
                    <MapPin size={14} color={colors.textSecondary} />
                    <Text style={styles.tripInfoText}>
                      {station?.name}
                    </Text>
                  </View>
                  
                  <View style={styles.tripFooter}>
                    <Text style={styles.tripCost}>{formatPrice(bookingData.total_price || booking.total_price)}</Text>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              );
            })
            )}
          </Animated.View>
        )}

        {/* Recent Bookings */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Đặt xe gần đây</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : bookings.length > 0 ? (
            bookings.map((booking, index) => (
              <TouchableOpacity
                key={booking._id}
                style={styles.tripCard}
                onPress={() => router.push({
                  pathname: '/booking-details',
                  params: { id: booking._id }
                })}
                activeOpacity={0.7}
              >
                <View style={styles.tripHeader}>
                  <Text style={styles.tripVehicle}>
                    {booking.vehicle_id?.brand} {booking.vehicle_id?.model}
                  </Text>
                  <Text style={[styles.tripStatus, { 
                    color: getStatusColor(booking.status),
                    backgroundColor: getStatusColor(booking.status) + '20'
                  }]}>
                    {getStatusText(booking.status)}
                  </Text>
                </View>
                
                <View style={styles.tripInfo}>
                  <Text style={styles.tripCode}>Mã: {booking.code}</Text>
                </View>
                
                <View style={styles.tripInfo}>
                  <Calendar size={14} color={colors.textSecondary} />
                  <Text style={styles.tripInfoText}>
                    {booking.start_date} • {booking.pickup_time}
                  </Text>
                </View>
                
                <View style={styles.tripInfo}>
                  <MapPin size={14} color={colors.textSecondary} />
                  <Text style={styles.tripInfoText}>
                    {booking.station_id?.name}
                  </Text>
                </View>
                
                <View style={styles.tripFooter}>
                  <Text style={styles.tripCost}>{formatPrice(booking.total_price)}</Text>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Chưa có đơn đặt xe nào
              </Text>
            </View>
          )}
          
          {/* Pagination Controls */}
          {!loading && bookings.length > 0 && (
            <View style={styles.paginationWrapper}>
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    currentPage === 1 && styles.pageButtonDisabled
                  ]}
                  onPress={() => {
                    if (currentPage > 1) {
                      loadBookings(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  activeOpacity={0.7}
                >
                  <ChevronLeft 
                    size={20} 
                    color={currentPage === 1 ? colors.textSecondary : '#fff'} 
                  />
                </TouchableOpacity>

                <View style={styles.pageInfo}>
                  <Text style={styles.pageText}>
                    <Text style={styles.currentPage}>{currentPage}</Text>
                    <Text style={styles.pageSeparator}> / </Text>
                    <Text style={styles.totalPage}>{totalPages}</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    !hasMore && styles.pageButtonDisabled
                  ]}
                  onPress={() => {
                    if (hasMore) {
                      loadBookings(currentPage + 1);
                    }
                  }}
                  disabled={!hasMore}
                  activeOpacity={0.7}
                >
                  <ChevronRight 
                    size={20} 
                    color={!hasMore ? colors.textSecondary : '#fff'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Pending Booking Detail Modal */}
      <Modal
        visible={showPendingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPendingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPendingBooking && (() => {
              const bookingData = selectedPendingBooking.booking_data || selectedPendingBooking;
              const vehicle = bookingData.vehicle || selectedPendingBooking.vehicle_id;
              const station = bookingData.station || selectedPendingBooking.station_id;
              const bookingId = selectedPendingBooking._id || selectedPendingBooking.temp_id;
              const bookingCode = selectedPendingBooking.code || selectedPendingBooking.temp_id;
              
              let secondsLeft = countdownTimers[bookingId];
              if (secondsLeft === undefined && selectedPendingBooking.expires_at) {
                const expiresAt = new Date(selectedPendingBooking.expires_at).getTime();
                const now = Date.now();
                secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
              } else if (secondsLeft === undefined) {
                secondsLeft = 0;
              }
              const isExpired = secondsLeft <= 0;

              return (
                <>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chi tiết đặt xe</Text>
                    <TouchableOpacity
                      onPress={() => setShowPendingModal(false)}
                      style={styles.closeButton}
                    >
                      <X size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Modal Body */}
                  <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                    {/* Vehicle Info */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Thông tin xe</Text>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Xe:</Text>
                        <Text style={styles.modalValue}>{vehicle?.brand} {vehicle?.model}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Màu:</Text>
                        <Text style={styles.modalValue}>{vehicle?.color}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Biển số:</Text>
                        <Text style={styles.modalValue}>{vehicle?.license_plate}</Text>
                      </View>
                    </View>

                    {/* Booking Info */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Thông tin đặt xe</Text>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Mã:</Text>
                        <Text style={styles.modalValue}>{bookingCode}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Trạng thái:</Text>
                        <Text style={[styles.modalValue, { 
                          color: getStatusColor(selectedPendingBooking.status),
                          fontWeight: '600'
                        }]}>
                          {getStatusText(selectedPendingBooking.status)}
                        </Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Ngày nhận:</Text>
                        <Text style={styles.modalValue}>
                          {formatDate(bookingData.start_date || selectedPendingBooking.start_date)} • {bookingData.pickup_time || selectedPendingBooking.pickup_time}
                        </Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Ngày trả:</Text>
                        <Text style={styles.modalValue}>
                          {formatDate(bookingData.end_date || selectedPendingBooking.end_date)} • {bookingData.return_time || selectedPendingBooking.return_time}
                        </Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Số ngày:</Text>
                        <Text style={styles.modalValue}>{bookingData.total_days || selectedPendingBooking.total_days} ngày</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Địa điểm:</Text>
                        <Text style={styles.modalValue}>{station?.name}</Text>
                      </View>
                    </View>

                    {/* Countdown Timer */}
                    {selectedPendingBooking.expires_at && (
                      <View style={[styles.modalSection, { 
                        backgroundColor: isExpired ? '#f5f5f5' : '#FEF2F2',
                        borderLeftWidth: 4,
                        borderLeftColor: isExpired ? '#999' : '#EF4444'
                      }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Clock size={20} color={isExpired ? '#999' : '#EF4444'} />
                          <Text style={[styles.modalSectionTitle, { 
                            color: isExpired ? '#999' : '#EF4444',
                            marginBottom: 0
                          }]}>
                            {isExpired ? 'Đã hết hạn' : `Còn ${formatCountdown(secondsLeft)}`}
                          </Text>
                        </View>
                        {!isExpired && (
                          <Text style={{ 
                            color: '#EF4444', 
                            fontSize: 12, 
                            marginTop: 4,
                            fontFamily: 'Inter-Regular'
                          }}>
                            Vui lòng thanh toán trước khi hết hạn
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Price Info */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Thông tin giá</Text>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Giá/ngày:</Text>
                        <Text style={styles.modalValue}>{formatPrice(bookingData.price_per_day || 0)}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Phí giữ chỗ:</Text>
                        <Text style={styles.modalValue}>{formatPrice(selectedPendingBooking.holding_fee_amount || 0)}</Text>
                      </View>
                      <View style={[styles.modalInfoRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <Text style={[styles.modalLabel, { fontWeight: '700', fontSize: 16 }]}>Tổng cộng:</Text>
                        <Text style={[styles.modalValue, { 
                          fontWeight: '700', 
                          fontSize: 18,
                          color: colors.primary
                        }]}>
                          {formatPrice(bookingData.total_price || selectedPendingBooking.total_price)}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>

                  {/* Modal Footer - Action Buttons */}
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => handleCancelPendingBooking(bookingId)}
                      disabled={cancellingBooking}
                    >
                      {cancellingBooking ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <XCircle size={20} color="#fff" />
                          <Text style={styles.cancelButtonText}>Hủy đặt xe</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {!isExpired && selectedPendingBooking.vnpay_url && (
                      <TouchableOpacity
                        style={[styles.modalButton, styles.paymentButton]}
                        onPress={() => handleContinuePayment(selectedPendingBooking.vnpay_url, selectedPendingBooking)}
                      >
                        <CreditCard size={20} color="#fff" />
                        <Text style={styles.paymentButtonText}>Thanh toán</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
      </SafeAreaView>
  );
}
