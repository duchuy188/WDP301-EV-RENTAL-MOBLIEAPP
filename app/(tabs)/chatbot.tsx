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
  Pressable
} from 'react-native';
import { Bot, User, Send, RotateCcw, History, X, Menu, Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendMessage as sendChatMessage, getConversationHistory, getConversations, getSuggestions } from '@/api/chatbotAPI';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
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
  const [suggestions, setSuggestions] = useState<string[]>([
    'Xe nào có pin nhiều?',
    'Giá thuê xe thế nào?',
    'Trạm xe gần nhất ở đâu?'
  ]);
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

  useEffect(() => {
    console.log('🟢 [Chatbot] Component mounted - loading initial data...');
    loadChatHistory();
    loadSuggestions();
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
      text: 'Xin chào! Tôi là trợ lý AI của EV Renter. Tôi có thể giúp bạn tìm xe, kiểm tra lịch sử thuê xe và trả lời các câu hỏi về dịch vụ. Bạn cần hỗ trợ gì?',
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
      
      if (__DEV__) {
        console.log('[Chatbot] Started fresh chat session:', newSessionId);
      }
    } catch (error) {
      console.error('Error in loadChatHistory:', error);
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
      
      if (__DEV__) {
        console.log('[Chatbot] Started new chat session:', newSessionId);
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  const loadConversationsList = async () => {
    setLoadingHistory(true);
    try {
      const response = await getConversations(50);
      if (__DEV__) {
        console.log('[Chatbot] Conversations response:', response);
      }
      
      const convList = response.data?.conversations || response.data || [];
      setConversations(Array.isArray(convList) ? convList : []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSuggestions = async () => {
    console.log('🔵 [Chatbot] Loading suggestions from API...');
    try {
      const response = await getSuggestions();
      console.log('✅ [Chatbot] Suggestions API response:', JSON.stringify(response, null, 2));
      
      const suggestionsData = response.data?.suggestions || [];
      console.log('📝 [Chatbot] Extracted suggestions data:', suggestionsData);
      console.log('📊 [Chatbot] Is array?', Array.isArray(suggestionsData), 'Length:', suggestionsData.length);
      
      const validSuggestions = Array.isArray(suggestionsData) && suggestionsData.length > 0 
        ? suggestionsData 
        : [
            'Xe nào có pin nhiều?',
            'Giá thuê xe thế nào?',
            'Trạm xe gần nhất ở đâu?'
          ];
      
      console.log('✨ [Chatbot] Final suggestions to display:', validSuggestions);
      setSuggestions(validSuggestions);
    } catch (error) {
      console.error('❌ [Chatbot] Error loading suggestions:', error);
      console.log('⚠️ [Chatbot] Using fallback suggestions');
      // Fallback to default suggestions if API fails
      setSuggestions([
        'Xe nào có pin nhiều?',
        'Giá thuê xe thế nào?',
        'Trạm xe gần nhất ở đâu?'
      ]);
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
          
          return {
            id: `${selectedSessionId}_${idx}`,
            text: messageText,
            isUser: messageRole === 'user',
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          };
        });
        
        setMessages(loadedMessages);
      } else {
        showWelcomeMessage();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        session_id: sessionId,
        message: userText,
      });

      if (__DEV__) {
        console.log('[Chatbot] Send message response:', JSON.stringify(response, null, 2));
      }

      const success = response.success || response.data?.success;
      const aiText = response.data?.message || response.data?.response || response.message;
      const responseSuggestions = response.suggestions || response.data?.suggestions;
      
      if (__DEV__) {
        console.log('[Chatbot] Success:', success, 'aiText:', aiText?.substring(0, 50) + '...');
        console.log('[Chatbot] Response suggestions:', responseSuggestions);
      }
      
      // Update suggestions if provided in response
      if (responseSuggestions && Array.isArray(responseSuggestions) && responseSuggestions.length > 0) {
        console.log('🔄 [Chatbot] Updating suggestions from response:', responseSuggestions);
        setSuggestions(responseSuggestions);
      }
      
      if (success && aiText) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: aiText,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        throw new Error('Không nhận được phản hồi từ server');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
                    {message.text || '[No content]'}
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
            </View>
          ))}
          
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

        {!isLoading && quickActions.length > 0 && (
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
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
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


