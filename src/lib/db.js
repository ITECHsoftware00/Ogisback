/**
 * db.js — Central Supabase data access layer
 * All database queries go through here so pages stay clean.
 */
import { supabase } from '../supabaseClient';

/* ─────────────────────── CREATORS ─────────────────────── */

export async function getCreators({ niche, platform, search, gender, minAge, maxAge, limit = 20, offset = 0 } = {}) {
  let query = supabase
    .from('creator_profiles')
    .select('*, profiles!inner(plan, profile_complete)')
    .eq('profiles.profile_complete', true)
    .order('rating', { ascending: false })
    .range(offset, offset + limit - 1);

  if (niche)   query = query.contains('niche', [niche]);
  if (search)  query = query.ilike('name', `%${search}%`);
  if (gender)  query = query.eq('gender', gender);
  if (minAge)  query = query.gte('age', minAge);
  if (maxAge)  query = query.lte('age', maxAge);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAggregateStats() {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('instagram_followers, tiktok_followers, youtube_followers, audience_locations');
  if (error) return null;
  const rows = data || [];
  const totalCreators  = rows.length;
  const totalInstagram = rows.reduce((s, r) => s + (r.instagram_followers || 0), 0);
  const totalTikTok    = rows.reduce((s, r) => s + (r.tiktok_followers    || 0), 0);
  const totalYouTube   = rows.reduce((s, r) => s + (r.youtube_followers   || 0), 0);
  const countryMap = {};
  rows.forEach(r => {
    (r.audience_locations || []).forEach(loc => {
      if (!loc.country) return;
      countryMap[loc.country] = (countryMap[loc.country] || 0) + (loc.percent || 0);
    });
  });
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, score]) => ({ country, score }));
  return { totalCreators, totalInstagram, totalTikTok, totalYouTube, topCountries };
}

export async function getCreatorByUsername(username) {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*, profiles(plan)')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Creator not found');
  return data;
}

