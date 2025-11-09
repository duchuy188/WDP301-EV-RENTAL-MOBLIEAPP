import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { 
  TrendingUp, 
  Calendar, 
  MapPin, 
  DollarSign,
  Clock,
  Award,
  Bike,
  MapPinned,
  Zap,
  Target,
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { personalAPI } from '@/api/personaAPI';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { UserStatsData } from '@/types/perssonal';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState<UserStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  // Auto-refresh when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Analytics tab focused, loading stats...');
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading personal analytics...');
      console.log('🔗 API Endpoint: /users/personal-analytics');
      
      const response = await personalAPI.getPersonal();
      console.log('✅ Personal analytics response:', JSON.stringify(response, null, 2));
      
      if (response && response.data) {
        setStatsData(response.data);
        console.log('✅ Stats data loaded successfully!');
        console.log('📊 Overview:', response.data.overview);
      } else {
        console.log('⚠️ No data in response');
        setError('Không có dữ liệu thống kê');
      }
    } catch (error: any) {
      console.error('❌ Error loading personal analytics:', error);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
        setError(error.response.data?.message || `Lỗi ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        console.error('❌ No response received:', error.request);
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        console.error('❌ Error message:', error.message);
        setError(error.message || 'Đã xảy ra lỗi không xác định');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}tr`;
    }
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months[month - 1];
  };

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => colors.primary,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontFamily: 'Inter-Regular',
      fontSize: 11,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
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
      backgroundColor: '#1B5E20',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 6,
      fontFamily: 'Inter-Bold',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: '#E8F5E9',
      fontFamily: 'Inter-Regular',
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 20,
      overflow: 'hidden',
    },
    sectionContent: {
      backgroundColor: colors.surface,
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
      fontFamily: 'Inter-Bold',
      letterSpacing: -0.3,
    },
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    overviewCard: {
      width: (width - 32 - 36 - 12) / 2, // screen width - margins - paddings - gap / 2
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    overviewCardGradient: {
      padding: 16,
    },
    overviewIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    overviewValue: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
      fontFamily: 'Inter-Bold',
      letterSpacing: -0.5,
    },
    overviewLabel: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.9)',
      fontFamily: 'Inter-Medium',
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: 12,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.background + '80',
      padding: 12,
    },
    chartLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      fontFamily: 'Inter-SemiBold',
    },
    peakItemsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    peakItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.primary + '30',
    },
    peakItemText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 6,
      fontFamily: 'Inter-SemiBold',
    },
    peakItemCount: {
      fontSize: 13,
      color: colors.primary,
      marginLeft: 6,
      fontFamily: 'Inter-SemiBold',
    },
    preferenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      padding: 14,
      borderRadius: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    preferenceLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    preferenceIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    preferenceName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      flex: 1,
    },
    preferenceCount: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: 'Inter-Bold',
    },
    insightCard: {
      backgroundColor: colors.primary + '12',
      padding: 14,
      borderRadius: 14,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    insightText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
    },
    monthlyStatsCard: {
      backgroundColor: colors.background,
      padding: 14,
      borderRadius: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    monthlyStatsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    monthLabel: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    monthlyStatsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    monthlyStatItem: {
      flex: 1,
      minWidth: '30%',
    },
    monthlyStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginBottom: 4,
    },
    monthlyStatValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      paddingVertical: 40,
    },
    highlightBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    highlightText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily: 'Inter-Bold',
    },
  });

  if (loading && !statsData) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Thống kê</Text>
          <Text style={styles.subtitle}>Phân tích hành vi thuê xe</Text>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !statsData) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Thống kê</Text>
          <Text style={styles.subtitle}>Phân tích hành vi thuê xe</Text>
        </Animated.View>
        <ScrollView
          contentContainerStyle={styles.loadingContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <View style={[styles.overviewIcon, { 
                  backgroundColor: colors.primary + '20',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginBottom: 20,
                }]}>
                  <TrendingUp size={40} color={colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 8 }]}>
                  {error || 'Chưa có dữ liệu'}
                </Text>
                <Text style={[styles.emptyText, { marginBottom: 20 }]}>
                  {error 
                    ? 'Vui lòng thử lại sau hoặc kiểm tra kết nối mạng'
                    : 'Bạn chưa có lịch sử thuê xe nào. Hãy bắt đầu thuê xe để xem thống kê!'}
                </Text>
                <TouchableOpacity
                  onPress={loadStats}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                    fontFamily: 'Inter-SemiBold',
                  }}>
                    Tải lại
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const { overview, peak_hours, peak_days, vehicle_preferences, station_preferences, monthly_stats, insights } = statsData;

  // Prepare chart data for peak hours
  const hourLabels = peak_hours.slice(0, 5).map(h => `${h.hour}h`);
  const hourData = peak_hours.slice(0, 5).map(h => h.count);

  // Prepare chart data for monthly stats
  const monthLabels = monthly_stats.slice(0, 6).reverse().map(m => getMonthName(m.month));
  const monthRentals = monthly_stats.slice(0, 6).reverse().map(m => m.rentals);
  const monthDistance = monthly_stats.slice(0, 6).reverse().map(m => Math.round(m.distance));

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <Text style={styles.title}>Thống kê</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {/* Overview Stats */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>📊 Tổng quan</Text>
            <View style={styles.overviewGrid}>
              <Animated.View entering={FadeInLeft.delay(250)} style={styles.overviewCard}>
                <LinearGradient
                  colors={['#1B5E20', '#2E7D32', '#43A047']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCardGradient}
                >
                  <View style={styles.overviewIcon}>
                    <TrendingUp size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.overviewValue}>{overview.total_rentals}</Text>
                  <Text style={styles.overviewLabel}>Chuyến đi</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(250)} style={styles.overviewCard}>
                <LinearGradient
                  colors={['#F59E0B', '#FB923C', '#FBBF24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCardGradient}
                >
                  <View style={styles.overviewIcon}>
                    <MapPin size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.overviewValue}>{overview.total_distance} km</Text>
                  <Text style={styles.overviewLabel}>Quãng đường</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInLeft.delay(300)} style={styles.overviewCard}>
                <LinearGradient
                  colors={['#10B981', '#14B8A6', '#34D399']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCardGradient}
                >
                  <View style={styles.overviewIcon}>
                    <DollarSign size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.overviewValue}>{formatPrice(overview.total_spent)}</Text>
                  <Text style={styles.overviewLabel}>Tổng chi tiêu</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(300)} style={styles.overviewCard}>
                <LinearGradient
                  colors={['#6366F1', '#818CF8', '#A5B4FC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCardGradient}
                >
                  <View style={styles.overviewIcon}>
                    <Calendar size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.overviewValue}>{overview.total_days.toFixed(1)}</Text>
                  <Text style={styles.overviewLabel}>Tổng ngày thuê</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInLeft.delay(350)} style={styles.overviewCard}>
                <LinearGradient
                  colors={['#EC4899', '#F472B6', '#F9A8D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCardGradient}
                >
                  <View style={styles.overviewIcon}>
                    <Award size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.overviewValue}>{formatPrice(overview.avg_spent_per_rental)}</Text>
                  <Text style={styles.overviewLabel}>TB/chuyến</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(350)} style={styles.overviewCard}>
                <LinearGradient
                  colors={['#8B5CF6', '#A78BFA', '#C4B5FD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCardGradient}
                >
                  <View style={styles.overviewIcon}>
                    <Target size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.overviewValue}>{overview.avg_distance_per_rental} km</Text>
                  <Text style={styles.overviewLabel}>TB quãng đường</Text>
                </LinearGradient>
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* Peak Hours Chart */}
        {peak_hours.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>⏰ Giờ thuê xe nhiều nhất</Text>
              <View style={styles.chartContainer}>
                <BarChart
                  data={{
                    labels: hourLabels,
                    datasets: [{ data: hourData.length > 0 ? hourData : [0] }],
                  }}
                  width={width - 68}
                  height={200}
                  chartConfig={chartConfig}
                  style={{
                    borderRadius: 12,
                  }}
                  fromZero
                  showBarTops={true}
                  showValuesOnTopOfBars={true}
                  segments={Math.max(...hourData) || 2}
                  formatYLabel={(value) => Math.round(parseFloat(value)).toString()}
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Peak Days */}
        {peak_days.length > 0 && (
          <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>📅 Ngày thuê xe nhiều nhất</Text>
              <View style={styles.peakItemsContainer}>
                {peak_days.sort((a, b) => {
                  // Sắp xếp theo thứ tự tuần: Thứ 2 (1) -> Chủ nhật (0)
                  const dayOrder = a.day === 0 ? 7 : a.day; // Chủ nhật xuống cuối
                  const dayOrderB = b.day === 0 ? 7 : b.day;
                  return dayOrder - dayOrderB;
                }).map((day, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(500 + index * 50)}>
                    <View style={styles.peakItem}>
                      <Calendar size={18} color={colors.primary} />
                      <Text style={styles.peakItemText}>{day.dayName}</Text>
                      <Text style={styles.peakItemCount}>({day.count} lần)</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Vehicle Preferences */}
        {vehicle_preferences.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>🏍️ Loại xe ưa thích</Text>
              {vehicle_preferences.map((vehicle, index) => (
                <Animated.View key={index} entering={FadeInLeft.delay(550 + index * 50)}>
                  <View style={styles.preferenceItem}>
                    <View style={styles.preferenceLeft}>
                      <LinearGradient
                        colors={[colors.primary, colors.primary + 'DD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.preferenceIcon}
                      >
                        <FontAwesome5 name="motorcycle" size={24} color="#FFFFFF" />
                      </LinearGradient>
                      <Text style={styles.preferenceName}>
                        {vehicle.vehicle_type === 'scooter' ? 'Xe tay ga' : vehicle.vehicle_type}
                      </Text>
                    </View>
                    <View style={styles.highlightBadge}>
                      <Text style={styles.highlightText}>{vehicle.count} lần</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Station Preferences */}
        {station_preferences.length > 0 && (
          <Animated.View entering={FadeInDown.delay(550)} style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>📍 Trạm thuê ưa thích</Text>
              {station_preferences.map((station, index) => (
                <Animated.View key={index} entering={FadeInRight.delay(600 + index * 50)}>
                  <TouchableOpacity 
                    style={styles.preferenceItem}
                    onPress={() => {
                      router.push({
                        pathname: '/station-details',
                        params: { id: station.station_id._id }
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.preferenceLeft}>
                      <LinearGradient
                        colors={['#F59E0B', '#FB923C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.preferenceIcon}
                      >
                        <MapPinned size={24} color="#FFFFFF" />
                      </LinearGradient>
                      <Text style={styles.preferenceName} numberOfLines={2}>
                        {station.station_id.name}
                      </Text>
                    </View>
                    <View style={styles.highlightBadge}>
                      <Text style={styles.highlightText}>{station.count} lần</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Monthly Stats Chart */}
        {monthly_stats.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>📈 Thống kê theo tháng</Text>
              
              {/* Rentals Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartLabel}>Số lượt thuê</Text>
                <LineChart
                  data={{
                    labels: monthLabels,
                    datasets: [{ data: monthRentals.length > 0 ? monthRentals : [0] }],
                  }}
                  width={width - 68}
                  height={200}
                  yAxisSuffix=" lần"
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  }}
                  bezier
                  style={{
                    borderRadius: 12,
                  }}
                  fromZero
                />
              </View>

              {/* Distance Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartLabel}>Quãng đường (km)</Text>
                <LineChart
                  data={{
                    labels: monthLabels,
                    datasets: [{ data: monthDistance.length > 0 ? monthDistance : [0] }],
                  }}
                  width={width - 68}
                  height={200}
                  yAxisSuffix=" km"
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                  }}
                  bezier
                  style={{
                    borderRadius: 12,
                  }}
                  fromZero
                />
              </View>

              {/* Detailed Monthly Stats */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.chartLabel}>Chi tiết từng tháng</Text>
                {monthly_stats.slice(0, 6).map((month, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(650 + index * 50)}>
                    <View style={styles.monthlyStatsCard}>
                      <View style={styles.monthlyStatsHeader}>
                        <Text style={styles.monthLabel}>
                          Tháng {month.month}/{month.year}
                        </Text>
                        {index === 0 && (
                          <View style={styles.highlightBadge}>
                            <Text style={styles.highlightText}>Gần nhất</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.monthlyStatsGrid}>
                        <View style={styles.monthlyStatItem}>
                          <Text style={styles.monthlyStatLabel}>Lượt thuê</Text>
                          <Text style={styles.monthlyStatValue}>{month.rentals}</Text>
                        </View>
                        <View style={styles.monthlyStatItem}>
                          <Text style={styles.monthlyStatLabel}>Quãng đường</Text>
                          <Text style={styles.monthlyStatValue}>{month.distance} km</Text>
                        </View>
                        <View style={styles.monthlyStatItem}>
                          <Text style={styles.monthlyStatLabel}>Chi tiêu</Text>
                          <Text style={styles.monthlyStatValue}>{formatPrice(month.spent)}</Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>💡 Thông tin chi tiết</Text>
              {insights.map((insight, index) => (
                <Animated.View key={index} entering={FadeInLeft.delay(750 + index * 50)}>
                  <View style={styles.insightCard}>
                    <Text style={styles.insightText}>• {insight}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

