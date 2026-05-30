// ─────────────────────────────────────────────
//  FF Scanner V2 — Design Token System
//  Brand: Farmers Factory (forest green + brown)
// ─────────────────────────────────────────────

export const Colors = {
  // Primary palette (from logo)
  primary:        '#2D7A5F',
  primaryLight:   '#3D9970',
  primaryLighter: '#4EB87A',
  primaryDark:    '#1A5240',
  primaryBg:      '#F0FAF5',
  primaryBorder:  '#C6E8D7',

  // Accent (brown farming tool from logo)
  accent:         '#7B3F1A',
  accentLight:    '#A0522D',
  accentBg:       '#FDF0E8',

  // Driver accent (blue)
  driver:         '#1D4ED8',
  driverLight:    '#3B82F6',
  driverBg:       '#EFF6FF',

  // Neutral
  white:          '#FFFFFF',
  background:     '#F4FAF7',
  cardBg:         '#FFFFFF',
  surface:        '#F8FDFB',

  // Text
  textPrimary:    '#122318',
  textSecondary:  '#3D6B52',
  textMuted:      '#82A693',
  textWhite:      '#FFFFFF',

  // Status
  success:        '#16A34A',
  successBg:      '#DCFCE7',
  warning:        '#D97706',
  warningBg:      '#FEF3C7',
  danger:         '#DC2626',
  dangerBg:       '#FEE2E2',
  info:           '#2563EB',
  infoBg:         '#DBEAFE',
  orange:         '#EA580C',
  orangeBg:       '#FFEDD5',

  // Border / shadow
  border:         '#DFF0E8',
  borderLight:    '#EEF8F2',
  shadow:         'rgba(29, 83, 58, 0.10)',
  shadowMd:       'rgba(29, 83, 58, 0.14)',
};

export const Typography = {
  fontSizes: {
    xs:   11,
    sm:   12,
    base: 14,
    md:   15,
    lg:   17,
    xl:   20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },
  fontWeights: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
    black:     '900' as const,
  },
  lineHeights: {
    tight:  1.2,
    normal: 1.45,
    loose:  1.7,
  },
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  base:16,
  lg:  20,
  xl:  24,
  '2xl':32,
  '3xl':40,
  '4xl':56,
};

export const Radii = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl':28,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor:   Colors.shadow,
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   Colors.shadowMd,
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius:  8,
    elevation:     4,
  },
  lg: {
    shadowColor:   Colors.shadowMd,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius:  16,
    elevation:     8,
  },
};
