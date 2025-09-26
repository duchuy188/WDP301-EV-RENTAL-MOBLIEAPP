import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}, ref) => {
  const { colors } = useTheme();

  const inputStyle = {
    borderWidth: 1,
    borderColor: error ? colors.error : colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    ...(leftIcon && { paddingLeft: 48 }),
    ...(rightIcon && { paddingRight: 48 }),
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={[styles.label, { color: colors.text }]}>
          {label}
        </ThemedText>
      )}
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={[styles.iconLeft, { borderColor: colors.border }]}>
            {leftIcon}
          </View>
        )}
        <TextInput
          ref={ref}
          style={[inputStyle, style]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
        {rightIcon && (
          <View style={[styles.iconRight, { borderColor: colors.border }]}>
            {rightIcon}
          </View>
        )}
      </View>
      {error && (
        <ThemedText style={[styles.error, { color: colors.error }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  iconLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    zIndex: 1,
  },
  iconRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -16 }], // dịch icon lên giữa input hơn
    zIndex: 10, // tăng zIndex để icon nổi lên trên
    backgroundColor: 'transparent',
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    width: 32,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});