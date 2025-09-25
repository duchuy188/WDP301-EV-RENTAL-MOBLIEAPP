import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { User, Mail, Phone, CreditCard, Eye, EyeOff } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const register = useAppStore(state => state.register);
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
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword, licenseNumber } = formData;

    if (!name || !email || !phone || !password || !confirmPassword || !licenseNumber) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const success = await register({
        name,
        email,
        phone,
        licenseNumber,
      });
      
      if (success) {
        Alert.alert(
          'Đăng ký thành công',
          'Tài khoản của bạn đang chờ xác thực. Bạn sẽ được chuyển đến trang chủ.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
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
              Tạo tài khoản mới 🚗
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
              onChangeText={updateField('email')}
              placeholder="Nhập email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Số điện thoại"
              value={formData.phone}
              onChangeText={updateField('phone')}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              leftIcon={<Phone size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Số giấy phép lái xe"
              value={formData.licenseNumber}
              onChangeText={updateField('licenseNumber')}
              placeholder="Nhập số GPLX"
              leftIcon={<CreditCard size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Mật khẩu"
              value={formData.password}
              onChangeText={updateField('password')}
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              secureTextEntry={!showPassword}
              rightIcon={
                <Button
                  title=""
                  variant="outline"
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </Button>
              }
            />

            <Input
              label="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChangeText={updateField('confirmPassword')}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <Button
                  title=""
                  variant="outline"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </Button>
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