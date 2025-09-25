import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
}

export function ThemedView({ style, lightColor, darkColor, ...props }: ThemedViewProps) {
  const { colors, isDark } = useTheme();
  const backgroundColor = isDark ? (darkColor || colors.background) : (lightColor || colors.background);

  return <View style={[{ backgroundColor }, style]} {...props} />;
}