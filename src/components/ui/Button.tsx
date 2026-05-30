import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radii, Shadows } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'driver';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export default function Button({
  label, onPress, variant = 'primary',
  loading, disabled, icon, style, fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.base, fullWidth && styles.full, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={['#3D9970', '#2D7A5F']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              {icon}
              <Text style={styles.labelPrimary}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'driver') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.base, fullWidth && styles.full, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              {icon}
              <Text style={styles.labelPrimary}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.base, fullWidth && styles.full, styles.dangerBtn, isDisabled && styles.disabled, style]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            {icon}
            <Text style={styles.labelPrimary}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[styles.ghostBtn, fullWidth && styles.full, isDisabled && styles.disabled, style]}
      >
        {icon}
        <Text style={styles.labelGhost}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // secondary
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.secondaryBtn, fullWidth && styles.full, isDisabled && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color={Colors.primary} size="small" /> : (
        <>
          {icon}
          <Text style={styles.labelSecondary}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  full: { width: '100%' },
  gradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 15, paddingHorizontal: 24,
  },
  dangerBtn: {
    backgroundColor: Colors.danger,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 15, paddingHorizontal: 24,
  },
  secondaryBtn: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1.5, borderColor: Colors.primaryBorder,
    borderRadius: Radii.lg,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 24,
  },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 12,
  },
  labelPrimary: {
    color: Colors.textWhite,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
  },
  labelSecondary: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
  labelGhost: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.medium,
  },
  disabled: { opacity: 0.45 },
});
