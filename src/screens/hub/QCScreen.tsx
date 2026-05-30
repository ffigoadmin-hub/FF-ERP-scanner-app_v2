import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { updateBoxStatus, logInventoryEvent } from '@/lib/supabase';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';
import { Box } from '@/types';

export default function QCScreen({ route, navigation }: any) {
  const { profile, hub } = useAuth();
  const box: Box = route.params?.box;
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<'pass' | 'fail' | null>(null);

  if (!box) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.noBoxText}>No box selected for QC</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleQC = async (pass: boolean) => {
    setLoading(true);
    try {
      const status = pass ? 'qc_passed' : 'qc_failed';
      const { error } = await updateBoxStatus(box.id, status);
      if (error) throw error;
      await logInventoryEvent({
        hubId:      hub?.id ?? profile?.hub_id ?? '',
        productId:  box.product_id ?? '',
        eventType:  pass ? 'receive' : 'qc_reject',
        qtyDelta:   pass ? 1 : -1,
        refId:      box.id, refType: 'box',
        notes:      notes.trim() || (pass ? 'QC passed' : 'QC failed'),
        createdBy:  profile?.id,
      });
      setResult(pass ? 'pass' : 'fail');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'QC update failed');
    }
    setLoading(false);
  };

  if (result) {
    const pass = result === 'pass';
    return (
      <LinearGradient
        colors={pass ? ['#14532D', '#16A34A'] : ['#7F1D1D', '#DC2626']}
        style={styles.resultScreen}
      >
        <View style={[styles.resultIcon, { backgroundColor: pass ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)' }]}>
          <Ionicons name={pass ? 'checkmark-circle' : 'close-circle'} size={80} color="#fff" />
        </View>
        <Text style={styles.resultTitle}>{pass ? 'QC Passed! ✅' : 'QC Failed ❌'}</Text>
        <Text style={styles.resultCode}>{box.box_code}</Text>
        <Text style={styles.resultProduct}>{(box as any).product?.name ?? '—'}</Text>
        <TouchableOpacity
          style={styles.resultBtn}
          onPress={() => { navigation.goBack(); navigation.goBack(); }}
        >
          <Text style={styles.resultBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Box summary */}
      <View style={styles.boxCard}>
        <View style={styles.boxTop}>
          <View style={styles.boxIcon}>
            <Ionicons name="cube-outline" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.boxCode}>{box.box_code}</Text>
            <Text style={styles.boxProduct}>{(box as any).product?.name ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Weight</Text>
            <Text style={styles.detailValue}>{box.weight_kg ?? '—'} kg</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>SKU</Text>
            <Text style={styles.detailValue}>{(box as any).product?.sku ?? '—'}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{box.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.notesCard}>
        <Text style={styles.notesLabel}>
          <Ionicons name="create-outline" size={14} color={Colors.textSecondary} /> QC Notes (optional)
        </Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add observations, issues, or comments…"
          placeholderTextColor={Colors.textMuted}
          multiline numberOfLines={3}
          value={notes} onChangeText={setNotes}
          textAlignVertical="top"
        />
      </View>

      {/* Pass / Fail buttons */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.qcButtons}>
          <TouchableOpacity style={styles.btnPass} onPress={() => handleQC(true)} activeOpacity={0.85}>
            <LinearGradient colors={['#22C55E', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.qcGrad}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#fff" />
              <Text style={styles.qcBtnLabel}>PASS</Text>
              <Text style={styles.qcBtnSub}>Box meets quality standards</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnFail} onPress={() => handleQC(false)} activeOpacity={0.85}>
            <LinearGradient colors={['#F87171', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.qcGrad}>
              <Ionicons name="close-circle-outline" size={28} color="#fff" />
              <Text style={styles.qcBtnLabel}>FAIL</Text>
              <Text style={styles.qcBtnSub}>Box does not meet standards</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.background },
  noBoxText: { fontSize: Typography.fontSizes.lg, color: Colors.textSecondary },
  backBtn: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: Radii.md, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: Typography.fontWeights.bold },

  boxCard: { backgroundColor: Colors.cardBg, borderRadius: Radii.xl, padding: Spacing.base, ...Shadows.md, marginBottom: 12 },
  boxTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  boxIcon: { width: 52, height: 52, borderRadius: Radii.md, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  boxCode: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black, color: Colors.textPrimary },
  boxProduct: { fontSize: Typography.fontSizes.base, color: Colors.textSecondary, marginTop: 2 },
  detailRow: { flexDirection: 'row', gap: 8 },
  detailChip: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 10, alignItems: 'center' },
  detailLabel: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, fontWeight: Typography.fontWeights.medium },
  detailValue: { fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, fontWeight: Typography.fontWeights.bold, marginTop: 2 },

  notesCard: { backgroundColor: Colors.cardBg, borderRadius: Radii.xl, padding: Spacing.base, ...Shadows.sm, marginBottom: 20 },
  notesLabel: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold, color: Colors.textSecondary, marginBottom: 8 },
  notesInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md,
    padding: 12, fontSize: Typography.fontSizes.base, color: Colors.textPrimary,
    minHeight: 80, backgroundColor: Colors.surface,
  },

  qcButtons: { gap: 12 },
  btnPass: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.md },
  btnFail: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.md },
  qcGrad: { padding: Spacing.base + 4, alignItems: 'center', gap: 4 },
  qcBtnLabel: { color: '#fff', fontSize: Typography.fontSizes['2xl'], fontWeight: Typography.fontWeights.black, letterSpacing: 2 },
  qcBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.fontSizes.sm },

  resultScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  resultIcon: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  resultTitle: { fontSize: Typography.fontSizes['3xl'], fontWeight: Typography.fontWeights.black, color: '#fff' },
  resultCode: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: 'rgba(255,255,255,0.9)' },
  resultProduct: { fontSize: Typography.fontSizes.base, color: 'rgba(255,255,255,0.65)', marginBottom: 16 },
  resultBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radii.lg, paddingHorizontal: 32, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  resultBtnText: { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
});
