import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/common/StatCard';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';

interface Stats { received: number; qcPassed: number; wastage: number; dispatched: number; }

export default function HubDashboard({ navigation }: any) {
  const { profile, hub, signOut } = useAuth();
  const [stats, setStats]       = useState<Stats>({ received: 0, qcPassed: 0, wastage: 0, dispatched: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today      = new Date().toISOString().split('T')[0];
  const greetHour  = new Date().getHours();
  const greeting   = greetHour < 12 ? 'Good Morning' : greetHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName  = profile?.name?.split(' ')[0] ?? 'Manager';

  const loadData = useCallback(async () => {
    const hubId = hub?.id ?? profile?.hub_id;
    if (!hubId) return;
    try {
      const [rcv, qcp, wst, dsp, act] = await Promise.all([
        supabase.from('boxes').select('*', { count: 'exact', head: true }).eq('hub_id', hubId).eq('status', 'received').gte('updated_at', `${today}T00:00:00`),
        supabase.from('boxes').select('*', { count: 'exact', head: true }).eq('hub_id', hubId).eq('status', 'qc_passed').gte('updated_at', `${today}T00:00:00`),
        supabase.from('wastage_entries').select('*', { count: 'exact', head: true }).eq('hub_id', hubId).eq('entry_date', today),
        supabase.from('boxes').select('*', { count: 'exact', head: true }).eq('hub_id', hubId).eq('status', 'dispatched').gte('updated_at', `${today}T00:00:00`),
        supabase.from('inventory_log').select('event_type,qty_delta,created_at').eq('hub_id', hubId).gte('created_at', `${today}T00:00:00`).order('created_at', { ascending: false }).limit(8),
      ]);
      setStats({
        received:   rcv.count  ?? 0,
        qcPassed:   qcp.count  ?? 0,
        wastage:    wst.count  ?? 0,
        dispatched: dsp.count  ?? 0,
      });
      setActivity(act.data ?? []);
    } catch (e) { console.warn('loadData:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hub?.id, profile?.hub_id, today]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
    >
      {/* ── Hero Header ───────────────────────────── */}
      <LinearGradient colors={['#1A5240', '#2D7A5F']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoSmall}>
            <Image source={require('../../../assets/logo.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
          </View>
          <View style={styles.headerMid}>
            <Text style={styles.greetText}>{greeting}, {firstName} 👋</Text>
            <View style={styles.hubPill}>
              <Ionicons name="location" size={11} color={Colors.primaryLighter} />
              <Text style={styles.hubPillText}>{hub?.name ?? 'Hub'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Date + hub code */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          {hub?.code && (
            <View style={styles.codePill}>
              <Text style={styles.codePillText}>{hub.code}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* ── Stats grid ──────────────────────────── */}
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Received"   value={stats.received}   icon="archive-outline"    color={Colors.primary} />
              <StatCard label="QC Passed"  value={stats.qcPassed}   icon="checkmark-circle-outline" color={Colors.success} />
            </View>
            <View style={[styles.statsRow, { marginTop: 10 }]}>
              <StatCard label="Wastage"    value={stats.wastage}    icon="warning-outline"    color={Colors.danger} />
              <StatCard label="Dispatched" value={stats.dispatched} icon="cube-outline"       color={Colors.info} />
            </View>
          </>
        )}

        {/* ── Quick Actions ────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Scan & Receive')}>
            <LinearGradient colors={['#3D9970', '#2D7A5F']} style={styles.actionGrad}>
              <Ionicons name="qr-code-outline" size={28} color="#fff" />
              <Text style={styles.actionLabel}>Scan & Receive</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Wastage')}>
            <LinearGradient colors={['#EA580C', '#C2410C']} style={styles.actionGrad}>
              <Ionicons name="warning-outline" size={28} color="#fff" />
              <Text style={styles.actionLabel}>Log Wastage</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Recent Activity ──────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Recent Activity</Text>
        {activity.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={32} color={Colors.border} />
            <Text style={styles.emptyText}>No activity yet today</Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {activity.map((item, i) => (
              <View key={i} style={[styles.activityRow, i < activity.length - 1 && styles.activityBorder]}>
                <View style={[styles.activityDot, { backgroundColor: item.qty_delta > 0 ? Colors.successBg : Colors.dangerBg }]}>
                  <Ionicons
                    name={item.event_type === 'receive' ? 'archive' : item.event_type === 'wastage' ? 'warning' : 'cube'}
                    size={14}
                    color={item.qty_delta > 0 ? Colors.success : Colors.danger}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityType}>{item.event_type?.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.activityDelta, { color: item.qty_delta > 0 ? Colors.success : Colors.danger }]}>
                  {item.qty_delta > 0 ? '+' : ''}{item.qty_delta}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingTop: 54, paddingBottom: 28, paddingHorizontal: Spacing.base },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  logoSmall: {
    width: 46, height: 46, borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid: { flex: 1 },
  greetText: { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  hubPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3,
    backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start',
    borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2,
  },
  hubPillText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600' },
  signOutBtn: { padding: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { color: 'rgba(255,255,255,0.65)', fontSize: Typography.fontSizes.sm },
  codePill: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radii.sm,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  codePillText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  body: { padding: Spacing.base, paddingBottom: 40 },
  sectionTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statsRow: { flexDirection: 'row', gap: 10 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.md },
  actionGrad: { padding: Spacing.base, alignItems: 'center', gap: 8 },
  actionLabel: { color: '#fff', fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },

  activityCard: {
    backgroundColor: Colors.cardBg, borderRadius: Radii.xl, ...Shadows.md, overflow: 'hidden',
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  activityDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  activityType: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  activityTime: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  activityDelta: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.black },

  emptyCard: {
    backgroundColor: Colors.cardBg, borderRadius: Radii.xl,
    padding: 32, alignItems: 'center', gap: 8, ...Shadows.sm,
  },
  emptyText: { color: Colors.textMuted, fontSize: Typography.fontSizes.base },
});
