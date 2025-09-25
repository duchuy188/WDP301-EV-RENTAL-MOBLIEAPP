import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { ThemedView } from '@/components/ui/ThemedView';

export default function IndexScreen() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);

  useEffect(() => {
    // Redirect based on authentication status
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  return <ThemedView style={{ flex: 1 }} />;
}