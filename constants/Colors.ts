export const Colors = {
  light: {
    primary: '#1B5E20',
    primaryLight: '#4CAF50',
    secondary: '#2E7D32',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceVariant: '#E8F5E8',
    text: '#1C1B1F',
    textSecondary: '#49454F',
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    white: '#FFFFFF',
    black: '#000000'
  },
  dark: {
    primary: '#4CAF50',
    primaryLight: '#81C784',
    secondary: '#66BB6A',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    text: '#E6E1E5',
    textSecondary: '#CAC4CF',
    border: '#3D3D3D',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    white: '#FFFFFF',
    black: '#000000'
  }
};

export type ColorScheme = keyof typeof Colors;