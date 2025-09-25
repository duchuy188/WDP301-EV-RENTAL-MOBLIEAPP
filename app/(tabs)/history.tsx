import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Clock, MapPin, Zap } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { Rental } from '@/types';

const screenWidth = Dimensions.get('window').width;

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { rentals } = useAppStore();
  const [activeTab, setActiveTab] = useState<'history' | 'analytics'>('history');

  // Mock analytics data
  const monthlySpending = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    datasets: [{
      data: [120000, 85000, 200000, 145000, 180000, 90000],
      color: (opacity = 1) => colors.primary,
      strokeWidth: 3,
    }]
  };

  const hourlyUsage = {
    labels: ['6h', '9h', '12h', '15h', '18h', '21h'],
    datasets: [{
      data: [2, 8, 3, 5, 12, 4]
    }]
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => colors.text + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 16,
    },
    propsForVerticalLabels: {
      fontSize: 10,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
    },
  };

  const RentalCard = ({ rental }: { rental: Rental }) => (
    <Card style={styles.rentalCard}>
      <View style={styles.rentalHeader}>
        <View style={styles.vehicleInfo}>
          <ThemedText type="subtitle">{rental.vehicle.name}</ThemedText>
          <ThemedText style={[styles.rentalDate, { color: colors.textSecondary }]}>
            {rental.startTime.toLocaleDateString('vi-VN')}
          </ThemedText>
        </View>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: rental.status === 'completed' ? colors.success + '20' : colors.warning + '20' }
          ]}>
            <ThemedText style={[
              styles.statusText,
              { color: rental.status === 'completed' ? colors.success : colors.warning }
            ]}>
              {rental.status === 'completed' ? 'Hoàn thành' : 'Đang thuê'}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.rentalDetails}>
        <View style={styles.detailItem}>
          <Clock size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
            {rental.startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            {rental.endTime && ` - ${rental.endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
          </ThemedText>
        </View>

        <View style={styles.detailItem}>
          <MapPin size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
            {rental.distance.toFixed(1)} km
          </ThemedText>
        </View>
      </View>

      <View style={styles.rentalFooter}>
        <ThemedText type="subtitle" style={[styles.cost, { color: colors.primary }]}>
          {rental.totalCost.toLocaleString('vi-VN')}đ
        </ThemedText>
        <Button
          title="Chi tiết"
          variant="outline"
          size="small"
          onPress={() => {/* Show rental details */}}
        />
      </View>
    </Card>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Zap size={24} color={colors.primary} />
          <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.primary }]}>
            {rentals.length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Chuyến đi
          </ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <MapPin size={24} color={colors.primary} />
          <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.primary }]}>
            {rentals.reduce((total, rental) => total + rental.distance, 0).toFixed(0)}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            km
          </ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <TrendingUp size={24} color={colors.success} />
          <ThemedText type="subtitle" style={[styles.statNumber, { color: colors.success }]}>
            {Math.floor(rentals.reduce((total, rental) => total + rental.distance, 0) * 2.3)}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            kg CO₂ tiết kiệm
          </ThemedText>
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Lịch sử thuê xe
        </ThemedText>
        {rentals.map((rental) => (
          <RentalCard key={rental.id} rental={rental} />
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.chartCard}>
        <ThemedText type="subtitle" style={styles.chartTitle}>
          Chi tiêu theo tháng
        </ThemedText>
        <LineChart
          data={monthlySpending}
          width={screenWidth - 80}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>

      <Card style={styles.chartCard}>
        <ThemedText type="subtitle" style={styles.chartTitle}>
          Thói quen thuê xe theo giờ
        </ThemedText>
        <BarChart
          data={hourlyUsage}
          width={screenWidth - 80}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=" lần"
        />
      </Card>

      <Card style={styles.insightsCard}>
        <ThemedText type="subtitle" style={styles.insightsTitle}>
          Insights cá nhân 💡
        </ThemedText>
        
        <View style={styles.insight}>
          <ThemedText style={styles.insightText}>
            • Bạn thường thuê xe vào khung giờ 17-19h (67% các chuyến đi)
          </ThemedText>
        </View>
        
        <View style={styles.insight}>
          <ThemedText style={styles.insightText}>
            • Quãng đường trung bình: {(rentals.reduce((total, rental) => total + rental.distance, 0) / rentals.length).toFixed(1)} km/chuyến
          </ThemedText>
        </View>
        
        <View style={styles.insight}>
          <ThemedText style={styles.insightText}>
            • Xe điện giúp bạn tiết kiệm ~{Math.floor(rentals.length * 35)}% chi phí so với xe xăng
          </ThemedText>
        </View>
        
        <View style={styles.insight}>
          <ThemedText style={[styles.insightText, { color: colors.success }]}>
            • Đóng góp bảo vệ môi trường: {Math.floor(rentals.reduce((total, rental) => total + rental.distance, 0) * 2.3)} kg CO₂ đã giảm
          </ThemedText>
        </View>
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Lịch sử & Phân tích</ThemedText>
        
        <View style={styles.tabContainer}>
          <Button
            title="Lịch sử"
            variant={activeTab === 'history' ? 'primary' : 'outline'}
            onPress={() => setActiveTab('history')}
            style={styles.tabButton}
          />
          <Button
            title="Phân tích"
            variant={activeTab === 'analytics' ? 'primary' : 'outline'}
            onPress={() => setActiveTab('analytics')}
            style={styles.tabButton}
          />
        </View>
      </View>

      {activeTab === 'history' ? renderHistory() : renderAnalytics()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  tabButton: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  rentalCard: {
    marginBottom: 16,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  rentalDate: {
    fontSize: 14,
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rentalDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
  },
  rentalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cost: {
    fontSize: 18,
    fontWeight: '700',
  },
  chartCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  chartTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  insightsCard: {
    marginBottom: 24,
  },
  insightsTitle: {
    marginBottom: 16,
  },
  insight: {
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});