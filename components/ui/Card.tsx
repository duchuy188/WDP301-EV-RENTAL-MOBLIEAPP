import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CardProps extends ViewProps {
  elevation?: number;
}

export function Card({ children, style, elevation = 2, ...props }: CardProps) {
  const { colors } = useTheme();

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    ...getShadowStyle(elevation),
  };

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}

function getShadowStyle(elevation: number) {
  return {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: elevation,
    },
    shadowOpacity: 0.1,
    shadowRadius: elevation * 2,
    elevation: elevation,
  };
}