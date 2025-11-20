import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuthStore();

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

  const handleLogin = async () => {
    // Clear previous error
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage('Email hoặc mật khẩu không đúng');
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
      flex: 0.4,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
    },
    heroImage: {
      width: 200,
      height: 150,
      marginBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 8,
      fontFamily: 'Inter-Bold',
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 40,
      fontFamily: 'Inter-Regular',
    },
    formContainer: {
      flex: 0.6,
      backgroundColor: theme.surface,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      paddingHorizontal: 30,
      paddingTop: 40,
    },
    inputGroup: {
      marginBottom: 20,
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
    inputFocused: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
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
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 30,
    },
    forgotText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-Medium',
    },
    loginButton: {
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
    loginButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    loginText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'Inter-Bold',
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    registerText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
    },
    registerLink: {
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
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Image
            source={require('@/assets/images/evrenter.jpg')}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>EV Renter</Text>
          <Text style={styles.subtitle}>
            Thuê xe điện thông minh, di chuyển xanh, tương lai bền vững
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Nhập email của bạn"
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
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
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
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Link href="/(auth)/forgot-password" asChild>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </Link>
          </TouchableOpacity>

          {errorMessage ? (
            <Animated.View 
              entering={FadeInDown.duration(300)} 
              style={styles.errorContainer}
            >
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Animated.View>
          ) : null}

          <AnimatedTouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
            entering={FadeInDown.delay(300)}
          >
            <Text style={styles.loginText}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Text>
          </AnimatedTouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}