import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Modal,
  Image
} from 'react-native';
import { QrCode, Camera, CircleCheck as CheckCircle, FileText, Clock, MapPin } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { useVehicleStore } from '@/store/vehicleStore';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function PickupScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const { currentRental } = useVehicleStore();
  const [qrScanned, setQrScanned] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);
  const [checklistCompleted, setChecklistCompleted] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const checklistItems = [
    { id: 1, title: 'Kiểm tra ngoại thất xe', completed: false },
    { id: 2, title: 'Kiểm tra nội thất xe', completed: false },
    { id: 3, title: 'Kiểm tra mức pin', completed: false },
    { id: 4, title: 'Kiểm tra bánh xe', completed: false },
    { id: 5, title: 'Chụp ảnh xe trước khi nhận', completed: false },
  ];

  const [checklist, setChecklist] = useState(checklistItems);

  const handleQRScan = () => {
    setShowQRModal(true);
    // Mock QR scan success after 2 seconds
    setTimeout(() => {
      setQrScanned(true);
      setShowQRModal(false);
      Alert.alert('Thành công', 'QR Code đã được quét thành công!');
    }, 2000);
  };

  const handleSignContract = () => {
    setShowContractModal(true);
  };

  const handleContractSign = () => {
    setContractSigned(true);
    setShowContractModal(false);
    Alert.alert('Thành công', 'Hợp đồng đã được ký thành công!');
  };

  const toggleChecklistItem = (id: number) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const isChecklistComplete = completedCount === checklist.length;

  React.useEffect(() => {
    setChecklistCompleted(isChecklistComplete);
  }, [isChecklistComplete]);

  const canConfirmPickup = qrScanned && contractSigned && checklistCompleted;

  const handleConfirmPickup = () => {
    if (canConfirmPickup) {
      Alert.alert(
        'Xác nhận nhận xe',
        'Bạn đã hoàn thành tất cả các bước. Xe đã sẵn sàng để sử dụng!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset states for demo
              setQrScanned(false);
              setContractSigned(false);
              setChecklistCompleted(false);
              setChecklist(checklistItems);
            }
          }
        ]
      );
    } else {
      Alert.alert('Chưa hoàn thành', 'Vui lòng hoàn thành tất cả các bước trước khi nhận xe.');
    }
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
      padding: 20,
    },
    rentalInfo: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vehicleName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      fontFamily: 'Inter-Bold',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
      fontFamily: 'Inter-Regular',
    },
    stepCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    stepTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    stepButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stepButtonCompleted: {
      backgroundColor: colors.success,
    },
    stepButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    stepDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    checklistTitle: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    checklistProgress: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 16,
      fontFamily: 'Inter-Medium',
    },
    confirmButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 20,
    },
    confirmButtonDisabled: {
      backgroundColor: colors.border,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
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
      padding: 30,
      alignItems: 'center',
      margin: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      fontFamily: 'Inter-Bold',
    },
    qrPlaceholder: {
      width: 200,
      height: 200,
      backgroundColor: colors.border,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    contractPreview: {
      width: '100%',
      height: 200,
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
    },
    contractText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
    },
    signButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 8,
    },
    signButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
  });

  if (!currentRental) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nhận xe</Text>
          <Text style={styles.subtitle}>Chưa có chuyến thuê nào đang hoạt động</Text>
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.stepDescription, { textAlign: 'center' }]}>
            Vui lòng đặt xe trước khi sử dụng tính năng này
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
        <Text style={styles.title}>Nhận xe</Text>
        <Text style={styles.subtitle}>Hoàn thành các bước để nhận xe</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.rentalInfo}>
          <Text style={styles.vehicleName}>{currentRental.vehicle.name}</Text>
          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{currentRental.pickupLocation}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {new Date(currentRental.startDate).toLocaleString('vi-VN')}
            </Text>
          </View>
        </Animated.View>

        {/* Step 1: QR Code Scan */}
        <AnimatedTouchableOpacity
          entering={FadeInDown.delay(300)}
          style={styles.stepCard}
          onPress={handleQRScan}
        >
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>1. Quét mã QR</Text>
            <TouchableOpacity
              style={[styles.stepButton, qrScanned && styles.stepButtonCompleted]}
              onPress={handleQRScan}
            >
              {qrScanned ? (
                <CheckCircle size={16} color="#FFFFFF" />
              ) : (
                <QrCode size={16} color="#FFFFFF" />
              )}
              <Text style={styles.stepButtonText}>
                {qrScanned ? 'Hoàn thành' : 'Quét QR'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.stepDescription}>
            Quét mã QR trên xe để xác thực và mở khóa xe
          </Text>
        </AnimatedTouchableOpacity>

        {/* Step 2: Contract Signing */}
        <AnimatedTouchableOpacity
          entering={FadeInDown.delay(400)}
          style={styles.stepCard}
          onPress={handleSignContract}
        >
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>2. Ký hợp đồng điện tử</Text>
            <TouchableOpacity
              style={[styles.stepButton, contractSigned && styles.stepButtonCompleted]}
              onPress={handleSignContract}
            >
              {contractSigned ? (
                <CheckCircle size={16} color="#FFFFFF" />
              ) : (
                <FileText size={16} color="#FFFFFF" />
              )}
              <Text style={styles.stepButtonText}>
                {contractSigned ? 'Đã ký' : 'Ký hợp đồng'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.stepDescription}>
            Đọc và ký hợp đồng thuê xe điện tử
          </Text>
        </AnimatedTouchableOpacity>

        {/* Step 3: Vehicle Checklist */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>3. Kiểm tra tình trạng xe</Text>
            <Text style={styles.checklistProgress}>
              {completedCount}/{checklist.length}
            </Text>
          </View>
          <Text style={styles.stepDescription}>
            Kiểm tra và ghi nhận tình trạng xe trước khi nhận
          </Text>

          {checklist.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.checklistItem}
              onPress={() => toggleChecklistItem(item.id)}
            >
              <TouchableOpacity
                onPress={() => toggleChecklistItem(item.id)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: item.completed ? colors.success : colors.border,
                  backgroundColor: item.completed ? colors.success : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {item.completed && <CheckCircle size={12} color="#FFFFFF" />}
              </TouchableOpacity>
              <Text style={[
                styles.checklistTitle,
                { color: item.completed ? colors.textSecondary : colors.text }
              ]}>
                {item.title}
              </Text>
              <TouchableOpacity style={{ padding: 8 }}>
                <Camera size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>

      <AnimatedTouchableOpacity
        entering={FadeInDown.delay(600)}
        style={[
          styles.confirmButton,
          !canConfirmPickup && styles.confirmButtonDisabled
        ]}
        onPress={handleConfirmPickup}
        disabled={!canConfirmPickup}
      >
        <Text style={styles.confirmButtonText}>Xác nhận bàn giao</Text>
      </AnimatedTouchableOpacity>

      {/* QR Modal */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quét mã QR</Text>
            <View style={styles.qrPlaceholder}>
              <QrCode size={64} color={colors.textSecondary} />
              <Text style={[styles.stepDescription, { marginTop: 12, textAlign: 'center' }]}>
                Đang quét...
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Contract Modal */}
      <Modal visible={showContractModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hợp đồng thuê xe</Text>
            <View style={styles.contractPreview}>
              <Text style={styles.contractText}>
                HỢP ĐỒNG THUÊ XE ĐIỆN{'\n\n'}
                Bên thuê: {currentRental.vehicle.name}{'\n'}
                Thời gian: {new Date(currentRental.startDate).toLocaleString('vi-VN')}{'\n'}
                Địa điểm: {currentRental.pickupLocation}{'\n\n'}
                Điều khoản:{'\n'}
                1. Bên thuê có trách nhiệm bảo quản xe{'\n'}
                2. Trả xe đúng thời gian quy định{'\n'}
                3. Chịu trách nhiệm về các thiệt hại...
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.stepButton, { backgroundColor: colors.border }]}
                onPress={() => setShowContractModal(false)}
              >
                <Text style={[styles.stepButtonText, { color: colors.text }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signButton} onPress={handleContractSign}>
                <Text style={styles.signButtonText}>Ký hợp đồng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}