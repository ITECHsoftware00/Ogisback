/**
 * storage.js — Supabase Storage helpers
 * Handles avatar, cover, logo, and content uploads.
 */
import { supabase } from '../supabaseClient';

const BUCKET_AVATARS = 'avatars';
const BUCKET_COVERS = 'covers';
const BUCKET_LOGOS = 'logos';
const BUCKET_CONTENT = 'content';

function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file to a Supabase Storage bucket.
 * Returns the public URL.
 */
async function uploadFile(bucket, path, file) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  return getPublicUrl(bucket, path);
}

/**
 * Upload creator avatar.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<string>} public URL
 */
export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;
  return uploadFile(BUCKET_AVATARS, path, file);
}

/**
 * Upload creator cover image.
 */
export async function uploadCover(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/cover.${ext}`;
  return uploadFile(BUCKET_COVERS, path, file);
}

/**
 * Upload brand logo.
 */
export async function uploadLogo(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/logo.${ext}`;
  return uploadFile(BUCKET_LOGOS, path, file);
}

/**
 * Upload content file (image or video) for a campaign/order.
 * @param {string} userId
 * @param {string} orderId
 * @param {File} file
 */
export async function uploadContent(userId, orderId, file) {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}.${ext}`;
  const path = `${userId}/${orderId}/${filename}`;
  return uploadFile(BUCKET_CONTENT, path, file);
}

/**
 * Upload a feed content file (image or video) — no orderId needed.
 * Used by the NewPost page.
 */
export async function uploadContentFile(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/feed/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return uploadFile(BUCKET_CONTENT, path, file);
}

/**
 * Delete a file from storage by its public URL.
 */
export async function deleteFileByUrl(bucket, publicUrl) {
  const url = new URL(publicUrl);
  // Path after /storage/v1/object/public/<bucket>/
  const parts = url.pathname.split(`/object/public/${bucket}/`);
  if (parts.length < 2) return;
  const filePath = parts[1];
  await supabase.storage.from(bucket).remove([filePath]);
}
