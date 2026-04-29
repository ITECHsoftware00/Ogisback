import { supabase } from '../supabaseClient';

export async function getAdminStats() {
  const [
    { count: totalCreators },
    { count: totalBrands },
    { count: totalOrders },
    { count: activeOrders },
    { count: pendingWithdrawals },
    { data: revenueData },
    { data: escrowData },
  ] = await Promise.all([
    supabase.from('creator_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('brand_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['active', 'in_review', 'delivered']),
    supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('escrow').select('platform_fee').eq('status', 'released'),
    supabase.from('escrow').select('amount').eq('status', 'held'),
  ]);

  const totalRevenue = (revenueData || []).reduce((s, r) => s + (r.platform_fee || 0), 0);
  const escrowHeld = (escrowData || []).reduce((s, r) => s + (r.amount || 0), 0);

  return {
    totalCreators: totalCreators || 0,
    totalBrands: totalBrands || 0,
    totalOrders: totalOrders || 0,
    activeOrders: activeOrders || 0,
    pendingWithdrawals: pendingWithdrawals || 0,
    totalRevenue,
    escrowHeld,
  };
}

export async function getRevenueChart() {
  const { data, error } = await supabase
    .from('escrow')
    .select('platform_fee, created_at')
    .eq('status', 'released')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const monthly = {};
  (data || []).forEach(r => {
    const key = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthly[key] = (monthly[key] || 0) + (r.platform_fee || 0);
  });
  return Object.entries(monthly).map(([month, revenue]) => ({ month, revenue }));
}

export async function getAdminUsers({ role, search, limit = 30, offset = 0 } = {}) {
  // Creators
  if (!role || role === 'creator') {
    let q = supabase
      .from('creator_profiles')
      .select('*, profiles(plan, profile_complete, created_at)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (search) q = q.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    if (role === 'creator') return (data || []).map(r => ({ ...r, role: 'creator' }));
  }

  if (!role || role === 'brand') {
    let q = supabase
      .from('brand_profiles')
      .select('*, profiles(plan, profile_complete, created_at)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (search) q = q.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    if (role === 'brand') return (data || []).map(r => ({ ...r, role: 'brand' }));
  }

  // Both
  const [{ data: creators }, { data: brands }] = await Promise.all([
    supabase.from('creator_profiles').select('*, profiles(plan, profile_complete, created_at)').order('created_at', { ascending: false }).limit(limit),
    supabase.from('brand_profiles').select('*, profiles(plan, profile_complete, created_at)').order('created_at', { ascending: false }).limit(limit),
  ]);
  return [
    ...(creators || []).map(r => ({ ...r, role: 'creator' })),
    ...(brands || []).map(r => ({ ...r, role: 'brand' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
}

export async function verifyCreator(creatorId, verified) {
  const { error } = await supabase
    .from('creator_profiles')
    .update({ verified })
    .eq('id', creatorId);
  if (error) throw error;
}

export async function banUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ profile_complete: false, plan: 'free' })
    .eq('id', userId);
  if (error) throw error;
}

export async function getAdminOrders({ status, search, limit = 30, offset = 0 } = {}) {
  let q = supabase
    .from('orders')
    .select('*, creator_profiles(id, name, username, avatar_url), brand_profiles(id, name, logo_url)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status && status !== 'all') q = q.eq('status', status);
  if (search) q = q.ilike('title', `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getAdminEscrow({ status, limit = 30 } = {}) {
  let q = supabase
    .from('escrow')
    .select('*, orders(title, status), brand_profiles(name, logo_url), creator_profiles(name, username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getAdminWithdrawals({ status, limit = 30, offset = 0 } = {}) {
  let q = supabase
    .from('withdrawals')
    .select('*, creator_profiles(id, name, username, avatar_url, wallet_balance)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function approveWithdrawal(withdrawalId) {
  const { error } = await supabase
    .from('withdrawals')
    .update({ status: 'completed' })
    .eq('id', withdrawalId);
  if (error) throw error;
}

export async function rejectWithdrawal(withdrawalId) {
  // Get withdrawal info first to refund balance
  const { data: wd, error: wdErr } = await supabase
    .from('withdrawals')
    .select('creator_id, amount')
    .eq('id', withdrawalId)
    .single();
  if (wdErr) throw wdErr;

  // Mark as failed
  const { error } = await supabase
    .from('withdrawals')
    .update({ status: 'failed' })
    .eq('id', withdrawalId);
  if (error) throw error;

  // Refund balance
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('wallet_balance')
    .eq('id', wd.creator_id)
    .single();
  if (profile) {
    await supabase
      .from('creator_profiles')
      .update({ wallet_balance: (profile.wallet_balance || 0) + wd.amount })
      .eq('id', wd.creator_id);
  }
}

export async function getAdminCampaigns({ status, limit = 30 } = {}) {
  let q = supabase
    .from('campaigns')
    .select('*, brand_profiles(name, logo_url)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function updateCampaignStatus(id, status) {
  const { error } = await supabase.from('campaigns').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function getAdminSubscriptions({ limit = 30 } = {}) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, profiles(role, id)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