export async function updateCreatorProfile(id, updates) {
  // Use update (not upsert) — username is NOT NULL so upsert without it fails on insert.
  // The row must already exist (created by DB trigger or fetchProfile).
  const { data, error } = await supabase
    .from('creator_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCreatorProfile(id) {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ─────────────────────── BRANDS ─────────────────────── */

export async function getBrandProfile(id) {
  const { data, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBrandBySlug(slug) {
  const { data, error } = await supabase
    .from('brand_profiles')
    .select('*, profiles(plan)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Brand not found');
  return data;
}

export async function updateBrandProfile(id, updates) {
  const { data, error } = await supabase
    .from('brand_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ─────────────────────── CAMPAIGNS ─────────────────────── */

export async function getCampaigns({ niche, platform, status = 'active', limit = 20, offset = 0 } = {}) {
  let query = supabase
    .from('campaigns')
    .select('*, brand_profiles(name, logo_url, slug)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (niche) query = query.contains('niche', [niche]);
  if (platform) query = query.contains('platforms', [platform]);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCampaignById(id) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, brand_profiles(name, logo_url, slug, industry, website)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Campaign not found');
  return data;
}

export async function createCampaign(brandId, campaign) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ brand_id: brandId, ...campaign })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCampaign(id, updates) {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBrandCampaigns(brandId) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, campaign_applications(count)')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ─────────────────────── APPLICATIONS ─────────────────────── */

export async function applyToCampaign(campaignId, creatorId, pitch, proposedRate) {
  const { data, error } = await supabase
    .from('campaign_applications')
    .insert({ campaign_id: campaignId, creator_id: creatorId, pitch, proposed_rate: proposedRate })
    .select()
    .single();
  if (error) throw error;
  // Increment applicant_count
  await supabase.rpc('increment_applicant_count', { campaign_id: campaignId });
  return data;
}

export async function getCreatorApplications(creatorId) {
  const { data, error } = await supabase
    .from('campaign_applications')
    .select('*, campaigns(title, budget_min, budget_max, brand_id, brand_profiles(name, logo_url))')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCampaignApplications(campaignId) {
  const { data, error } = await supabase
    .from('campaign_applications')
    .select('*, creator_profiles(name, username, avatar_url, rating, instagram_followers, tiktok_followers)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateApplicationStatus(applicationId, status) {
  const { data, error } = await supabase
    .from('campaign_applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ─────────────────────── ORDERS ─────────────────────── */

export async function getOrders(userId, role) {
  const col = role === 'creator' ? 'creator_id' : 'brand_id';
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      creator_profiles(name, username, avatar_url),
      brand_profiles(name, logo_url, slug)
    `)
    .eq(col, userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOrderById(id) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      creator_profiles(name, username, avatar_url),
      brand_profiles(name, logo_url, slug)
    `)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOrder(order) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id, status, deliveryNote = null) {
  const updates = { status };
  if (deliveryNote) updates.delivery_note = deliveryNote;
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ─────────────────────── CONVERSATIONS & MESSAGES ─────────────────────── */

export async function getConversations(userId, role) {
  const col = role === 'creator' ? 'creator_id' : 'brand_id';
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      creator_profiles(name, username, avatar_url, is_online),
      brand_profiles(name, logo_url, slug)
    `)
    .eq(col, userId)
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOrCreateConversation(creatorId, brandId) {
  // Try to find existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('brand_id', brandId)
    .maybeSingle();

  if (existing) return existing;

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({ creator_id: creatorId, brand_id: brandId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMessages(conversationId, limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function deleteMessage(messageId) {
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) throw error;
}

export async function sendMessage(conversationId, senderId, senderRole, body) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, sender_role: senderRole, body })
    .select()
    .single();
  if (error) throw error;

  // Update conversation last_message
  await supabase
    .from('conversations')
    .update({ last_message: body, last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

export function subscribeToMessages(conversationId, callback) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, payload => callback(payload.new))
    .subscribe();
}

/* ─────────────────────── NOTIFICATIONS ─────────────────────── */

export async function getNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

export async function createNotification(userId, type, title, message, link = null) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, message, link });
  if (error) console.error('Notification error:', error);
}

/* ─────────────────────── WITHDRAWALS ─────────────────────── */

export async function createWithdrawal(creatorId, amount, method, accountDetails) {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert({ creator_id: creatorId, amount, method, account_details: accountDetails })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getWithdrawals(creatorId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ─────────────────────── CONTENT POSTS ─────────────────────── */

export async function getContentPosts({ creatorId, limit = 30, offset = 0 } = {}) {
  let query = supabase
    .from('content_posts')
    .select('*, creator_profiles(username, name, avatar_url, verified)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (creatorId) query = query.eq('creator_id', creatorId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCreatorPosts(creatorId) {
  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCreatorAnalytics(creatorId) {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select(`
      name, avatar_url,
      instagram, tiktok, youtube,
      instagram_followers, tiktok_followers, youtube_followers,
      instagram_engagement, tiktok_engagement, youtube_engagement,
      instagram_avg_likes, instagram_avg_comments,
      tiktok_avg_likes, tiktok_avg_comments,
      youtube_avg_likes, youtube_avg_comments,
      audience_locations,
      rating, review_count, completed_orders
    `)
    .eq('id', creatorId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createContentPost({ creatorId, type, mediaUrl, mediaUrls = [], thumbnailUrl, caption, tags = [], platform, location, status = 'published' }) {
  const { data, error } = await supabase
    .from('content_posts')
    .insert({
      creator_id:    creatorId,
      type,
      media_url:     mediaUrl     || null,
      media_urls:    mediaUrls,
      thumbnail_url: thumbnailUrl || null,
      caption,
      tags,
      platform,
      location:      location     || null,
      status,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContentPost(postId) {
  const { error } = await supabase
    .from('content_posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}

export async function incrementPostViews(postId) {
  await supabase.rpc('increment_post_views', { p_post_id: postId });
}

export async function incrementPostLikes(postId) {
  await supabase.rpc('increment_post_likes', { p_post_id: postId });
}

export async function togglePostLike(postId, userId) {
  const { data, error } = await supabase.rpc('toggle_post_like', {
    p_post_id: postId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data; // true = now liked, false = now unliked
}

export async function checkPostLiked(postId, userId) {
  const { data } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function getPostComments(postId) {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addPostComment(postId, userId, userRole, body, authorName, authorAvatar) {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, user_role: userRole, body, author_name: authorName, author_avatar: authorAvatar })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePostComment(commentId) {
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
  if (error) throw error;
}

/* ─────────────────────── REVIEWS ─────────────────────── */

export async function getCreatorReviews(creatorId) {
  const { data, error } = await supabase
    .from('order_reviews')
    .select('*, brand_profiles(name, logo_url)')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createReview(orderId, creatorId, brandId, rating, review) {
  const { data, error } = await supabase
    .from('order_reviews')
    .insert({ order_id: orderId, creator_id: creatorId, brand_id: brandId, rating, review })
    .select()
    .single();
  if (error) throw error;
  // Update creator avg rating
  await supabase.rpc('refresh_creator_rating', { p_creator_id: creatorId });
  return data;
}

/* ─────────────────────── CAMPAIGN MANAGEMENT ─────────────────────── */

export async function deleteCampaign(id) {
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

/* ─────────────────────── BRANDS (public listing) ─────────────────────── */

export async function getBrands({ limit = 30 } = {}) {
  const { data, error } = await supabase
    .from('brand_profiles')
    .select('id, name, logo_url, industry, slug, profiles(plan)')
    .eq('profiles.profile_complete', true)
    .order('name')
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/* ─────────────────────── CONVERSATIONS (by id) ─────────────────────── */

export async function getConversationById(id) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      creator_profiles(id, name, username, avatar_url, is_online),
      brand_profiles(id, name, logo_url, slug)
    `)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Conversation not found');
  return data;
}

/* ─────────────────────── SAVED CREATORS ─────────────────────── */

export async function getSavedCreators(brandId) {
  const { data, error } = await supabase
    .from('saved_creators')
    .select('creator_id, created_at, creator_profiles(*, profiles(plan))')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => r.creator_profiles).filter(Boolean);
}

export async function saveCreator(brandId, creatorId) {
  const { error } = await supabase
    .from('saved_creators')
    .upsert({ brand_id: brandId, creator_id: creatorId });
  if (error) throw error;
}

export async function unsaveCreator(brandId, creatorId) {
  const { error } = await supabase
    .from('saved_creators')
    .delete()
    .eq('brand_id', brandId)
    .eq('creator_id', creatorId);
  if (error) throw error;
}

/* ─────────────────────── SAVED POSTS ─────────────────────── */

export async function savePost(userId, postId) {
  const { error } = await supabase
    .from('saved_posts')
    .upsert({ user_id: userId, post_id: postId });
  if (error) throw error;
}

export async function unsavePost(userId, postId) {
  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
  if (error) throw error;
}

export async function checkPostSaved(userId, postId) {
  const { data } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();
  return !!data;
}

export async function getSavedPosts(userId) {
  const { data, error } = await supabase
    .from('saved_posts')
    .select('post_id, created_at, content_posts(*, creator_profiles(username, name, avatar_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => r.content_posts).filter(Boolean);
}

/* ─────────────────────── FORUM ─────────────────────── */

export async function getForumPosts({ category, search, sort = 'trending', limit = 30, offset = 0 } = {}) {
  let query = supabase
    .from('forum_posts')
    .select('*')
    .range(offset, offset + limit - 1);

  if (category && category !== 'all') query = query.eq('category', category);
  if (search) query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);

  if (sort === 'new') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'active') {
    query = query.order('reply_count', { ascending: false });
  } else {
    // trending: pinned first, then by likes
    query = query.order('pinned', { ascending: false }).order('likes', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createForumPost({ userId, userRole, authorName, authorAvatar, plan, title, body, category, tags }) {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      user_id: userId,
      user_role: userRole,
      author_name: authorName,
      author_avatar: authorAvatar || null,
      plan: plan || 'free',
      title,
      body,
      category,
      tags: tags || [],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteForumPost(postId) {
  const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function getForumReplies(postId) {
  const { data, error } = await supabase
    .from('forum_replies')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addForumReply({ postId, userId, userRole, authorName, authorAvatar, plan, body }) {
  const { data, error } = await supabase
    .from('forum_replies')
    .insert({
      post_id: postId,
      user_id: userId,
      user_role: userRole,
      author_name: authorName,
      author_avatar: authorAvatar || null,
      plan: plan || 'free',
      body,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteForumReply(replyId) {
  const { error } = await supabase.from('forum_replies').delete().eq('id', replyId);
  if (error) throw error;
}

export async function toggleForumPostLike(postId, userId) {
  const { data, error } = await supabase.rpc('toggle_forum_like', {
    p_post_id: postId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data; // true = now liked, false = now unliked
}

export async function checkForumPostLiked(postId, userId) {
  const { data } = await supabase
    .from('forum_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function incrementForumPostViews(postId) {
  await supabase.rpc('increment_forum_post_views', { p_post_id: postId });
}

/* ─────────────────────── FOLLOWS ─────────────────────── */

export async function followCreator(followerId, creatorId) {
  const { error } = await supabase
    .from('follows')
    .upsert({ follower_id: followerId, creator_id: creatorId });
  if (error) throw error;
}

export async function unfollowCreator(followerId, creatorId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('creator_id', creatorId);
  if (error) throw error;
}

export async function checkFollowing(followerId, creatorId) {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('creator_id', creatorId)
    .maybeSingle();
  return !!data;
}

/** Creators the given user is following */
export async function getFollowing(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('creator_id, created_at, creator_profiles(*, profiles(plan))')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => r.creator_profiles).filter(Boolean);
}

/** Users who follow the given creator */
export async function getFollowers(creatorId) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, created_at')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Count of followers for a creator */
export async function getFollowerCount(creatorId) {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId);
  if (error) throw error;
  return count || 0;
}

/**
 * Recent followers with profile info.
 * Returns an array of { follower_id, created_at, name, username, avatar_url }
 */
export async function getRecentFollowerProfiles(creatorId, limit = 8) {
  // Step 1: get recent follower_ids
  const { data: follows, error } = await supabase
    .from('follows')
    .select('follower_id, created_at')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!follows?.length) return [];

  const ids = follows.map(f => f.follower_id);

  // Step 2: batch-lookup creator_profiles (followers who are creators)
  const { data: creatorProfiles } = await supabase
    .from('creator_profiles')
    .select('id, name, username, avatar_url')
    .in('id', ids);

  // Step 3: batch-lookup brand_profiles (followers who are brands)
  const { data: brandProfiles } = await supabase
    .from('brand_profiles')
    .select('id, name, slug, logo_url')
    .in('id', ids);

  const cpMap = Object.fromEntries((creatorProfiles || []).map(p => [p.id, { ...p, role: 'creator', avatar: p.avatar_url }]));
  const bpMap = Object.fromEntries((brandProfiles   || []).map(p => [p.id, { ...p, role: 'brand',   avatar: p.logo_url, username: p.slug }]));

  return follows.map(f => {
    const profile = cpMap[f.follower_id] || bpMap[f.follower_id] || null;
    return {
      follower_id: f.follower_id,
      created_at:  f.created_at,
      name:        profile?.name     || 'OgisBack User',
      username:    profile?.username || null,
      avatar:      profile?.avatar   || null,
      role:        profile?.role     || 'creator',
    };
  });
}
