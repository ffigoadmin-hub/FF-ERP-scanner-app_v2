import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Box helpers ─────────────────────────────────────────────

export async function getBoxByCode(boxCode: string) {
  return supabase
    .from('boxes')
    .select('*, product:products(id,name,sku,unit,image_url), hub:hubs(id,name,code)')
    .eq('box_code', boxCode)
    .single();
}

export async function getBoxById(boxId: string) {
  return supabase
    .from('boxes')
    .select('*, product:products(id,name,sku,unit,image_url), hub:hubs(id,name,code)')
    .eq('id', boxId)
    .single();
}

export async function updateBoxStatus(boxId: string, status: string) {
  return supabase
    .from('boxes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', boxId)
    .select()
    .single();
}

export async function getHubBoxes(hubId: string, status?: string) {
  let q = supabase
    .from('boxes')
    .select('*, product:products(id,name,sku,unit), hub:hubs(id,name,code)')
    .eq('hub_id', hubId)
    .order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  return q;
}

// ─── Inventory log ────────────────────────────────────────────

export async function logInventoryEvent(params: {
  hubId: string; productId: string; eventType: string;
  qtyDelta: number; refId?: string; refType?: string;
  notes?: string; createdBy?: string;
}) {
  return supabase.from('inventory_log').insert({
    hub_id:     params.hubId,
    product_id: params.productId,
    event_type: params.eventType,
    qty_delta:  params.qtyDelta,
    ref_id:     params.refId     ?? null,
    ref_type:   params.refType   ?? null,
    notes:      params.notes     ?? null,
    created_by: params.createdBy ?? null,
  }).select().single();
}

export async function getHubInventoryToday(hubId: string) {
  const today = new Date().toISOString().split('T')[0];
  return supabase
    .from('inventory_log')
    .select('*')
    .eq('hub_id', hubId)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);
}

// ─── Wastage ─────────────────────────────────────────────────

export async function logWastage(params: {
  boxId: string; hubId: string; productId: string;
  reason: string; weightKg: number; photoUrl?: string; loggedBy?: string;
}) {
  return supabase.from('wastage_log').insert({
    box_id:     params.boxId,
    hub_id:     params.hubId,
    product_id: params.productId,
    reason:     params.reason,
    weight_kg:  params.weightKg,
    photo_url:  params.photoUrl  ?? null,
    logged_by:  params.loggedBy  ?? null,
  }).select().single();
}

// ─── Delivery packs ──────────────────────────────────────────

export async function getPackByCode(packCode: string) {
  return supabase
    .from('delivery_packs')
    .select('*, hub:hubs(id,name,code), items:delivery_pack_items(*, box:boxes(*, product:products(id,name,sku)))')
    .eq('pack_code', packCode)
    .single();
}

export async function getDriverPacks(driverId: string, routeDate: string) {
  return supabase
    .from('delivery_packs')
    .select('*, hub:hubs(id,name,code), items:delivery_pack_items(id,box_id,order_id)')
    .eq('driver_id', driverId)
    .eq('route_date', routeDate)
    .order('created_at', { ascending: false });
}

export async function updatePackStatus(packId: string, status: string) {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'dispatched') updates.dispatched_at = new Date().toISOString();
  if (status === 'delivered')  updates.delivered_at  = new Date().toISOString();
  return supabase.from('delivery_packs').update(updates).eq('id', packId).select().single();
}

// ─── Profile ─────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const joined = await supabase
    .from('profiles')
    .select('*, hub:hubs(id,name,code,address,lat,lng,radius_km)')
    .eq('id', userId)
    .single();

  if (!joined.error) return joined;

  console.warn('[getProfile] hub-join failed, falling back:', joined.error.message);
  const plain = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (!plain.error && plain.data?.hub_id) {
    const { data: hub } = await supabase
      .from('hubs').select('id,name,code,address,lat,lng,radius_km')
      .eq('id', plain.data.hub_id).single();
    if (hub) (plain.data as any).hub = hub;
  }

  return plain;
}
