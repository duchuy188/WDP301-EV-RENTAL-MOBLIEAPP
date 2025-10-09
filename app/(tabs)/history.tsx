import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Calendar, MapPin, Clock, DollarSign, TrendingUp, Award, Target } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { useVehicleStore } from '@/store/vehicleStore';

const { width, height } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const { rentalHistory } = useVehicleStore();

  // Safe icon wrappers - if an icon is undefined (bad import), fall back to a simple placeholder component
  const SafeIcon = (Icon: any) => (props: any) => {
    if (!Icon) return <View style={{ width: props.size || 20, height: props.size || 20 }} />;
    return <Icon {...props} />;
  };

  const CalendarIcon = SafeIcon(Calendar);
  const MapPinIcon = SafeIcon(MapPin);
  const ClockIcon = SafeIcon(Clock);
  const DollarSignIcon = SafeIcon(DollarSign);
  const TrendingUpIcon = SafeIcon(TrendingUp);
  const AwardIcon = SafeIcon(Award);
  const TargetIcon = SafeIcon(Target);
  const [VictoryModule, setVictoryModule] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    // try to require victory-native at runtime; if not installed, set null
    try {
      // @ts-ignore - require is used to avoid dynamic import TypeScript issues
      const mod = require('victory-native');
      if (mounted) setVictoryModule(mod);
    } catch (e) {
      if (mounted) setVictoryModule(null);
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Mock analytics data
  const monthlyData = [
    { month: 'T1', cost: 850000 },
    { month: 'T2', cost: 1200000 },
    { month: 'T3', cost: 950000 },
    { month: 'T4', cost: 1400000 },
    { month: 'T5', cost: 1100000 },
    { month: 'T6', cost: 1600000 },
  ];

  const hourlyData = [
    { hour: '6-8h', count: 5 },
    { hour: '8-10h', count: 12 },
    { hour: '10-12h', count: 8 },
    { hour: '12-14h', count: 6 },
    { hour: '14-16h', count: 9 },
    { hour: '16-18h', count: 15 },
    { hour: '18-20h', count: 11 },
  ];

  const totalSpent = monthlyData.reduce((sum, item) => sum + item.cost, 0);
  const totalTrips = rentalHistory.length + 15; // Add some mock data
  const averageDistance = 32;
  const favoriteTime = '8-9h sáng';

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'android' ? 20 : 8,
      paddingHorizontal: 2,
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
    chartContainer: {
      alignItems: 'center',
      marginVertical: 6,
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
      textAlign: 'right',
      fontFamily: 'Inter-Bold',
    },
    insightsCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    insightText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
    },
    seeAllButton: {
      marginTop: 8,
      alignSelf: 'center',
    },
    seeAllText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Lịch sử & Phân tích</Text>
          <Text style={styles.subtitle}>Theo dõi hành trình thuê xe của bạn</Text>
        </Animated.View>

  <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 4 }} showsVerticalScrollIndicator={false}>
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
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MapPin size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{averageDistance}km</Text>
            <Text style={styles.statLabel}>Quãng đường TB</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>Eco</Text>
            <Text style={styles.statLabel}>Hạng thành viên</Text>
          </View>
        </Animated.View>

        {/* Monthly Spending Chart */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Chi phí theo tháng</Text>
          <View style={styles.chartContainer}>
            {(() => {
              const hasVictory = VictoryModule && VictoryModule.VictoryChart && VictoryModule.VictoryArea && VictoryModule.VictoryAxis && VictoryModule.VictoryTheme;
              if (hasVictory) {
                const V = VictoryModule;
                return (
                  <V.VictoryChart
                    theme={V.VictoryTheme?.material}
                      width={width - 8}
                      height={Math.round(height * 0.32)}
                    padding={{ left: 56, top: 12, right: 20, bottom: 32 }}
                  >
                    <V.VictoryAxis dependentAxis tickFormat={(x: number) => `${x/1000}k`} />
                    <V.VictoryAxis />
                    <V.VictoryArea
                      data={monthlyData}
                      x="month"
                      y="cost"
                      style={{
                        data: { fill: colors.primary + '40', stroke: colors.primary, strokeWidth: 2 },
                      }}
                    />
                  </V.VictoryChart>
                );
              }
                return (
                <View style={{ width: width - 8, height: 240, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textSecondary }}>Charts unavailable — install 'victory-native' to view analytics.</Text>
                </View>
              );
            })()}
          </View>
        </Animated.View>

        {/* Hourly Usage Chart */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian thuê xe phổ biến</Text>
          <View style={styles.chartContainer}>
            {(() => {
              const hasVictoryBar = VictoryModule && VictoryModule.VictoryChart && VictoryModule.VictoryBar && VictoryModule.VictoryAxis && VictoryModule.VictoryTheme;
              if (hasVictoryBar) {
                const V = VictoryModule;
                return (
                  <V.VictoryChart
                    theme={V.VictoryTheme?.material}
                      width={width - 8}
                      height={Math.round(height * 0.32)}
                      domainPadding={6}
                      padding={{ left: 48, top: 12, right: 20, bottom: 44 }}
                  >
                    <V.VictoryAxis dependentAxis />
                    <V.VictoryAxis style={{ tickLabels: { angle: -45 } }} />
                    <V.VictoryBar
                      data={hourlyData}
                      x="hour"
                      y="count"
                      style={{
                        data: { fill: colors.secondary },
                      }}
                    />
                  </V.VictoryChart>
                );
              }
              return (
                <View style={{ width: width - 8, height: 240, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textSecondary }}>Charts unavailable — install 'victory-native' to view analytics.</Text>
                </View>
              );
            })()}
          </View>
        </Animated.View>

        {/* Personal Insights */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Insights cá nhân</Text>
          
          <View style={styles.insightsCard}>
            <Text style={styles.insightText}>
              💡 Bạn hay thuê xe nhiều nhất vào khung giờ {favoriteTime}. Đây là thời điểm có nhiều ưu đãi!
            </Text>
          </View>
          
          <View style={styles.insightsCard}>
            <Text style={styles.insightText}>
              🚗 Bạn đã tiết kiệm được khoảng 150kg CO2 so với sử dụng xe xăng trong 6 tháng qua.
            </Text>
          </View>
          
          <View style={styles.insightsCard}>
            <Text style={styles.insightText}>
              📈 Chi tiêu của bạn tăng 12% so với tháng trước. Hãy thử sử dụng xe vào giờ thấp điểm để tiết kiệm.
            </Text>
          </View>
        </Animated.View>

        {/* Recent Trips */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Chuyến đi gần đây</Text>
          
          {rentalHistory.map((rental, index) => (
            <View key={rental.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripVehicle}>{rental.vehicle.name}</Text>
                <Text style={styles.tripStatus}>Hoàn thành</Text>
              </View>
              
              <View style={styles.tripInfo}>
                <Calendar size={14} color={colors.textSecondary} />
                <Text style={styles.tripInfoText}>
                  {formatDate(rental.startDate)} • {formatTime(rental.startDate)}
                </Text>
              </View>
              
              <View style={styles.tripInfo}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={styles.tripInfoText}>
                  {rental.pickupLocation} → {rental.returnLocation}
                </Text>
              </View>
              
              <View style={styles.tripInfo}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={styles.tripInfoText}>{rental.distance} km</Text>
              </View>
              
              <Text style={styles.tripCost}>{formatPrice(rental.totalCost)}</Text>
            </View>
          ))}
          
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>Xem tất cả lịch sử</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      </SafeAreaView>
  );
}
