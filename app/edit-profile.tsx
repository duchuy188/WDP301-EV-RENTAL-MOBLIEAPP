import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Save,
  ArrowLeft,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/api/authAPI';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const { colors } = useThemeStore();
  const { user, loadProfile } = useAuthStore();

  // Edit profile form state
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.profileImage || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    if (!editForm.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    if (!editForm.address.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ');
      return;
    }

    setIsUpdating(true);

    try {
      // Call real API to update profile
      await authAPI.updateProfile({
        fullname: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        avatar: editForm.avatar,
      });

      // Reload profile from server to get updated data
      await loadProfile();

      setIsUpdating(false);
      Alert.alert('Thành công', 'Thông tin đã được cập nhật!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      setIsUpdating(false);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập camera để chụp ảnh');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // Tạo object có format phù hợp để gửi lên backend
        const imageFile = {
          uri: imageUri,
          type: 'image/jpeg',
          name: `avatar_${Date.now()}.jpg`,
        };
        setEditForm((prev) => ({ ...prev, avatar: imageFile as any }));
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // Tạo object có format phù hợp để gửi lên backend
        const imageFile = {
          uri: imageUri,
          type: 'image/jpeg',
          name: `avatar_${Date.now()}.jpg`,
        };
        setEditForm((prev) => ({ ...prev, avatar: imageFile as any }));
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleUploadAvatar = () => {
    Alert.alert('Chọn ảnh đại diện', 'Chọn nguồn ảnh', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Camera', onPress: pickImageFromCamera },
      { text: 'Thư viện', onPress: pickImageFromGallery },
    ]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 30,
      paddingVertical: 20,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.border,
      marginBottom: 16,
      borderWidth: 4,
      borderColor: colors.surface,
    },
    changeAvatarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 24,
      gap: 8,
    },
    changeAvatarText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
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
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      height: 50,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    saveButtonContainer: {
      padding: 20,
      paddingTop: 10,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    saveButtonDisabled: {
      backgroundColor: colors.border,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.scrollContent}>
            {/* Avatar Section */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.avatarSection}>
              <Image
                source={{
                  uri:
                    typeof editForm.avatar === 'string' && editForm.avatar
                      ? editForm.avatar
                      : editForm.avatar && typeof editForm.avatar === 'object' && 'uri' in editForm.avatar
                      ? (editForm.avatar as any).uri
                      : 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.changeAvatarButton} onPress={handleUploadAvatar}>
                <Camera size={18} color={colors.primary} />
                <Text style={styles.changeAvatarText}>Đổi ảnh đại diện</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Personal Information */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên *</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại *</Text>
                <View style={styles.inputContainer}>
                  <Phone size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, phone: text }))}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ *</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={editForm.address}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, address: text }))}
                    placeholder="Nhập địa chỉ"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.textSecondary }]}
                    value={user?.email || ''}
                    placeholder="Email"
                    placeholderTextColor={colors.textSecondary}
                    editable={false}
                  />
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Text style={styles.saveButtonText}>Đang cập nhật...</Text>
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}


