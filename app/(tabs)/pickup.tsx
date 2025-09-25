import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrCode, FileText, CircleCheck as CheckCircle, Camera, Clock } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';

export default function PickupScreen() {
  const { colors } = useTheme();
  const { startRental } = useAppStore();
  const [currentStep, setCurrentStep] = useState<'qr' | 'inspection' | 'contract' | 'complete'>('qr');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const inspectionItems = [
    'Kiểm tra thân xe không trầy xước',
    'Kiểm tra đèn chiếu sáng hoạt động tốt',
    'Kiểm tra gương chiếu hậu',
    'Kiểm tra lốp xe và áp suất',
    'Kiểm tra phanh trước/sau',
    'Kiểm tra mức pin còn lại'
  ];

  const handleQRScan = () => {
    // Mock QR scan
    Alert.alert('QR Code đã quét', 'Xe VinFast VF e34 đã được xác thực!', [
      { text: 'Tiếp tục', onPress: () => setCurrentStep('inspection') }
    ]);
  };

  const toggleCheckedItem = (item: string) => {
    setCheckedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const handleCompleteInspection = () => {
    if (checkedItems.length !== inspectionItems.length) {
      Alert.alert('Chưa hoàn thành', 'Vui lòng kiểm tra tất cả các mục');
      return;
    }
    setCurrentStep('contract');
  };

  const handleSignContract = () => {
    Alert.alert('Ký hợp đồng', 'Hợp đồng đã được ký thành công!', [
      { text: 'Hoàn thành', onPress: () => {
        setCurrentStep('complete');
        startRental('1'); // Mock vehicle ID
      }}
    ]);
  };

  const renderQRStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <QrCode size={32} color={colors.primary} />
        <ThemedText type="subtitle">Quét mã QR trên xe</ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Hướng camera vào mã QR để bắt đầu quá trình nhận xe
        </ThemedText>
      </View>

      <Card style={styles.qrContainer}>
        <View style={styles.qrPlaceholder}>
          <QrCode size={100} color={colors.primary} />
          <ThemedText style={[styles.qrText, { color: colors.textSecondary }]}>
            Nhấn nút dưới để mở camera
          </ThemedText>
        </View>
      </Card>

      <Button
        title="Quét mã QR"
        onPress={handleQRScan}
        fullWidth
        style={styles.actionButton}
      />
    </View>
  );

  const renderInspectionStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <CheckCircle size={32} color={colors.primary} />
        <ThemedText type="subtitle">Kiểm tra tình trạng xe</ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Kiểm tra các mục sau trước khi nhận xe
        </ThemedText>
      </View>

      <ScrollView style={styles.checklistContainer}>
        {inspectionItems.map((item, index) => (
          <Card key={index} style={styles.checklistItem}>
            <View style={styles.checklistRow}>
              <Button
                title=""
                variant={checkedItems.includes(item) ? 'primary' : 'outline'}
                onPress={() => toggleCheckedItem(item)}
                style={styles.checkbox}
              >
                {checkedItems.includes(item) && (
                  <CheckCircle size={16} color={colors.white} />
                )}
              </Button>
              <ThemedText style={styles.checklistText}>{item}</ThemedText>
            </View>
          </Card>
        ))}
      </ScrollView>

      <Button
        title="Chụp ảnh tình trạng xe"
        variant="outline"
        onPress={() => Alert.alert('Camera', 'Chức năng chụp ảnh')}
        fullWidth
        style={styles.cameraButton}
      />

      <Button
        title="Hoàn thành kiểm tra"
        onPress={handleCompleteInspection}
        disabled={checkedItems.length !== inspectionItems.length}
        fullWidth
        style={styles.actionButton}
      />
    </View>
  );

  const renderContractStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <FileText size={32} color={colors.primary} />
        <ThemedText type="subtitle">Hợp đồng thuê xe</ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Đọc và ký hợp đồng để hoàn thành việc nhận xe
        </ThemedText>
      </View>

      <Card style={styles.contractContainer}>
        <ScrollView style={styles.contractContent}>
          <ThemedText type="subtitle" style={styles.contractTitle}>
            ĐIỀU KHOẢN THUÊ XE ĐIỆN
          </ThemedText>
          <ThemedText style={[styles.contractText, { color: colors.textSecondary }]}>
            1. Người thuê phải có giấy phép lái xe hợp lệ{'\n'}
            2. Tuân thủ luật giao thông và quy định về xe điện{'\n'}
            3. Bảo quản xe cẩn thận, báo cáo sự cố ngay lập tức{'\n'}
            4. Trả xe đúng thời gian và địa điểm đã thỏa thuận{'\n'}
            5. Chịu trách nhiệm về các thiệt hại do lỗi của mình
          </ThemedText>
        </ScrollView>
        
        <View style={styles.signatureArea}>
          <ThemedText style={[styles.signatureLabel, { color: colors.textSecondary }]}>
            Khu vực ký tên (cảm ứng)
          </ThemedText>
        </View>
      </Card>

      <Button
        title="Ký hợp đồng"
        onPress={handleSignContract}
        fullWidth
        style={styles.actionButton}
      />
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <CheckCircle size={64} color={colors.success} />
        <ThemedText type="title" style={[styles.successTitle, { color: colors.success }]}>
          Nhận xe thành công!
        </ThemedText>
        <ThemedText style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Bạn đã hoàn thành quy trình nhận xe. Chúc bạn có chuyến đi an toàn!
        </ThemedText>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Xe:</ThemedText>
          <ThemedText style={styles.summaryValue}>VinFast VF e34</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Thời gian nhận:</ThemedText>
          <ThemedText style={styles.summaryValue}>{new Date().toLocaleTimeString('vi-VN')}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Giá thuê:</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>
            25,000đ/giờ
          </ThemedText>
        </View>
      </Card>

      <Button
        title="Bắt đầu hành trình"
        onPress={() => {/* Navigate to rental screen */}}
        fullWidth
        style={styles.actionButton}
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'qr':
        return renderQRStep();
      case 'inspection':
        return renderInspectionStep();
      case 'contract':
        return renderContractStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderQRStep();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Nhận xe</ThemedText>
        <View style={styles.progressContainer}>
          {['qr', 'inspection', 'contract', 'complete'].map((step, index) => (
            <View 
              key={step} 
              style={[
                styles.progressDot,
                {
                  backgroundColor: ['qr', 'inspection', 'contract', 'complete'].indexOf(currentStep) >= index 
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
  qrContainer: {
    marginBottom: 32,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  qrText: {
    marginTop: 16,
    textAlign: 'center',
  },
  checklistContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  checklistItem: {
    marginBottom: 12,
    padding: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    padding: 0,
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
  },
  cameraButton: {
    marginBottom: 16,
  },
  contractContainer: {
    marginBottom: 24,
    maxHeight: 300,
  },
  contractContent: {
    maxHeight: 200,
  },
  contractTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  contractText: {
    lineHeight: 20,
    marginBottom: 16,
  },
  signatureArea: {
    height: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  signatureLabel: {
    fontSize: 12,
  },
  successTitle: {
    textAlign: 'center',
    marginTop: 16,
  },
  summaryCard: {
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 16,
    marginBottom: 24,
  },
});