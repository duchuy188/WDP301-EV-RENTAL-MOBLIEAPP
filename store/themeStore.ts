import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

export interface Colors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  icon: string;
}

interface ThemeState {
  mode: ThemeMode;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
  initTheme: () => void;
}

const lightColors: Colors = {
  primary: '#1B5E20',
  secondary: '#4CAF50',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  icon: '#666666',
};

const darkColors: Colors = {
  primary: '#4CAF50',
  secondary: '#66BB6A',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  success: '#4CAF50',
  warning: '#FFB74D',
  error: '#EF5350',
  icon: '#AAAAAA',
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  colors: lightColors,

  setMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem('themeMode', mode);
    set({ mode });
    
    // Update colors based on mode
    const systemTheme = useColorScheme();
    const actualTheme = mode === 'system' ? systemTheme : mode;
    const colors = actualTheme === 'dark' ? darkColors : lightColors;
    set({ colors });
  },

  initTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode') as ThemeMode;
      if (savedMode) {
        const systemTheme = useColorScheme();
        const actualTheme = savedMode === 'system' ? systemTheme : savedMode;
        const colors = actualTheme === 'dark' ? darkColors : lightColors;
        set({ mode: savedMode, colors });
      }
    } catch (error) {
      
    }
  },
}));