import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Settings, CircleHelp as HelpCircle, Shield, Bell, Moon, Sun, LogOut, CreditCard as Edit, Phone, Mail, CreditCard, Star, Gift } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, rentals } = useAppStore();

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const menuItems = [
    { icon: Edit, title: 'Chỉnh sửa thông tin', onPress: () => Alert.alert('Chỉnh sửa thông tin') },
    { icon: Bell, title: 'Thông báo', onPress: () => Alert.alert('Cài đặt thông báo') },
    { icon: Shield, title: 'Bảo mật', onPress: () => Alert.alert('Cài đặt bảo mật') },
    { icon: HelpCircle, title: 'Trợ giúp', onPress: () => Alert.alert('Trung tâm trợ giúp') },
    { icon: Settings, title: 'Cài đặt', onPress: () => Alert.alert('Cài đặt ứng dụng') },
  ];

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <User size={32} color={colors.white} />
                </View>
              )}
              {user.isVerified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                  <Shield size={12} color={colors.white} />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <ThemedText type="title" style={styles.userName}>
                {user.name}
              </ThemedText>
              {user.isVerified ? (
                <View style={styles.verifiedContainer}>
                  <Shield size={16} color={colors.success} />
                  <ThemedText style={[styles.verifiedText, { color: colors.success }]}>
                    Đã xác thực
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={[styles.unverifiedText, { color: colors.warning }]}>
                  Chờ xác thực
                </ThemedText>
              )}
            </View>
            
            <Button
              title=""
              variant="outline"
              onPress={() => Alert.alert('Chỉnh sửa hồ sơ')}
              style={styles.editButton}
            >
              <Edit size={20} color={colors.primary} />
            </Button>
          </View>

          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Mail size={16} color={colors.textSecondary} />
              <ThemedText style={[styles.contactText, { color: colors.textSecondary }]}>
                {user.email}
              </ThemedText>
            </View>
            <View style={styles.contactItem}>
              <Phone size={16} color={colors.textSecondary} />
              <ThemedText style={[styles.contactText, { color: colors.textSecondary }]}>
                {user.phone}
              </ThemedText>
            </View>
            <View style={styles.contactItem}>
              <CreditCard size={16} color={colors.textSecondary} />
              <ThemedText style={[styles.contactText, { color: colors.textSecondary }]}>
                GPLX: {user.licenseNumber}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.primary }]}>
              {rentals.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Chuyến đi
            </ThemedText>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.ratingContainer}>
              <Star size={18} color={colors.warning} fill={colors.warning} />
              <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.primary }]}>
                4.9
              </ThemedText>
            </View>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Đánh giá
            </ThemedText>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.pointsContainer}>
              <Gift size={18} color={colors.success} />
              <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.primary }]}>
                1,250
              </ThemedText>
            </View>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Điểm thưởng
            </ThemedText>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Hành động nhanh
          </ThemedText>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => Alert.alert('Nạp tiền')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                <CreditCard size={24} color={colors.primary} />
              </View>
              <ThemedText style={styles.quickActionText}>Nạp tiền</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => Alert.alert('Ưu đãi')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}>
                <Gift size={24} color={colors.success} />
              </View>
              <ThemedText style={styles.quickActionText}>Ưu đãi</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => Alert.alert('Hỗ trợ')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '20' }]}>
                <HelpCircle size={24} color={colors.warning} />
              </View>
              <ThemedText style={styles.quickActionText}>Hỗ trợ</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => Alert.alert('Mời bạn')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                <User size={24} color={colors.primary} />
              </View>
              <ThemedText style={styles.quickActionText}>Mời bạn</ThemedText>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Settings Menu */}
        <Card style={styles.menuCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Cài đặt
          </ThemedText>

          {/* Theme Toggle */}
          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
            <View style={styles.menuItemLeft}>
              {isDark ? (
                <Sun size={20} color={colors.textSecondary} />
              ) : (
                <Moon size={20} color={colors.textSecondary} />
              )}
              <ThemedText style={styles.menuItemText}>
                {isDark ? 'Chế độ sáng' : 'Chế độ tối'}
              </ThemedText>
            </View>
          </TouchableOpacity>

          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <item.icon size={20} color={colors.textSecondary} />
                <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}

          {/* Logout */}
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <LogOut size={20} color={colors.error} />
              <ThemedText style={[styles.menuItemText, { color: colors.error }]}>
                Đăng xuất
              </ThemedText>
            </View>
          </TouchableOpacity>
        </Card>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <ThemedText style={[styles.versionText, { color: colors.textSecondary }]}>
            EV Renter v1.0.0
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    marginBottom: 4,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  unverifiedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0,
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    minWidth: '20%',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  menuCard: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
  },
});