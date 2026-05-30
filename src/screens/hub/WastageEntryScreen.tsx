// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import HubSelector from '@/components/HubSelector';
import ProductPicker from '@/components/ProductPicker';
import { Colors, Typography, Radii, Shadows, Spacing } from '@/theme';

interface SelectedHub { id: string; name: string; code: string; }
interface WastageEntry { id: string; item_name: string; quantity_kg: number; created_at: string; }

export default function WastageEntryScreen() {
  const { profile, user, hub: authHub } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [selectedHub, setSelectedHub] = useState<SelectedHub | null>(
    authHub ? { id: authHub.id, name: authHub.name, code: authHub.code } : null
  );
  const [itemName, setItemName]                   = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantityKg, setQuantityKg]               = useState('');
  const [amount, setAmount]                       = useState('');
  const [reason, setReason]                       = useState('');
  const [photo1, setPhoto1]                       = useState<string | null>(null);
  const [photo2, setPhoto2]                       = useState<string | null>(null);
  const [notes, setNotes]                         = useState('');
  const [submitting, setSubmitting]               = useState(false);
  const [submitted, setSubmitted]                 = useState(false);
  const [submittedEntry, setSubmittedEntry]       = useState<any>(null);
  const [submitError, setSubmitError]             = useState<string | null>(null);
  const [todayEntries, setTodayEntries]           = useState<WastageEntry[]>([]);
  const [entriesLoading, setEntriesLoading]       = useState(false);
  const [refreshing, setRefreshing]               = useState(false);
  const [showEODBanner, setShowEODBanner]         = useState(false);

  useEffect(() => { loadTodayEntries(); checkEODBanner(); }, [selectedHub?.id]);

  const loadTodayEntries = useCallback(async () => {
    const hubId = selectedHub?.id ?? profile?.hub_id;
    if (!hubId) return;
    setEntriesLoading(true);
    try {
      const { data } = await supabase
        .from('wastage_entries').select('id,item_name,quantity_kg,created_at')
        .eq('hub_id', hubId).eq('entry_date', today).order('created_at', { ascending: false });
      setTodayEntries(data ?? []);
    } catch (e) { console.warn('loadTodayEntries:', e); }
    setEntriesLoading(false);
  }, [selectedHub?.id, profile?.hub_id, today]);

  const checkEODBanner = async () => {
    const hubId = selectedHub?.id ?? profile?.hub_id;
    const now = new Date();
    const pastEOD = now.getHours() > 19 || (now.getHours() === 19 && now.getMinutes() >= 30);
    if (!pastEOD || !hubId) return;
    const { count } = await supabase
      .from('wastage_entries').select('*', { count: 'exact', head: true })
      .eq('hub_id', hubId).eq('entry_date', today);
    setShowEODBanner((count ?? 0) === 0);
  };

  const takePhoto = async (num: 1 | 2) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75, allowsEditing: false, exif: false });
    if (!result.canceled && result.assets?.[0]) {
      if (num === 1) setPhoto1(result.assets[0].uri);
      else setPhoto2(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string, path: string): Promise<string | null> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from('wastage-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    const { data: { publicUrl } } = supabase.storage.from('wastage-photos').getPublicUrl(path);
    return publicUrl;
  };

  const qty = parseFloat(quantityKg);
  const canSubmit = !!selectedHub && itemName.trim().length > 0 && quantityKg.length > 0 && qty > 0 && !!photo1 && !!photo2 && !submitting;

  const handleSubmit = async () => {
    const submitterId = profile?.id ?? user?.id;
    if (!submitterId) { Alert.alert('Not logged in', 'Please sign in first.'); return; }
    if (!canSubmit) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const uuid = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const hubId = selectedHub!.id;
      const photo1Url = await uploadPhoto(photo1!, `${hubId}/${today}/${uuid}_1.jpg`);
      const photo2Url = await uploadPhoto(photo2!, `${hubId}/${today}/${uuid}_2.jpg`);
      const { data, error } = await supabase.from('wastage_entries').insert({
        hub_id: hubId, hub_name: selectedHub!.name,
        item_name: itemName.trim(), quantity_kg: qty,
        amount: amount ? parseFloat(amount) : null,
        reason: reason.trim() || null,
        photo_1_url: photo1Url, photo_2_url: photo2Url,
        entry_date: today, submitted_by: submitterId,
        notes: notes.trim() || null,
      }).select().single();
      if (error) throw error;
      setSubmittedEntry(data); setSubmitted(true); setShowEODBanner(false);
      await loadTodayEntries();
    } catch (e: any) {
      const msg = e?.message ?? 'Unknown error';
      setSubmitError(msg); Alert.alert('Submit Failed', msg);
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setItemName(''); setSelectedProductId(null); setQuantityKg(''); setAmount('');
    setReason(''); setPhoto1(null); setPhoto2(null); setNotes('');
    setSubmitted(false); setSubmittedEntry(null);
  };

  if (submitted && submittedEntry) {
    return (
      <LinearGradient colors={['#1A5240', '#2D7A5F', '#3D9970']} style={styles.successScreen}>
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={80} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Entry Submitted!</Text>
        <View style={styles.successCard}>
          <Text style={styles.successItem}>{submittedEntry.item_name}</Text>
          <Text style={styles.successQty}>{submittedEntry.quantity_kg} kg</Text>
          {submittedEntry.amount ? <Text style={styles.successAmt}>Est. Loss: ₹{submittedEntry.amount}</Text> : null}
          <Text style={styles.successHub}>📍 {selectedHub?.name}</Text>
        </View>
        <TouchableOpacity style={styles.addAnotherBtn} onPress={resetForm}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addAnotherText}>Add Another Entry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <ScrollView
      style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadTodayEntries(); setRefreshing(false); }} tintColor={Colors.orange} colors={[Colors.orange]} />}
    >
      {/* Header */}
      <LinearGradient colors={['#9A3412', '#EA580C']} style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="warning" size={22} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>EOD Wastage Entry</Text>
          <Text style={styles.headerSub}>{todayFormatted}</Text>
        </View>
      </LinearGradient>

      {showEODBanner && (
        <View style={styles.eodBanner}>
          <Ionicons name="alert-circle" size={18} color="#fff" />
          <Text style={styles.eodBannerText}>EOD Wastage not submitted yet!</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Hub</Text>
        <HubSelector selectedHubId={selectedHub?.id ?? null} onSelect={(h: any) => setSelectedHub({ id: h.id, name: h.name, code: h.code })} />

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Item Name <Text style={styles.req}>*</Text></Text>
        <ProductPicker hubId={selectedHub?.id ?? null} selectedId={selectedProductId} selectedName={itemName}
          onSelect={(item: any, customName?: string) => {
            if (item) { setItemName(item.name); setSelectedProductId(item.id); }
            else { setItemName(customName ?? ''); setSelectedProductId(null); }
          }} />

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Quantity <Text style={styles.req}>*</Text></Text>
        <View style={styles.unitRow}>
          <TextInput style={styles.unitInput} placeholder="0.0" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" value={quantityKg} onChangeText={setQuantityKg} />
          <View style={styles.unitBadge}><Text style={styles.unitText}>kg</Text></View>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Amount <Text style={styles.opt}>₹ optional</Text></Text>
        <View style={styles.unitRow}>
          <View style={[styles.unitBadge, styles.unitBadgeLeft]}><Text style={styles.unitText}>₹</Text></View>
          <TextInput style={[styles.unitInput, { borderLeftWidth: 0 }]} placeholder="0" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Reason <Text style={styles.opt}>optional</Text></Text>
        <TextInput style={styles.textArea} placeholder="Reason for wastage…" placeholderTextColor={Colors.textMuted} multiline numberOfLines={2} value={reason} onChangeText={setReason} textAlignVertical="top" />

        {/* Photos */}
        {[1, 2].map(num => {
          const photo = num === 1 ? photo1 : photo2;
          return (
            <View key={num}>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                Photo {num} <Text style={styles.req}>*</Text>
                {photo ? <Text style={styles.captured}> ✓ Captured</Text> : null}
              </Text>
              {photo ? (
                <View style={styles.photoWrap}>
                  <Image source={{ uri: photo }} style={styles.photoThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.retakeBtn} onPress={() => takePhoto(num as 1 | 2)}>
                    <Ionicons name="camera" size={13} color="#fff" />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.cameraBtn} onPress={() => takePhoto(num as 1 | 2)}>
                  <Ionicons name="camera-outline" size={28} color={Colors.orange} />
                  <Text style={styles.cameraBtnText}>Take Photo {num}</Text>
                  <Text style={styles.cameraSub}>Required</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Notes <Text style={styles.opt}>optional</Text></Text>
        <TextInput style={styles.textArea} placeholder="Additional notes…" placeholderTextColor={Colors.textMuted} multiline numberOfLines={2} value={notes} onChangeText={setNotes} textAlignVertical="top" />
      </View>

      {submitError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#fff" />
          <Text style={styles.errorText}>{submitError}</Text>
          <TouchableOpacity onPress={() => setSubmitError(null)}><Ionicons name="close" size={14} color="#fff" /></TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.submitBtn, !canSubmit && styles.submitOff]} onPress={handleSubmit} disabled={!canSubmit} activeOpacity={0.85}>
        <LinearGradient colors={canSubmit ? ['#F97316', '#EA580C', '#C2410C'] : ['#D1D5DB', '#9CA3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGrad}>
          {submitting ? <ActivityIndicator color="#fff" /> : <>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.submitText}>Submit Wastage Entry</Text>
          </>}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>Today's Entries</Text>
      {entriesLoading ? <ActivityIndicator color={Colors.orange} style={{ marginVertical: 16 }} /> :
        todayEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={36} color={Colors.border} />
            <Text style={styles.emptyText}>No entries today</Text>
          </View>
        ) : todayEntries.map(e => (
          <View key={e.id} style={styles.entryRow}>
            <View style={styles.entryDot}><Ionicons name="trash-outline" size={15} color={Colors.orange} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryName}>{e.item_name}</Text>
              <Text style={styles.entryTime}>{new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <Text style={styles.entryQty}>{e.quantity_kg} kg</Text>
          </View>
        ))
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 24, paddingHorizontal: Spacing.base },
  headerIcon: { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.black },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: Typography.fontSizes.xs, marginTop: 2 },
  eodBanner: { backgroundColor: Colors.danger, margin: Spacing.base, marginBottom: 0, borderRadius: Radii.lg, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  eodBannerText: { color: '#fff', fontWeight: Typography.fontWeights.bold, fontSize: 13, flex: 1 },
  formCard: { backgroundColor: Colors.cardBg, margin: Spacing.base, borderRadius: Radii.xl, padding: Spacing.base, ...Shadows.md },
  fieldLabel: { fontSize: 13, fontWeight: Typography.fontWeights.bold, color: Colors.textSecondary, marginBottom: 7 },
  req: { color: Colors.danger }, opt: { fontSize: 11, fontWeight: '400', color: Colors.textMuted },
  captured: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  unitRow: { flexDirection: 'row', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md, overflow: 'hidden', backgroundColor: Colors.surface },
  unitInput: { flex: 1, padding: 13, fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  unitBadge: { backgroundColor: Colors.orangeBg, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1.5, borderLeftColor: Colors.border },
  unitBadgeLeft: { borderLeftWidth: 0, borderRightWidth: 1.5, borderRightColor: Colors.border },
  unitText: { fontSize: 15, fontWeight: '700', color: Colors.orange },
  textArea: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md, padding: 12, fontSize: 14, color: Colors.textPrimary, minHeight: 72, backgroundColor: Colors.surface },
  cameraBtn: { borderWidth: 2, borderColor: '#FED7AA', borderStyle: 'dashed', borderRadius: Radii.lg, paddingVertical: 22, alignItems: 'center', gap: 6, backgroundColor: Colors.orangeBg },
  cameraBtnText: { fontSize: 15, fontWeight: '700', color: Colors.orange },
  cameraSub: { fontSize: 11, color: '#FB923C' },
  photoWrap: { position: 'relative' },
  photoThumb: { width: '100%', height: 180, borderRadius: Radii.md, backgroundColor: Colors.border },
  retakeBtn: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 5 },
  retakeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  errorBanner: { backgroundColor: Colors.danger, marginHorizontal: Spacing.base, borderRadius: Radii.md, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  errorText: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  submitBtn: { marginHorizontal: Spacing.base, marginBottom: Spacing.xl, borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.md },
  submitOff: { opacity: 0.5 },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  emptyCard: { backgroundColor: Colors.cardBg, marginHorizontal: Spacing.base, borderRadius: Radii.xl, padding: 32, alignItems: 'center', gap: 6, ...Shadows.sm },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  entryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, marginHorizontal: Spacing.base, borderRadius: Radii.lg, padding: 13, marginBottom: 8, gap: 12, ...Shadows.sm },
  entryDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.orangeBg, justifyContent: 'center', alignItems: 'center' },
  entryName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  entryTime: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  entryQty: { fontSize: 15, fontWeight: '800', color: Colors.orange },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  successIconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
  successCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radii.xl, padding: 22, width: '100%', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  successItem: { fontSize: 18, fontWeight: '700', color: '#fff' },
  successQty: { fontSize: 32, fontWeight: '900', color: '#fff' },
  successAmt: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  successHub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  addAnotherBtn: { backgroundColor: '#fff', borderRadius: Radii.lg, paddingVertical: 14, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addAnotherText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
});
