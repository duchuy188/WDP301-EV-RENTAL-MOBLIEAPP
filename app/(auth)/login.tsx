import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';
import * as AuthSession from 'expo-auth-session';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login } = useAuthStore();
  const { googleLogin } = useAuthStore();

  // Replace these client IDs with your OAuth client IDs from Google Cloud Console.
  // For Expo-managed apps, use the appropriate client id for web / iOS / Android.
  const GOOGLE_EXPO_CLIENT_ID = process.env.GOOGLE_EXPO_CLIENT_ID || '<YOUR_EXPO_OAUTH_CLIENT_ID>'; // e.g. for expo web
  const GOOGLE_IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID || '<YOUR_IOS_CLIENT_ID>';
  const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID || '<YOUR_ANDROID_CLIENT_ID>';

  // Configure the discovery document for Google
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

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
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', 'Email hoặc mật khẩu không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-in using OAuth2 (ID token flow)
  const handleGoogleSignIn = async () => {
    try {
      // build the request
      const redirectUri = AuthSession.makeRedirectUri();

      const clientId = GOOGLE_EXPO_CLIENT_ID;
      if (!clientId || clientId.startsWith('<YOUR_')) {
        Alert.alert('Cấu hình Google OAuth', 'Vui lòng cấu hình GOOGLE_EXPO_CLIENT_ID trong env hoặc thay các placeholder trong mã nguồn.');
        return;
      }

      const scopes = ['openid', 'profile', 'email'];
      if (!discovery) {
        Alert.alert('Lỗi cấu hình', 'Không thể lấy thông tin discovery từ Google. Vui lòng thử lại sau.');
        return;
      }

      const request = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        scopes,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: {
          nonce: Math.random().toString(36).substring(2, 15),
          prompt: 'select_account',
        },
      });

      await request.makeAuthUrlAsync(discovery);

  const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        const idToken = (result as any).params?.id_token;
        if (!idToken) {
          Alert.alert('Đăng nhập Google thất bại', 'Không nhận được idToken từ Google');
          return;
        }

        // Send idToken to backend to create/find user and receive our app token
        setIsGoogleLoading(true);
        try {
          await googleLogin(idToken);
          router.replace('/(tabs)');
        } catch (e) {
          Alert.alert('Lỗi', 'Đăng nhập bằng Google thất bại');
        } finally {
          setIsGoogleLoading(false);
        }
      } else if (result.type === 'dismiss' || result.type === 'cancel') {
        // user cancelled
      } else {
        Alert.alert('Lỗi OAuth', 'Kết quả không hợp lệ: ' + JSON.stringify(result));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Google sign-in error', error);
      Alert.alert('Lỗi', 'Không thể đăng nhập với Google');
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
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                onChangeText={setEmail}
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
                onChangeText={setPassword}
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

          {/* Google sign-in button */}
          <AnimatedTouchableOpacity
            style={[styles.loginButton, { backgroundColor: '#DB4437', marginBottom: 12 }]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
            entering={FadeInDown.delay(350)}
          >
            <Text style={styles.loginText}>{isGoogleLoading ? 'Đang xử lý...' : 'Đăng nhập với Google'}</Text>
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