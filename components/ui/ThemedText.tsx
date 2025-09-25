import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ThemedTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'caption';
}

export function ThemedText({ style, lightColor, darkColor, type = 'default', ...props }: ThemedTextProps) {
  const { colors, isDark } = useTheme();
  const textColor = isDark ? (darkColor || colors.text) : (lightColor || colors.text);

  const getTypeStyle = () => {
    switch (type) {
      case 'title':
        return { fontSize: 24, fontWeight: '700' as const };
      case 'subtitle':
        return { fontSize: 18, fontWeight: '600' as const };
      case 'caption':
        return { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary };
      default:
        return { fontSize: 16, fontWeight: '400' as const };
    }
  };

  return (
    <Text 
      style={[
        { color: textColor, fontFamily: 'Inter-Regular' },
        getTypeStyle(),
        style
      ]} 
      {...props} 
    />
  );
}