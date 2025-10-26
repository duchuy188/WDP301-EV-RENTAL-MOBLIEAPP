import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Chrome as Home, History, User, MessageCircle } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  const colors = {
    light: {
      primary: '#1B5E20',
      secondary: '#4CAF50',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      text: '#1A1A1A',
      icon: '#666666',
      activeIcon: '#1B5E20',
    },
    dark: {
      primary: '#4CAF50',
      secondary: '#66BB6A',
      background: '#121212',
      surface: '#1E1E1E',
      text: '#FFFFFF',
      icon: '#AAAAAA',
      activeIcon: '#4CAF50',
    }
  };

  const theme = colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: colorScheme === 'dark' ? '#333' : '#E0E0E0',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.activeIcon,
        tabBarInactiveTintColor: theme.icon,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Đặt xe',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch sử',
          tabBarIcon: ({ size, color }) => (
            <History size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'Trợ lý',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}