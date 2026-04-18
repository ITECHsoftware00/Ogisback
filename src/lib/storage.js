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
async function uploadFile(bucket, path, file, contentType) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: contentType ?? file.type });
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
 * Compress an image File to JPEG at max 1920px, 85% quality.
 * Videos and GIFs are returned as-is. Always resolves — never hangs.
 */
export async function compressImage(file, maxPx = 1920, quality = 0.85) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  return new Promise((resolve) => {
    // Fallback: if canvas/img operations stall for any reason, use original
    const giveUp = setTimeout(() => resolve(file), 10_000);

    const done = (result) => { clearTimeout(giveUp); resolve(result); };

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          if (!blob) { done(file); return; }
          done(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      } catch {
        done(file);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); done(file); };
    img.src = url;
  });
}

/**
 * Upload a feed content file (image or video) — no orderId needed.
 * Used by the NewPost page.
 */
export async function uploadContentFile(userId, file) {
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop();
  const path = `${userId}/feed/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return uploadFile(BUCKET_CONTENT, path, compressed, compressed.type);
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
