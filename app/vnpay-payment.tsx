import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { bookingAPI } from '@/api/bookingAPI';

export default function VNPayPaymentScreen() {
  const { colors } = useThemeStore();
  const params = useLocalSearchParams();
  
  const paymentUrl = params.paymentUrl as string;
  const bookingId = params.bookingId as string;
  const amount = params.amount ? parseFloat(params.amount as string) : 0;

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    
    

    // Check for booking-success redirect from backend (localhost URL can't be loaded)
    if (url.includes('/booking-success') && !paymentProcessed) {
      setIsVerifying(true);
      setPaymentProcessed(true);
      
      try {
        // Extract booking code from URL
        const urlObj = new URL(url);
        const bookingCode = urlObj.searchParams.get('code');
        const holdingFeePaid = urlObj.searchParams.get('holdingFeePaid');
        
        
        
        setTimeout(() => {
          Alert.alert(
            'Thanh toán thành công! 🎉',
            `Phí giữ chỗ đã được thanh toán.\n\nMã đặt xe: ${bookingCode || bookingId}\n\nĐơn đặt xe của bạn đã được xác nhận.`,
            [
              {
                text: 'Xem đơn đặt xe',
                onPress: () => {
                  router.replace('/(tabs)/history');
                }
              }
            ]
          );
        }, 300);
      } catch (error) {
        
      }
      return;
    }

    // Kiểm tra URL return từ VNPay
    // Backend callback URL: /api/payments/holding-fee/callback
    if ((url.includes('/holding-fee/callback') || url.includes('vnp_ResponseCode') || url.includes('/vnpay/return')) && !paymentProcessed) {
      setIsVerifying(true);
      setPaymentProcessed(true); // Mark as processed to prevent duplicate handling
      
      try {
        // Parse URL để lấy response code
        const urlObj = new URL(url);
        const vnpResponseCode = urlObj.searchParams.get('vnp_ResponseCode');
        const vnpTransactionStatus = urlObj.searchParams.get('vnp_TransactionStatus');
        
        
        
        // VNPay Response Codes:
        // 00: Success
        // Other codes: Failed
        if (vnpResponseCode === '00' || vnpTransactionStatus === '00') {
          // Wait a moment to ensure backend processing completes
          setTimeout(() => {
            Alert.alert(
              'Thanh toán thành công! 🎉',
              'Phí giữ chỗ đã được thanh toán. Đơn đặt xe của bạn đã được xác nhận.',
              [
                {
                  text: 'Xem đơn đặt xe',
                  onPress: () => {
                    // Redirect to History tab since the booking should now be visible
                    router.replace('/(tabs)/history');
                  }
                }
              ]
            );
          }, 500);
        } else {
          // Payment failed or cancelled
          const errorMessages: { [key: string]: string } = {
            '07': 'Giao dịch bị nghi ngờ gian lận',
            '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
            '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11': 'Đã hết hạn chờ thanh toán',
            '12': 'Thẻ/Tài khoản bị khóa',
            '13': 'Sai mật khẩu xác thực giao dịch (OTP)',
            '24': 'Khách hàng hủy giao dịch',
            '51': 'Tài khoản không đủ số dư',
            '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
            '75': 'Ngân hàng thanh toán đang bảo trì',
            '79': 'Giao dịch vượt quá số lần nhập sai mật khẩu',
            '99': 'Lỗi không xác định'
          };
          
          const errorMessage = errorMessages[vnpResponseCode || '99'] || 'Thanh toán không thành công';
          
          Alert.alert(
            'Thanh toán thất bại',
            errorMessage,
            [
              {
                text: 'Quay lại',
                onPress: () => router.replace('/(tabs)/history')
              }
            ]
          );
        }
      } catch (error: any) {
        
        Alert.alert(
          'Lỗi xác thực',
          'Không thể xác thực kết quả thanh toán. Vui lòng kiểm tra lại đơn đặt xe của bạn.',
          [
            {
              text: 'Quay lại',
              onPress: () => router.replace('/(tabs)/history')
            }
          ]
        );
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    
    
    
    // Don't show error if payment has been processed (ERR_INVALID_REDIRECT is expected after successful payment)
    if (paymentProcessed || isVerifying) {
      
      return;
    }
    
    // Ignore errors for callback and success URLs (they redirect to localhost which mobile can't access)
    if (nativeEvent.url && (
      nativeEvent.url.includes('/holding-fee/callback') || 
      nativeEvent.url.includes('vnp_ResponseCode') ||
      nativeEvent.url.includes('/booking-success') ||
      nativeEvent.url.includes('localhost') ||
      nativeEvent.url.includes('192.168.102.8')
    )) {
      
      
      // Try to extract payment result from URL even on error
      if (nativeEvent.url.includes('vnp_ResponseCode') && !paymentProcessed) {
        
        setIsVerifying(true);
        setPaymentProcessed(true);
        
        try {
          const urlObj = new URL(nativeEvent.url);
          const vnpResponseCode = urlObj.searchParams.get('vnp_ResponseCode');
          const vnpTransactionStatus = urlObj.searchParams.get('vnp_TransactionStatus');
          
          
          
          if (vnpResponseCode === '00' || vnpTransactionStatus === '00') {
            setTimeout(() => {
              Alert.alert(
                'Thanh toán thành công! 🎉',
                'Phí giữ chỗ đã được thanh toán. Đơn đặt xe của bạn đã được xác nhận.',
                [
                  {
                    text: 'Xem đơn đặt xe',
                    onPress: () => {
                      router.replace('/(tabs)/history');
                    }
                  }
                ]
              );
            }, 500);
          } else {
            const errorMessages: { [key: string]: string } = {
              '07': 'Giao dịch bị nghi ngờ gian lận',
              '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
              '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
              '11': 'Đã hết hạn chờ thanh toán',
              '12': 'Thẻ/Tài khoản bị khóa',
              '13': 'Sai mật khẩu xác thực giao dịch (OTP)',
              '24': 'Khách hàng hủy giao dịch',
              '51': 'Tài khoản không đủ số dư',
              '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
              '75': 'Ngân hàng thanh toán đang bảo trì',
              '79': 'Giao dịch vượt quá số lần nhập sai mật khẩu',
              '99': 'Lỗi không xác định'
            };
            
            const errorMessage = errorMessages[vnpResponseCode || '99'] || 'Thanh toán không thành công';
            
            Alert.alert(
              'Thanh toán thất bại',
              errorMessage,
              [
                {
                  text: 'Quay lại',
                  onPress: () => router.replace('/(tabs)/history')
                }
              ]
            );
          }
        } catch (error) {
          
        } finally {
          setIsVerifying(false);
        }
      }
      
      return;
    }
    
    // Only log actual errors that need attention
    
    
    Alert.alert(
      'Lỗi tải trang',
      'Không thể tải trang thanh toán. Vui lòng thử lại.',
      [
        {
          text: 'Thử lại',
          onPress: () => webViewRef.current?.reload()
        },
        {
          text: 'Quay lại',
          onPress: () => router.back(),
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'Hủy thanh toán?',
              'Bạn có chắc muốn hủy thanh toán? Đơn đặt xe sẽ bị hủy.',
              [
                { text: 'Không', style: 'cancel' },
                {
                  text: 'Hủy',
                  onPress: async () => {
                    try {
                      setIsCancelling(true);
                      
                      // Cancel pending booking if it's a temp booking (has PB prefix)
                      if (bookingId && bookingId.startsWith('PB')) {
                        await bookingAPI.cancelPendingBooking(bookingId);
                        
                        // Navigate back and let useFocusEffect refresh the list
                        router.replace('/(tabs)/history');
                        
                        // Show success message after navigation
                        setTimeout(() => {
                          Alert.alert(
                            'Đã hủy thành công',
                            'Đơn đặt xe đã được hủy. Xe đã được nhả ra.'
                          );
                        }, 500);
                      } else {
                        router.replace('/(tabs)/history');
                      }
                    } catch (error: any) {
                      
                      Alert.alert(
                        'Lỗi',
                        'Không thể hủy đặt xe. Vui lòng thử lại.',
                        [{ text: 'OK', onPress: () => router.replace('/(tabs)/history') }]
                      );
                    } finally {
                      setIsCancelling(false);
                    }
                  },
                  style: 'destructive'
                }
              ]
            );
          }}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ArrowLeft size={24} color="#fff" />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán VNPay</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* WebView */}
      {isVerifying ? (
        <View style={styles.verifyingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.verifyingText}>Đang xác thực thanh toán...</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={styles.webview}
        />
      )}
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
  paymentInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
});

