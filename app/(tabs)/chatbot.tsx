import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Pressable,
  Linking,
  Alert
} from 'react-native';
import { Bot, User, Send, RotateCcw, History, X, Menu, Plus, ExternalLink, CreditCard } from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendMessage as sendChatMessage, getConversationHistory, getConversations, getSuggestions } from '@/api/chatbotAPI';
import { CHATBOT } from '@/config/chatbot';
import { router } from 'expo-router';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  context?: string;
  actions?: string[];
  suggestions?: string[];
}

interface ChatContext {
  topic?: string;
  userIntent?: string;
  lastKeywords?: string[];
  conversationStep?: number;
  sessionId?: string;
  conversationId?: string;
}

const TypingIndicator = ({ color }: { color: string }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, [dot1, dot2, dot3]);

  const animatedStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Animated.View
        style={[
          { width: 8, height: 8, borderRadius: 4, backgroundColor: color },
          animatedStyle(dot1),
        ]}
      />
      <Animated.View
        style={[
          { width: 8, height: 8, borderRadius: 4, backgroundColor: color },
          animatedStyle(dot2),
        ]}
      />
      <Animated.View
        style={[
          { width: 8, height: 8, borderRadius: 4, backgroundColor: color },
          animatedStyle(dot3),
        ]}
      />
    </View>
  );
};

