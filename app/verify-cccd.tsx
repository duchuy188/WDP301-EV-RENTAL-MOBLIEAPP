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
import { Camera, Upload, X, AlertCircle, Eye } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '@/store/themeStore';
import { kycAPI } from '@/api/kycAPI';

const { width, height } = Dimensions.get('window');

export default function VerifyCCCDScreen() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  const [hometown, setHometown] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [issuePlace, setIssuePlace] = useState('');
  const [features, setFeatures] = useState('');
  const [doe, setDoe] = useState('');
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
      console.log('🔄 Bắt đầu load dữ liệu CCCD...');
      
      // Gọi API lấy thông tin CCCD chi tiết
      const response: any = await kycAPI.getIdentityCard();
      console.log('📸 Response từ API:', JSON.stringify(response, null, 2));
      
      // Check nếu response có data wrapper
      const data = response.data || response;
      const card = data.identityCard || data;
      
      console.log('📋 Identity Card data:', card);
      
      if (card) {
        // Ảnh
        if (card.frontImage) {
          console.log('🖼️ Setting front image:', card.frontImage);
          setFrontImage(card.frontImage);
        }
        if (card.backImage) {
          console.log('🖼️ Setting back image:', card.backImage);
          setBackImage(card.backImage);
        }
        
        // Thông tin cơ bản
        if (card.id) setIdNumber(card.id);
        if (card.name) setFullName(card.name);
        if (card.dob) setDateOfBirth(card.dob);
        if (card.sex) setGender(card.sex);
        if (card.nationality) setNationality(card.nationality);
        
        // Địa chỉ và nơi cấp
        if (card.address) setAddress(card.address);
        if (card.home) setHometown(card.home);
        if (card.issueDate) setIssueDate(card.issueDate);
        if (card.issueLocation) setIssuePlace(card.issueLocation);
        if (card.features) setFeatures(card.features);
        if (card.doe) setDoe(card.doe);
        
        console.log('✅ Đã load CCCD - Name:', card.name, 'Images:', !!card.frontImage, !!card.backImage);
      } else {
        console.log('⚠️ Không tìm thấy dữ liệu identityCard trong response');
      }
      
      // Lấy status từ API status
      try {
        const statusResponse: any = await kycAPI.getKYCStatus();
        setKycStatus(statusResponse.status || statusResponse.kycStatus || 'not_submitted');
      } catch (statusError) {
        console.log('⚠️ Lỗi khi lấy status:', statusError);
      }
    } catch (error: any) {
      console.log('❌ LỖI khi load CCCD:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error response:', error.response?.data);
    }
  };

  const processImageWithOCR = async (imageUri: string, side: 'front' | 'back') => {
    setIsLoading(true);
    try {
      // Prepare image file for API
      const imageFile = {
        uri: imageUri,
        name: side === 'front' ? 'cccd_front.jpg' : 'cccd_back.jpg',
        type: 'image/jpeg',
      };

      // Call OCR API
      if (side === 'front') {
        const response = await kycAPI.uploadIdentityCardFront(imageFile);
        
        // Auto-fill form with OCR data from response.identityCard
        if (response.identityCard) {
          const { id, name, dob } = response.identityCard;
          if (id) setIdNumber(id);
          if (name) setFullName(name);
          if (dob) setDateOfBirth(dob);
        }
        
        setFrontImage(imageUri);
        console.log('✅ OCR thành công, đã tự động điền thông tin');
      } else {
        const response = await kycAPI.uploadIdentityCardBack(imageFile);
        setBackImage(imageUri);
        console.log('✅ Đã xử lý ảnh mặt sau CCCD');
        
        // Gọi API để lấy trạng thái KYC sau khi upload cả 2 mặt
        try {
          const statusResponse = await kycAPI.getKYCStatus();
          console.log('📋 KYC Status:', statusResponse);
          if (statusResponse.identity) {
            setKycStatus(statusResponse.kycStatus || 'pending');
          }
        } catch (statusError) {
          console.log('⚠️ Không lấy được status:', statusError);
        }
      }
    } catch (error: any) {
      console.log('OCR Error:', error);
      
      // Check if it's a network error (backend not available)
      if (error.message === 'Network Error' || error.message?.includes('Network')) {
        Alert.alert(
          'Không thể kết nối', 
          'Vui lòng chụp lại',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Lỗi', 
          'Vui lòng chụp lại',
          [{ text: 'OK' }]
        );
      }
      
      // Still set the image even if OCR fails
      if (side === 'front') {
        setFrontImage(imageUri);
      } else {
        setBackImage(imageUri);
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

  const formatIdNumber = (text: string) => {
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
        'Vui lòng upload đầy đủ ảnh mặt trước và mặt sau CCCD'
      );
      return;
    }

    setIsLoading(true);
    try {
      // Prepare front image file
      const frontImageFile = {
        uri: frontImage,
        name: 'cccd_front.jpg',
        type: 'image/jpeg',
      };

      // Prepare back image file
      const backImageFile = {
        uri: backImage,
        name: 'cccd_back.jpg',
        type: 'image/jpeg',
      };

      // Call API to upload front image
      console.log('📤 Uploading front image...');
      const frontResponse = await kycAPI.uploadIdentityCardFront(frontImageFile);
      console.log('✅ Front image uploaded:', frontResponse);

      // Call API to upload back image
      console.log('📤 Uploading back image...');
      const backResponse = await kycAPI.uploadIdentityCardBack(backImageFile);
      console.log('✅ Back image uploaded:', backResponse);

      // Auto-fill form with OCR data from response if available
      if (frontResponse.identityCard) {
        const { id, name, dob } = frontResponse.identityCard;
        if (id) setIdNumber(id);
        if (name) setFullName(name);
        if (dob) setDateOfBirth(dob);
      }

      // Get KYC status after upload
      try {
        const statusResponse = await kycAPI.getKYCStatus();
        console.log('📋 KYC Status:', statusResponse);
        setKycStatus(statusResponse.kycStatus || 'pending');
      } catch (statusError) {
        console.log('⚠️ Không lấy được status:', statusError);
      }

      // Show success message
      Alert.alert(
        'Thành công',
        'Hồ sơ CCCD của bạn đã được nộp thành công!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.log('❌ Lỗi khi upload CCCD:', error);
      
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
      backgroundColor: colors.surface,
    },
    closeButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
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
      paddingTop: 12,
    },
    infoText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Inter-Medium',
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
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin CCCD</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!frontImage && !backImage && (
          <View style={styles.notice}>
            <AlertCircle size={20} color="#C62828" />
            <Text style={styles.noticeText}>
              Chụp rõ 2 mặt của CCCD để xác thực danh tính. Người đặt xe trên EV Renter (đã xác thực CCCD) <Text style={styles.noticeHighlight}>ĐỒNG THỜI phải là người nhận xe.</Text>
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh mặt trước CCCD</Text>
          {!frontImage && (
            <Text style={styles.sectionSubtitle}>Hình chụp cần thấy được ảnh đại diện và số CCCD</Text>
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
                    <Text style={styles.uploadButtonText}>Chụp ảnh CCCD</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh mặt sau CCCD</Text>
          
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
                    <Text style={styles.uploadButtonText}>Chụp ảnh CCCD</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Hiển thị thông tin chi tiết chỉ khi đã xác minh thành công */}
        {(frontImage || backImage) && (kycStatus === 'verified' || kycStatus === 'approved') && (
          <>
            <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Số CCCD</Text>
          <TextInput
            style={styles.input}
            placeholder="0000-0000-0000"
            placeholderTextColor={colors.textSecondary}
            value={idNumber}
            onChangeText={(text) => setIdNumber(formatIdNumber(text))}
            keyboardType="number-pad"
            maxLength={14}
          />
          <Text style={styles.infoText}>Dãy 12 chữ số ở mặt trước CCCD</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
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
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Giới tính</Text>
          <TextInput
            style={styles.input}
            placeholder="Nam/Nữ"
            placeholderTextColor={colors.textSecondary}
            value={gender}
            onChangeText={setGender}
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
          <Text style={styles.inputLabel}>Quê quán</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Quê quán"
            placeholderTextColor={colors.textSecondary}
            value={hometown}
            onChangeText={setHometown}
            multiline
            numberOfLines={2}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Địa chỉ thường trú</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Địa chỉ"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
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
          <Text style={styles.inputLabel}>Ngày hết hạn</Text>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/yyyy"
            placeholderTextColor={colors.textSecondary}
            value={doe}
            onChangeText={setDoe}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nơi cấp</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nơi cấp"
            placeholderTextColor={colors.textSecondary}
            value={issuePlace}
            onChangeText={setIssuePlace}
            multiline
            numberOfLines={2}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Đặc điểm nhận dạng</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Đặc điểm nhận dạng"
            placeholderTextColor={colors.textSecondary}
            value={features}
            onChangeText={setFeatures}
            multiline
            numberOfLines={2}
            editable={false}
          />
        </View>
          </>
        )}

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

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang xử lý ảnh...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

