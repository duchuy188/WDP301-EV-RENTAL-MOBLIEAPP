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
  Modal,
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Save,
  ArrowLeft,
  Lock,
  X,
  Eye,
  EyeOff,
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

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const handleChangePassword = async () => {
    // Validate inputs
    if (!passwordForm.currentPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Call API to change password
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setIsChangingPassword(false);
      setShowPasswordModal(false);
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      Alert.alert('Thành công', 'Mật khẩu đã được thay đổi!');
    } catch (error: any) {
      setIsChangingPassword(false);
      
      // Lấy message tiếng Việt từ backend
      let errorMessage = 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Mật khẩu hiện tại không đúng';
      } else if (error.message && !error.message.includes('status code')) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
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
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: '#1B5E20',
      borderBottomWidth: 1,
      borderBottomColor: '#1B5E20',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
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
    changePasswordButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary + '15',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      gap: 8,
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    changePasswordButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      fontFamily: 'Inter-Medium',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalInputGroup: {
      marginBottom: 16,
    },
    modalInputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      fontFamily: 'Inter-Medium',
    },
    modalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      height: 50,
    },
    modalInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    eyeButton: {
      padding: 4,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    confirmButtonDisabled: {
      backgroundColor: colors.border,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    cancelButtonText: {
      color: colors.text,
    },
    confirmButtonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFFFFF" />
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

              {/* Change Password Button */}
              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={() => setShowPasswordModal(true)}
              >
                <Lock size={20} color={colors.primary} />
                <Text style={styles.changePasswordButtonText}>Đổi mật khẩu</Text>
              </TouchableOpacity>
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

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Current Password */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Mật khẩu hiện tại *</Text>
                <View style={styles.modalInputContainer}>
                  <Lock size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.modalInput}
                    value={passwordForm.currentPassword}
                    onChangeText={(text) =>
                      setPasswordForm((prev) => ({ ...prev, currentPassword: text }))
                    }
                    placeholder="Nhập mật khẩu hiện tại"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showCurrentPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Mật khẩu mới *</Text>
                <View style={styles.modalInputContainer}>
                  <Lock size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.modalInput}
                    value={passwordForm.newPassword}
                    onChangeText={(text) =>
                      setPasswordForm((prev) => ({ ...prev, newPassword: text }))
                    }
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Xác nhận mật khẩu mới *</Text>
                <View style={styles.modalInputContainer}>
                  <Lock size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.modalInput}
                    value={passwordForm.confirmPassword}
                    onChangeText={(text) =>
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: text }))
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Modal Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.confirmButton,
                    isChangingPassword && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  <Text style={[styles.modalButtonText, styles.confirmButtonText]}>
                    {isChangingPassword ? 'Đang xử lý...' : 'Xác nhận'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}


