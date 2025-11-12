import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Camera, X, FileText, CreditCard, Eye } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { kycAPI } from '@/api/kycAPI';

export default function VerifyDocumentsScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [identityStatus, setIdentityStatus] = useState<string>('not_submitted');
  const [licenseStatus, setLicenseStatus] = useState<string>('not_submitted');

  // Reload status khi quay lại màn hình
  useFocusEffect(
    React.useCallback(() => {
      loadKYCStatus();
    }, [])
  );

  const loadKYCStatus = async () => {
    try {
      const response = await kycAPI.getKYCStatus();
      
      
      // Cập nhật trạng thái CCCD
      if (response.identity && response.identity.frontUploaded && response.identity.backUploaded) {
        setIdentityStatus(response.kycStatus);
      } else if (response.identity && (response.identity.frontUploaded || response.identity.backUploaded)) {
        setIdentityStatus('uploading');
      }
      
      // Cập nhật trạng thái GPLX
      if (response.license && response.license.frontUploaded && response.license.backUploaded) {
        setLicenseStatus(response.kycStatus);
      } else if (response.license && (response.license.frontUploaded || response.license.backUploaded)) {
        setLicenseStatus('uploading');
      }
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Đang chờ xác minh';
      case 'approved': return 'Đã xác minh';
      case 'rejected': return 'Bị từ chối';
      case 'uploading': return 'Đang tải lên';
      default: return 'Chưa tải lên';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA726';
      case 'approved': return '#66BB6A';
      case 'rejected': return '#EF5350';
      case 'uploading': return '#42A5F5';
      default: return colors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: '#1B5E20',
    },
    closeButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginLeft: 16,
      fontFamily: 'Inter-Bold',
    },
    scrollContent: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      fontFamily: 'Inter-Bold',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.border,
    },
    statusText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      gap: 8,
    },
    uploadButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác thực kyc</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Xác thực kyc</Text>

        {/* CCCD Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Căn cước công dân</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(identityStatus) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(identityStatus) }]}>
                {isLoading ? '...' : getStatusText(identityStatus)}
              </Text>
            </View>
          </View>
          
          <View style={styles.iconContainer}>
            <CreditCard size={24} color={colors.primary} />
          </View>

          <Text style={styles.cardDescription}>
            Chụp rõ 2 mặt của CCCD để xác thực danh tính
          </Text>

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => router.push('/verify-cccd')}
          >
            {identityStatus !== 'not_submitted' ? (
              <>
                <Eye size={18} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Xem ảnh</Text>
              </>
            ) : (
              <>
                <Camera size={18} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Chụp ảnh CCCD</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* GPLX Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Giấy phép lái xe</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(licenseStatus) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(licenseStatus) }]}>
                {isLoading ? '...' : getStatusText(licenseStatus)}
              </Text>
            </View>
          </View>

          <View style={styles.iconContainer}>
            <FileText size={24} color={colors.primary} />
          </View>

          <Text style={styles.cardDescription}>
            Chụp rõ 2 mặt của GPLX để xác thực quyền lái xe
          </Text>

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => router.push('/verify-gplx')}
          >
            {licenseStatus !== 'not_submitted' ? (
              <>
                <Eye size={18} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Xem ảnh</Text>
              </>
            ) : (
              <>
                <Camera size={18} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Chụp ảnh GPLX</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

