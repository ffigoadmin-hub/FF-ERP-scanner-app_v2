import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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

// ── Types ─────────────────────────────────────────────────────
interface Stats { received: number; qcPassed: number; wastage: number; dispatched: number }
interface InventoryItem { product_name: string; quantity: number }
interface WastageItem   { item_name: string; quantity_kg: number; amount: number | null }

// ── Bar chart row ──────────────────────────────────────────────
function BarRow({ label, value, max, color, unit = 'kg' }: {
  label: string; value: number; max: number; color: string; unit?: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;
  return (
    <View style={bar.row}>
      <Text style={bar.label} numberOfLines={1}>{label}</Text>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[bar.val, { color }]}>{value}{unit}</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  label: { width: 90, fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  track: { flex: 1, height: 10, backgroundColor: Colors.borderLight, borderRadius: 6, overflow: 'hidden' },
  fill:  { height: 10, borderRadius: 6 },
  val:   { width: 52, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});

// ── Donut-style summary ────────────────────────────────────────
function FlowBar({ received, dispatched, wastage }: { received: number; dispatched: number; wastage: number }) {
  const total = received + dispatched + wastage || 1;
  const rcvPct = Math.round((received  / total) * 100);
  const dspPct = Math.round((dispatched / total) * 100);
  const wstPct = Math.round((wastage   / total) * 100);
  return (
    <View>
      <View style={flow.track}>
        <View style={[flow.seg, { flex: rcvPct || 1, backgroundColor: Colors.primary }]} />
        <View style={[flow.seg, { flex: dspPct || 1, backgroundColor: Colors.info }]} />
        <View style={[flow.seg, { flex: wstPct || 1, backgroundColor: Colors.danger }]} />
      </View>
      <View style={flow.legend}>
        <FlowLegend color={Colors.primary} label="Received"   value={received}  />
        <FlowLegend color={Colors.info}    label="Dispatched" value={dispatched} />
        <FlowLegend color={Colors.danger}  label="Wastage"    value={wastage}    />
      </View>
    </View>
  );
}

function FlowLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={flow.legendItem}>
      <View style={[flow.dot, { backgroundColor: color }]} />
      <Text style={flow.legendLabel}>{label}</Text>
      <Text style={[flow.legendVal, { color }]}>{value}</Text>
    </View>
  );
}

