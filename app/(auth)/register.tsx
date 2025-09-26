import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { User, Mail, Phone, CreditCard, Eye, EyeOff } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import api from '@/api';

export default function RegisterScreen() {
  const { colors } = useTheme();
  // Hàm gọi API đăng ký
  const register = async (data: { fullname: string; email: string; password: string }) => {
    return api.post('/api/auth/register', data);
  };
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Rule kiểm tra email hợp lệ
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      setEmailError('Email không hợp lệ');
      return;
    } else {
      setEmailError('');
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Lỗi',
        'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        fullname: name,
        email,
        password,
      });
      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          'Đăng ký thành công',
          'Tài khoản của bạn đang chờ xác thực. Bạn sẽ được chuyển đến trang đăng nhập.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        Alert.alert('Lỗi', 'Đăng ký không thành công');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              Tạo tài khoản mới
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Đăng ký để bắt đầu thuê xe điện
            </ThemedText>
          </View>

          <View style={styles.form}>
            <Input
              label="Họ và tên"
              value={formData.name}
              onChangeText={updateField('name')}
              placeholder="Nhập họ và tên"
              leftIcon={<User size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Email"
              value={formData.email}
              onChangeText={value => {
                updateField('email')(value);
                setEmailError('');
              }}
              placeholder="Nhập email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
              error={emailError}
            />

            {/* Đã xoá trường Số điện thoại và Số giấy phép lái xe */}

            <Input
              label="Mật khẩu"
              value={formData.password}
              onChangeText={updateField('password')}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
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

            <Input
              label="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChangeText={updateField('confirmPassword')}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={'#000'} />
                  ) : (
                    <Eye size={20} color={'#000'} />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              title="Đăng ký"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <ThemedText style={{ color: colors.textSecondary }}>
                Đã có tài khoản?{' '}
              </ThemedText>
              <Link href="/(auth)/login" asChild>
                <ThemedText style={[styles.loginLink, { color: colors.primary }]}>
                  Đăng nhập
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
    marginBottom: 32,
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
  registerButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLink: {
    fontWeight: '600',
  },
});