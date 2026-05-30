import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radii } from '@/theme';

type Color = 'green' | 'orange' | 'red' | 'blue' | 'yellow' | 'gray' | 'brown';

interface Props {
  label: string;
  color?: Color;
  size?: 'sm' | 'md';
}

const colorMap: Record<Color, { bg: string; text: string; border: string }> = {
  green:  { bg: Colors.successBg,  text: Colors.success, border: '#A7F3D0' },
  orange: { bg: Colors.orangeBg,   text: Colors.orange,  border: '#FED7AA' },
  red:    { bg: Colors.dangerBg,   text: Colors.danger,  border: '#FECACA' },
  blue:   { bg: Colors.infoBg,     text: Colors.info,    border: '#BFDBFE' },
  yellow: { bg: Colors.warningBg,  text: Colors.warning, border: '#FDE68A' },
  gray:   { bg: '#F3F4F6',         text: '#6B7280',      border: '#E5E7EB' },
  brown:  { bg: Colors.accentBg,   text: Colors.accent,  border: '#DDB894' },
};

export default function Badge({ label, color = 'green', size = 'md' }: Props) {
  const c = colorMap[color];
  return (
    <View style={[
      styles.base,
      { backgroundColor: c.bg, borderColor: c.border },
      size === 'sm' && styles.sm,
    ]}>
      <Text style={[
        styles.label,
        { color: c.text },
        size === 'sm' && styles.labelSm,
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sm: { paddingHorizontal: 7, paddingVertical: 2 },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelSm: { fontSize: Typography.fontSizes.xs },
});
