import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { feedbackAPI } from '@/api/feedbackAPI';
import { API_BASE_URL } from '@/api/config';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function TestFeedbackScreen() {
  const { colors } = useThemeStore();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Test rental ID - thay bằng ID thực từ rental của bạn
  const testRentalId = '675b9e0ee3ee4a8ff19bb95b'; // Thay đổi ID này

  const testFetch = async () => {
    setLoading(true);
    setResult('Testing fetch...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'GET',
      });
      
      const text = await response.text();
      setResult(`✅ Fetch Success!\nStatus: ${response.status}\nResponse: ${text.substring(0, 200)}`);
    } catch (error: any) {
      setResult(`❌ Fetch Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testJSONPost = async () => {
    setLoading(true);
    setResult('Testing JSON POST...');
    
    try {
      const payload = {
        rental_id: testRentalId,
        type: 'rating',
        overall_rating: 5,
        comment: 'Test feedback'
      };

      
      const response = await feedbackAPI.createFeedback(payload);
      
      
      setResult(`✅ JSON POST Success!\n${JSON.stringify(response, null, 2)}`);
      Alert.alert('Thành công', 'JSON POST hoạt động!');
    } catch (error: any) {
      
      setResult(`❌ JSON POST Error:\n${error.message}\n${JSON.stringify(error, null, 2)}`);
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testFormDataPost = async () => {
    setLoading(true);
    setResult('Testing FormData POST...');
    
    try {
      const formData = new FormData();
      formData.append('rental_id', testRentalId);
      formData.append('type', 'rating');
      formData.append('overall_rating', '4');
      formData.append('comment', 'Test with FormData');

      
      const response = await feedbackAPI.createFeedback(formData);
      
      
      setResult(`✅ FormData POST Success!\n${JSON.stringify(response, null, 2)}`);
      Alert.alert('Thành công', 'FormData POST hoạt động!');
    } catch (error: any) {
      
      setResult(`❌ FormData POST Error:\n${error.message}\n${JSON.stringify(error, null, 2)}`);
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Feedback API</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>API Configuration</Text>
          <Text style={styles.infoText}>Base URL: {API_BASE_URL}</Text>
          <Text style={styles.infoText}>Endpoint: /feedback</Text>
          <Text style={styles.infoText}>Test Rental ID: {testRentalId}</Text>
        </View>

        <Text style={styles.sectionTitle}>Kiểm tra kết nối:</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#3B82F6' }]}
          onPress={testFetch}
          disabled={loading}
        >
          <Text style={styles.buttonText}>1. Test Fetch (GET)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#10B981' }]}
          onPress={testJSONPost}
          disabled={loading}
        >
          <Text style={styles.buttonText}>2. Test JSON POST</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#F59E0B' }]}
          onPress={testFormDataPost}
          disabled={loading}
        >
          <Text style={styles.buttonText}>3. Test FormData POST</Text>
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingText}>Đang kiểm tra...</Text>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Kết quả:</Text>
            <ScrollView style={styles.resultScroll}>
              <Text style={styles.resultText}>{result}</Text>
            </ScrollView>
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>📝 Hướng dẫn:</Text>
          <Text style={styles.noteText}>
            1. Đảm bảo backend đang chạy{'\n'}
            2. Kiểm tra IP address trong config.ts{'\n'}
            3. Thay testRentalId bằng ID rental thật{'\n'}
            4. Test từ trên xuống dưới{'\n'}
            5. Xem console logs để biết chi tiết
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 16,
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  resultScroll: {
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  noteCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
  },
});