export default function ChatbotScreen() {
  const colorScheme = useColorScheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(CHATBOT.suggestedQuestions);
  const [chatContext, setChatContext] = useState<ChatContext>({
    topic: '',
    userIntent: '',
    lastKeywords: [],
    conversationStep: 0,
    sessionId: undefined,
    conversationId: undefined,
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const sidebarAnim = useRef(new Animated.Value(-300)).current;

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

  // Helper functions
  const extractErrorMessage = (err: any): string | undefined => {
    if (!err) return undefined;
    if (err.response && err.response.data) {
      if (typeof err.response.data === 'string') return err.response.data;
      if (err.response.data.message) return err.response.data.message;
      if (err.response.data.error) return err.response.data.error;
    }
    if (err.message) return err.message;
    return undefined;
  };

  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const removeUrls = (text: string): string => {
    return text.replace(/(https?:\/\/[^\s]+)/g, '').trim();
  };

  const replaceCarEmojis = (text: string): string => {
    // Replace car emoji 🚗 with motorcycle emoji 🏍️
    return text.replace(/🚗/g, '🏍️');
  };

  const extractPaymentLink = (text: string): string | null => {
    const paymentRegex = /(https?:\/\/[^\s]*(?:vnpay|payment)[^\s]*)/i;
    const match = text.match(paymentRegex);
    return match ? match[1] : null;
  };

  const extractBookingId = (text: string): string | null => {
    // Try to extract booking code from text (format: PB followed by timestamp or BKxxxxxx)
    // Handle markdown formatting like **PB09113418951H**
    const bookingRegex = /\*\*Mã đặt chỗ:\*\*\s*(PB\d+[A-Z]?|BK[A-Z0-9]+)|Mã:\s*(PB\d+[A-Z]?|BK[A-Z0-9]+)|\b(PB\d+[A-Z]?|BK[A-Z0-9]+)\b/i;
    const match = text.match(bookingRegex);
    // Return the first non-null capture group
    return match ? (match[1] || match[2] || match[3]) : null;
  };

  const getActionForSuggestion = (suggestion: string, actions?: string[]): string | null => {
    if (!actions) return null;
    
    const suggestionLower = suggestion.toLowerCase().trim();
    
    if (suggestionLower.includes('thanh toán') || suggestionLower.includes('thanh toan')) {
      return actions.find(a => a.includes('pay')) || null;
    }
    if (suggestionLower.includes('xem') || suggestionLower.includes('chi tiết') || suggestionLower.includes('chi tiet')) {
      return actions.find(a => a.includes('view') || a.includes('details')) || null;
    }
    if (suggestionLower.includes('hủy') || suggestionLower.includes('huy') || suggestionLower.includes('cancel')) {
      return actions.find(a => a.includes('cancel')) || null;
    }
    if (suggestionLower.includes('xác nhận') || suggestionLower.includes('xac nhan') || suggestionLower.includes('confirm')) {
      return actions.find(a => a.includes('confirm')) || null;
    }
    if (suggestionLower.includes('thay đổi') || suggestionLower.includes('thay doi') || suggestionLower.includes('edit')) {
      return actions.find(a => a.includes('edit')) || null;
    }
    
    return null;
  };

  const handleOpenLink = async (url: string, bookingId?: string) => {
    try {
      
      
      
      // Check if it's a payment link (VNPay) - case insensitive
      const urlLower = url.toLowerCase();
      const isPaymentLink = 
        urlLower.includes('payment') || 
        urlLower.includes('vnpay') || 
        urlLower.includes('vnp_') ||
        urlLower.includes('sandbox.vnpayment.vn') ||
        urlLower.includes('vnpayment.vn');
      
      
      
      if (isPaymentLink) {
        
        
        // Navigate to VNPay WebView screen
        router.push({
          pathname: '/vnpay-payment',
          params: {
            paymentUrl: url,
            bookingId: bookingId || '',
            amount: '0' // Amount will be shown in the payment page
          }
        });
      } else {
        
        // For other links, open in browser
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Lỗi', 'Không thể mở liên kết này');
        }
      }
    } catch (error) {
      
      Alert.alert('Lỗi', 'Không thể mở liên kết');
    }
  };

  useEffect(() => {
    
    loadChatHistory();
    loadSuggestions();
  }, []);

  // Listen for payment completion events
  useEffect(() => {
    const handlePaymentSuccess = (event: any) => {
      
      
      const notificationMessage: Message = {
        id: `payment-success-${Date.now()}`,
        text: '🎉 Thanh toán thành công! Đơn đặt xe của bạn đã được xác nhận. Bạn có thể xem chi tiết trong phần Lịch sử.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, notificationMessage]);
      
      // Auto scroll to show the new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    // Note: You would need to emit this event from vnpay-payment.tsx after successful payment
    // For now, this is a placeholder for the event listener
    
    return () => {
      // Cleanup
    };
  }, []);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: showSidebar ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar]);

  const toggleSidebar = () => {
    if (!showSidebar) {
      loadConversationsList();
    }
    setShowSidebar(!showSidebar);
  };

  const showWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: CHATBOT.welcomeMessage,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const loadChatHistory = async () => {
    try {
      // Luôn tạo session mới mỗi lần mở app
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('chatbot_session_id', newSessionId);
      setSessionId(newSessionId);
      
      // Hiển thị welcome message cho chat mới
      showWelcomeMessage();
      
    } catch (error) {
      
      showWelcomeMessage();
    }
  };

  const startNewChat = async () => {
    try {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('chatbot_session_id', newSessionId);
      setSessionId(newSessionId);
      
      showWelcomeMessage();
      
      // Reload suggestions for new chat
      await loadSuggestions();
      
    } catch (error) {
      
    }
  };

  const loadConversationsList = async () => {
    setLoadingHistory(true);
    try {
      const response = await getConversations(50);
      
      const convList = response.data?.conversations || response.data || [];
      setConversations(Array.isArray(convList) ? convList : []);
    } catch (error) {
      
      setConversations([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSuggestions = async () => {
    
    try {
      const response = await getSuggestions();
      const suggestionsData = response.data?.suggestions || [];
      
      const validSuggestions = Array.isArray(suggestionsData) && suggestionsData.length > 0 
        ? suggestionsData 
        : [
            'Xe nào có pin nhiều?',
            'Giá thuê xe thế nào?',
            'Trạm xe gần nhất ở đâu?'
          ];
      
      
      setSuggestions(validSuggestions);
    } catch (error) {
      
      
      // Fallback to default suggestions if API fails
      setSuggestions(CHATBOT.suggestedQuestions);
    }
  };

  const loadConversation = async (selectedSessionId: string) => {
    try {
      await AsyncStorage.setItem('chatbot_session_id', selectedSessionId);
      setSessionId(selectedSessionId);
      setShowSidebar(false);
      
      const historyResponse = await getConversationHistory(selectedSessionId);
      let historyMessages = 
        historyResponse.data?.data?.messages || 
        historyResponse.data?.messages || 
        (historyResponse as any).messages;
      
      if (historyMessages && Array.isArray(historyMessages) && historyMessages.length > 0) {
        const loadedMessages: Message[] = historyMessages.map((msg: any, idx: number) => {
          const messageText = msg.content || msg.message || msg.text || '[Empty message]';
          const messageRole = msg.role?.toLowerCase();
          const urls = extractUrls(messageText);
          
          return {
            id: `${selectedSessionId}_${idx}`,
            text: messageText,
            isUser: messageRole === 'user',
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            actions: msg.metadata?.actions || (urls.length > 0 ? urls : undefined),
            suggestions: msg.metadata?.suggestions,
            context: msg.metadata?.context,
          };
        });
        
        setMessages(loadedMessages);
        
        // Update chat context
        setChatContext({
          sessionId: selectedSessionId,
          conversationId: (historyResponse.data as any)?.conversation_id,
          topic: '',
          userIntent: '',
          lastKeywords: [],
          conversationStep: loadedMessages.length,
        });
      } else {
        showWelcomeMessage();
      }
    } catch (error) {
      
    }
  };

  const sendMessage = async (suggestedText?: string) => {
    const messageText = suggestedText || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const payload = {
        message: messageText,
        session_id: chatContext.sessionId || sessionId,
        conversation_id: chatContext.conversationId
      } as any;

      const response = await sendChatMessage(payload);


      const success = response.success || response.data?.success;
      const aiText = response.data?.message || response.data?.response || response.message;
      const responseSuggestions = response.suggestions || response.data?.suggestions;
      const responseActions = response.actions || response.data?.actions || [];
      const responseContext = response.data?.context;
      
      
      // Extract URLs from message
      const urls = extractUrls(aiText || '');
      // Combine action strings and URLs
      const actionStrings = Array.isArray(responseActions) ? responseActions : [];
      const messageActions = [...actionStrings, ...urls].filter((v, i, a) => a.indexOf(v) === i);
      
      // Update suggestions if provided in response
      if (responseSuggestions && Array.isArray(responseSuggestions) && responseSuggestions.length > 0) {
        
        setSuggestions(responseSuggestions);
      }
      
      if (success && aiText) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: aiText,
          isUser: false,
          timestamp: new Date(),
          context: responseContext,
          actions: messageActions.length > 0 ? messageActions : undefined,
          suggestions: responseSuggestions
        };
        setMessages(prev => [...prev, aiResponse]);

        // Update chat context
        setChatContext(prev => ({
          ...prev,
          sessionId: response.data?.session_id ?? prev.sessionId,
          conversationId: response.data?.conversation_id ?? prev.conversationId,
          topic: responseContext ?? prev.topic,
          conversationStep: (prev.conversationStep || 0) + 1
        }));

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        throw new Error('Không nhận được phản hồi từ server');
      }
    } catch (error: any) {
      
      
      // Check if backend returned a message even with error status (e.g., "No pending booking to cancel")
      const backendMessage = error.response?.data?.message || error.response?.data?.data?.message;
      const backendSuggestions = error.response?.data?.suggestions || error.response?.data?.data?.suggestions;
      
      
      if (backendMessage) {
        // Backend sent a user-friendly message (even with 500 status)
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: backendMessage,
          isUser: false,
          timestamp: new Date(),
          suggestions: backendSuggestions
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // Update suggestions if provided
        if (backendSuggestions && Array.isArray(backendSuggestions) && backendSuggestions.length > 0) {
          setSuggestions(backendSuggestions);
        }
      } else {
        // Generic error message
        const msg = extractErrorMessage(error) ?? 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.';
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: msg,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = suggestions.map(text => ({ 
    text, 
    action: () => setInputText(text) 
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: '#1B5E20',
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#1B5E20',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerLeft: {
      flex: 1,
      paddingLeft: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      fontFamily: 'Inter-Bold',
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#E8F5E9',
      marginTop: 2,
      fontFamily: 'Inter-Regular',
    },
    newChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    newChatText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    messageWrapper: {
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
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
      backgroundColor: theme.primary,
    },
    botAvatar: {
      backgroundColor: theme.secondary,
    },
    messageBubble: {
      maxWidth: '75%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
    },
    userBubble: {
      backgroundColor: theme.primary,
    },
    botBubble: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
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
      color: theme.text,
    },
    timestamp: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
      fontFamily: 'Inter-Regular',
    },
    loadingWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 12,
    },
    loadingBubble: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 16,
    },
    quickActions: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    quickActionsTitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
      fontFamily: 'Inter-Medium',
    },
    quickActionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      marginVertical: -4,
    },
    quickAction: {
      backgroundColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      margin: 4,
    },
    quickActionText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
    },
    suggestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    paymentButton: {
      backgroundColor: '#3B82F6',
    },
    confirmButton: {
      backgroundColor: theme.primary,
    },
    cancelButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#EF4444',
    },
    defaultSuggestionButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: theme.secondary,
    },
    suggestionButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    cancelButtonText: {
      color: '#EF4444',
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    defaultSuggestionText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 12,
    },
    textInput: {
      flex: 1,
      backgroundColor: theme.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.text,
      maxHeight: 100,
      fontFamily: 'Inter-Regular',
    },
    sendButton: {
      backgroundColor: theme.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.border,
    },
    menuButton: {
      padding: 8,
    },
    sidebarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999,
    },
    sidebar: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: 280,
      backgroundColor: theme.surface,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    sidebarHeader: {
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sidebarTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 12,
    },
    newChatButtonSidebar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    newChatButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    conversationsList: {
      flex: 1,
    },
    conversationsSection: {
      paddingTop: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      textTransform: 'uppercase',
      fontFamily: 'Inter-SemiBold',
    },
    conversationItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    conversationItemActive: {
      backgroundColor: theme.background,
      borderRightWidth: 3,
      borderRightColor: theme.primary,
    },
    conversationIcon: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    conversationContent: {
      flex: 1,
    },
    conversationTime: {
      fontSize: 11,
      color: theme.textSecondary,
      marginBottom: 2,
      fontFamily: 'Inter-Regular',
    },
    conversationPreview: {
      fontSize: 14,
      color: theme.text,
      fontFamily: 'Inter-Regular',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <Menu size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Trợ lý AI</Text>
          <Text style={styles.headerSubtitle}>🟢 Đang hoạt động</Text>
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
          <RotateCcw size={16} color="#FFFFFF" />
          <Text style={styles.newChatText}>Mới</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessage : styles.botMessage,
              ]}
            >
              {!message.isUser && (
                <View style={[styles.avatar, styles.botAvatar, { marginTop: 4 }]}>
                  <Bot size={16} color="#FFFFFF" />
                </View>
              )}
              
              <View style={{ flex: 1, maxWidth: '75%' }}>
                <View style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : styles.botBubble,
                ]}>
                  <Text style={[
                    styles.messageText,
                    message.isUser ? styles.userText : styles.botText,
                  ]}>
                    {message.actions && message.actions.length > 0 
                      ? replaceCarEmojis(removeUrls(message.text))
                      : replaceCarEmojis(message.text || '[No content]')}
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

                {/* Render suggestion buttons below the message bubble */}
                {message.suggestions && message.suggestions.length > 0 && !message.isUser && (
                  <View style={{ marginTop: 8, gap: 6 }}>
                    {message.suggestions.map((suggestion, idx) => {
                      const action = getActionForSuggestion(suggestion, message.actions);
                      const paymentLink = extractPaymentLink(message.text);
                      const bookingId = extractBookingId(message.text);
                      
                      
                      // Special handling for payment action
                      if (action === 'pay_holding_fee' && paymentLink) {
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => handleOpenLink(paymentLink, bookingId || undefined)}
                            style={[styles.suggestionButton, styles.paymentButton]}
                          >
                            <CreditCard size={14} color="#FFFFFF" />
                            <Text style={styles.suggestionButtonText}>
                              💳 {suggestion}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      // Special handling for cancel action
                      if (action && action.includes('cancel')) {
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={async () => {
                              // If this is a cancel_booking action and we have a booking ID, call API directly
                              if (action === 'cancel_booking' && bookingId) {
                                Alert.alert(
                                  'Xác nhận hủy booking',
                                  `Bạn có chắc muốn hủy booking ${bookingId}?\n\nLưu ý: Phí giữ chỗ sẽ không được hoàn lại nếu đã thanh toán.`,
                                  [
                                    {
                                      text: 'Không',
                                      style: 'cancel'
                                    },
                                    {
                                      text: 'Hủy booking',
                                      style: 'destructive',
                                      onPress: async () => {
                                        try {
                                          
                                          setIsLoading(true);
                                          
                                          // Import bookingAPI dynamically
                                          const { bookingAPI } = await import('@/api/bookingAPI');
                                          const response = await bookingAPI.cancelPendingBooking(bookingId);
                                          
                                          
                                          
                                          // Show success message in chat
                                          const successMessage: Message = {
                                            id: Date.now().toString(),
                                            text: '✅ Đã hủy booking thành công!\n\n🏍️ Xe đã được nhả ra và có thể được đặt bởi người khác.\n\nBạn có thể đặt xe mới bất cứ lúc nào.',
                                            isUser: false,
                                            timestamp: new Date(),
                                            suggestions: ['Đặt xe mới', 'Xem lịch sử booking']
                                          };
                                          setMessages(prev => [...prev, successMessage]);
                                          setSuggestions(['Đặt xe mới', 'Xem lịch sử booking']);
                                          
                                          setTimeout(() => {
                                            scrollViewRef.current?.scrollToEnd({ animated: true });
                                          }, 100);
                                        } catch (error: any) {
                                          
                                          
                                          const errorMsg = error.response?.data?.message || error.message || 'Không thể hủy booking';
                                          
                                          const errorMessage: Message = {
                                            id: Date.now().toString(),
                                            text: `❌ Lỗi: ${errorMsg}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ.`,
                                            isUser: false,
                                            timestamp: new Date(),
                                          };
                                          setMessages(prev => [...prev, errorMessage]);
                                        } finally {
                                          setIsLoading(false);
                                        }
                                      }
                                    }
                                  ]
                                );
                              } else {
                                // For other cancel actions, just send the message
                                sendMessage(suggestion);
                              }
                            }}
                            style={[styles.suggestionButton, styles.cancelButton]}
                          >
                            <Text style={styles.cancelButtonText}>❌ {suggestion}</Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      // Special handling for confirm action
                      if (action && action.includes('confirm')) {
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => sendMessage(suggestion)}
                            style={[styles.suggestionButton, styles.confirmButton]}
                          >
                            <Text style={styles.suggestionButtonText}>✅ {suggestion}</Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      // Default suggestion button
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => sendMessage(suggestion)}
                          style={[styles.suggestionButton, styles.defaultSuggestionButton]}
                        >
                          <Text style={styles.defaultSuggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Render action buttons (URLs) below suggestions */}
                {message.actions && message.actions.length > 0 && !message.isUser && !message.suggestions && (
                  <View style={{ marginTop: 8, gap: 6 }}>
                    {message.actions.map((action, idx) => {
                      const isUrl = action.startsWith('http://') || action.startsWith('https://');
                      if (!isUrl) return null;
                      
                      const isPaymentLink = action.includes('payment') || action.includes('vnpay');
                      const bookingId = extractBookingId(message.text);
                      
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => handleOpenLink(action, bookingId || undefined)}
                          style={[
                            styles.suggestionButton,
                            isPaymentLink ? styles.paymentButton : styles.confirmButton
                          ]}
                        >
                          {isPaymentLink ? (
                            <>
                              <CreditCard size={14} color="#FFFFFF" />
                              <Text style={styles.suggestionButtonText}> Thanh toán ngay</Text>
                            </>
                          ) : (
                            <>
                              <ExternalLink size={14} color="#FFFFFF" />
                              <Text style={styles.suggestionButtonText}>Mở liên kết</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {message.isUser && (
                <View style={[styles.avatar, styles.userAvatar]}>
                  <User size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          ))}

          {/* Suggested Questions - Show only when no messages and no pending actions */}
          {messages.length === 0 && !isLoading && !messages.some(m => m.suggestions && m.suggestions.length > 0) && (
            <View style={{ paddingHorizontal: 8, marginTop: 20 }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, fontFamily: 'Inter-SemiBold' }}>
                  Xin chào! 👋 Tôi có thể giúp gì cho bạn?
                </Text>
              </View>
              
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 12, fontFamily: 'Inter-SemiBold' }}>
                  Gợi ý:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {suggestions.map((question, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => sendMessage(question)}
                      style={{
                        flex: 1,
                        minWidth: '47%',
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                        backgroundColor: theme.surface,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 12,
                        minHeight: 70,
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <Text style={{ fontSize: 13, lineHeight: 18, color: theme.text, fontFamily: 'Inter-Regular' }}>
                        {question}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
          
          {isLoading && (
            <View style={styles.loadingWrapper}>
              <View style={[styles.avatar, styles.botAvatar]}>
                <Bot size={16} color="#FFFFFF" />
              </View>
              <View style={styles.loadingBubble}>
                <TypingIndicator color={theme.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {!isLoading && messages.length > 0 && quickActions.length > 0 && !messages.some(m => m.suggestions && m.suggestions.length > 0) && (
          <View style={styles.quickActions}>
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
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor={theme.textSecondary}
            multiline
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showSidebar && (
        <Pressable 
          style={styles.sidebarOverlay} 
          onPress={() => setShowSidebar(false)}
        />
      )}

      <Animated.View 
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: sidebarAnim }],
          },
        ]}
        pointerEvents={showSidebar ? 'auto' : 'none'}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Trợ lý AI</Text>
          <TouchableOpacity 
            style={styles.newChatButtonSidebar} 
            onPress={() => {
              startNewChat();
              setShowSidebar(false);
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.newChatButtonText}>Chat mới</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.conversationsList}>
          <View style={styles.conversationsSection}>
            <Text style={styles.sectionTitle}>Lịch sử chat</Text>
            
            {loadingHistory ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Đang tải...</Text>
              </View>
            ) : conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Chưa có lịch sử</Text>
              </View>
            ) : (
              conversations.map((conv: any, index: number) => {
                const convSessionId = conv.session_id || conv.id || `conv_${index}`;
                const isActive = convSessionId === sessionId;
                const lastMessage = conv.last_message || conv.preview || 'Cuộc trò chuyện';
                const timestamp = conv.last_activity || conv.timestamp || conv.created_at;
                
                return (
                  <TouchableOpacity
                    key={convSessionId}
                    style={[
                      styles.conversationItem,
                      isActive && styles.conversationItemActive
                    ]}
                    onPress={() => loadConversation(convSessionId)}
                  >
                    <View style={styles.conversationIcon}>
                      <Bot size={16} color={theme.textSecondary} />
                    </View>
                    <View style={styles.conversationContent}>
                      {timestamp && (
                        <Text style={styles.conversationTime}>
                          {new Date(timestamp).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </Text>
                      )}
                      <Text 
                        style={styles.conversationPreview}
                        numberOfLines={1}
                      >
                        {lastMessage}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}


