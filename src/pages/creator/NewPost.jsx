import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Hash, X, Plus, Camera, Image,
  Clock, Upload, Volume2, VolumeX, Scissors, Sliders,
  Palette, Play, Pause, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { createContentPost } from '../../lib/db';
import { uploadContentFile } from '../../lib/storage';

/* ─── helpers ─────────────────────────────────────────────── */
function detectType(files) {
  if (files.length > 1) return 'carousel';
  if (files[0].type.startsWith('video/')) return 'reel';
  return 'photo';
}

function highlightCaption(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(#\w+)/g, '<span style="color:#EC4899;font-weight:500">$1</span>')
    .replace(/(@\w+)/g, '<span style="color:#8B5CF6;font-weight:500">$1</span>');
}

function fmtTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const ASPECT_RATIOS = [
  { label: 'Original', value: 'original', css: null },
  { label: '1:1',      value: '1:1',      css: '1 / 1' },
  { label: '4:5',      value: '4:5',      css: '4 / 5' },
  { label: '9:16',     value: '9:16',     css: '9 / 16' },
];

const PLATFORM_CONFIG = [
  { id: 'Instagram', active: 'bg-pink-500 text-white border-pink-500', inactive: 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-pink-400' },
  { id: 'TikTok',    active: 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900', inactive: 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-500' },
  { id: 'YouTube',   active: 'bg-red-500 text-white border-red-500', inactive: 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-400' },
];

const FILTERS = [
  { name: 'Normal',   css: 'none' },
  { name: 'Vivid',    css: 'saturate(1.5) contrast(1.1)' },
  { name: 'Warm',     css: 'sepia(0.3) saturate(1.2) brightness(1.05)' },
  { name: 'Cool',     css: 'hue-rotate(20deg) saturate(0.9)' },
  { name: 'Fade',     css: 'contrast(0.85) brightness(1.1) saturate(0.8)' },
  { name: 'B&W',      css: 'grayscale(1)' },
  { name: 'Vintage',  css: 'sepia(0.5) contrast(0.85) brightness(1.1) saturate(0.8)' },
  { name: 'Dramatic', css: 'contrast(1.4) saturate(1.3) brightness(0.95)' },
];

/* ─── component ───────────────────────────────────────────── */
export default function NewPost() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  /* media */
  const [files,        setFiles]        = useState([]);
  const [previews,     setPreviews]     = useState([]);
  const [type,         setType]         = useState('photo');
  const [dragOver,     setDragOver]     = useState(false);
  const [carouselIdx,  setCarouselIdx]  = useState(0);
  const [aspectRatio,  setAspectRatio]  = useState('original');
  const [thumbDataUrl, setThumbDataUrl] = useState(null);
  const fileInputRef = useRef(null);
  const addMoreRef   = useRef(null);
  const videoRef     = useRef(null);

  /* caption */
  const [caption, setCaption] = useState('');
  const captionRef = useRef(null);
  const overlayRef = useRef(null);

  /* tags */
  const [tags,     setTags]     = useState([]);
  const [tagInput, setTagInput] = useState('');

  /* details */
  const [location,     setLocation]     = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [platforms,    setPlatforms]    = useState(['Instagram', 'TikTok', 'YouTube']);

  /* right panel tab */
  const [rightTab,    setRightTab]    = useState('caption'); // 'edit'|'caption'|'details'
  const [editSubTab,  setEditSubTab]  = useState('filter');  // 'filter'|'adjust'|'trim'|'cover'

  /* edit tools */
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [adjustments,    setAdjustments]    = useState({ brightness: 100, contrast: 100, saturation: 100 });
  const [trimStart,      setTrimStart]      = useState(0);
  const [trimEnd,        setTrimEnd]        = useState(0);
  const [videoDuration,  setVideoDuration]  = useState(0);
  const [isMuted,        setIsMuted]        = useState(false);
  const [playingTrim,    setPlayingTrim]    = useState(false);
  const trimCheckRef = useRef(null);

  /* upload */
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draftSaved,     setDraftSaved]     = useState(false);

  const mountedRef    = useRef(true);
  const progressTimer = useRef(null);
  const draftTimer    = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      previews.forEach(p => URL.revokeObjectURL(p));
      clearInterval(trimCheckRef.current);
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    if (uploading) window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploading]);

  useEffect(() => {
    if (!caption && !files.length) return;
    clearTimeout(draftTimer.current);
    setDraftSaved(false);
    draftTimer.current = setTimeout(() => setDraftSaved(true), 3000);
    return () => clearTimeout(draftTimer.current);
  }, [caption, files.length]);

  /* ─── computed filter ── */
  const filterPreset   = FILTERS[selectedFilter]?.css === 'none' ? '' : (FILTERS[selectedFilter]?.css || '');
  const adjFilter      = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
  const computedFilter = [filterPreset, adjFilter].filter(Boolean).join(' ') || 'none';

  const activeFile    = files[carouselIdx];
  const activePreview = previews[carouselIdx];
  const isVideo       = activeFile?.type.startsWith('video/');
  const arCss         = ASPECT_RATIOS.find(a => a.value === aspectRatio)?.css;

  /* ─── file handling ── */
  const handleFiles = useCallback((incoming) => {
    const MAX_IMG = 20 * 1024 * 1024;
    const MAX_VID = 200 * 1024 * 1024;
    const all = Array.from(incoming);

    const oversized = all.filter(f => f.size > (f.type.startsWith('video/') ? MAX_VID : MAX_IMG));
    if (oversized.length) {
      oversized.forEach(f => {
        toast.error(`"${f.name}" exceeds the ${f.type.startsWith('video/') ? '200 MB' : '20 MB'} limit`);
      });
      return;
    }
    const valid = all.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (!valid.length) { toast.error('Select image or video files'); return; }

    setFiles(prev => {
      const next = [...prev, ...valid];
      setPreviews(next.map(f => URL.createObjectURL(f)));
      setType(detectType(next));
      return next;
    });
    setCarouselIdx(0);
    setSelectedFilter(0);
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    setTrimStart(0); setTrimEnd(0);
    setRightTab('edit');
    setEditSubTab('filter');
  }, []);

  const removeFile = (i) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      setPreviews(next.map(f => URL.createObjectURL(f)));
      if (next.length) setType(detectType(next));
      return next;
    });
    setCarouselIdx(c => Math.min(c, Math.max(0, files.length - 2)));
  };

  const clearMedia = () => {
    previews.forEach(p => URL.revokeObjectURL(p));
    setFiles([]); setPreviews([]); setThumbDataUrl(null);
    setCarouselIdx(0);
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };

  /* ─── caption ── */
  const handleCaptionInput = (e) => {
    const val = e.target.value;
    if (val.length > 2200) return;
    setCaption(val);
    if (overlayRef.current) overlayRef.current.innerHTML = highlightCaption(val) + '\u200b';
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 260) + 'px';
  };

  /* ─── tags ── */
  const addTag = () => {
    const t = tagInput.replace(/^#/, '').trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!t || tags.length >= 10 || tags.includes(t)) { setTagInput(''); return; }
    setTags(p => [...p, t]); setTagInput('');
  };
  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && tags.length) setTags(t => t.slice(0, -1));
  };

  /* ─── capture frame ── */
  const captureFrame = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setThumbDataUrl(c.toDataURL('image/jpeg', 0.85));
    toast.success('Cover captured!');
  };

  /* ─── play trim region ── */
  const playTrim = () => {
    const v = videoRef.current;
    if (!v || !videoDuration) return;
    clearInterval(trimCheckRef.current);
    v.currentTime = trimStart;
    v.play();
    setPlayingTrim(true);
    trimCheckRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.currentTime >= trimEnd) {
        videoRef.current?.pause();
        setPlayingTrim(false);
        clearInterval(trimCheckRef.current);
      }
    }, 80);
  };

  const stopTrim = () => {
    videoRef.current?.pause();
    setPlayingTrim(false);
    clearInterval(trimCheckRef.current);
  };

  /* ─── platform ── */
  const togglePlatform = (id) =>
    setPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  /* ─── upload / post ── */
  const canPost = caption.trim().length > 0 || files.length > 0;

  const animateProgress = (from, to) => {
    clearInterval(progressTimer.current);
    let cur = from;
    progressTimer.current = setInterval(() => {
      cur = Math.min(cur + 1, to);
      if (mountedRef.current) setUploadProgress(cur);
      if (cur >= to) clearInterval(progressTimer.current);
    }, 40);
  };

  const handlePost = async (asDraft = false) => {
    if (!canPost || uploading) return;
    if (mountedRef.current) { setUploading(true); setUploadProgress(0); }

    try {
      animateProgress(0, 15);
      let done = 0;
      const total = files.length + (thumbDataUrl ? 1 : 0);
      const tick = () => {
        done++;
        const pct = Math.round((done / Math.max(total, 1)) * 70) + 15;
        if (mountedRef.current) {
          clearInterval(progressTimer.current);
          setUploadProgress(pct);
          animateProgress(pct, Math.min(pct + 8, 85));
        }
      };

      const urls = await Promise.all(
        files.map(f => uploadContentFile(user.id, f).then(url => { tick(); return url; }))
      );

      let thumbUrl = urls[0] || null;
      if (thumbDataUrl) {
        const blob = await (await fetch(thumbDataUrl)).blob();
        thumbUrl = await uploadContentFile(user.id, new File([blob], 'thumb.jpg', { type: 'image/jpeg' }));
        tick();
      }

      animateProgress(uploadProgress, 95);

      await createContentPost({
        creatorId:    user.id,
        type:         files.length === 0 ? 'text' : type,
        mediaUrl:     urls[0] || null,
        mediaUrls:    urls,
        thumbnailUrl: thumbUrl,
        caption,
        tags,
        platform:     platforms.join(',') || null,
        location:     location || null,
        status:       asDraft ? 'draft' : 'published',
      });

      clearInterval(progressTimer.current);
      if (mountedRef.current) setUploadProgress(100);
      toast.success(asDraft ? 'Draft saved!' : 'Posted!');
      setTimeout(() => navigate('/creator/feed'), 400);
    } catch (err) {
      clearInterval(progressTimer.current);
      const msg = err.message || '';
      if (msg.includes('foreign key') || msg.includes('creator_id_fkey')) {
        toast.error('Complete your creator profile first.', { duration: 5000 });
        navigate('/creator/settings?setup=true');
      } else if (msg.toLowerCase().includes('size') || msg.toLowerCase().includes('exceeded')) {
        toast.error('File too large. Max 20 MB for images, 200 MB for videos.', { duration: 6000 });
      } else {
        toast.error(msg || 'Upload failed — try again');
      }
      if (mountedRef.current) { setUploading(false); setUploadProgress(0); }
    }
  };

  /* ─── JSX ─────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <SEO title="New Post" noindex />

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/creator/feed')}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white leading-tight">New Post</h1>
            <p className="text-xs text-gray-400">Share content with your audience</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {draftSaved && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full hidden sm:block">
                Draft saved
              </motion.span>
            )}
          </AnimatePresence>
          <button onClick={() => handlePost(true)} disabled={!canPost || uploading}
            className="btn btn-outline btn-sm disabled:opacity-40">
            Save Draft
          </button>
          <button onClick={() => handlePost(false)} disabled={!canPost || uploading}
            className="btn btn-creator btn-sm gap-2 min-w-[110px] disabled:opacity-40">
            {uploading
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {uploadProgress}%</>
              : <><Upload size={14} /> Post Now</>}
          </button>
        </div>
      </div>

      {/* ── Upload progress bar ── */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-creator to-primary"
                animate={{ width: `${uploadProgress}%` }} transition={{ ease: 'easeOut', duration: 0.3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Split layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 lg:h-[calc(100vh-13rem)]">

        {/* ══ LEFT: Media panel ══════════════════════════════════ */}
        <div className="lg:w-[55%] flex flex-col gap-3">

          {files.length === 0 ? (
            /* Drop zone */
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 min-h-[320px] lg:min-h-0 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed cursor-pointer transition-all ${
                dragOver ? 'border-creator bg-creator/5 scale-[1.01]' : 'border-gray-200 dark:border-gray-700 hover:border-creator/50 hover:bg-gray-50 dark:hover:bg-gray-800/30'
              }`}>
              <div className="flex flex-col items-center gap-3 text-center p-8">
                <div className="w-16 h-16 rounded-3xl bg-creator/10 flex items-center justify-center">
                  <Upload size={28} className="text-creator" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Drag & drop or <span className="text-creator">browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, MP4, MOV · Images up to 20 MB · Videos up to 200 MB</p>
                </div>
                <div className="flex gap-2 mt-1">
                  {['Photo', 'Carousel', 'Video'].map(l => (
                    <span key={l} className="text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">{l}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Main preview */}
              <div className="relative rounded-3xl overflow-hidden bg-black flex-1 min-h-[280px] lg:min-h-0 flex items-center justify-center">
                {isVideo ? (
                  <video
                    ref={videoRef}
                    src={activePreview}
                    controls
                    muted={isMuted}
                    onLoadedMetadata={e => {
                      const dur = e.target.duration;
                      setVideoDuration(dur);
                      if (trimEnd === 0) setTrimEnd(dur);
                    }}
                    className="w-full h-full object-contain"
                    style={{ filter: computedFilter, ...(arCss ? { aspectRatio: arCss } : {}) }}
                  />
                ) : (
                  <img
                    src={activePreview}
                    alt=""
                    className="w-full h-full transition-all duration-300"
                    style={{
                      filter: computedFilter,
                      objectFit: arCss ? 'cover' : 'contain',
                      ...(arCss ? { aspectRatio: arCss } : {}),
                    }}
                  />
                )}

                {/* Overlays */}
                <button onClick={clearMedia}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all">
                  <X size={14} />
                </button>

                {isVideo && (
                  <button onClick={() => setIsMuted(m => !m)}
                    className="absolute top-3 left-3 w-8 h-8 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all">
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                )}

                {/* Carousel nav */}
                {files.length > 1 && (
                  <>
                    {carouselIdx > 0 && (
                      <button onClick={() => setCarouselIdx(i => i - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all">
                        <ChevronLeft size={16} />
                      </button>
                    )}
                    {carouselIdx < files.length - 1 && (
                      <button onClick={() => setCarouselIdx(i => i + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all">
                        <ChevronRight size={16} />
                      </button>
                    )}
                    {/* Dot indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {files.map((_, i) => (
                        <button key={i} onClick={() => setCarouselIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === carouselIdx ? 'bg-white w-4' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}

                {/* Watermark */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-creator to-primary flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">O</span>
                  </div>
                  <span className="text-white text-[10px] font-medium">OgisBack</span>
                </div>
              </div>

              {/* Carousel strip */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {previews.map((p, i) => (
                  <div key={i} className="relative flex-shrink-0 group cursor-pointer" onClick={() => setCarouselIdx(i)}>
                    {files[i]?.type.startsWith('video/') ? (
                      <div className={`w-14 h-14 rounded-xl bg-gray-900 overflow-hidden ring-2 transition-all ${i === carouselIdx ? 'ring-creator' : 'ring-transparent opacity-60'}`}>
                        <video src={p} className="w-full h-full object-cover" preload="metadata" muted />
                      </div>
                    ) : (
                      <img src={p} alt="" className={`w-14 h-14 rounded-xl object-cover ring-2 transition-all ${i === carouselIdx ? 'ring-creator' : 'ring-transparent opacity-60'}`} />
                    )}
                    <button onClick={e => { e.stopPropagation(); removeFile(i); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow">
                      <X size={9} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addMoreRef.current?.click()}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-creator hover:text-creator transition-all flex-shrink-0">
                  <Plus size={18} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ══ RIGHT: Editor panel ════════════════════════════════ */}
        <div className="lg:w-[45%] card flex flex-col overflow-hidden">

          {/* Author row */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-creator to-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
              {user?.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                : (user?.user_metadata?.name?.[0] || user?.email?.[0] || 'C').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                {user?.user_metadata?.name || 'Creator'}
              </p>
              <p className="text-xs text-gray-400">Posting to OgisBack</p>
            </div>
            {/* Platform chips */}
            <div className="flex items-center gap-1">
              {PLATFORM_CONFIG.map(p => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${platforms.includes(p.id) ? p.active : p.inactive}`}>
                  {p.id === 'Instagram' ? 'IG' : p.id === 'TikTok' ? 'TT' : 'YT'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            {[
              { id: 'edit',    label: 'Edit',    icon: Palette },
              { id: 'caption', label: 'Caption', icon: null },
              { id: 'details', label: 'Details', icon: null },
            ].map(t => (
              <button key={t.id} onClick={() => setRightTab(t.id)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                  rightTab === t.id
                    ? 'border-creator text-creator'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* ── EDIT tab ── */}
              {rightTab === 'edit' && (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                  className="p-4 space-y-4">
                  {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Image size={22} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No media yet</p>
                        <p className="text-xs text-gray-400 mt-0.5">Add a photo or video to use editing tools</p>
                      </div>
                      <button onClick={() => fileInputRef.current?.click()} className="btn btn-creator btn-sm gap-2 mt-1">
                        <Upload size={13} /> Add Media
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Edit sub-tab bar */}
                      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        {[
                          { id: 'filter', label: 'Filter',  icon: Palette },
                          { id: 'adjust', label: 'Adjust',  icon: Sliders },
                          ...(isVideo ? [
                            { id: 'trim',  label: 'Trim',   icon: Scissors },
                            { id: 'cover', label: 'Cover',  icon: Camera  },
                          ] : []),
                        ].map(t => (
                          <button key={t.id} onClick={() => setEditSubTab(t.id)}
                            className={`flex items-center gap-1 flex-1 justify-center py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                              editSubTab === t.id ? 'bg-white dark:bg-gray-700 text-creator shadow-sm' : 'text-gray-500'
                            }`}>
                            <t.icon size={11} /> {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Filter panel */}
                      {editSubTab === 'filter' && (
                        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                          {FILTERS.map((f, i) => (
                            <button key={f.name} onClick={() => setSelectedFilter(i)}
                              className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all ${selectedFilter === i ? 'opacity-100' : 'opacity-55 hover:opacity-80'}`}>
                              <div className={`w-16 h-16 rounded-xl overflow-hidden ring-2 transition-all ${selectedFilter === i ? 'ring-creator' : 'ring-transparent'}`}>
                                {isVideo ? (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center"
                                    style={{ filter: f.css === 'none' ? 'none' : f.css }}>
                                    <span className="text-white text-[9px] font-semibold opacity-80">{f.name}</span>
                                  </div>
                                ) : (
                                  <img src={previews[0]} alt={f.name} className="w-full h-full object-cover"
                                    style={{ filter: f.css === 'none' ? 'none' : f.css }} />
                                )}
                              </div>
                              <span className={`text-[10px] font-medium ${selectedFilter === i ? 'text-creator' : 'text-gray-500'}`}>{f.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Adjust panel */}
                      {editSubTab === 'adjust' && (
                        <div className="space-y-5">
                          {[
                            { key: 'brightness', label: 'Brightness', min: 50, max: 150 },
                            { key: 'contrast',   label: 'Contrast',   min: 50, max: 150 },
                            { key: 'saturation', label: 'Saturation', min: 0,  max: 200 },
                          ].map(({ key, label, min, max }) => (
                            <div key={key}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{adjustments[key]}%</span>
                                  <button onClick={() => setAdjustments(a => ({ ...a, [key]: 100 }))}
                                    className="text-[10px] text-creator hover:underline">Reset</button>
                                </div>
                              </div>
                              <input type="range" min={min} max={max} value={adjustments[key]}
                                onChange={e => setAdjustments(a => ({ ...a, [key]: Number(e.target.value) }))}
                                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-creator cursor-pointer" />
                            </div>
                          ))}
                          <button onClick={() => setAdjustments({ brightness: 100, contrast: 100, saturation: 100 })}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            Reset all
                          </button>
                        </div>
                      )}

                      {/* Trim panel */}
                      {editSubTab === 'trim' && isVideo && (
                        <div className="space-y-4">
                          {/* Stats row */}
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-500">Total: <span className="text-gray-700 dark:text-gray-300">{fmtTime(videoDuration)}</span></span>
                            <span className="text-creator font-semibold">Selected: {fmtTime(Math.max(0, trimEnd - trimStart))}</span>
                          </div>

                          {/* Visual timeline */}
                          <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer"
                            onClick={e => {
                              if (!videoDuration) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const pct = (e.clientX - rect.left) / rect.width;
                              const t = pct * videoDuration;
                              if (videoRef.current) videoRef.current.currentTime = t;
                            }}>
                            {/* Selected region */}
                            <div className="absolute top-0 bottom-0 bg-creator/25 border-x-2 border-creator rounded"
                              style={{
                                left:  `${videoDuration ? (trimStart / videoDuration) * 100 : 0}%`,
                                right: `${videoDuration ? ((videoDuration - trimEnd) / videoDuration) * 100 : 0}%`,
                              }} />
                            {/* Center label */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-[10px] text-gray-400">Click to seek</span>
                            </div>
                          </div>

                          {/* Start slider */}
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Start</span>
                              <span className="text-xs font-bold text-gray-800 dark:text-white tabular-nums">{fmtTime(trimStart)}</span>
                            </div>
                            <input type="range"
                              min={0}
                              max={Math.max(0, trimEnd - 0.5)}
                              step={0.1}
                              value={trimStart}
                              onChange={e => {
                                const v = Number(e.target.value);
                                setTrimStart(v);
                                if (videoRef.current) videoRef.current.currentTime = v;
                              }}
                              className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-creator cursor-pointer" />
                          </div>

                          {/* End slider */}
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">End</span>
                              <span className="text-xs font-bold text-gray-800 dark:text-white tabular-nums">{fmtTime(trimEnd)}</span>
                            </div>
                            <input type="range"
                              min={Math.min(videoDuration, trimStart + 0.5)}
                              max={videoDuration}
                              step={0.1}
                              value={trimEnd}
                              onChange={e => {
                                const v = Number(e.target.value);
                                setTrimEnd(v);
                                if (videoRef.current) videoRef.current.currentTime = v;
                              }}
                              className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-creator cursor-pointer" />
                          </div>

                          {/* Play trim button */}
                          <button
                            onClick={playingTrim ? stopTrim : playTrim}
                            className={`flex items-center gap-2 w-full justify-center py-2 rounded-xl text-sm font-semibold transition-all border ${
                              playingTrim
                                ? 'bg-creator/10 border-creator text-creator'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-creator hover:text-creator'
                            }`}>
                            {playingTrim ? <><Pause size={14} /> Stop Preview</> : <><Play size={14} /> Play Trim</>}
                          </button>

                          <p className="text-[10px] text-gray-400 text-center">
                            Trim points saved as metadata · {fmtTime(Math.max(0, trimEnd - trimStart))} clip
                          </p>
                        </div>
                      )}

                      {/* Cover panel */}
                      {editSubTab === 'cover' && isVideo && (
                        <div className="space-y-3">
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Scrub the video to any frame, then capture it as your cover thumbnail.
                          </p>
                          <button onClick={captureFrame} className="btn btn-outline btn-sm gap-2 w-full">
                            <Camera size={13} /> Capture Current Frame
                          </button>
                          {thumbDataUrl && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                              <div className="relative flex-shrink-0">
                                <img src={thumbDataUrl} alt="cover" className="w-14 h-14 rounded-xl object-cover ring-2 ring-creator" />
                                <button onClick={() => setThumbDataUrl(null)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                                  <X size={9} />
                                </button>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-creator">Cover set</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">This frame will be shown as thumbnail</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Aspect ratio (images only) */}
                      {!isVideo && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Aspect Ratio</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {ASPECT_RATIOS.map(ar => (
                              <button key={ar.value} onClick={() => setAspectRatio(ar.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                  aspectRatio === ar.value ? 'bg-creator text-white border-creator' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-creator/50'
                                }`}>
                                {ar.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* ── CAPTION tab ── */}
              {rightTab === 'caption' && (
                <motion.div key="caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                  className="p-4 space-y-4">

                  {/* Caption textarea */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Caption</label>
                    <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                      <div ref={overlayRef} aria-hidden="true"
                        className="absolute inset-3 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words overflow-hidden font-sans"
                        style={{ color: 'transparent', zIndex: 1 }}
                        dangerouslySetInnerHTML={{ __html: highlightCaption(caption) + '\u200b' }} />
                      <textarea ref={captionRef} value={caption} onChange={handleCaptionInput}
                        onScroll={() => { if (overlayRef.current && captionRef.current) overlayRef.current.scrollTop = captionRef.current.scrollTop; }}
                        placeholder="What's on your mind? Use #hashtags and @mentions…"
                        className="relative w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none border-none focus:ring-0 leading-relaxed"
                        style={{ caretColor: 'auto', zIndex: 2, minHeight: 100 }} />
                    </div>
                    {caption.length > 1800 && (
                      <p className={`text-[11px] mt-1 text-right ${caption.length > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                        {caption.length} / 2200
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                      Tags <span className="font-normal normal-case">({tags.length}/10)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl min-h-[44px] items-center border border-gray-200 dark:border-gray-700">
                      {tags.map(t => (
                        <span key={t} className="flex items-center gap-1 bg-creator/15 text-creator text-xs font-medium px-2.5 py-1 rounded-full">
                          #{t}
                          <button onClick={() => setTags(p => p.filter(x => x !== t))} className="hover:text-red-500 transition-colors ml-0.5">
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                      {tags.length < 10 && (
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                          onKeyDown={handleTagKey} onBlur={addTag}
                          placeholder={tags.length === 0 ? '#hashtag, Enter to add' : ''}
                          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Add media shortcut */}
                  {files.length === 0 && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 w-full py-2.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:border-creator hover:text-creator transition-all text-sm font-medium justify-center">
                      <Upload size={15} /> Add photo or video
                    </button>
                  )}
                </motion.div>
              )}

              {/* ── DETAILS tab ── */}
              {rightTab === 'details' && (
                <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                  className="p-4 space-y-5">

                  {/* Location */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Location</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={location} onChange={e => setLocation(e.target.value)}
                        placeholder="Add a location…" className="input pl-9 text-sm" />
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Clock size={12} /> Schedule
                    </label>
                    <input type="datetime-local" value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="input text-sm" min={new Date().toISOString().slice(0, 16)} />
                    {scheduleDate && (
                      <p className="text-xs text-creator mt-1.5 font-medium">
                        Scheduled for {new Date(scheduleDate).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Platforms */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">Share to Platforms</label>
                    <div className="space-y-2">
                      {PLATFORM_CONFIG.map(p => (
                        <button key={p.id} onClick={() => togglePlatform(p.id)}
                          className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl border-2 transition-all ${
                            platforms.includes(p.id)
                              ? p.active + ' border-2'
                              : 'border-gray-200 dark:border-gray-700 text-gray-500'
                          }`}>
                          <span className="text-sm font-semibold">{p.id}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            platforms.includes(p.id) ? 'bg-white/30 border-white/60' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {platforms.includes(p.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Post type indicator */}
                  {files.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-creator/5 border border-creator/20 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-creator" />
                      <span className="text-xs text-creator font-semibold capitalize">{type} post</span>
                      <span className="text-xs text-gray-400">· {files.length} file{files.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Bottom action bar */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-creator transition-colors">
              <Upload size={14} /> {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Add media'}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePost(true)} disabled={!canPost || uploading}
                className="btn btn-outline btn-sm text-xs disabled:opacity-40">
                Draft
              </button>
              <button onClick={() => handlePost(false)} disabled={!canPost || uploading}
                className="btn btn-creator btn-sm gap-1.5 disabled:opacity-40">
                {uploading
                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                  : <><Upload size={13} /> Post</>}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      <input ref={addMoreRef}   type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </DashboardLayout>
  );
}
