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
import { ArrowLeft, Star, MessageSquare, Send, Camera, X, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '@/store/themeStore';
import { feedbackAPI } from '@/api/feedbackAPI';

type FeedbackType = 'rating' | 'complaint';

export default function SubmitFeedbackScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const rentalId = params.rentalId as string;

  const [activeTab, setActiveTab] = useState<FeedbackType>('rating');
  const [loading, setLoading] = useState(false);

  // Rating states
  const [overallRating, setOverallRating] = useState(0);
  const [staffService, setStaffService] = useState(0);
  const [vehicleCondition, setVehicleCondition] = useState(0);
  const [stationCleanliness, setStationCleanliness] = useState(0);
  const [checkoutProcess, setCheckoutProcess] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Complaint states
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('other');
  const [complaintComment, setComplaintComment] = useState('');

  // Image states (shared for both rating and complaint)
  const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; type: string; name: string }>>([]);

  const categories = [
    { value: 'payment', label: 'Thanh toán' },
    { value: 'vehicle', label: 'Xe' },
    { value: 'staff', label: 'Nhân viên' },
    { value: 'service', label: 'Dịch vụ' },
    { value: 'other', label: 'Khác' },
  ];

  const renderStarRating = (rating: number, setRating: (value: number) => void, label: string) => {
    return (
      <View style={styles.ratingRow}>
        <Text style={styles.ratingLabel}>{label}</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Star
                size={32}
                color={star <= rating ? '#FCD34D' : '#D1D5DB'}
                fill={star <= rating ? '#FCD34D' : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const validateRatingForm = () => {
    if (overallRating === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng đánh giá tổng thể');
      return false;
    }
    return true;
  };

  const validateComplaintForm = () => {
    if (!complaintTitle.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề khiếu nại');
      return false;
    }
    if (!complaintDescription.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng mô tả chi tiết vấn đề');
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
      console.error('Error picking image from camera:', error);
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
      console.error('Error picking image from gallery:', error);
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
      name: `feedback_${Date.now()}.jpg`,
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

  const renderImagePicker = () => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Hình ảnh (Tối đa 5 ảnh)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
          {/* Selected images */}
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

          {/* Add image button */}
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
    );
  };

  const handleSubmitRating = async () => {
    if (!validateRatingForm()) return;

    try {
      setLoading(true);
      
      console.log('📝 Submitting rating...', {
        rentalId,
        overallRating,
        hasImages: selectedImages.length > 0,
        imageCount: selectedImages.length
      });
      
      // Nếu có ảnh, dùng FormData
      if (selectedImages.length > 0) {
        const formData = new FormData();
        formData.append('rental_id', rentalId);
        formData.append('type', 'rating');
        formData.append('overall_rating', overallRating.toString());
        if (staffService > 0) formData.append('staff_service', staffService.toString());
        if (vehicleCondition > 0) formData.append('vehicle_condition', vehicleCondition.toString());
        if (stationCleanliness > 0) formData.append('station_cleanliness', stationCleanliness.toString());
        if (checkoutProcess > 0) formData.append('checkout_process', checkoutProcess.toString());
        if (ratingComment) formData.append('comment', ratingComment);
        
        // Thêm images
        selectedImages.forEach((image, index) => {
          console.log(`Adding image ${index + 1}:`, image.name);
          formData.append('images', {
            uri: image.uri,
            type: image.type,
            name: image.name,
          } as any);
        });

        console.log('📤 Sending FormData with images...');
        await feedbackAPI.createFeedback(formData);
      } else {
        // Không có ảnh, gửi JSON
        const payload = {
          rental_id: rentalId,
          type: 'rating',
          overall_rating: overallRating,
          staff_service: staffService,
          vehicle_condition: vehicleCondition,
          station_cleanliness: stationCleanliness,
          checkout_process: checkoutProcess,
          comment: ratingComment,
        };

        console.log('📤 Sending JSON payload:', payload);
        await feedbackAPI.createFeedback(payload);
      }
      
      console.log('✅ Rating submitted successfully!');
      Alert.alert(
        'Thành công',
        'Cảm ơn bạn đã đánh giá!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Quay lại và reload
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error submitting rating:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          'Không thể gửi đánh giá. Vui lòng thử lại.';
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!validateComplaintForm()) return;

    try {
      setLoading(true);
      
      console.log('📝 Submitting complaint...', {
        rentalId,
        title: complaintTitle,
        hasImages: selectedImages.length > 0,
        imageCount: selectedImages.length
      });
      
      // Nếu có ảnh, dùng FormData
      if (selectedImages.length > 0) {
        const formData = new FormData();
        formData.append('rental_id', rentalId);
        formData.append('type', 'complaint');
        formData.append('title', complaintTitle);
        formData.append('description', complaintDescription);
        formData.append('category', complaintCategory);
        if (complaintComment) formData.append('comment', complaintComment);
        
        // Thêm images
        selectedImages.forEach((image, index) => {
          console.log(`Adding image ${index + 1}:`, image.name);
          formData.append('images', {
            uri: image.uri,
            type: image.type,
            name: image.name,
          } as any);
        });

        console.log('📤 Sending FormData with images...');
        await feedbackAPI.createFeedback(formData);
      } else {
        // Không có ảnh, gửi JSON
        const payload = {
          rental_id: rentalId,
          type: 'complaint',
          title: complaintTitle,
          description: complaintDescription,
          category: complaintCategory,
          comment: complaintComment,
        };

        console.log('📤 Sending JSON payload:', payload);
        await feedbackAPI.createFeedback(payload);
      }
      
      console.log('✅ Complaint submitted successfully!');
      Alert.alert(
        'Thành công',
        'Khiếu nại của bạn đã được gửi. Chúng tôi sẽ xem xét và phản hồi sớm nhất.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Quay lại và reload
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error submitting complaint:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          'Không thể gửi khiếu nại. Vui lòng thử lại.';
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderRatingForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>⭐ Đánh giá chuyến thuê xe</Text>
        <Text style={styles.formDescription}>
          Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn
        </Text>

        <View style={styles.ratingsSection}>
          {renderStarRating(overallRating, setOverallRating, 'Đánh giá tổng thể *')}
          {renderStarRating(staffService, setStaffService, 'Dịch vụ nhân viên')}
          {renderStarRating(vehicleCondition, setVehicleCondition, 'Tình trạng xe')}
          {renderStarRating(stationCleanliness, setStationCleanliness, 'Vệ sinh trạm')}
          {renderStarRating(checkoutProcess, setCheckoutProcess, 'Quy trình nhận/trả xe')}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nhận xét của bạn</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={ratingComment}
            onChangeText={setRatingComment}
            textAlignVertical="top"
          />
        </View>

        {/* Image picker */}
        {renderImagePicker()}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmitRating}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Send size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderComplaintForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>🚨 Khiếu nại</Text>
        <Text style={styles.formDescription}>
          Chúng tôi rất tiếc về trải nghiệm không tốt của bạn. Vui lòng mô tả chi tiết để chúng tôi có thể hỗ trợ.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tiêu đề khiếu nại *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Nhập tiêu đề ngắn gọn"
            placeholderTextColor="#9CA3AF"
            value={complaintTitle}
            onChangeText={setComplaintTitle}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Danh mục</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  complaintCategory === cat.value && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setComplaintCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    complaintCategory === cat.value && { color: '#fff' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mô tả chi tiết *</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="Mô tả vấn đề bạn gặp phải..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            value={complaintDescription}
            onChangeText={setComplaintDescription}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Ghi chú thêm</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="Thông tin bổ sung (nếu có)..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={complaintComment}
            onChangeText={setComplaintComment}
            textAlignVertical="top"
          />
        </View>

        {/* Image picker */}
        {renderImagePicker()}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: '#EF4444' }]}
          onPress={handleSubmitComplaint}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Send size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Gửi khiếu nại</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phản hồi</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'rating' && [styles.activeTab, { borderBottomColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('rating')}
          >
            <Star
              size={20}
              color={activeTab === 'rating' ? colors.primary : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'rating' && { color: colors.primary, fontWeight: '700' },
              ]}
            >
              Đánh giá
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'complaint' && [styles.activeTab, { borderBottomColor: '#EF4444' }],
            ]}
            onPress={() => setActiveTab('complaint')}
          >
            <MessageSquare
              size={20}
              color={activeTab === 'complaint' ? '#EF4444' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'complaint' && { color: '#EF4444', fontWeight: '700' },
              ]}
            >
              Khiếu nại
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'rating' ? renderRatingForm() : renderComplaintForm()}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  ratingsSection: {
    marginBottom: 24,
  },
  ratingRow: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
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
});

