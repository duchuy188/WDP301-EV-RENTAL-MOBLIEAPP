import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Calendar, MapPin, Clock, DollarSign, TrendingUp, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { bookingAPI } from '@/api/bookingAPI';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { colors } = useThemeStore();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await bookingAPI.getBookings({ page, limit: 10 });
      
      if (page === 1) {
        setBookings(response.bookings || []);
      } else {
        setBookings(prev => [...prev, ...(response.bookings || [])]);
      }
      
      // Check if there are more items to load
      const hasMoreItems = response.pagination && 
                          response.pagination.current < response.pagination.total;
      setHasMore(hasMoreItems);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    await loadBookings(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadBookings(currentPage + 1);
    }
  };

  const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}: any) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  };

  // Calculate analytics from completed bookings
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalSpent = completedBookings.reduce((sum, booking) => sum + (booking.final_amount || booking.total_price || 0), 0);
  const totalTrips = completedBookings.length;

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
        return colors.textSecondary;
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
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      width: (width - 24) / 2,
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
  });

  return (
    <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Lịch sử & Phân tích</Text>
          <Text style={styles.subtitle}>Theo dõi hành trình thuê xe của bạn</Text>
        </Animated.View>

  <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 4 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
          onScroll={({nativeEvent}) => {
            if (isCloseToBottom(nativeEvent)) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{totalTrips}</Text>
            <Text style={styles.statLabel}>Tổng chuyến đi</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <DollarSign size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{formatPrice(totalSpent).replace('₫', '')}</Text>
            <Text style={styles.statLabel}>Tổng chi tiêu</Text>
          </View>
        </Animated.View>

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
          
          {/* Load More Indicator */}
          {loadingMore && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>
                Đang tải thêm...
              </Text>
            </View>
          )}
          
          {/* End of List Message */}
          {!loading && bookings.length > 0 && !hasMore && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Đã hiển thị tất cả {bookings.length} đơn đặt xe
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      </SafeAreaView>
  );
}
