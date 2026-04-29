export function normalizeCreator(row) {
  if (!row) return null;
  const ig = row.instagram_followers || 0;
  const tt = row.tiktok_followers || 0;
  const yt = row.youtube_followers || 0;
  return {
    ...row,
    avatar: row.avatar_url || `https://i.pravatar.cc/150?u=${row.id}`,
    cover: row.cover_url || '',
    followers: { instagram: ig, tiktok: tt, youtube: yt },
    totalFollowers: ig + tt + yt,
    engagementRate: row.instagram_engagement || row.tiktok_engagement || row.youtube_engagement || 0,
    reviewCount: row.review_count || 0,
    verified: row.is_verified || false,
    isVerified: row.is_verified || false,
    isOnline: row.is_online || false,
    niche: row.niche || [],
    plan: row.profiles?.plan || 'free',
    rates: {
      post: row.rate_post || 0,
      reel: row.rate_reel || 0,
      story: row.rate_story || 0,
      video: row.rate_video || 0,
    },
  };
}

export function normalizePost(row) {
  if (!row) return null;
  return {
    ...row,
    thumbnail: row.thumbnail_url || row.media_url || `https://picsum.photos/seed/${row.id}/400/400`,
    creator: row.creator_profiles?.name || 'Creator',
    username: row.creator_profiles?.username || 'creator',
    avatar: row.creator_profiles?.avatar_url || `https://i.pravatar.cc/40?u=${row.creator_id}`,
    postedDate: row.created_at,
    likes:    row.likes    || row.like_count    || 0,
    comments: row.comments || row.comment_count || 0,
    views:    row.views    || row.view_count    || 0,
    saves:    row.saves    || row.save_count    || 0,
  };
}

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

export function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function formatCurrency(n) {
  if (!n) return '$0';
  return `$${Number(n).toLocaleString()}`;
}

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
