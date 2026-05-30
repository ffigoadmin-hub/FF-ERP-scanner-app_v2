import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getPackByCode, updatePackStatus } from '@/lib/supabase';
import ScannerCamera from '@/components/scanner/ScannerCamera';
import Badge from '@/components/ui/Badge';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';
import { DeliveryPack } from '@/types';

export default function ScanDispatchScreen() {
  const [scanning, setScanning] = useState(false);
  const [pack, setPack]         = useState<DeliveryPack | null>(null);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleScan = async (data: string) => {
    setScanning(false); setLoading(true);
    const { data: packData, error } = await getPackByCode(data);
    if (error || !packData) {
      Alert.alert('Not Found', 'Pack not found. Check the code and try again.');
      setLoading(false); return;
    }
    setPack(packData as DeliveryPack);
    setLoading(false);
  };

  const handleDispatch = async () => {
    if (!pack) return;
    setLoading(true);
    const { error } = await updatePackStatus(pack.id, 'dispatched');
    if (error) { Alert.alert('Error', error.message); setLoading(false); return; }
    setDone(true); setLoading(false);
  };

  const reset = () => { setPack(null); setDone(false); };

  if (scanning) return <ScannerCamera onScan={handleScan} onClose={() => setScanning(false)} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#1E3A8A', '#1D4ED8']} style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Dispatch</Text>
        <Text style={styles.headerSub}>Scan a pack to mark it dispatched</Text>
      </LinearGradient>

      {!pack && !loading && (
        <TouchableOpacity style={styles.scanZone} onPress={() => setScanning(true)} activeOpacity={0.8}>
          <View style={styles.scanBorder}>
            <Ionicons name="barcode-outline" size={52} color={Colors.driverLight} />
            <Text style={styles.scanTapText}>Tap to Scan Pack</Text>
            <Text style={styles.scanSubText}>Barcode or QR code</Text>
          </View>
        </TouchableOpacity>
      )}

      {loading && <View style={styles.loadingWrap}><ActivityIndicator size="large" color={Colors.driverLight} /><Text style={styles.loadingText}>Loading pack…</Text></View>}

      {pack && !loading && (
        <View style={styles.packCard}>
          {done ? (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}><Ionicons name="checkmark-circle" size={64} color={Colors.success} /></View>
              <Text style={styles.successTitle}>Pack Dispatched! 🚚</Text>
              <Text style={styles.successCode}>{pack.pack_code}</Text>
            </View>
          ) : (
            <>
              <View style={styles.packHeader}>
                <View>
                  <Text style={styles.packCode}>{pack.pack_code}</Text>
                  <Text style={styles.packHub}>{(pack as any).hub?.name ?? '—'}</Text>
                </View>
                <Badge label={pack.status.replace('_',' ')} color="blue" />
              </View>
              <View style={styles.divider} />
              <View style={styles.itemsRow}>
                <Ionicons name="layers-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.itemsText}>{(pack as any).items?.length ?? 0} items in this pack</Text>
              </View>
            </>
          )}
        </View>
      )}

      {pack && !loading && !done && (
        <TouchableOpacity style={styles.dispatchBtn} onPress={handleDispatch} activeOpacity={0.85}>
          <LinearGradient colors={['#3B82F6', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dispatchGrad}>
            <Ionicons name="rocket-outline" size={20} color="#fff" />
            <Text style={styles.dispatchText}>Mark Dispatched</Text>
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
  scanBorder: { height: 220, borderRadius: Radii.xl, borderWidth: 2, borderColor: '#BFDBFE', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.driverBg },
  scanTapText: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.driver },
  scanSubText: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted },
  loadingWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: Typography.fontSizes.base },
  packCard: { margin: Spacing.base, backgroundColor: Colors.cardBg, borderRadius: Radii.xl, padding: Spacing.base, ...Shadows.md },
  packHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  packCode: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black, color: Colors.textPrimary },
  packHub: { fontSize: Typography.fontSizes.base, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemsText: { fontSize: Typography.fontSizes.base, color: Colors.textSecondary },
  successWrap: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black, color: Colors.success },
  successCode: { fontSize: Typography.fontSizes.lg, color: Colors.textSecondary },
  dispatchBtn: { marginHorizontal: Spacing.base, borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.md },
  dispatchGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  dispatchText: { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
  resetText: { color: Colors.textMuted, fontSize: Typography.fontSizes.base },
});
