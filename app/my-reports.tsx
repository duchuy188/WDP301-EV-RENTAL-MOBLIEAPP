import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { reportsAPI } from '@/api/reportsAPI';
import type { Report } from '@/types/reports';

export default function MyReportsScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [filter])
  );

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : undefined;
      const response = await reportsAPI.getUserReports(params);
      setReports(response.data || []);
    } catch (error) {
      console.error('Load reports error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vehicle_breakdown: '🔧 Xe hỏng',
      battery_issue: '🔋 Vấn đề pin',
      accident: '💥 Tai nạn',
      other: '📝 Khác',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    return status === 'resolved' ? '#10B981' : '#F59E0B';
  };

  const getStatusIcon = (status: string) => {
    return status === 'resolved' ? (
      <CheckCircle size={18} color="#10B981" />
    ) : (
      <Clock size={18} color="#F59E0B" />
    );
  };

  const getStatusText = (status: string) => {
    return status === 'resolved' ? 'Đã xử lý' : 'Đang xử lý';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    // API trả về format "DD/MM/YYYY HH:mm:ss"
    // Chỉ cần trả về nguyên gốc vì đã đúng định dạng
    return dateStr;
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={[styles.reportCard, { backgroundColor: colors.surface }]}
      onPress={() => {
        console.log('View report:', item._id);
        router.push({
          pathname: '/report-details',
          params: { id: item._id }
        });
      }}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportCodeRow}>
          <Text style={[styles.reportCode, { color: colors.text }]}>{item.code}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={[styles.issueType, { color: colors.primary }]}>
          {getIssueTypeLabel(item.issue_type)}
        </Text>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>

      {item.images && item.images.length > 0 && (
        <View style={styles.imagesPreview}>
          {item.images.slice(0, 3).map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={styles.imageThumb} />
          ))}
          {item.images.length > 3 && (
            <View style={styles.moreImages}>
              <Text style={styles.moreImagesText}>+{item.images.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.reportFooter}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {formatDate(item.createdAt)}
        </Text>
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AlertTriangle size={64} color="#D1D5DB" />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {filter === 'all'
          ? 'Chưa có báo cáo sự cố nào'
          : filter === 'pending'
          ? 'Không có báo cáo đang xử lý'
          : 'Không có báo cáo đã xử lý'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo sự cố của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'pending' && styles.filterButtonTextActive,
            ]}
          >
            Đang xử lý
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'resolved' && styles.filterButtonActive]}
          onPress={() => setFilter('resolved')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'resolved' && styles.filterButtonTextActive,
            ]}
          >
            Đã xử lý
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.text }}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#EF4444',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reportHeader: {
    marginBottom: 12,
  },
  reportCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCode: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  issueType: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  imagesPreview: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  imageThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  moreImages: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});