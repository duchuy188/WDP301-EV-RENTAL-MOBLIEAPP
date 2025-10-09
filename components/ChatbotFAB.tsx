import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  FadeIn,
  FadeInDown 
} from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { useVehicleStore } from '@/store/vehicleStore';

const { height } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatbotFAB() {
  const colorScheme = useColorScheme();
  const { colors } = useThemeStore();
  const { vehicles, rentalHistory } = useVehicleStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của EV Renter. Tôi có thể giúp bạn tìm xe, kiểm tra lịch sử thuê xe và trả lời các câu hỏi về dịch vụ. Bạn cần hỗ trợ gì?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { duration: 100 }),
      withSpring(1, { duration: 100 })
    );
    setIsOpen(true);
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Vehicle availability queries
    if (lowerMessage.includes('xe') && (lowerMessage.includes('còn') || lowerMessage.includes('sẵn') || lowerMessage.includes('có'))) {
      const availableVehicles = vehicles.filter(v => v.isAvailable);
      return `Hiện tại có ${availableVehicles.length} xe có sẵn:\n\n${availableVehicles.map(v => 
        `🚗 ${v.name} - Pin: ${v.batteryLevel}%\n📍 ${v.location.address.split(',')[0]}\n💰 ${v.pricePerHour.toLocaleString()}đ/giờ`
      ).join('\n\n')}`;
    }

    // Battery level queries
    if (lowerMessage.includes('pin') && (lowerMessage.includes('nhiều') || lowerMessage.includes('cao') || lowerMessage.includes('đầy'))) {
      const highBatteryVehicles = vehicles
        .filter(v => v.isAvailable && v.batteryLevel >= 80)
        .sort((a, b) => b.batteryLevel - a.batteryLevel);
      
      if (highBatteryVehicles.length === 0) {
        return 'Hiện tại không có xe nào với mức pin trên 80%. Xe có pin cao nhất hiện tại là ' + 
               vehicles.sort((a, b) => b.batteryLevel - a.batteryLevel)[0]?.name + 
               ` với ${vehicles.sort((a, b) => b.batteryLevel - a.batteryLevel)[0]?.batteryLevel}% pin.`;
      }
      
      return `Xe có pin cao nhất:\n\n${highBatteryVehicles.slice(0, 3).map(v => 
        `🔋 ${v.name} - ${v.batteryLevel}%\n📍 ${v.location.address.split(',')[0]}`
      ).join('\n\n')}`;
    }

    // Location-based queries
    if (lowerMessage.includes('gần') || lowerMessage.includes('địa điểm') || lowerMessage.includes('đâu')) {
      const locations = [...new Set(vehicles.map(v => v.location.address.split(',')[0]))];
      return `Các điểm có xe hiện tại:\n\n${locations.map((loc, i) => 
        `📍 ${loc}\n🚗 ${vehicles.filter(v => v.location.address.includes(loc)).length} xe có sẵn`
      ).join('\n\n')}`;
    }

    // Price queries
    if (lowerMessage.includes('giá') || lowerMessage.includes('rẻ') || lowerMessage.includes('tiền')) {
      const cheapestVehicles = vehicles
        .filter(v => v.isAvailable)
        .sort((a, b) => a.pricePerHour - b.pricePerHour);
      
      return `Xe giá tốt nhất:\n\n${cheapestVehicles.slice(0, 3).map(v => 
        `💰 ${v.name} - ${v.pricePerHour.toLocaleString()}đ/giờ\n📍 ${v.location.address.split(',')[0]}\n🔋 Pin: ${v.batteryLevel}%`
      ).join('\n\n')}`;
    }

    // Rental history queries
    if (lowerMessage.includes('lịch sử') || lowerMessage.includes('thuê trước') || lowerMessage.includes('đã thuê')) {
      if (rentalHistory.length === 0) {
        return 'Bạn chưa có lịch sử thuê xe nào. Hãy đặt xe đầu tiên của bạn!';
      }
      
      const recentRentals = rentalHistory.slice(0, 3);
      return `Lịch sử thuê xe gần đây:\n\n${recentRentals.map(r => 
        `🚗 ${r.vehicle.name}\n📅 ${new Date(r.startDate).toLocaleDateString('vi-VN')}\n💰 ${r.totalCost.toLocaleString()}đ\n🛣️ ${r.distance}km`
      ).join('\n\n')}`;
    }

    // Booking help
    if (lowerMessage.includes('đặt') || lowerMessage.includes('thuê') || lowerMessage.includes('book')) {
      return `Để đặt xe, bạn có thể:\n\n1️⃣ Vào tab "Đặt xe" trên trang chủ\n2️⃣ Chọn xe phù hợp với nhu cầu\n3️⃣ Chọn thời gian và địa điểm\n4️⃣ Xác nhận đặt xe\n\n💡 Mẹo: Đặt xe trước 30 phút để có giá tốt nhất!`;
    }

    // App features
    if (lowerMessage.includes('tính năng') || lowerMessage.includes('làm gì') || lowerMessage.includes('chức năng')) {
      return `EV Renter có các tính năng chính:\n\n🚗 Đặt xe điện dễ dàng\n📱 Quét QR để nhận xe\n📝 Hợp đồng điện tử\n📊 Theo dõi lịch sử và phân tích\n💬 Trợ lý AI (tôi đây!)\n🌙 Chế độ sáng/tối\n\nBạn muốn biết thêm về tính năng nào?`;
    }

    // Default responses
    const defaultResponses = [
      'Tôi có thể giúp bạn tìm xe có sẵn, kiểm tra lịch sử thuê xe, hoặc hướng dẫn sử dụng ứng dụng. Bạn cần hỗ trợ gì cụ thể?',
      'Bạn có thể hỏi tôi về:\n• Xe có sẵn gần bạn\n• Xe có pin cao\n• Giá thuê xe\n• Lịch sử thuê xe\n• Cách đặt xe\n\nBạn muốn biết gì?',
      'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi về xe có sẵn, giá cả, lịch sử thuê xe, hoặc cách sử dụng ứng dụng.',
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputText.trim()),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const quickActions = [
    { text: 'Xe nào có pin nhiều?', action: () => setInputText('Xe nào có pin nhiều?') },
    { text: 'Điểm thuê gần nhất?', action: () => setInputText('Điểm thuê gần nhất?') },
    { text: 'Lịch sử của tôi', action: () => setInputText('Lịch sử thuê xe của tôi') },
    { text: 'Xe giá rẻ nhất?', action: () => setInputText('Xe nào giá rẻ nhất?') },
  ];

  const styles = StyleSheet.create({
    fab: {
      position: 'absolute',
      bottom: 90,
      right: 20,
      width: 56,
      height: 56,
      backgroundColor: colors.primary,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    chatContainer: {
      flex: 1,
      backgroundColor: colors.surface,
      marginTop: height * 0.1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: 'Inter-Regular',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    messageWrapper: {
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    userMessage: {
      justifyContent: 'flex-end',
    },
    botMessage: {
      justifyContent: 'flex-start',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 8,
    },
    userAvatar: {
      backgroundColor: colors.primary,
    },
    botAvatar: {
      backgroundColor: colors.secondary,
    },
    messageBubble: {
      maxWidth: '75%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
    },
    userBubble: {
      backgroundColor: colors.primary,
    },
    botBubble: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Inter-Regular',
    },
    userText: {
      color: '#FFFFFF',
    },
    botText: {
      color: colors.text,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      fontFamily: 'Inter-Regular',
    },
    quickActions: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    quickActionsTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'Inter-Medium',
    },
    quickActionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    quickAction: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    quickActionText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      maxHeight: 100,
      fontFamily: 'Inter-Regular',
    },
    sendButton: {
      marginLeft: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
  });

  return (
    <>
      <AnimatedTouchableOpacity
        style={[styles.fab, animatedStyle]}
        onPress={handlePress}
      >
        <MessageCircle size={24} color="#FFFFFF" />
      </AnimatedTouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.chatContainer}>
            <Animated.View entering={FadeIn.delay(100)} style={styles.chatHeader}>
              <View>
                <Text style={styles.headerTitle}>Trợ lý AI</Text>
                <Text style={styles.headerSubtitle}>🟢 Đang hoạt động</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </Animated.View>

            <ScrollView 
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message, index) => (
                <Animated.View
                  key={message.id}
                  entering={FadeInDown.delay(index * 50)}
                  style={[
                    styles.messageWrapper,
                    message.isUser ? styles.userMessage : styles.botMessage,
                  ]}
                >
                  {!message.isUser && (
                    <View style={[styles.avatar, styles.botAvatar]}>
                      <Bot size={16} color="#FFFFFF" />
                    </View>
                  )}
                  
                  <View>
                    <View style={[
                      styles.messageBubble,
                      message.isUser ? styles.userBubble : styles.botBubble,
                    ]}>
                      <Text style={[
                        styles.messageText,
                        message.isUser ? styles.userText : styles.botText,
                      ]}>
                        {message.text}
                      </Text>
                    </View>
                    <Text style={[
                      styles.timestamp,
                      message.isUser && { textAlign: 'right' }
                    ]}>
                      {message.timestamp.toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>

                  {message.isUser && (
                    <View style={[styles.avatar, styles.userAvatar]}>
                      <User size={16} color="#FFFFFF" />
                    </View>
                  )}
                </Animated.View>
              ))}
            </ScrollView>

            {messages.length === 1 && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.quickActions}>
                <Text style={styles.quickActionsTitle}>Câu hỏi gợi ý:</Text>
                <View style={styles.quickActionsRow}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickAction}
                      onPress={action.action}
                    >
                      <Text style={styles.quickActionText}>{action.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Nhập câu hỏi của bạn..."
                placeholderTextColor={colors.textSecondary}
                multiline
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
                <Send size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}