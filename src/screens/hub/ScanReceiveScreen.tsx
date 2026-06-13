import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { getBoxByCode, getBoxById, updateBoxStatus, logInventoryEvent } from '@/lib/supabase';
import ScannerCamera from '@/components/scanner/ScannerCamera';
import Badge from '@/components/ui/Badge';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';
import { Box, QRPayload } from '@/types';

export default function ScanReceiveScreen({ navigation }: any) {
  const { profile, hub } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [box, setBox]           = useState<Box | null>(null);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const statusColor: Record<string, 'green'|'orange'|'red'|'blue'|'gray'> = {
    received: 'green', qc_passed: 'green', qc_failed: 'red',
    dispatched: 'blue', created: 'gray', wasted: 'red',
  };

  // Fixed: receives (data, parsed) directly from ScannerCamera
  const handleScan = async (data: string, parsed: QRPayload | null) => {
    setScanning(false);
    setLoading(true);
    try {
      const { data: boxData, error } = parsed?.box_id
        ? await getBoxById(parsed.box_id)
        : await getBoxByCode(data);

      if (error || !boxData) {
        Alert.alert('Not Found', 'Box not found in system. Check the code and try again.');
        setLoading(false); return;
      }
      setBox(boxData as Box);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch box details.');
    }
    setLoading(false);
  };

  const handleReceive = async () => {
    if (!box) return;
    setLoading(true);
    try {
      const { error } = await updateBoxStatus(box.id, 'received', hub?.id ?? profile?.hub_id ?? '');
      if (error) throw error;

      // Guard: only log if productId is known
      if (box.product_id) {
        await logInventoryEvent({
          hubId:      hub?.id ?? profile?.hub_id ?? '',
          productId:  box.product_id,
          eventType:  'receive',
          qtyDelta:   1,
          refId:      box.id,
          refType:    'box',
          notes:      `Box ${box.box_code} received`,
          createdBy:  profile?.id,
        });
      }
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to update box status.');
    }
    setLoading(false);
  };

  const handleQC = () => {
    if (!box) return;
    navigation.navigate('QC', { box });
  };

  const reset = () => { setBox(null); setDone(false); setScanning(false); };

  if (scanning) {
    return (
      <View style={{ flex: 1 }}>
        <ScannerCamera
          onScan={handleScan}
          onClose={() => setScanning(false)}
          hint="Scan box QR code or barcode"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <LinearGradient colors={['#1A5240', '#2D7A5F']} style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Receive</Text>
        <Text style={styles.headerSub}>Scan a box QR or barcode to receive it into the hub</Text>
      </LinearGradient>

      {/* Scanner trigger */}
      {!box && !loading && (
        <TouchableOpacity style={styles.scanZone} onPress={() => setScanning(true)} activeOpacity={0.8}>
          <View style={styles.scanBorder}>
            <View style={styles.scanCornerTL} />
            <View style={styles.scanCornerTR} />
            <View style={styles.scanCornerBL} />
            <View style={styles.scanCornerBR} />
            <Ionicons name="qr-code-outline" size={56} color={Colors.primary} />
            <Text style={styles.scanTapText}>Tap to Scan Box</Text>
            <Text style={styles.scanSubText}>QR code or barcode</Text>
          </View>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching box details…</Text>
        </View>
      )}

      {/* Box details */}
      {box && !loading && (
        <View style={styles.boxCard}>
          {done ? (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Box Received! ✅</Text>
              <Text style={styles.successCode}>{box.box_code}</Text>
              <Text style={styles.successProduct}>{(box as any).product?.name ?? 'Unknown product'}</Text>
            </View>
          ) : (
            <>
              <View style={styles.boxHeader}>
                <View>
                  <Text style={styles.boxCode}>{box.box_code}</Text>
                  <Text style={styles.boxProduct}>{(box as any).product?.name ?? '—'}</Text>
                </View>
                <Badge label={box.status.replace('_', ' ')} color={statusColor[box.status] ?? 'gray'} />
              </View>
              <View style={styles.divider} />
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Ionicons name="scale-outline" size={16} color={Colors.textMuted} />
                  <View>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{box.weight_kg ?? '—'} kg</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="barcode-outline" size={16} color={Colors.textMuted} />
                  <View>
                    <Text style={styles.detailLabel}>SKU</Text>
                    <Text style={styles.detailValue}>{(box as any).product?.sku ?? '—'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                  <View>
                    <Text style={styles.detailLabel}>Hub</Text>
                    <Text style={styles.detailValue}>{(box as any).hub?.name ?? hub?.name ?? '—'}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* Action buttons */}
      {box && !loading && !done && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnReceive} onPress={handleReceive} activeOpacity={0.85}>
            <LinearGradient colors={['#3D9970', '#2D7A5F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
              <Ionicons name="archive-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Receive Box</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnQC} onPress={handleQC} activeOpacity={0.85}>
            <Ionicons name="clipboard-outline" size={20} color={Colors.primary} />
            <Text style={styles.btnQCText}>Run QC Check</Text>
          </TouchableOpacity>
        </View>
      )}

      {(done || box) && !loading && (
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Ionicons name="scan-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.resetText}>Scan Another Box</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const cornerStyle = { position: 'absolute' as const, width: 24, height: 24, borderColor: Colors.primary, borderWidth: 3 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: Spacing.base },
  headerTitle: { color: '#fff', fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: Typography.fontSizes.sm, marginTop: 4 },
  scanZone: { margin: Spacing.base, marginTop: Spacing.xl },
  scanBorder: { height: 240, borderRadius: Radii.xl, borderWidth: 2, borderColor: Colors.primaryBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primaryBg, position: 'relative' },
  scanCornerTL: { ...cornerStyle, top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  scanCornerTR: { ...cornerStyle, top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  scanCornerBL: { ...cornerStyle, bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  scanCornerBR: { ...cornerStyle, bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanTapText: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.primary },
  scanSubText: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted },
  loadingWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: Typography.fontSizes.base },
  boxCard: { margin: Spacing.base, backgroundColor: Colors.cardBg, borderRadius: Radii.xl, padding: Spacing.base, ...Shadows.md },
  boxHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  boxCode: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black, color: Colors.textPrimary },
  boxProduct: { fontSize: Typography.fontSizes.base, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 14 },
  detailsGrid: { gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, fontWeight: Typography.fontWeights.medium },
  detailValue: { fontSize: Typography.fontSizes.base, color: Colors.textPrimary, fontWeight: Typography.fontWeights.semibold },
  successWrap: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black, color: Colors.success },
  successCode: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  successProduct: { fontSize: Typography.fontSizes.base, color: Colors.textMuted },
  actions: { marginHorizontal: Spacing.base, gap: 10 },
  btnReceive: { borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.md },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  btnText: { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  btnQC: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryBg },
  btnQCText: { color: Colors.primary, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
  resetText: { color: Colors.textMuted, fontSize: Typography.fontSizes.base, fontWeight: Typography.fontWeights.medium },
});
