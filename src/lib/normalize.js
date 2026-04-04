/**
 * normalize.js — Map Supabase DB rows to the shape UI components expect.
 * Components were built with mock data; these helpers bridge the gap.
 */

/** Map a creator_profiles row → CreatorCard / page-compatible shape */
export function normalizeCreator(row) {
  if (!row) return null;
  return {
    ...row,
    // CreatorCard reads `avatar`, mock data used `avatar`
    avatar: row.avatar_url || `https://i.pravatar.cc/150?u=${row.id}`,
    // CreatorCard reads `creator.followers` as an object
    followers: {
      instagram: row.instagram_followers || 0,
      tiktok: row.tiktok_followers || 0,
      youtube: row.youtube_followers || 0,
    },
    niche: row.niche || [],
    plan: row.profiles?.plan || 'free',
    isVerified: row.is_verified || false,
  };
}

/** Map a campaigns row (with brand_profiles join) → CampaignCard-compatible shape */
export function normalizeCampaign(row) {
  if (!row) return null;
  return {
    ...row,
    brand: row.brand_profiles?.name || 'Unknown Brand',
    brandLogo: row.brand_profiles?.logo_url || `https://i.pravatar.cc/40?u=${row.brand_id}`,
    brandId: row.brand_id,
    budget: {
      min: row.budget_min || 0,
      max: row.budget_max || 0,
    },
    niche: row.niche || [],
    platforms: row.platforms || [],
    applicants: row.applicant_count || 0,
  };
}

/** Map a orders row → Orders page-compatible shape */
export function normalizeOrder(row) {
  if (!row) return null;
  return {
    ...row,
    creatorName: row.creator_profiles?.name || 'Creator',
    creatorAvatar: row.creator_profiles?.avatar_url || null,
    creatorUsername: row.creator_profiles?.username || null,
    brandName: row.brand_profiles?.name || 'Brand',
    brandLogo: row.brand_profiles?.logo_url || null,
  };
}

/** Map a conversations row → Messages page-compatible shape */
export function normalizeConversation(row) {
  if (!row) return null;
  return {
    ...row,
    otherName: row.creator_profiles?.name || row.brand_profiles?.name || 'Unknown',
    otherAvatar: row.creator_profiles?.avatar_url || row.brand_profiles?.logo_url || null,
    otherUsername: row.creator_profiles?.username || row.brand_profiles?.slug || null,
    isOnline: row.creator_profiles?.is_online || false,
    lastMessage: row.last_message || '',
    lastMessageAt: row.last_message_at || row.created_at,
  };
}

/** Simple utility: format a number like 152000 → '152K' */
export function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

/** Format currency: 1500 → '$1,500' */
export function formatCurrency(n) {
  if (!n) return '$0';
  return `$${Number(n).toLocaleString()}`;
}

/** Time ago from ISO string */
export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
