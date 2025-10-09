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
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  User, 
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
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Zap,
  Leaf,
  Trophy,
  Gift,
  FileText,
  Camera,
  Share2,
  Save,
  X,
  Upload,
  CheckCircle
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
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit profile form state
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: 'Quận 1, TP.HCM', // Mock address
    avatar: user?.profileImage || '',
    cccdImage: '',
    licenseImage: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [cccdUploaded, setCccdUploaded] = useState(false);
  const [licenseUploaded, setLicenseUploaded] = useState(false);

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
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: 'Quận 1, TP.HCM',
      avatar: user?.profileImage || '',
      cccdImage: '',
      licenseImage: '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }
    
    if (!editForm.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    
    if (!editForm.address.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ');
      return;
    }

    setIsUpdating(true);
    
    // Mock API call
    setTimeout(() => {
      setIsUpdating(false);
      setShowEditModal(false);
      Alert.alert('Thành công', 'Thông tin đã được cập nhật!');
    }, 2000);
  };

  const handleUploadAvatar = () => {
    Alert.alert(
      'Chọn ảnh đại diện',
      'Chọn nguồn ảnh',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Camera', onPress: () => mockUploadImage('avatar') },
        { text: 'Thư viện', onPress: () => mockUploadImage('avatar') },
      ]
    );
  };

  const handleUploadCCCD = () => {
    Alert.alert(
      'Chụp ảnh CCCD',
      'Vui lòng chụp rõ 2 mặt của CCCD',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: () => mockUploadDocument('cccd') },
      ]
    );
  };

  const handleUploadLicense = () => {
    Alert.alert(
      'Chụp ảnh GPLX',
      'Vui lòng chụp rõ 2 mặt của Giấy phép lái xe',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: () => mockUploadDocument('license') },
      ]
    );
  };

  const mockUploadImage = (type: string) => {
    setTimeout(() => {
      if (type === 'avatar') {
        setEditForm(prev => ({
          ...prev,
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
        }));
      }
      Alert.alert('Thành công', 'Ảnh đã được tải lên!');
    }, 1000);
  };

  const mockUploadDocument = (type: string) => {
    setTimeout(() => {
      if (type === 'cccd') {
        setCccdUploaded(true);
        setEditForm(prev => ({ ...prev, cccdImage: 'mock-cccd-url' }));
      } else if (type === 'license') {
        setLicenseUploaded(true);
        setEditForm(prev => ({ ...prev, licenseImage: 'mock-license-url' }));
      }
      Alert.alert('Thành công', 'Tài liệu đã được tải lên và đang chờ xác thực!');
    }, 1500);
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
          title: 'Phương thức thanh toán',
          icon: <CreditCard size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Thanh toán', 'Tính năng đang phát triển'),
        },
        {
          id: 3,
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
          id: 4,
          title: 'Điểm thưởng của tôi',
          icon: <Gift size={20} color={colors.textSecondary} />,
          badge: `${userStats.points} điểm`,
          onPress: () => Alert.alert('Điểm thưởng', `Bạn có ${userStats.points} điểm thưởng`),
        },
        {
          id: 5,
          title: 'Mã giảm giá',
          icon: <Trophy size={20} color={colors.textSecondary} />,
          badge: '3 mã',
          onPress: () => Alert.alert('Mã giảm giá', 'Bạn có 3 mã giảm giá khả dụng'),
        },
        {
          id: 6,
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
          id: 7,
          title: 'Trung tâm trợ giúp',
          icon: <HelpCircle size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Trợ giúp', 'Liên hệ: support@evrenter.com'),
        },
        {
          id: 8,
          title: 'Điều khoản sử dụng',
          icon: <FileText size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Điều khoản', 'Tính năng đang phát triển'),
        },
        {
          id: 9,
          title: 'Chính sách bảo mật',
          icon: <Shield size={20} color={colors.textSecondary} />,
          onPress: () => Alert.alert('Bảo mật', 'Tính năng đang phát triển'),
        },
        {
          id: 10,
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
    // Edit Profile Modal Styles
    editModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    editModalContent: {
      flex: 1,
      backgroundColor: colors.surface,
      marginTop: 50,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    editModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    editModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editForm: {
      flex: 1,
      padding: 20,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 30,
    },
    editAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    changeAvatarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 8,
    },
    changeAvatarText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      fontFamily: 'Inter-Medium',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      height: 50,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    documentSection: {
      marginTop: 20,
    },
    documentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      fontFamily: 'Inter-Medium',
    },
    documentCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    documentCardUploaded: {
      borderColor: colors.success,
      backgroundColor: colors.success + '10',
    },
    documentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    documentStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    statusUploaded: {
      color: colors.success,
    },
    statusPending: {
      color: colors.textSecondary,
    },
    documentDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
      fontFamily: 'Inter-Regular',
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 8,
    },
    uploadButtonUploaded: {
      backgroundColor: colors.success,
    },
    uploadButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    saveButtonContainer: {
      padding: 20,
      paddingTop: 0,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    saveButtonDisabled: {
      backgroundColor: colors.border,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
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

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.editModalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditModal(false)}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editForm} showsVerticalScrollIndicator={false}>
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                <Image
                  source={{ uri: editForm.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                  style={styles.editAvatar}
                />
                <TouchableOpacity
                  style={styles.changeAvatarButton}
                  onPress={handleUploadAvatar}
                >
                  <Camera size={16} color={colors.primary} />
                  <Text style={styles.changeAvatarText}>Đổi ảnh đại diện</Text>
                </TouchableOpacity>
              </View>

              {/* Personal Information */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên *</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại *</Text>
                <View style={styles.inputContainer}>
                  <Phone size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ *</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={editForm.address}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, address: text }))}
                    placeholder="Nhập địa chỉ"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.textSecondary }]}
                    value={user?.email || ''}
                    placeholder="Email"
                    placeholderTextColor={colors.textSecondary}
                    editable={false}
                  />
                </View>
              </View>

              {/* Document Verification Section */}
              <View style={styles.documentSection}>
                <Text style={styles.documentTitle}>Xác thực tài liệu</Text>
                
                {/* CCCD Card */}
                <View style={[styles.documentCard, cccdUploaded && styles.documentCardUploaded]}>
                  <View style={styles.documentHeader}>
                    <Text style={styles.documentName}>Căn cước công dân (CCCD)</Text>
                    <View style={styles.documentStatus}>
                      {cccdUploaded ? (
                        <CheckCircle size={16} color={colors.success} />
                      ) : (
                        <Upload size={16} color={colors.textSecondary} />
                      )}
                      <Text style={[
                        styles.statusText,
                        cccdUploaded ? styles.statusUploaded : styles.statusPending
                      ]}>
                        {cccdUploaded ? 'Đã tải lên' : 'Chưa tải lên'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.documentDesc}>
                    Chụp rõ 2 mặt của CCCD để xác thực danh tính
                  </Text>
                  <TouchableOpacity
                    style={[styles.uploadButton, cccdUploaded && styles.uploadButtonUploaded]}
                    onPress={handleUploadCCCD}
                  >
                    <Camera size={16} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>
                      {cccdUploaded ? 'Tải lên lại' : 'Chụp ảnh CCCD'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* License Card */}
                <View style={[styles.documentCard, licenseUploaded && styles.documentCardUploaded]}>
                  <View style={styles.documentHeader}>
                    <Text style={styles.documentName}>Giấy phép lái xe (GPLX)</Text>
                    <View style={styles.documentStatus}>
                      {licenseUploaded ? (
                        <CheckCircle size={16} color={colors.success} />
                      ) : (
                        <Upload size={16} color={colors.textSecondary} />
                      )}
                      <Text style={[
                        styles.statusText,
                        licenseUploaded ? styles.statusUploaded : styles.statusPending
                      ]}>
                        {licenseUploaded ? 'Đã tải lên' : 'Chưa tải lên'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.documentDesc}>
                    Chụp rõ 2 mặt của GPLX để xác thực quyền lái xe
                  </Text>
                  <TouchableOpacity
                    style={[styles.uploadButton, licenseUploaded && styles.uploadButtonUploaded]}
                    onPress={handleUploadLicense}
                  >
                    <Camera size={16} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>
                      {licenseUploaded ? 'Tải lên lại' : 'Chụp ảnh GPLX'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isUpdating && styles.saveButtonDisabled
                ]}
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Text style={styles.saveButtonText}>Đang cập nhật...</Text>
                ) : (
                  <>
                    <Save size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}