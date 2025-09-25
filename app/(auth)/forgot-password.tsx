import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 2000);
  };

  if (sent) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <ThemedText type="title" style={styles.title}>
              Email đã được gửi! ✉️
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email {email}
            </ThemedText>
            <ThemedText style={[styles.note, { color: colors.textSecondary }]}>
              Vui lòng kiểm tra cả thư mục spam nếu không thấy email.
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <Button
              title="Mở ứng dụng Email"
              variant="primary"
              fullWidth
              style={styles.button}
            />
            <Link href="/(auth)/login" asChild>
              <Button
                title="Quay lại đăng nhập"
                variant="outline"
                fullWidth
                style={styles.button}
              />
            </Link>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Button
          title=""
          variant="outline"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={colors.primary} />
        </Button>

        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Quên mật khẩu? 🔐
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
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

          <Button
            title="Gửi hướng dẫn"
            onPress={handleResetPassword}
            loading={loading}
            fullWidth
            style={styles.resetButton}
          />

          <Link href="/(auth)/login" asChild>
            <ThemedText style={[styles.backToLogin, { color: colors.primary }]}>
              Quay lại đăng nhập
            </ThemedText>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 24,
    padding: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  resetButton: {
    marginBottom: 24,
  },
  backToLogin: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  note: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
  },
  button: {
    marginBottom: 16,
  },
});