import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useVehicleStore } from '@/store/vehicleStore';

export default function Index() {
  const { isAuthenticated, checkAuthState } = useAuthStore();
  const { initTheme } = useThemeStore();
  const { loadMockData } = useVehicleStore();

  useEffect(() => {
    checkAuthState();
    initTheme();
    loadMockData();
  }, []);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}