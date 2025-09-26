import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import api from '@/api';

export default function LoginScreen() {
  const { colors } = useTheme();
  // Hàm gọi API đăng nhập
  const login = async (data: { email: string; password: string }) => {
    return api.post('/api/auth/login', data);
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      if (response.status === 200 || response.status === 201) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Lỗi', 'Email hoặc mật khẩu không đúng');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Chào mừng trở lại! 👋
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Đăng nhập để tiếp tục thuê xe điện
            </ThemedText>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email của bạn"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={'#000'} />
                  ) : (
                    <Eye size={20} color={'#000'} />
                  )}
                </TouchableOpacity>
              }
            />

            <Link href="/(auth)/forgot-password" asChild>
              <ThemedText style={[styles.forgotPassword, { color: colors.primary }]}>
                Quên mật khẩu?
              </ThemedText>
            </Link>

            <Button
              title="Đăng nhập"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            <View style={styles.signupContainer}>
              <ThemedText style={{ color: colors.textSecondary }}>
                Chưa có tài khoản?{' '}
              </ThemedText>
              <Link href="/(auth)/register" asChild>
                <ThemedText style={[styles.signupLink, { color: colors.primary }]}>
                  Đăng ký ngay
                </ThemedText>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  eyeButton: {
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  forgotPassword: {
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 24,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupLink: {
    fontWeight: '600',
  },
});