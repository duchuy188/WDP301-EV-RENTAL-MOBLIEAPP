import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Camera, X, AlertCircle, Eye } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '@/store/themeStore';
import { kycAPI } from '@/api/kycAPI';

const { width, height } = Dimensions.get('window');

export default function VerifyGPLXScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  const [placeIssue, setPlaceIssue] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [licenseClass, setLicenseClass] = useState('');
  const [classList, setClassList] = useState<string[]>([]);
  const [expiryText, setExpiryText] = useState('');
  const [kycStatus, setKycStatus] = useState<string>('');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  // Load ảnh đã upload khi vào màn hình
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      
      
      // Lấy thông tin từ getDriverLicense
      const response = await kycAPI.getDriverLicense();
      
      
      if (response && (response as any).data?.driverLicense) {
        const licenseData = (response as any).data.driverLicense;
        
        
        // Set ảnh
        if (licenseData.frontImage) {
          
          setFrontImage(licenseData.frontImage);
        }
        if (licenseData.backImage) {
          
          setBackImage(licenseData.backImage);
        }
        
        // Set thông tin cơ bản
        if (licenseData.id) {
          setLicenseNumber(formatLicenseNumber(licenseData.id));
        }
        if (licenseData.name) {
          setFullName(licenseData.name);
        }
        if (licenseData.dob) {
          setDateOfBirth(licenseData.dob);
        }
        
        // Set thông tin chi tiết
        if (licenseData.nationality) {
          setNationality(licenseData.nationality);
        }
        if (licenseData.address) {
          setAddress(licenseData.address);
        }
        if (licenseData.placeIssue) {
          setPlaceIssue(licenseData.placeIssue);
        }
        if (licenseData.issueDate) {
          setIssueDate(licenseData.issueDate);
        }
        if (licenseData.class) {
          setLicenseClass(licenseData.class);
        }
        if (licenseData.classList && Array.isArray(licenseData.classList)) {
          setClassList(licenseData.classList);
        }
        if (licenseData.expiryText) {
          setExpiryText(licenseData.expiryText);
        }
        
        
      } else {
        
      }
      
      // Lấy status từ API status
      try {
        const statusResponse: any = await kycAPI.getKYCStatus();
        setKycStatus(statusResponse.status || statusResponse.kycStatus || 'not_submitted');
      } catch (statusError) {
        
      }
    } catch (error: any) {
      
      
      
    }
  };

  const processImageWithOCR = async (imageUri: string, side: 'front' | 'back') => {
    setIsLoading(true);
    try {
      const fileName = imageUri.split('/').pop() || `license_${side}_${Date.now()}.jpg`;
      const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

      const imageFile = {
        uri: imageUri,
        name: fileName,
        type: fileType,
      };

      

      if (side === 'front') {
        const response = await kycAPI.uploadLicenseFront(imageFile);
        
        
        setFrontImage(imageUri);
        
        // Auto-fill từ OCR
        if (response.license?.id) {
          setLicenseNumber(formatLicenseNumber(response.license.id));
        }
        if (response.license?.name) {
          setFullName(response.license.name);
        }
        if ((response.license as any)?.dob) {
          setDateOfBirth(formatDate((response.license as any).dob));
        }
        
        Alert.alert('Thành công', 'Đã lưu ảnh mặt trước GPLX');
      } else {
        const response = await kycAPI.uploadLicenseBack(imageFile);
        
        
        setBackImage(imageUri);
        Alert.alert('Thành công', 'Đã lưu ảnh mặt sau GPLX');
      }
    } catch (error: any) {
      
      if (error.message?.includes('Network Error')) {
        Alert.alert('Không thể kết nối', 'Vui lòng chụp lại');
      } else {
        Alert.alert('Lỗi', 'Vui lòng chụp lại');
      }
      // Xóa ảnh nếu upload thất bại
      if (side === 'front') {
        setFrontImage(null);
      } else {
        setBackImage(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.6, // Reduced quality for faster upload
    });

    if (!result.canceled && result.assets[0]) {
      // Chỉ lưu ảnh local, không gọi API ngay
      if (side === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async (side: 'front' | 'back') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.6, // Reduced quality for faster upload
    });

    if (!result.canceled && result.assets[0]) {
      // Chỉ lưu ảnh local, không gọi API ngay
      if (side === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
    }
  };

  const showImageOptions = (side: 'front' | 'back') => {
    Alert.alert(
      'Chọn hình ảnh',
      'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: () => takePhoto(side) },
        { text: 'Chọn từ thư viện', onPress: () => pickImage(side) },
      ]
    );
  };

  const formatLicenseNumber = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const limited = numbers.slice(0, 12);
    const formatted = limited.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    return formatted;
  };

  const formatDate = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const limited = numbers.slice(0, 8);
    let formatted = limited;
    if (limited.length > 3) {
      formatted = limited.slice(0, 2);
      if (limited.length >= 4) {
        formatted += '/' + limited.slice(2, 4) + '/' + limited.slice(4);
      } else {
        formatted += '/' + limited.slice(2);
      }
    }
    return formatted;
  };

  const handleSubmit = async () => {
    if (!frontImage || !backImage) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng upload đầy đủ ảnh mặt trước và mặt sau GPLX'
      );
      return;
    }

    setIsLoading(true);
    try {
      const fileName = frontImage.split('/').pop() || `license_front_${Date.now()}.jpg`;
      const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

      // Prepare front image file
      const frontImageFile = {
        uri: frontImage,
        name: fileName,
        type: fileType,
      };

      const backFileName = backImage.split('/').pop() || `license_back_${Date.now()}.jpg`;
      const backFileType = backFileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

      // Prepare back image file
      const backImageFile = {
        uri: backImage,
        name: backFileName,
        type: backFileType,
      };

      // Call API to upload front image
      
      const frontResponse = await kycAPI.uploadLicenseFront(frontImageFile);
      

      // Auto-fill form with OCR data from response if available
      if (frontResponse.license?.id) {
        setLicenseNumber(formatLicenseNumber(frontResponse.license.id));
      }
      if (frontResponse.license?.name) {
        setFullName(frontResponse.license.name);
      }
      if ((frontResponse.license as any)?.dob) {
        setDateOfBirth(formatDate((frontResponse.license as any).dob));
      }

      // Call API to upload back image
      
      const backResponse = await kycAPI.uploadLicenseBack(backImageFile);
      

      // Get KYC status after upload
      try {
        const statusResponse = await kycAPI.getKYCStatus();
        
        setKycStatus(statusResponse.kycStatus || 'pending');
      } catch (statusError) {
        
      }

      // Show success message
      Alert.alert(
        'Thành công',
        'Hồ sơ GPLX của bạn đã được nộp thành công!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      
      
      if (error.message === 'Network Error' || error.message?.includes('Network')) {
        Alert.alert(
          'Không thể kết nối', 
          'Vui lòng kiểm tra kết nối mạng và thử lại',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Lỗi', 
          'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
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
    notice: {
      backgroundColor: '#FFEBEE',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      flexDirection: 'row',
      gap: 12,
    },
    noticeText: {
      flex: 1,
      fontSize: 14,
      color: '#C62828',
      lineHeight: 20,
      fontFamily: 'Inter-Regular',
    },
    noticeHighlight: {
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      fontFamily: 'Inter-SemiBold',
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      fontFamily: 'Inter-Regular',
    },
    imageUploadContainer: {
      marginBottom: 16,
    },
    imageUploadBox: {
      height: 200,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    uploadedImage: {
      width: '100%',
      height: '100%',
    },
    imagePreviewContainer: {
      height: 200,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    viewImageButton: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadContent: {
      alignItems: 'center',
      gap: 8,
    },
    uploadText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
      marginTop: 8,
    },
    uploadButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      fontFamily: 'Inter-Medium',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    infoText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      fontFamily: 'Inter-Regular',
    },
    whyLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
    },
    whyLinkText: {
      fontSize: 14,
      color: colors.text,
      textDecorationLine: 'underline',
      fontFamily: 'Inter-Regular',
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 40,
    },
    submitButtonDisabled: {
      backgroundColor: colors.border,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    loadingBox: {
      backgroundColor: colors.surface,
      padding: 30,
      borderRadius: 16,
      alignItems: 'center',
      minWidth: 200,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBackground: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: width,
      height: height,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 24,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    fullImage: {
      width: width,
      height: height * 0.8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin GPLX</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!frontImage && !backImage && (
          <View style={styles.notice}>
            <AlertCircle size={20} color="#C62828" />
            <Text style={styles.noticeText}>
              Lưu ý: Để tránh phát sinh vấn đề trong quá trình thuê xe, người đặt xe trên EV Renter (đã xác thực GPLX) <Text style={styles.noticeHighlight}>ĐỒNG THỜI phải là người nhận xe.</Text>
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh mặt trước GPLX</Text>
          {!frontImage && (
            <>
              <Text style={styles.sectionSubtitle}>
                Vui lòng sử dụng GPLX thẻ cứng
              </Text>
              <Text style={styles.sectionSubtitle}>
                Hình chụp cần thấy được ảnh đại diện và số GPLX
              </Text>
            </>
          )}

          <View style={styles.imageUploadContainer}>
            {frontImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: frontImage }} style={styles.uploadedImage} resizeMode="cover" />
                <TouchableOpacity 
                  style={styles.viewImageButton}
                  onPress={() => openImageModal(frontImage)}
                >
                  <Eye size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imageUploadBox}
                onPress={() => showImageOptions('front')}
              >
                <View style={styles.uploadContent}>
                  <Camera size={48} color={colors.textSecondary} />
                  <Text style={styles.uploadText}>Chụp ảnh mặt trước</Text>
                  <TouchableOpacity style={styles.uploadButton} onPress={() => showImageOptions('front')}>
                    <Camera size={16} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>Chụp ảnh GPLX</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh mặt sau GPLX</Text>
          {!backImage && (
            <Text style={styles.sectionSubtitle}>
              Hình chụp mặt sau cần thấy rõ các hạng GPLX
            </Text>
          )}
          
          <View style={styles.imageUploadContainer}>
            {backImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: backImage }} style={styles.uploadedImage} resizeMode="cover" />
                <TouchableOpacity 
                  style={styles.viewImageButton}
                  onPress={() => openImageModal(backImage)}
                >
                  <Eye size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imageUploadBox}
                onPress={() => showImageOptions('back')}
              >
                <View style={styles.uploadContent}>
                  <Camera size={48} color={colors.textSecondary} />
                  <Text style={styles.uploadText}>Chụp ảnh mặt sau</Text>
                  <TouchableOpacity style={styles.uploadButton} onPress={() => showImageOptions('back')}>
                    <Camera size={16} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>Chụp ảnh GPLX</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Hiển thị thông tin chi tiết chỉ khi đã xác minh thành công */}
        {(frontImage || backImage) && (kycStatus === 'verified' || kycStatus === 'approved') && (
          <>
            <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số giấy phép lái xe</Text>
          <Text style={styles.sectionSubtitle}>Dãy 12 chữ số ở mặt trước GPLX</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="0000-0000-0000"
              placeholderTextColor={colors.textSecondary}
              value={licenseNumber}
              onChangeText={(text) => setLicenseNumber(formatLicenseNumber(text))}
              keyboardType="number-pad"
              maxLength={14}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngày sinh</Text>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/yyyy"
            placeholderTextColor={colors.textSecondary}
            value={dateOfBirth}
            onChangeText={(text) => setDateOfBirth(formatDate(text))}
            keyboardType="number-pad"
            maxLength={10}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Quốc tịch</Text>
          <TextInput
            style={styles.input}
            placeholder="Quốc tịch"
            placeholderTextColor={colors.textSecondary}
            value={nationality}
            onChangeText={setNationality}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Địa chỉ</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Địa chỉ"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nơi cấp</Text>
          <TextInput
            style={styles.input}
            placeholder="Nơi cấp"
            placeholderTextColor={colors.textSecondary}
            value={placeIssue}
            onChangeText={setPlaceIssue}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngày cấp</Text>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/yyyy"
            placeholderTextColor={colors.textSecondary}
            value={issueDate}
            onChangeText={setIssueDate}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Hạng</Text>
          <TextInput
            style={styles.input}
            placeholder="Hạng GPLX"
            placeholderTextColor={colors.textSecondary}
            value={licenseClass}
            onChangeText={setLicenseClass}
            editable={false}
          />
        </View>

        {classList.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loại xe được phép lái</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Loại xe"
              placeholderTextColor={colors.textSecondary}
              value={classList.join('\n')}
              multiline
              numberOfLines={classList.length}
              editable={false}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Thời hạn</Text>
          <TextInput
            style={styles.input}
            placeholder="Thời hạn"
            placeholderTextColor={colors.textSecondary}
            value={expiryText}
            onChangeText={setExpiryText}
            editable={false}
          />
        </View>
          </>
        )}

        {/* Link "Vì sao" luôn hiển thị */}
        <TouchableOpacity 
          style={styles.whyLink}
          onPress={() => {
            Alert.alert(
              'Vì sao tôi phải xác thực GPLX',
              'Xác thực GPLX giúp đảm bảo an toàn cho cả chủ xe và người thuê. Theo luật, người lái xe phải có GPLX hợp lệ khi tham gia giao thông.'
            );
          }}
        >
          <AlertCircle size={16} color={colors.text} />
          <Text style={styles.whyLinkText}>Vì sao tôi phải xác thực GPLX</Text>
        </TouchableOpacity>

        {/* Submit Button - Ẩn khi đã xác minh hoặc đang xem ảnh */}
        {!modalVisible && kycStatus !== 'verified' && kycStatus !== 'approved' && (
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!frontImage || !backImage) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!frontImage || !backImage}
          >
            <Text style={styles.submitButtonText}>Nộp hồ sơ</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Loading Overlay for OCR Processing */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Đang xử lý ảnh GPLX...</Text>
          </View>
        </View>
      )}

      {/* Image Viewer Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.fullImage} 
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

