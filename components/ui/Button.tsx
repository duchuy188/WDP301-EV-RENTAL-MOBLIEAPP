import React from 'react';
import { TouchableOpacity, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'medium', 
  loading = false, 
  fullWidth = false,
  style,
  disabled,
  ...props 
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const base = {
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      ...(fullWidth && { width: '100%' as const })
    };

    const sizeStyles = {
      small: { paddingVertical: 8, paddingHorizontal: 16 },
      medium: { paddingVertical: 12, paddingHorizontal: 24 },
      large: { paddingVertical: 16, paddingHorizontal: 32 }
    };

    const variantStyles = {
      primary: {
        backgroundColor: disabled ? colors.border : colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? colors.border : colors.surface,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.border : colors.primary,
      }
    };

    return [base, sizeStyles[size], variantStyles[variant]];
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    
    switch (variant) {
      case 'primary':
        return colors.white;
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      default:
        return colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={getTextColor()} style={{ marginRight: 8 }} />}
      <ThemedText style={{ color: getTextColor(), fontWeight: '600' }}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}