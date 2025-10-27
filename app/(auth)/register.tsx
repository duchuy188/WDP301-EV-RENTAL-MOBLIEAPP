import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name || !formData.email || !formData.password) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    // Validate password strength (match backend requirements)
    if (formData.password.length < 8) {
      setErrorMessage('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      setErrorMessage('Mật khẩu phải bao gồm: Chữ hoa (A-Z), Chữ thường (a-z), Số (0-9), Ký tự đặc biệt (@$!%*?&)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      // Gọi API đăng ký
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      // Đăng ký thành công
      setSuccessMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (error: any) {
      const message = error?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      setErrorMessage(message);
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
      justifyContent: 'center',
    },
    header: {
      paddingTop: 80,
      paddingBottom: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 12,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 50,
      fontFamily: 'Inter-Regular',
      lineHeight: 22,
    },
    formContainer: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      paddingHorizontal: 30,
      paddingTop: 40,
      paddingBottom: 50,
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
    passwordHint: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
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
    errorContainer: {
      backgroundColor: '#FEE',
      borderLeftWidth: 4,
      borderLeftColor: '#F44',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    errorText: {
      color: '#C00',
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
    successContainer: {
      backgroundColor: '#E8F5E9',
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    successText: {
      color: '#2E7D32',
      fontSize: 14,
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
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (errorMessage) setErrorMessage('');
                }}
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
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Nhập email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
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
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (errorMessage) setErrorMessage('');
                }}
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
            <Text style={styles.passwordHint}>
              Ít nhất 8 ký tự: chữ hoa, chữ thường, số và ký tự đặc biệt
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData({ ...formData, confirmPassword: text });
                  if (errorMessage) setErrorMessage('');
                }}
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

          {errorMessage ? (
            <Animated.View 
              entering={FadeInDown.duration(300)} 
              style={styles.errorContainer}
            >
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Animated.View>
          ) : null}

          {successMessage ? (
            <Animated.View 
              entering={FadeInDown.duration(300)} 
              style={styles.successContainer}
            >
              <Text style={styles.successText}>{successMessage}</Text>
            </Animated.View>
          ) : null}

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