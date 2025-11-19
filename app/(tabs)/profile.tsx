import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  CircleHelp as HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Star,
  Award,
  Edit3,
  MapPin,
  FileText,
  Camera,
  CheckCircle,
  Key,
  Flag,
  XCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { bookingAPI } from '@/api/bookingAPI';
import { Booking } from '@/types/booking';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { colors, mode, setMode } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [totalBookings, setTotalBookings] = useState(0);
  const [userStats, setUserStats] = useState({
    level: 'Eco Driver',
    totalTrips: 0,
    totalDistance: 0,
    totalSpending: 0,
  });

  // Fetch all bookings and calculate stats
  const fetchBookingsAndStats = async () => {
    try {
      setLoadingActivities(true);
      
      // Fetch recent bookings for activity list
      const recentResponse = await bookingAPI.getBookings({ page: 1, limit: 5 });
      setRecentBookings(recentResponse.bookings);
      setTotalBookings(recentResponse.pagination.totalRecords);
      
      // Fetch all bookings to calculate stats
      const allResponse = await bookingAPI.getBookings({ 
        page: 1, 
        limit: 1000 // Get a large number to calculate stats
      });
      
      const allBookings = allResponse.bookings || [];
      
      // Filter completed bookings
      const completedBookings = allBookings.filter(b => b.status === 'completed');
      
      // Calculate total distance from completed bookings
      // Estimate: 30km per day of rental
      const totalDistance = completedBookings.reduce((sum, booking) => {
        const days = booking.total_days || 1;
        const estimatedDistance = days * 30; // 30km per day
        return sum + estimatedDistance;
      }, 0);
      
      // Count completed trips
      const totalTrips = completedBookings.length;
      
      // Calculate total spending from completed bookings
      const totalSpending = completedBookings.reduce((sum, booking) => {
        const amount = booking.final_amount || booking.total_price || 0;
        return sum + amount;
      }, 0);
      
      setUserStats({
        level: 'Eco Driver',
        totalTrips,
        totalDistance: Math.round(totalDistance),
        totalSpending: Math.round(totalSpending),
      });
      
    } catch (error) {
      
    } finally {
      setLoadingActivities(false);
    }
  };

  // Auto-refresh when tab is focused (e.g., after creating/editing/completing booking)
  useFocusEffect(
    useCallback(() => {
      fetchBookingsAndStats();
    }, [])
  );

  // Transform bookings to activity format
  const getActivityFromBooking = (booking: Booking) => {
    const statusMap: { [key: string]: { text: string; iconName: string; color: string; bgColor: string } } = {
      'pending': { text: 'Đặt xe', iconName: 'motorcycle', color: colors.primary, bgColor: colors.primary + '15' },
      'confirmed': { text: 'Xác nhận', iconName: 'check', color: '#10B981', bgColor: '#10B98115' },
      'active': { text: 'Đang thuê', iconName: 'key', color: '#F59E0B', bgColor: '#F59E0B15' },
      'completed': { text: 'Hoàn thành', iconName: 'flag', color: '#6366F1', bgColor: '#6366F115' },
      'cancelled': { text: 'Đã hủy', iconName: 'x', color: '#EF4444', bgColor: '#EF444415' },
    };

    const statusInfo = statusMap[booking.status] || { text: 'Đặt xe', iconName: 'motorcycle', color: colors.primary, bgColor: colors.primary + '15' };
    
    // Lấy mã booking
    const bookingCode = booking.code || booking._id?.slice(-6)?.toUpperCase() || 'N/A';
    
    
    // Tên xe và model
    const vehicleCode = booking.vehicle_id?.name || 'Xe máy';
    const vehicleModel = booking.vehicle_id?.model 
      ? `${booking.vehicle_id?.brand || ''} ${booking.vehicle_id?.model}`.trim() 
      : null;
    const stationName = booking.station_id?.name || 'Trạm thuê xe';
    
    // Use the most relevant date based on status
    let dateToUse = booking.createdAt;
    if (booking.status === 'cancelled' && booking.cancelled_at) {
      dateToUse = booking.cancelled_at;
    } else if (booking.status === 'confirmed' && booking.confirmed_at) {
      dateToUse = booking.confirmed_at;
    } else if (booking.updatedAt) {
      dateToUse = booking.updatedAt;
    }
    
    const formattedTime = formatDateTime(dateToUse);
    
    return {
      id: booking._id,
      bookingCode: bookingCode,
      vehicleCode: vehicleCode,
      vehicleModel: vehicleModel,
      stationName: stationName,
      price: booking.total_price,
      statusText: statusInfo.text,
      time: formattedTime,
      iconName: statusInfo.iconName,
      iconColor: statusInfo.color,
      iconBgColor: statusInfo.bgColor,
    };
  };

  // Parse date from DD/MM/YYYY HH:mm:ss format
  const parseDateString = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    try {
      // Format: "27/10/2025 09:35:05" -> convert to ISO
      const parts = dateString.split(' ');
      if (parts.length !== 2) return null;
      
      const [datePart, timePart] = parts;
      const [day, month, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');
      
      // Create ISO format: YYYY-MM-DDTHH:mm:ss
      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      const date = new Date(isoString);
      
      if (isNaN(date.getTime())) return null;
      return date;
    } catch (error) {
      
      return null;
    }
  };

  // Format date to readable string
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Gần đây';
    
    const date = parseDateString(dateString);
    
    if (!date || isNaN(date.getTime())) {
      return 'Gần đây';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Nếu trong vòng 24h: hiển thị relative time
    if (diffInHours < 24) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      if (diffInMinutes < 1) return 'Vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      return `${diffInHours} giờ trước`;
    }
    
    // Nếu > 24h: hiển thị ngày và giờ
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    // Nếu cùng năm: chỉ hiển thị ngày/tháng
    if (year === now.getFullYear()) {
      if (diffInDays < 7) {
        return `${diffInDays} ngày trước`;
      }
      return `${day}/${month} lúc ${hour}:${minute}`;
    }
    
    // Khác năm: hiển thị đầy đủ
    return `${day}/${month}/${year}`;
  };

  const recentActivity = recentBookings.map(getActivityFromBooking);

  // Render activity icon
  const renderActivityIcon = (iconName: string, iconColor: string) => {
    const iconSize = 18;

    switch (iconName) {
      case 'motorcycle':
        return <FontAwesome5 name="motorcycle" size={iconSize} color={iconColor} />;
      case 'check':
        return <CheckCircle size={iconSize} color={iconColor} />;
      case 'key':
        return <Key size={iconSize} color={iconColor} />;
      case 'flag':
        return <Flag size={iconSize} color={iconColor} />;
      case 'x':
        return <XCircle size={iconSize} color={iconColor} />;
      default:
        return <FontAwesome5 name="motorcycle" size={iconSize} color={iconColor} />;
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const menuSections = [
    {
      title: 'Tài khoản',
      items: [
        {
          id: 1,
          title: 'Chỉnh sửa thông tin',
          icon: <Edit3 size={20} color={colors.textSecondary} />,
          onPress: handleEditProfile,
        },
        {
          id: 2,
          title: 'Xác thực kyc',
          icon: <FileText size={20} color={colors.textSecondary} />,
          onPress: () => router.push('/verify-documents'),
        },
        {
          id: 3,
          title: 'Xem báo cáo sự cố',
          icon: <AlertTriangle size={20} color={colors.textSecondary} />,
          onPress: () => router.push('/my-reports'),
        },
      ]
    },
    {
      title: 'Hỗ trợ',
      items: [
        {
          id: 8,
          title: 'Trung tâm trợ giúp',
          icon: <HelpCircle size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Trợ giúp', 'Liên hệ: support@evrenter.com'),
        },
        {
          id: 9,
          title: 'Điều khoản sử dụng',
          icon: <FileText size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Điều khoản', 'Tính năng đang phát triển'),
        },
        {
          id: 10,
          title: 'Chính sách bảo mật',
          icon: <Shield size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Bảo mật', 'Tính năng đang phát triển'),
        },
        {
          id: 11,
          title: 'Đánh giá ứng dụng',
          icon: <Star size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Đánh giá', 'Cảm ơn bạn đã sử dụng ứng dụng!'),
        },
      ]
    }
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: '#1B5E20',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      fontFamily: 'Inter-Bold',
    },
    content: {
      flex: 1,
    },
    profileCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginTop: 24,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.border,
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 28,
      height: 28,
      backgroundColor: colors.primary,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    profileInfo: {
      flex: 1,
      marginLeft: 16,
    },
    name: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
      fontFamily: 'Inter-Bold',
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Inter-Regular',
    },
    levelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    levelText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
      marginLeft: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      flex: 1,
      minWidth: (width - 88) / 3 - 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    statLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
    },
    section: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      padding: 20,
      paddingBottom: 12,
      fontFamily: 'Inter-Medium',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    menuIcon: {
      width: 40,
      alignItems: 'center',
    },
    menuContent: {
      flex: 1,
      marginLeft: 8,
    },
    menuText: {
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    activityItemCard: {
      marginHorizontal: 20,
      marginTop: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    activityIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityMainContent: {
      flex: 1,
      gap: 6,
    },
    activityHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    activityTitleContainer: {
      flex: 1,
      gap: 2,
    },
    activityVehicleCode: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    activityVehicleModel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    activityDetails: {
      gap: 4,
    },
    activityDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    activityStationText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    activityCodeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    activityDivider: {
      fontSize: 12,
      color: colors.textSecondary,
      marginHorizontal: 4,
    },
    activityPriceText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      fontFamily: 'Inter-SemiBold',
    },
    activityTimeText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    activityLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      gap: 12,
    },
    activityLoadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    activityEmptyContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    activityEmptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    seeMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: colors.primary + '10',
      borderWidth: 1,
      borderColor: colors.primary + '30',
      gap: 6,
    },
    seeMoreText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    logoutButton: {
      backgroundColor: colors.error + '10',
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    logoutItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    logoutText: {
      flex: 1,
      fontSize: 16,
      color: colors.error,
      marginLeft: 8,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      margin: 20,
      alignItems: 'center',
      minWidth: 300,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      fontFamily: 'Inter-Bold',
    },
    modalText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
      fontFamily: 'Inter-Regular',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    confirmButton: {
      backgroundColor: colors.error,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    cancelButtonText: {
      color: colors.text,
    },
    confirmButtonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <Text style={styles.title}>Cá nhân</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Profile Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: user?.profileImage || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.avatar}
              />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.name || 'Người dùng'}</Text>
              <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tài khoản Section */}
        <Animated.View 
          entering={FadeInDown.delay(300)} 
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>{menuSections[0].title}</Text>
          
          {menuSections[0].items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, index === 0 && { borderTopWidth: 0 }]}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                {item.icon}
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Thuê xe gần đây</Text>
          
          {loadingActivities ? (
            <View style={styles.activityLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.activityLoadingText}>Đang tải...</Text>
            </View>
          ) : recentActivity.length === 0 ? (
            <View style={styles.activityEmptyContainer}>
              <Text style={styles.activityEmptyText}>Chưa có hoạt động nào</Text>
            </View>
          ) : (
            <>
              {recentActivity.map((activity, index) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.activityItemCard, index === 0 && { marginTop: 0 }]}
                  onPress={() => router.push(`/booking-details?id=${activity.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityRow}>
                    <View style={[styles.activityIconContainer, { backgroundColor: activity.iconBgColor }]}>
                      {renderActivityIcon(activity.iconName, activity.iconColor)}
                    </View>
                    
                    <View style={styles.activityMainContent}>
                      <View style={styles.activityHeader}>
                        <View style={styles.activityTitleContainer}>
                          <Text style={styles.activityVehicleCode} numberOfLines={1}>
                            {activity.vehicleCode}
                          </Text>
                          {activity.vehicleModel && (
                            <Text style={styles.activityVehicleModel} numberOfLines={1}>
                              {activity.vehicleModel}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: activity.iconBgColor }]}>
                          <Text style={[styles.statusBadgeText, { color: activity.iconColor }]}>
                            {activity.statusText}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.activityDetails}>
                        <View style={styles.activityDetailRow}>
                          <MapPin size={12} color={colors.textSecondary} />
                          <Text style={styles.activityStationText} numberOfLines={1}>
                            {activity.stationName}
                          </Text>
                        </View>
                        
                        <View style={styles.activityDetailRow}>
                          <Text style={styles.activityCodeText}>Mã: {activity.bookingCode}</Text>
                          <Text style={styles.activityDivider}>•</Text>
                          <Text style={styles.activityPriceText}>{formatPrice(activity.price)}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.activityTimeText}>{activity.time}</Text>
                    </View>
                    
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Nút Xem thêm nếu có nhiều hơn 5 bookings */}
              {totalBookings > 5 && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={() => router.push('/(tabs)/history')}
                >
                  <Text style={styles.seeMoreText}>
                    Xem thêm
                  </Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>

        {/* Hỗ trợ Section */}
        <Animated.View 
          entering={FadeInDown.delay(500)} 
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>{menuSections[1].title}</Text>
          
          {menuSections[1].items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, index === 0 && { borderTopWidth: 0 }]}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                {item.icon}
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Logout Button */}
        <AnimatedTouchableOpacity
          entering={FadeInDown.delay(600)}
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <View style={styles.logoutItem}>
            <View style={styles.menuIcon}>
              <LogOut size={20} color={colors.error} />
            </View>
            <Text style={styles.logoutText}>Đăng xuất</Text>
            <ChevronRight size={20} color={colors.error} />
          </View>
        </AnimatedTouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận đăng xuất</Text>
            <Text style={styles.modalText}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  Hủy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={[styles.modalButtonText, styles.confirmButtonText]}>
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}