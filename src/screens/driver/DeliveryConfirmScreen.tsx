import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getPackByCode, updatePackStatus } from '@/lib/supabase';
import ScannerCamera from '@/components/scanner/ScannerCamera';
import Badge from '@/components/ui/Badge';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';
import { DeliveryPack } from '@/types';

export default function DeliveryConfirmScreen() {
  const [scanning, setScanning] = useState(false);
  const [pack, setPack]         = useState<DeliveryPack | null>(null);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleScan = async (data: string) => {
    setScanning(false); setLoading(true);
    const { data: packData, error } = await getPackByCode(data);
    if (error || !packData) { Alert.alert('Not Found', 'Pack not found.'); setLoading(false); return; }
    setPack(packData as DeliveryPack);
    setLoading(false);
  };

  const handleDeliver = async () => {
    if (!pack) return;
    setLoading(true);
    const { error } = await updatePackStatus(pack.id, 'delivered');
    if (error) { Alert.alert('Error', error.message); setLoading(false); return; }
    setDone(true); setLoading(false);
  };

  const reset = () => { setPack(null); setDone(false); };

  if (scanning) return <ScannerCamera onScan={handleScan} onClose={() => setScanning(false)} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#14532D', '#16A34A']} style={styles.header}>
        <Text style={styles.headerTitle}>Confirm Delivery</Text>
        <Text style={styles.headerSub}>Scan pack to mark as delivered at door</Text>
      </LinearGradient>

      {!pack && !loading && (
        <TouchableOpacity style={styles.scanZone} onPress={() => setScanning(true)} activeOpacity={0.8}>
          <View style={styles.scanBorder}>
            <Ionicons name="home-outline" size={52} color={Colors.success} />
            <Text style={styles.scanTapText}>Tap to Scan Pack</Text>
            <Text style={styles.scanSubText}>Confirm delivery at door</Text>
          </View>
        </TouchableOpacity>
      )}

      {loading && <View style={styles.loadingWrap}><ActivityIndicator size="large" color={Colors.success} /><Text style={styles.loadingText}>Loading pack…</Text></View>}

      {pack && !loading && (
        <View style={styles.packCard}>
          {done ? (
            <LinearGradient colors={['#14532D', '#16A34A']} style={styles.successGrad}>
              <View style={styles.successIcon}><Ionicons name="checkmark-circle" size={72} color="#fff" /></View>
              <Text style={styles.successTitle}>Delivered! ✅</Text>
              <Text style={styles.successCode}>{pack.pack_code}</Text>
              <Text style={styles.successHub}>{(pack as any).hub?.name ?? '—'}</Text>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.packHeader}>
                <View>
                  <Text style={styles.packCode}>{pack.pack_code}</Text>
                  <Text style={styles.packHub}>{(pack as any).hub?.name ?? '—'}</Text>
                </View>
                <Badge label={pack.status.replace('_',' ')} color={pack.status === 'delivered' ? 'green' : 'orange'} />
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="layers-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{(pack as any).items?.length ?? 0} items</Text>
                </View>
                {pack.dispatched_at && (
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.infoText}>
                      Dispatched {new Date(pack.dispatched_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      )}

      {pack && !loading && !done && (
        <TouchableOpacity style={styles.deliverBtn} onPress={handleDeliver} activeOpacity={0.85}>
          <LinearGradient colors={['#22C55E', '#16A34A', '#15803D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.deliverGrad}>
            <Ionicons name="home-outline" size={22} color="#fff" />
            <Text style={styles.deliverText}>Confirm Delivered</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {(pack || done) && !loading && (
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Ionicons name="scan-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.resetText}>Scan Another Pack</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: Spacing.base },
  headerTitle: { color: '#fff', fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: Typography.fontSizes.sm, marginTop: 4 },
  scanZone: { margin: Spacing.base, marginTop: Spacing.xl },
  scanBorder: { height: 220, borderRadius: Radii.xl, borderWidth: 2, borderColor: '#A7F3D0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.successBg },
  scanTapText: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.success },
  scanSubText: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted },
  loadingWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: Typography.fontSizes.base },
  packCard: { margin: Spacing.base, backgroundColor: Colors.cardBg, borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.md },
  successGrad: { padding: 36, alignItems: 'center', gap: 8 },
  successIcon: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: Typography.fontSizes['2xl'], fontWeight: Typography.fontWeights.black, color: '#fff' },
  successCode: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: 'rgba(255,255,255,0.9)' },
  successHub: { fontSize: Typography.fontSizes.base, color: 'rgba(255,255,255,0.65)' },
  packHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: Spacing.base },
  packCode: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black, color: Colors.textPrimary },
  packHub: { fontSize: Typography.fontSizes.base, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  infoRow: { flexDirection: 'row', gap: 20, padding: Spacing.base },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: Typography.fontSizes.sm, color: Colors.textSecondary },
  deliverBtn: { marginHorizontal: Spacing.base, borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.md },
  deliverGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  deliverText: { color: '#fff', fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
  resetText: { color: Colors.textMuted, fontSize: Typography.fontSizes.base },
});
