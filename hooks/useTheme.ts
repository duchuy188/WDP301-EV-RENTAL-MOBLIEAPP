import { Colors, ColorScheme } from '@/constants/Colors';
import { useAppStore } from '@/store/useAppStore';

export function useTheme() {
  const theme = useAppStore(state => state.theme);
  const toggleTheme = useAppStore(state => state.toggleTheme);
  
  return {
    theme,
    colors: Colors[theme],
    toggleTheme,
    isDark: theme === 'dark'
  };
}