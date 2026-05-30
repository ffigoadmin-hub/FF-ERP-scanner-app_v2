import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';

interface Props {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  bgColor?: string;
  trend?: string;
}

export default function StatCard({ label, value, icon, color = Colors.primary, bgColor = Colors.primaryBg, trend }: Props) {
  return (
    <View style={[styles.card, Shadows.md]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend ? <Text style={[styles.trend, { color }]}>{trend}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radii.xl,
    padding: Spacing.base,
    alignItems: 'flex-start',
    gap: 6,
  },
  iconWrap: {
    width: 42, height: 42,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: Typography.fontSizes['3xl'],
    fontWeight: Typography.fontWeights.black,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textMuted,
  },
  trend: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
});