const flow = StyleSheet.create({
  track:      { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 12 },
  seg:        { height: 14 },
  legend:     { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  legendLabel:{ fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  legendVal:  { fontSize: 12, fontWeight: '800', marginLeft: 2 },
});

// ── Main Component ─────────────────────────────────────────────
export default function HubDashboard({ navigation }: any) {
  const { profile, hub, signOut } = useAuth();

  const [stats,     setStats]     = useState<Stats>({ received: 0, qcPassed: 0, wastage: 0, dispatched: 0 });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [wastageItems, setWastageItems] = useState<WastageItem[]>([]);
  const [activity,  setActivity]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today     = new Date().toISOString().split('T')[0];
  const greetHour = new Date().getHours();
  const greeting  = greetHour < 12 ? 'Good Morning' : greetHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = profile?.name?.split(' ')[0] ?? 'Manager';

  const loadData = useCallback(async () => {
    const hubId = hub?.id ?? profile?.hub_id;
    if (!hubId) {
      setLoading(false);   // ← fix: don't leave spinner stuck forever
      setRefreshing(false);
      return;
    }
    try {
      const [rcv, qcp, wst, dsp, act, inv, wstDetail] = await Promise.all([
        supabase.from('boxes').select('*', { count: 'exact', head: true })
          .eq('hub_id', hubId).eq('status', 'received').gte('updated_at', `${today}T00:00:00`),
        supabase.from('boxes').select('*', { count: 'exact', head: true })
          .eq('hub_id', hubId).eq('status', 'qc_passed').gte('updated_at', `${today}T00:00:00`),
        supabase.from('wastage_entries').select('*', { count: 'exact', head: true })
          .eq('hub_id', hubId).eq('entry_date', today),
        supabase.from('boxes').select('*', { count: 'exact', head: true })
          .eq('hub_id', hubId).eq('status', 'dispatched').gte('updated_at', `${today}T00:00:00`),
        supabase.from('inventory_log').select('event_type,qty_delta,created_at')
          .eq('hub_id', hubId).gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false }).limit(8),
        supabase.from('inventory')
          .select('quantity, product:products(name)')
          .eq('hub_id', hubId)
          .gt('quantity', 0)
          .order('quantity', { ascending: false })
          .limit(6),
        supabase.from('wastage_entries')
          .select('item_name, quantity_kg, amount')
          .eq('hub_id', hubId).eq('entry_date', today)
          .order('quantity_kg', { ascending: false })
          .limit(5),
      ]);

      setStats({
        received:   rcv.count  ?? 0,
        qcPassed:   qcp.count  ?? 0,
        wastage:    wst.count  ?? 0,
        dispatched: dsp.count  ?? 0,
      });
      setActivity(act.data ?? []);

      // Inventory rows
      const invRows: InventoryItem[] = (inv.data ?? []).map((r: any) => ({
        product_name: r.product?.name ?? 'Unknown',
        quantity:     r.quantity ?? 0,
      }));
      setInventory(invRows);

      // Wastage items
      setWastageItems(wstDetail.data ?? []);
    } catch (e) { console.warn('loadData:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hub?.id, profile?.hub_id, today]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // Computed
  const invMax       = inventory.length > 0 ? Math.max(...inventory.map(i => i.quantity)) : 1;
  const totalWastageKg = wastageItems.reduce((s, w) => s + (w.quantity_kg ?? 0), 0);
  const totalWastageAmt = wastageItems.reduce((s, w) => s + (w.amount ?? 0), 0);
  const wstMax       = wastageItems.length > 0 ? Math.max(...wastageItems.map(w => w.quantity_kg)) : 1;

  const barColors = [Colors.primary, Colors.primaryLight, '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9'];

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <LinearGradient colors={['#1A5240', '#2D7A5F']} style={s.header}>
        <View style={s.headerTop}>
          <View style={s.logoSmall}>
            <Image source={require('../../../assets/logo.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
          </View>
          <View style={s.headerMid}>
            <Text style={s.greetText}>{greeting}, {firstName} 👋</Text>
            <View style={s.hubPill}>
              <Ionicons name="location" size={11} color={Colors.primaryLighter} />
              <Text style={s.hubPillText}>{hub?.name ?? 'Hub'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={signOut} style={s.signOutBtn}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        <View style={s.dateRow}>
          <Text style={s.dateText}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          {hub?.code && (
            <View style={s.codePill}><Text style={s.codePillText}>{hub.code}</Text></View>
          )}
        </View>
      </LinearGradient>

      <View style={s.body}>

        {/* ── Stat Cards ──────────────────────────────── */}
        <Text style={s.sectionTitle}>Today's Overview</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <>
            <View style={s.statsRow}>
              <StatCard label="Received"   value={stats.received}   icon="archive-outline"          color={Colors.primary} />
              <StatCard label="QC Passed"  value={stats.qcPassed}   icon="checkmark-circle-outline" color={Colors.success} />
            </View>
            <View style={[s.statsRow, { marginTop: 10 }]}>
              <StatCard label="Wastage"    value={stats.wastage}    icon="warning-outline"          color={Colors.danger} />
              <StatCard label="Dispatched" value={stats.dispatched} icon="cube-outline"             color={Colors.info} />
            </View>

            {/* ── Box Flow Bar ──────────────────────── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="analytics-outline" size={16} color={Colors.primary} />
                <Text style={s.cardTitle}>Box Flow Today</Text>
              </View>
              <FlowBar
                received={stats.received}
                dispatched={stats.dispatched}
                wastage={stats.wastage}
              />
            </View>

            {/* ── Inventory Chart ───────────────────── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="layers-outline" size={16} color={Colors.primary} />
                <Text style={s.cardTitle}>Inventory at Hub</Text>
                <View style={s.badgePill}>
                  <Text style={s.badgeText}>{inventory.length} products</Text>
                </View>
              </View>
              {inventory.length === 0 ? (
                <View style={s.emptyRow}>
                  <Ionicons name="cube-outline" size={28} color={Colors.border} />
                  <Text style={s.emptyText}>No stock data yet</Text>
                </View>
              ) : (
                inventory.map((item, i) => (
                  <BarRow
                    key={i}
                    label={item.product_name}
                    value={item.quantity}
                    max={invMax}
                    color={barColors[i % barColors.length]}
                    unit=" kg"
                  />
                ))
              )}
            </View>

            {/* ── Today's Wastage ───────────────────── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="warning-outline" size={16} color={Colors.orange} />
                <Text style={[s.cardTitle, { color: Colors.orange }]}>Today's Wastage</Text>
                {totalWastageKg > 0 && (
                  <View style={[s.badgePill, { backgroundColor: Colors.orangeBg }]}>
                    <Text style={[s.badgeText, { color: Colors.orange }]}>{totalWastageKg.toFixed(1)} kg</Text>
                  </View>
                )}
              </View>

              {wastageItems.length === 0 ? (
                <View style={s.emptyRow}>
                  <Ionicons name="checkmark-circle-outline" size={28} color={Colors.success} />
                  <Text style={[s.emptyText, { color: Colors.success }]}>No wastage logged today</Text>
                </View>
              ) : (
                <>
                  {wastageItems.map((item, i) => (
                    <BarRow
                      key={i}
                      label={item.item_name}
                      value={Number(item.quantity_kg.toFixed(1))}
                      max={wstMax}
                      color={i === 0 ? Colors.danger : Colors.orange}
                      unit=" kg"
                    />
                  ))}
                  {totalWastageAmt > 0 && (
                    <View style={s.lossRow}>
                      <Ionicons name="trending-down-outline" size={14} color={Colors.danger} />
                      <Text style={s.lossLabel}>Estimated Loss</Text>
                      <Text style={s.lossVal}>₹{totalWastageAmt.toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </>
        )}

        {/* ── Quick Actions ────────────────────────── */}
        <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>Quick Actions</Text>
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Scan & Receive')}>
            <LinearGradient colors={['#3D9970', '#2D7A5F']} style={s.actionGrad}>
              <Ionicons name="qr-code-outline" size={28} color="#fff" />
              <Text style={s.actionLabel}>Scan & Receive</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Wastage')}>
            <LinearGradient colors={['#EA580C', '#C2410C']} style={s.actionGrad}>
              <Ionicons name="warning-outline" size={28} color="#fff" />
              <Text style={s.actionLabel}>Log Wastage</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Recent Activity ──────────────────────── */}
        <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>Recent Activity</Text>
        {activity.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="time-outline" size={32} color={Colors.border} />
            <Text style={s.emptyText}>No activity yet today</Text>
          </View>
        ) : (
          <View style={s.activityCard}>
            {activity.map((item, i) => (
              <View key={i} style={[s.activityRow, i < activity.length - 1 && s.activityBorder]}>
                <View style={[s.activityDot, { backgroundColor: item.qty_delta > 0 ? Colors.successBg : Colors.dangerBg }]}>
                  <Ionicons
                    name={item.event_type === 'receive' ? 'archive' : item.event_type === 'wastage' ? 'warning' : 'cube'}
                    size={14}
                    color={item.qty_delta > 0 ? Colors.success : Colors.danger}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.activityType}>{item.event_type?.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={s.activityTime}>
                    {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[s.activityDelta, { color: item.qty_delta > 0 ? Colors.success : Colors.danger }]}>
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

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header:      { paddingTop: 54, paddingBottom: 28, paddingHorizontal: Spacing.base },
  headerTop:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  logoSmall:   { width: 46, height: 46, borderRadius: Radii.md, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerMid:   { flex: 1 },
  greetText:   { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
  hubPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  hubPillText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600' },
  signOutBtn:  { padding: 8 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText:    { color: 'rgba(255,255,255,0.65)', fontSize: Typography.fontSizes.sm },
  codePill:    { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 3 },
  codePillText:{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  body:        { padding: Spacing.base, paddingBottom: 48 },
  sectionTitle:{ fontSize: 11, fontWeight: Typography.fontWeights.bold, color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  statsRow:    { flexDirection: 'row', gap: 10 },

  // Card
  card:        { backgroundColor: Colors.cardBg, borderRadius: Radii.xl, padding: Spacing.base, marginTop: 12, ...Shadows.md },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  cardTitle:   { fontSize: 13, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, flex: 1 },
  badgePill:   { backgroundColor: Colors.primaryBg, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:   { fontSize: 10, fontWeight: '700', color: Colors.primary },

  // Loss row
  lossRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  lossLabel:  { flex: 1, fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  lossVal:    { fontSize: 14, fontWeight: '800', color: Colors.danger },

  // Quick Actions
  actionsRow:  { flexDirection: 'row', gap: 10 },
  actionCard:  { flex: 1, borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.md },
  actionGrad:  { padding: Spacing.base, alignItems: 'center', gap: 8 },
  actionLabel: { color: '#fff', fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },

  // Activity
  activityCard:  { backgroundColor: Colors.cardBg, borderRadius: Radii.xl, ...Shadows.md, overflow: 'hidden' },
  activityRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  activityBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  activityDot:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  activityType:  { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  activityTime:  { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  activityDelta: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.black },

  emptyCard: { backgroundColor: Colors.cardBg, borderRadius: Radii.xl, padding: 32, alignItems: 'center', gap: 8, ...Shadows.sm },
  emptyRow:  { alignItems: 'center', gap: 6, paddingVertical: 16 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.fontSizes.base },
});
