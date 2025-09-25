import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Camera, CreditCard, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';

export default function ReturnScreen() {
  const { colors } = useTheme();
  const { currentRental, endRental } = useAppStore();
  const [currentStep, setCurrentStep] = useState<'location' | 'inspection' | 'payment' | 'complete'>('location');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [damages, setDamages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  const stations = [
    { id: '1', name: 'Hoàn Kiếm Station', address: 'Hàng Bài, Hoàn Kiếm' },
    { id: '2', name: 'Tràng Tiền Station', address: 'Tràng Tiền, Hoàn Kiếm' },
    { id: '3', name: 'Lý Thái Tổ Station', address: 'Lý Thái Tổ, Hoàn Kiếm' }
  ];

  const damageOptions = [
    'Trầy xước nhẹ',
    'Vỡ gương',
    'Lốp xe bị hỏng',
    'Đèn không hoạt động',
    'Phanh kém',
    'Khác'
  ];

  const handleSelectStation = (stationId: string) => {
    setSelectedStation(stationId);
    setCurrentStep('inspection');
  };

  const handleToggleDamage = (damage: string) => {
    setDamages(prev => 
      prev.includes(damage)
        ? prev.filter(d => d !== damage)
        : [...prev, damage]
    );
  };

  const handleTakePhoto = () => {
    // Mock photo taking
    Alert.alert('Camera', 'Ảnh đã được chụp và lưu!');
    setPhotos(prev => [...prev, `photo_${Date.now()}.jpg`]);
  };

  const handleCompleteInspection = () => {
    setCurrentStep('payment');
  };

  const handlePayment = () => {
    const additionalCharges = damages.length * 50000; // Mock additional charges
    endRental(damages, additionalCharges);
    setCurrentStep('complete');
  };

  const renderLocationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <MapPin size={32} color={colors.primary} />
        <ThemedText type="subtitle">Chọn điểm trả xe</ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Chọn một trong các điểm trả xe gần bạn
        </ThemedText>
      </View>

      {stations.map((station) => (
        <Card key={station.id} style={styles.stationCard}>
          <View style={styles.stationInfo}>
            <ThemedText type="subtitle">{station.name}</ThemedText>
            <ThemedText style={[styles.stationAddress, { color: colors.textSecondary }]}>
              {station.address}
            </ThemedText>
          </View>
          <Button
            title="Chọn"
            onPress={() => handleSelectStation(station.id)}
            variant="outline"
          />
        </Card>
      ))}
    </View>
  );

  const renderInspectionStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Camera size={32} color={colors.primary} />
        <ThemedText type="subtitle">Kiểm tra tình trạng xe</ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Ghi nhận tình trạng xe trước khi trả
        </ThemedText>
      </View>

      <Card style={styles.photosSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Chụp ảnh xe (bắt buộc)
        </ThemedText>
        <Button
          title="Chụp ảnh tình trạng xe"
          onPress={handleTakePhoto}
          variant="outline"
          fullWidth
          style={styles.photoButton}
        />
        {photos.length > 0 && (
          <ThemedText style={[styles.photoCount, { color: colors.success }]}>
            ✓ Đã chụp {photos.length} ảnh
          </ThemedText>
        )}
      </Card>

      <Card style={styles.damagesSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Báo cáo hư hỏng (nếu có)
        </ThemedText>
        {damageOptions.map((damage) => (
          <View key={damage} style={styles.damageOption}>
            <Button
              title=""
              variant={damages.includes(damage) ? 'primary' : 'outline'}
              onPress={() => handleToggleDamage(damage)}
              style={styles.damageCheckbox}
            >
              {damages.includes(damage) && (
                <CheckCircle size={16} color={colors.white} />
              )}
            </Button>
            <ThemedText style={styles.damageText}>{damage}</ThemedText>
          </View>
        ))}
      </Card>

      <Button
        title="Hoàn thành kiểm tra"
        onPress={handleCompleteInspection}
        disabled={photos.length === 0}
        fullWidth
        style={styles.actionButton}
      />
    </View>
  );

  const renderPaymentStep = () => {
    if (!currentRental) return null;
    
    const duration = Math.ceil((new Date().getTime() - currentRental.startTime.getTime()) / (1000 * 60 * 60));
    const baseCost = duration * currentRental.vehicle.pricePerHour;
    const additionalCharges = damages.length * 50000;
    const totalCost = baseCost + additionalCharges;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <CreditCard size={32} color={colors.primary} />
          <ThemedText type="subtitle">Thanh toán</ThemedText>
          <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
            Xác nhận và thanh toán chi phí thuê xe
          </ThemedText>
        </View>

        <Card style={styles.billCard}>
          <ThemedText type="subtitle" style={styles.billTitle}>
            HOÁ ĐƠN THUÊ XE
          </ThemedText>
          
          <View style={styles.billRow}>
            <ThemedText>Thời gian thuê:</ThemedText>
            <ThemedText>{duration} giờ</ThemedText>
          </View>
          
          <View style={styles.billRow}>
            <ThemedText>Giá cơ bản:</ThemedText>
            <ThemedText>{baseCost.toLocaleString('vi-VN')}đ</ThemedText>
          </View>
          
          {damages.length > 0 && (
            <View style={styles.billRow}>
              <ThemedText style={{ color: colors.warning }}>
                Phí hư hỏng ({damages.length} mục):
              </ThemedText>
              <ThemedText style={{ color: colors.warning }}>
                +{additionalCharges.toLocaleString('vi-VN')}đ
              </ThemedText>
            </View>
          )}
          
          <View style={[styles.billRow, styles.totalRow]}>
            <ThemedText type="subtitle">Tổng cộng:</ThemedText>
            <ThemedText type="subtitle" style={{ color: colors.primary }}>
              {totalCost.toLocaleString('vi-VN')}đ
            </ThemedText>
          </View>
        </Card>

        {damages.length > 0 && (
          <Card style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}>
            <View style={styles.warningHeader}>
              <AlertTriangle size={20} color={colors.warning} />
              <ThemedText style={[styles.warningTitle, { color: colors.warning }]}>
                Phát hiện hư hỏng
              </ThemedText>
            </View>
            {damages.map((damage, index) => (
              <ThemedText key={index} style={[styles.damageItem, { color: colors.warning }]}>
                • {damage}
              </ThemedText>
            ))}
          </Card>
        )}

        <Button
          title="Xác nhận thanh toán"
          onPress={handlePayment}
          fullWidth
          style={styles.actionButton}
        />
      </View>
    );
  };

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <CheckCircle size={64} color={colors.success} />
        <ThemedText type="title" style={[styles.successTitle, { color: colors.success }]}>
          Trả xe thành công!
        </ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Cảm ơn bạn đã sử dụng dịch vụ. Hẹn gặp lại!
        </ThemedText>
      </View>

      <Card style={styles.summaryCard}>
        <ThemedText type="subtitle" style={styles.summaryTitle}>
          TÓNG KẾT CHUYẾN ĐI
        </ThemedText>
        
        <View style={styles.summaryRow}>
          <ThemedText>Thời gian:</ThemedText>
          <ThemedText>{new Date().toLocaleTimeString('vi-VN')}</ThemedText>
        </View>
        
        <View style={styles.summaryRow}>
          <ThemedText>Quãng đường:</ThemedText>
          <ThemedText>~{Math.floor(Math.random() * 30 + 10)} km</ThemedText>
        </View>
        
        <View style={styles.summaryRow}>
          <ThemedText>Tiết kiệm CO₂:</ThemedText>
          <ThemedText style={{ color: colors.success }}>
            ~{Math.floor(Math.random() * 5 + 2)} kg
          </ThemedText>
        </View>
      </Card>

      <Button
        title="Về trang chủ"
        onPress={() => {/* Navigate to home */}}
        fullWidth
        style={styles.actionButton}
      />

      <Button
        title="Đánh giá chuyến đi"
        variant="outline"
        onPress={() => Alert.alert('Đánh giá', 'Cảm ơn phản hồi của bạn!')}
        fullWidth
        style={styles.reviewButton}
      />
    </View>
  );

  if (!currentRental && currentStep !== 'complete') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <AlertTriangle size={64} color={colors.textSecondary} />
          <ThemedText type="subtitle" style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            Không có chuyến thuê nào
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Bạn cần nhận xe trước khi có thể trả xe
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'location':
        return renderLocationStep();
      case 'inspection':
        return renderInspectionStep();
      case 'payment':
        return renderPaymentStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderLocationStep();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Trả xe</ThemedText>
        <View style={styles.progressContainer}>
          {['location', 'inspection', 'payment', 'complete'].map((step, index) => (
            <View 
              key={step} 
              style={[
                styles.progressDot,
                {
                  backgroundColor: ['location', 'inspection', 'payment', 'complete'].indexOf(currentStep) >= index 
                    ? colors.primary 
                    : colors.border
                }
              ]} 
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepDescription: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  stationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationAddress: {
    fontSize: 14,
    marginTop: 4,
  },
  photosSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  photoButton: {
    marginBottom: 12,
  },
  photoCount: {
    fontSize: 14,
    textAlign: 'center',
  },
  damagesSection: {
    marginBottom: 24,
  },
  damageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  damageCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    padding: 0,
  },
  damageText: {
    flex: 1,
    fontSize: 14,
  },
  billCard: {
    marginBottom: 24,
  },
  billTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 16,
  },
  warningCard: {
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  damageItem: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 4,
  },
  successTitle: {
    textAlign: 'center',
    marginTop: 16,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  reviewButton: {
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
});