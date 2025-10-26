import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Download, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useThemeStore } from '@/store/themeStore';
import { contractAPI } from '@/api/contractAPI';

export default function ContractViewScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  const contractId = params.id as string;
  const viewMode = (params.mode as string) || 'html'; // 'html' or 'pdf'

  const [loading, setLoading] = useState(true);
  const [contractUrl, setContractUrl] = useState('');
  const [contractHtml, setContractHtml] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    loadContract();
  }, [contractId, viewMode]);

  const loadContract = async () => {
    try {
      setLoading(true);
      
      // Get auth token
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        router.back();
        return;
      }
      
      setAuthToken(token);
      
      if (viewMode === 'html') {
        // For HTML mode, get HTML content directly
        const html = await contractAPI.getContractHtml(contractId);
        console.log('📄 Loaded HTML content, length:', html.length);
        setContractHtml(html);
      } else {
        // For PDF mode, build URL without token in query string
        // We'll pass the token via headers in WebView
        const apiClient = require('@/api/config').default;
        const pdfUrl = `${apiClient.defaults.baseURL}/contracts/${contractId}/pdf`;
        console.log('📄 Using backend PDF URL:', pdfUrl);
        setContractUrl(pdfUrl);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      Alert.alert('Lỗi', 'Không thể tải hợp đồng');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      if (!authToken) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }
      
      // Build API URL (without token in query string)
      const apiClient = require('@/api/config').default;
      const pdfUrl = `${apiClient.defaults.baseURL}/contracts/${contractId}/pdf`;
      
      console.log('⬇️ Downloading PDF from:', pdfUrl);
      
      // Generate filename with contract ID
      const filename = `contract-${contractId}.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      // Download the file with authentication header
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      
      console.log('✅ Downloaded to:', downloadResult.uri);
      console.log('📊 File info:', downloadResult);
      
      // Check if file actually has content
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      console.log('📄 File size:', fileInfo.size);
      
      if (!fileInfo.exists || fileInfo.size === 0) {
        Alert.alert('Lỗi', 'File tải về bị lỗi hoặc rỗng');
        return;
      }
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Share the downloaded file (user can save or open in other apps)
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Lưu hoặc chia sẻ hợp đồng',
          UTI: 'com.adobe.pdf',
        });
        Alert.alert('Thành công', 'Đã tải hợp đồng thành công!');
      } else {
        // Fallback: open in browser on platforms where sharing isn't available
        Alert.alert('Thành công', `File đã lưu tại: ${downloadResult.uri}`);
      }
    } catch (error: any) {
      console.error('Error downloading contract:', error);
      Alert.alert('Lỗi', 'Không thể tải hợp đồng: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hợp đồng thuê xe</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Đang tải hợp đồng...
          </Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Hợp đồng thuê xe</Text>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Download size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        source={
          viewMode === 'html' 
            ? { html: contractHtml } 
            : { 
                uri: contractUrl,
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              }
        }
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
          Alert.alert('Lỗi', 'Không thể hiển thị hợp đồng');
        }}
      />
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
  downloadButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  webview: {
    flex: 1,
  },
});

