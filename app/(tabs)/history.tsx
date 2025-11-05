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
import { Calendar, MapPin, Clock, DollarSign, TrendingUp, ChevronRight, ChevronLeft } from 'lucide-react-native';
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
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalSpentAll, setTotalSpentAll] = useState(0);
  const [totalCompletedAll, setTotalCompletedAll] = useState(0);
  const [totalDistanceAll, setTotalDistanceAll] = useState(0);
  const [allLoadedBookings, setAllLoadedBookings] = useState<any[]>([]); // Store all loaded bookings across pages

  useEffect(() => {
    loadBookingsAndStats();
  }, []);

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
    setRefreshing(false);
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
  });

  return (
    <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Lịch sử & Phân tích</Text>
          <Text style={styles.subtitle}>Theo dõi hành trình thuê xe của bạn</Text>
        </Animated.View>

  <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 4, paddingBottom: 20 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
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
            <View style={[styles.statIcon, { backgroundColor: '#10B981' + '20' }]}>
              <Calendar size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{completedBookingsCount}</Text>
            <Text style={styles.statLabel}>Đã hoàn thành</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B' + '20' }]}>
              <MapPin size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{totalDistanceAll}</Text>
            <Text style={styles.statLabel}>Tổng KM</Text>
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
      </SafeAreaView>
  );
}
