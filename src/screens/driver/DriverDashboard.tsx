import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { getDriverPacks } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';
import { DeliveryPack } from '@/types';

const packStatusColor: Record<string, 'blue'|'green'|'yellow'|'gray'|'orange'> = {
  ready: 'blue', dispatched: 'orange', delivered: 'green', packing: 'yellow', partial_delivered: 'orange',
};

export default function DriverDashboard({ navigation }: any) {
  const { profile, signOut } = useAuth();
  const [packs, setPacks]     = useState<DeliveryPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const firstName  = profile?.name?.split(' ')[0] ?? 'Driver';
  const delivered  = packs.filter(p => p.status === 'delivered').length;
  const pending    = packs.filter(p => p.status !== 'delivered').length;

  const loadPacks = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await getDriverPacks(profile.id, today);
    setPacks((data ?? []) as DeliveryPack[]);
    setLoading(false); setRefreshing(false);
  }, [profile?.id, today]);

  useEffect(() => { loadPacks(); }, [loadPacks]);
  const onRefresh = () => { setRefreshing(true); loadPacks(); };

  return (
    <ScrollView
      style={styles.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.driverLight} colors={[Colors.driverLight]} />}
    >
      {/* Header */}
      <LinearGradient colors={['#1E3A8A', '#1D4ED8', '#2563EB']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoSmall}>
            <Image source={require('../../../assets/logo.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetText}>Hey, {firstName} 🚚</Text>
            <Text style={styles.greetSub}>Driver Dashboard</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Mini stats */}
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatVal}>{packs.length}</Text>
            <Text style={styles.miniStatLabel}>Total</Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <Text style={styles.miniStatVal}>{delivered}</Text>
            <Text style={styles.miniStatLabel}>Delivered</Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <Text style={styles.miniStatVal}>{pending}</Text>
            <Text style={styles.miniStatLabel}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Scan Pack')}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.actionGrad}>
              <Ionicons name="barcode-outline" size={26} color="#fff" />
              <Text style={styles.actionLabel}>Scan Pack</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Deliver')}>
            <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.actionGrad}>
              <Ionicons name="checkmark-circle-outline" size={26} color="#fff" />
              <Text style={styles.actionLabel}>Confirm Delivery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Packs list */}
        <Text style={styles.sectionTitle}>Today's Route</Text>
        {loading ? (
          <ActivityIndicator color={Colors.driverLight} style={{ marginVertical: 24 }} />
        ) : packs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyTitle}>No packs assigned today</Text>
            <Text style={styles.emptyText}>Pull down to refresh</Text>
          </View>
        ) : (
          packs.map(pack => (
            <View key={pack.id} style={styles.packCard}>
              <View style={styles.packTop}>
                <View style={styles.packIconWrap}>
                  <Ionicons name="cube" size={22} color={Colors.driverLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.packCode}>{pack.pack_code}</Text>
                  <Text style={styles.packHub}>{(pack as any).hub?.name ?? '—'}</Text>
                </View>
                <Badge
                  label={pack.status.replace('_', ' ')}
                  color={packStatusColor[pack.status] ?? 'gray'}
                  size="sm"
                />
              </View>
              <View style={styles.packMeta}>
                <View style={styles.packMetaItem}>
                  <Ionicons name="layers-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.packMetaText}>{(pack as any).items?.length ?? 0} items</Text>
                </View>
                {pack.dispatched_at && (
                  <View style={styles.packMetaItem}>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.packMetaText}>
                      Dispatched {new Date(pack.dispatched_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 54, paddingBottom: 28, paddingHorizontal: Spacing.base },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  logoSmall: { width: 46, height: 46, borderRadius: Radii.md, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  greetText: { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  greetSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  signOutBtn: { padding: 8 },
  dateText: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.fontSizes.sm, marginBottom: 18 },
  miniStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radii.xl, padding: 14 },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatVal: { color: '#fff', fontSize: Typography.fontSizes['2xl'], fontWeight: Typography.fontWeights.black },
  miniStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  miniStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  body: { padding: Spacing.base, paddingBottom: 40 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  actionCard: { flex: 1, borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.md },
  actionGrad: { padding: Spacing.base, alignItems: 'center', gap: 6 },
  actionLabel: { color: '#fff', fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, textAlign: 'center' },
  sectionTitle: { fontSize: Typography.fontSizes.base, fontWeight: Typography.fontWeights.bold, color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  emptyCard: { backgroundColor: Colors.cardBg, borderRadius: Radii.xl, padding: 36, alignItems: 'center', gap: 8, ...Shadows.sm },
  emptyTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: Colors.textSecondary },
  emptyText: { color: Colors.textMuted, fontSize: Typography.fontSizes.sm },
  packCard: { backgroundColor: Colors.cardBg, borderRadius: Radii.xl, padding: Spacing.base, marginBottom: 10, ...Shadows.md },
  packTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  packIconWrap: { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: Colors.driverBg, alignItems: 'center', justifyContent: 'center' },
  packCode: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  packHub: { fontSize: Typography.fontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  packMeta: { flexDirection: 'row', gap: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  packMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  packMetaText: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted },
});
