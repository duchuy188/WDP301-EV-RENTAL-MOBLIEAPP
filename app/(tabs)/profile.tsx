import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
  Switch,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { 
  Settings, 
  CreditCard, 
  CircleHelp as HelpCircle, 
  LogOut, 
  ChevronRight, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Star, 
  Award, 
  Edit3,
  MapPin,
  Trophy,
  Gift,
  FileText,
  Camera,
  Share2,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { colors, mode, setMode } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userStats = {
    level: 'Eco Driver',
    totalTrips: 28,
    totalDistance: 945,
    co2Saved: 127,
    rating: 4.9,
    points: 2450,
    nextLevelPoints: 3000,
    memberSince: '2023-06-15',
    favoriteVehicle: 'Tesla Model 3',
    totalSavings: 850000,
  };

  const achievements = [
    { id: 1, title: 'Eco Warrior', description: 'Tiết kiệm 100kg CO2', icon: '🌱', unlocked: true },
    { id: 2, title: 'Speed Demon', description: '50 chuyến đi', icon: '⚡', unlocked: false },
    { id: 3, title: 'Night Rider', description: 'Thuê xe ban đêm 10 lần', icon: '🌙', unlocked: true },
    { id: 4, title: 'Explorer', description: 'Thuê xe ở 5 quận khác nhau', icon: '🗺️', unlocked: true },
  ];

  const recentActivity = [
    { id: 1, action: 'Thuê xe Tesla Model 3', time: '2 giờ trước', icon: '🚗' },
    { id: 2, action: 'Đạt thành tích Eco Warrior', time: '1 ngày trước', icon: '🏆' },
    { id: 3, action: 'Cập nhật thông tin cá nhân', time: '3 ngày trước', icon: '👤' },
    { id: 4, action: 'Đánh giá 5 sao cho VinFast VF5', time: '1 tuần trước', icon: '⭐' },
  ];

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

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(newMode);
  };

  const getThemeIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun size={20} color={colors.textSecondary} />;
      case 'dark':
        return <Moon size={20} color={colors.textSecondary} />;
      default:
        return <Settings size={20} color={colors.textSecondary} />;
    }
  };

  const getThemeText = () => {
    switch (mode) {
      case 'light':
        return 'Sáng';
      case 'dark':
        return 'Tối';
      default:
        return 'Theo hệ thống';
    }
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
          title: 'Phương thức thanh toán',
          icon: <CreditCard size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Thanh toán', 'Tính năng đang phát triển'),
        },
        {
          id: 4,
          title: 'Địa chỉ đã lưu',
          icon: <MapPin size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Địa chỉ', 'Tính năng đang phát triển'),
        },
      ]
    },
    {
      title: 'Ưu đãi & Điểm thưởng',
      items: [
        {
          id: 5,
          title: 'Điểm thưởng của tôi',
          icon: <Gift size={20} color={colors.textSecondary} />,
          badge: `${userStats.points} điểm`,
          onPress: () => Alert.alert('Điểm thưởng', `Bạn có ${userStats.points} điểm thưởng`),
        },
        {
          id: 6,
          title: 'Mã giảm giá',
          icon: <Trophy size={20} color={colors.textSecondary} />,
          badge: '3 mã',
          onPress: () => Alert.alert('Mã giảm giá', 'Bạn có 3 mã giảm giá khả dụng'),
        },
        {
          id: 7,
          title: 'Chương trình giới thiệu',
          icon: <Share2 size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Giới thiệu', 'Mời bạn bè và nhận thưởng!'),
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
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
      fontFamily: 'Inter-Bold',
    },
    content: {
      flex: 1,
    },
    profileCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginTop: -10,
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
      width: (width - 88) / 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 16,
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
    progressSection: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    progressPoints: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
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
    menuBadge: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
      marginTop: 2,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    switchText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
      fontFamily: 'Inter-Regular',
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    themeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    themeText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
      fontFamily: 'Inter-Regular',
    },
    themeValue: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    achievementsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      padding: 20,
      paddingTop: 12,
    },
    achievementCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      width: (width - 76) / 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    achievementCardUnlocked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    achievementIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    achievementTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
      fontFamily: 'Inter-Medium',
    },
    achievementDesc: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    activityIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    activityTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: 'Inter-Regular',
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

  const progressPercentage = (userStats.points / userStats.nextLevelPoints) * 100;

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
              <TouchableOpacity style={styles.editAvatarButton}>
                <Camera size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.name || 'Người dùng'}</Text>
              <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
              <View style={styles.levelBadge}>
                <Award size={12} color={colors.primary} />
                <Text style={styles.levelText}>{userStats.level}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.totalTrips}</Text>
              <Text style={styles.statLabel}>Chuyến đi</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.totalDistance}</Text>
              <Text style={styles.statLabel}>Tổng KM</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.co2Saved}</Text>
              <Text style={styles.statLabel}>CO2 tiết kiệm</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.rating}</Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
          </View>

          {/* Progress to Next Level */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Tiến độ lên hạng</Text>
              <Text style={styles.progressPoints}>
                {userStats.points}/{userStats.nextLevelPoints} điểm
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>
        </Animated.View>

        {/* Achievements Section */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Thành tích</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked && styles.achievementCardUnlocked
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          {recentActivity.map((activity, index) => (
            <View
              key={activity.id}
              style={[styles.activityItem, index === 0 && { borderTopWidth: 0 }]}
            >
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.action}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Settings Sections */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          
          <View style={styles.switchContainer}>
            <Bell size={20} color={colors.textSecondary} />
            <Text style={styles.switchText}>Thông báo</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
          
          <TouchableOpacity style={styles.themeOption} onPress={toggleTheme}>
            <View style={styles.themeInfo}>
              {getThemeIcon()}
              <Text style={styles.themeText}>Giao diện</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.themeValue}>{getThemeText()}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <Animated.View 
            key={section.title}
            entering={FadeInDown.delay(600 + sectionIndex * 100)} 
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items.map((item, index) => (
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
                  {item.badge && <Text style={styles.menuBadge}>{item.badge}</Text>}
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        ))}

        {/* Logout Button */}
        <AnimatedTouchableOpacity
          entering={FadeInDown.delay(900)}
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