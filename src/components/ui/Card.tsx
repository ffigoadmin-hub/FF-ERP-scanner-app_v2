import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'flat' | 'outlined';
  padding?: number;
}

export default function Card({ children, style, variant = 'default', padding }: Props) {
  return (
    <View style={[
      styles.base,
      variant === 'flat'     && styles.flat,
      variant === 'outlined' && styles.outlined,
      padding !== undefined  && { padding },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radii.xl,
    padding: Spacing.base,
    ...Shadows.md,
  },
  flat: {
    ...Shadows.sm,
    shadowOpacity: 0.5,
  },
  outlined: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
});
