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
  Platform
} from 'react-native';
import { Link, router } from 'expo-router';
import { Mail, ArrowLeft, CircleCheck as CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { authAPI } from '@/api/authAPI';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

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

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.forgotPassword({ email });
      
      
      setIsEmailSent(true);
    } catch (error: any) {
      
      
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || 'Không thể gửi email. Vui lòng thử lại sau.';
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 30,
      paddingBottom: 20,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
    },
    backText: {
      color: theme.primary,
      fontSize: 16,
      marginLeft: 8,
      fontFamily: 'Inter-Medium',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
      fontFamily: 'Inter-Bold',
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      lineHeight: 24,
      fontFamily: 'Inter-Regular',
    },
    formContainer: {
      flex: 1,
      backgroundColor: theme.surface,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      paddingHorizontal: 30,
      paddingTop: 40,
    },
    inputGroup: {
      marginBottom: 30,
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
    resetButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    resetText: {
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
    successContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    successIcon: {
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
      fontFamily: 'Inter-Bold',
    },
    successText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 30,
      fontFamily: 'Inter-Regular',
    },
  });

  if (isEmailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.primary} />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
        
        <Animated.View entering={FadeInUp.delay(100)} style={styles.formContainer}>
          <View style={styles.successContainer}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.successIcon}>
              <CheckCircle size={80} color={theme.secondary} />
            </Animated.View>
            
            <Animated.Text entering={FadeInDown.delay(300)} style={styles.successTitle}>
              Email đã được gửi!
            </Animated.Text>
            
            <Animated.Text entering={FadeInDown.delay(400)} style={styles.successText}>
              Chúng tôi đã gửi link đặt lại mật khẩu tới email {email}. 
              Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
            </Animated.Text>

            <AnimatedTouchableOpacity
              style={styles.resetButton}
              onPress={() => router.push('/(auth)/login')}
              entering={FadeInDown.delay(500)}
            >
              <Text style={styles.resetText}>Quay lại đăng nhập</Text>
            </AnimatedTouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        
        <Animated.Text entering={FadeInUp.delay(100)} style={styles.title}>
          Quên mật khẩu?
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(200)} style={styles.subtitle}>
          Nhập địa chỉ email để nhận link đặt lại mật khẩu
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color={theme.textSecondary} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email của bạn"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <AnimatedTouchableOpacity
          style={styles.resetButton}
          onPress={handleResetPassword}
          disabled={isLoading}
          entering={FadeInDown.delay(400)}
        >
          <Text style={styles.resetText}>
            {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại'}
          </Text>
        </AnimatedTouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Nhớ mật khẩu? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}