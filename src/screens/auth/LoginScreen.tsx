import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';

const HUB_HINTS = [
  { label: 'Hyderabad Hub',  email: 'manager.hyd@ffactory.com',  code: 'HYD',  color: '#2D7A5F' },
  { label: 'Palikarani Hub', email: 'manager.pali@ffactory.com', code: 'PALI', color: '#3D7A2D' },
  { label: 'Vanagaram Hub',  email: 'manager.vana@ffactory.com', code: 'VANA', color: '#2D5E7A' },
];

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState<'email' | 'pass' | null>(null);

  const handleLogin = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.'); return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
    setLoading(false);
    if (error) Alert.alert('Login Failed', error.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Full screen gradient background */}
      <LinearGradient
        colors={['#1A5240', '#2D7A5F', '#3D9970']}
        start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + Brand */}
        <View style={styles.brandWrap}>
          <View style={styles.logoCard}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>Farmers Factory</Text>
          <Text style={styles.brandSub}>Operations Hub</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSub}>Sign in to your hub account</Text>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputRow, focused === 'email' && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={18} color={focused === 'email' ? Colors.primary : Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="manager@ffactory.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                autoFocus
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, focused === 'pass' && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={focused === 'pass' ? Colors.primary : Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#3D9970', '#2D7A5F', '#1A5240']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.signInGradient}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.signInText}>Sign In</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Hub Chips */}
        <View style={styles.hubSection}>
          <Text style={styles.hubSectionTitle}>— Quick Select Hub —</Text>
          <View style={styles.hubList}>
            {HUB_HINTS.map(h => (
              <TouchableOpacity
                key={h.code}
                style={styles.hubChip}
                onPress={() => setEmail(h.email)}
                activeOpacity={0.8}
              >
                <View style={[styles.hubCodeBadge, { backgroundColor: h.color }]}>
                  <Text style={styles.hubCode}>{h.code}</Text>
                </View>
                <Text style={styles.hubLabel}>{h.label}</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>FF Scanner v2.0 • Farmers Factory Ops</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -80, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.03)', bottom: 80, left: -60,
  },
  scroll: {
    flexGrow: 1, paddingHorizontal: Spacing.base,
    paddingTop: 60, paddingBottom: 40,
    alignItems: 'center',
  },

  // Brand
  brandWrap: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logoCard: {
    width: 100, height: 100, borderRadius: Radii.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.base,
    ...Shadows.lg,
  },
  logo: { width: 80, height: 80 },
  brandName: {
    fontSize: Typography.fontSizes['2xl'],
    fontWeight: Typography.fontWeights.black,
    color: '#fff',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: Typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: Typography.fontWeights.medium,
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Card
  card: {
    width: '100%', backgroundColor: Colors.cardBg,
    borderRadius: Radii['2xl'], padding: Spacing.xl,
    ...Shadows.lg, marginBottom: Spacing.xl,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.black,
    color: Colors.textPrimary, marginBottom: 4,
  },
  cardSub: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textMuted, marginBottom: Spacing.xl,
  },

  // Field
  fieldWrap: { marginBottom: Spacing.base },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textSecondary, marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radii.md, paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: Colors.surface,
  },
  inputFocused: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  input: {
    flex: 1, fontSize: Typography.fontSizes.md,
    color: Colors.textPrimary, padding: 0,
  },

  // Sign In
  signInBtn: { borderRadius: Radii.lg, overflow: 'hidden', marginTop: 8, ...Shadows.md },
  btnDisabled: { opacity: 0.6 },
  signInGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 15,
  },
  signInText: {
    color: '#fff', fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
  },

  // Hub chips
  hubSection: { width: '100%', alignItems: 'center', marginBottom: Spacing.lg },
  hubSectionTitle: {
    fontSize: Typography.fontSizes.xs, color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5, textTransform: 'uppercase',
    fontWeight: Typography.fontWeights.semibold, marginBottom: Spacing.md,
  },
  hubList: { width: '100%', gap: 8 },
  hubChip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radii.lg, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  hubCodeBadge: {
    borderRadius: Radii.sm, paddingHorizontal: 8, paddingVertical: 3,
  },
  hubCode: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  hubLabel: {
    flex: 1, fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)',
    marginTop: Spacing.base, letterSpacing: 0.5,
  },
});
