import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { Link, router } from 'expo-router';
import { User, Mail, Phone, Lock, Eye, EyeOff, Camera, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuthStore();

  const colors = {
    light: {
      background: '#F5F5F5',
      surface: '#FFFFFF',
      primary: '#1B5E20',
      secondary: '#4CAF50',
      text: '#1A1A1A',
      textSecondary: '#666666',
      border: '#E0E0E0',
    },
    dark: {
      background: '#121212',
      surface: '#1E1E1E',
      primary: '#4CAF50',
      secondary: '#66BB6A',
      text: '#FFFFFF',
      textSecondary: '#AAAAAA',
      border: '#333333',
    }
  };

  const theme = colors[colorScheme ?? 'light'];

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.licenseNumber) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Đăng ký thất bại', 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flexGrow: 1,
    },
    header: {
      paddingTop: 60,
      paddingBottom: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 8,
      fontFamily: 'Inter-Bold',
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 40,
      fontFamily: 'Inter-Regular',
    },
    formContainer: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      paddingHorizontal: 30,
      paddingTop: 30,
      paddingBottom: 40,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
      fontFamily: 'Inter-Medium',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      height: 50,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    eyeButton: {
      padding: 4,
    },
    uploadSection: {
      marginBottom: 20,
    },
    uploadButton: {
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginTop: 8,
    },
    uploadText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
    },
    registerButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    registerText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
    },
    loginLink: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>
            Tạo tài khoản để bắt đầu thuê xe điện
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <View style={styles.inputContainer}>
              <User size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nhập họ và tên"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Nhập email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số giấy phép lái xe</Text>
            <View style={styles.inputContainer}>
              <CreditCard size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.licenseNumber}
                onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
                placeholder="Nhập số giấy phép lái xe"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={theme.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.inputLabel}>Giấy phép lái xe & CCCD</Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Camera size={24} color={theme.textSecondary} />
              <Text style={styles.uploadText}>
                Chụp ảnh giấy phép lái xe và CCCD{'\n'}(Chỉ cần demo UI)
              </Text>
            </TouchableOpacity>
          </View>

          <AnimatedTouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
            entering={FadeInDown.delay(300)}
          >
            <Text style={styles.registerText}>
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Text>
          </AnimatedTouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}