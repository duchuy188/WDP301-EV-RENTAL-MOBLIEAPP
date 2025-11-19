import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { reportsAPI } from '@/api/reportsAPI';
import { Report } from '@/types/reports';

const { width } = Dimensions.get('window');

export default function ReportDetailsScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    loadReportDetails();
  }, [reportId]);

  const loadReportDetails = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getReportById(reportId);
      console.log('[REPORT DETAILS] Report data:', response.data);
      setReport(response.data);
    } catch (error: any) {
      console.error('[REPORT DETAILS] Error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin báo cáo');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getIssueTypeText = (type: string) => {
    switch (type) {
      case 'vehicle_breakdown':
        return '🔧 Xe hỏng';
      case 'battery_issue':
        return '🔋 Vấn đề pin';
      case 'accident':
        return '💥 Tai nạn';
      case 'other':
        return '📝 Khác';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'pending' ? '#F59E0B' : '#10B981';
  };

  const getStatusText = (status: string) => {
    return status === 'pending' ? 'Đang xử lý' : 'Đã xử lý';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Đang tải...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy thông tin báo cáo</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Report Code & Status */}
          <View style={styles.codeSection}>
            <Text style={styles.reportCode}>{report.code}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
              {report.status === 'pending' ? (
                <Clock size={20} color={getStatusColor(report.status)} />
              ) : (
                <CheckCircle2 size={20} color={getStatusColor(report.status)} />
              )}
              <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                {getStatusText(report.status)}
              </Text>
            </View>
          </View>

          {/* Issue Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loại sự cố</Text>
            <View style={styles.issueTypeCard}>
              <Text style={styles.issueTypeText}>{getIssueTypeText(report.issue_type)}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{report.description}</Text>
            </View>
          </View>

          {/* Images */}
          {report.images && report.images.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hình ảnh ({report.images.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesContainer}>
                  {report.images.map((imageUri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.imageWrapper}
                      onPress={() => setSelectedImageIndex(index)}
                    >
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Vehicle Info */}
          {report.vehicle_id && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin xe</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <FontAwesome5 name="motorcycle" size={18} color={colors.primary} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.infoLabel}>Tên xe</Text>
                    <Text style={styles.infoValue}>
                      {typeof report.vehicle_id === 'object' ? (report.vehicle_id as any).name : 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <FileText size={18} color={colors.primary} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.infoLabel}>Biển số</Text>
                    <Text style={styles.infoValue}>
                      {typeof report.vehicle_id === 'object' ? (report.vehicle_id as any).license_plate : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Station Info */}
          {report.station_id && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trạm thuê xe</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MapPin size={18} color={colors.primary} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.infoValue}>
                      {typeof report.station_id === 'object' ? (report.station_id as any).name : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Rental Info */}
          {report.rental_id && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin thuê xe</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <FileText size={18} color={colors.primary} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.infoLabel}>Mã thuê xe</Text>
                    <Text style={styles.infoValue}>
                      {typeof report.rental_id === 'object' ? (report.rental_id as any).code : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Resolution Notes (if resolved) */}
          {report.status === 'resolved' && report.resolution_notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ghi chú xử lý</Text>
              <View style={[styles.descriptionCard, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.descriptionText, { color: '#065F46' }]}>
                  {report.resolution_notes}
                </Text>
              </View>
            </View>
          )}

          {/* Timestamps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Calendar size={18} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.infoLabel}>Ngày báo cáo</Text>
                  <Text style={styles.infoValue}>{formatDate(report.createdAt)}</Text>
                </View>
              </View>
              {report.resolved_at && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <CheckCircle2 size={18} color="#10B981" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.infoLabel}>Ngày xử lý xong</Text>
                      <Text style={styles.infoValue}>{formatDate(report.resolved_at)}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Full Image Modal */}
      {selectedImageIndex !== null && report.images && (
        <View style={styles.fullImageModal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImageIndex(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedImageIndex * width, y: 0 }}
          >
            {report.images.map((imageUri, index) => (
              <View key={index} style={styles.fullImageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                <Text style={styles.imageCounter}>
                  {index + 1} / {report.images!.length}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  content: {
    padding: 20,
  },
  codeSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reportCode: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  issueTypeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  issueTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  descriptionCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnail: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  fullImageModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 999,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  fullImageContainer: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: '80%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 40,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});