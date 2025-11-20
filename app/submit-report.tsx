import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, AlertTriangle, Send, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '@/store/themeStore';
import { reportsAPI } from '@/api/reportsAPI';
import type { IssueType } from '@/types/reports';

export default function SubmitReportScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const rentalId = params.rentalId as string;
  const bookingId = params.bookingId as string;

  const [loading, setLoading] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('vehicle_breakdown');
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; type: string; name: string }>>([]);

  const issueTypes: Array<{ value: IssueType; label: string; icon: string }> = [
    { value: 'vehicle_breakdown', label: 'Xe hỏng', icon: '🔧' },
    { value: 'battery_issue', label: 'Vấn đề pin', icon: '🔋' },
    { value: 'accident', label: 'Tai nạn', icon: '💥' },
    { value: 'other', label: 'Khác', icon: '📝' },
  ];

  const validateForm = () => {
    if (!description.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng mô tả chi tiết sự cố');
      return false;
    }
    if (description.trim().length < 10) {
      Alert.alert('Thông tin chưa đầy đủ', 'Vui lòng mô tả chi tiết hơn (ít nhất 10 ký tự)');
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập máy ảnh');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const addImage = (uri: string) => {
    if (selectedImages.length >= 5) {
      Alert.alert('Giới hạn', 'Chỉ được tải lên tối đa 5 ảnh');
      return;
    }

    const imageFile = {
      uri,
      type: 'image/jpeg',
      name: `report_${Date.now()}.jpg`,
    };

    setSelectedImages((prev) => [...prev, imageFile]);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (selectedImages.length >= 5) {
      Alert.alert('Giới hạn', 'Chỉ được tải lên tối đa 5 ảnh');
      return;
    }

    Alert.alert('Chọn ảnh', 'Chọn nguồn ảnh', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Camera', onPress: pickImageFromCamera },
      { text: 'Thư viện', onPress: pickImageFromGallery },
    ]);
  };

  const handleSubmit = async () => {
    console.log('=== SUBMIT REPORT DEBUG ===');
    console.log('rentalId:', rentalId);
    console.log('bookingId:', bookingId);
    console.log('issueType:', issueType);
    console.log('description length:', description.length);
    console.log('selectedImages count:', selectedImages.length);

    if (!validateForm()) return;

    // Kiểm tra có rentalId hoặc bookingId
    if (!rentalId && !bookingId) {
      console.error('ERROR: Missing both rentalId and bookingId');
      Alert.alert('Lỗi', 'Thiếu thông tin thuê xe hoặc đặt xe');
      return;
    }

    try {
      setLoading(true);

      // Nếu có ảnh, dùng FormData
      if (selectedImages.length > 0) {
        console.log('Creating FormData with images...');
        const formData = new FormData();
        
        // Ưu tiên rentalId, nếu không có thì dùng bookingId
        if (rentalId) {
          console.log('Adding rental_id to FormData:', rentalId);
          formData.append('rental_id', rentalId);
        }
        if (bookingId) {
          console.log('Adding booking_id to FormData:', bookingId);
          formData.append('booking_id', bookingId);
        }
        
        formData.append('issue_type', issueType);
        formData.append('description', description.trim());

        // Thêm images
        selectedImages.forEach((image, index) => {
          console.log(`Adding image ${index + 1}:`, image.name);
          formData.append('images', {
            uri: image.uri,
            type: image.type,
            name: image.name,
          } as any);
        });

        console.log('Calling API with FormData...');
        const response = await reportsAPI.createReport(formData as any);
        console.log('API Response:', response);
      } else {
        // Không có ảnh, gửi JSON
        const payload: any = {
          issue_type: issueType,
          description: description.trim(),
        };

        // Ưu tiên rentalId, nếu không có thì dùng bookingId
        if (rentalId) {
          console.log('Adding rental_id to payload:', rentalId);
          payload.rental_id = rentalId;
        }
        if (bookingId) {
          console.log('Adding booking_id to payload:', bookingId);
          payload.booking_id = bookingId;
        }

        console.log('Calling API with JSON payload:', payload);
        const response = await reportsAPI.createReport(payload);
        console.log('API Response:', response);
      }

      Alert.alert(
        'Thành công',
        'Báo cáo sự cố đã được gửi. Chúng tôi sẽ xem xét và liên hệ với bạn sớm nhất.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/my-reports');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('=== SUBMIT REPORT ERROR ===');
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      console.error('Error response status:', error?.response?.status);
      console.error('Error request:', error?.request);
      console.error('Error config:', error?.config);
      console.error('Error config url:', error?.config?.url);
      console.error('Error config method:', error?.config?.method);
      console.error('Error config headers:', error?.config?.headers);
      
      let errorMessage = 'Không thể gửi báo cáo. Vui lòng thử lại.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.log('Using server error message:', errorMessage);
      } else if (error?.message) {
        errorMessage = error.message;
        console.log('Using error.message:', errorMessage);
      } else if (error?.request && !error?.response) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        console.log('Network error detected');
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: '#EF4444' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            <View style={styles.alertBox}>
              <AlertTriangle size={24} color="#EF4444" />
              <Text style={styles.alertText}>
                Vui lòng mô tả chi tiết sự cố để chúng tôi có thể hỗ trợ bạn nhanh chóng
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Loại sự cố *</Text>
              <View style={styles.issueTypesContainer}>
                {issueTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.issueTypeChip,
                      issueType === type.value && {
                        backgroundColor: '#EF4444',
                        borderColor: '#EF4444',
                      },
                    ]}
                    onPress={() => setIssueType(type.value)}
                  >
                    <Text style={styles.issueTypeIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.issueTypeText,
                        issueType === type.value && { color: '#fff' },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mô tả chi tiết sự cố *</Text>
              <TextInput
                style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
                placeholder="Mô tả chi tiết tình trạng xe, vị trí, thời gian xảy ra sự cố..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {description.length} ký tự {description.length < 10 && '(tối thiểu 10)'}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hình ảnh sự cố (Tối đa 5 ảnh)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {selectedImages.length < 5 && (
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={handleAddImage}
                  >
                    <Camera size={32} color="#9CA3AF" />
                    <Text style={styles.addImageText}>Thêm ảnh</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
              <Text style={styles.imageHint}>
                📸 {selectedImages.length}/5 ảnh
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#EF4444' }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Send size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Gửi báo cáo sự cố</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              ⚠️ Lưu ý: Sau khi gửi báo cáo, vui lòng chờ nhân viên liên hệ để được hỗ trợ.
              Nếu gấp, vui lòng gọi hotline để được hỗ trợ nhanh hơn.
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    flex: 1,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  issueTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  issueTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    gap: 8,
  },
  issueTypeIcon: {
    fontSize: 20,
  },
  issueTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  imagesScroll: {
    marginVertical: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  imageHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});