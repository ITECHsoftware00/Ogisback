import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image, MapPin, Hash, X, Plus, Camera, Tag,
  Clock, Upload, ChevronDown, ChevronUp,
  Volume2, VolumeX, Scissors, Sliders, Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { createContentPost } from '../../lib/db';
import { uploadContentFile } from '../../lib/storage';

/* ── helpers ── */
function detectType(fileList) {
  if (fileList.length > 1) return 'carousel';
  if (fileList[0].type.startsWith('video/')) return 'reel';
  return 'photo';
}

function highlightCaption(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(#\w+)/g, '<span style="color:#EC4899;font-weight:500">$1</span>')
    .replace(/(@\w+)/g, '<span style="color:#8B5CF6;font-weight:500">$1</span>');
}

function fmtTime(sec) {
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
  { id: 'Instagram', color: 'bg-pink-500',   active: 'bg-pink-500 text-white border-pink-500',   inactive: 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-pink-400' },
  { id: 'TikTok',    color: 'bg-gray-900',   active: 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white', inactive: 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-500' },
  { id: 'YouTube',   color: 'bg-red-500',    active: 'bg-red-500 text-white border-red-500',     inactive: 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-400' },
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

export default function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* media */
  const [files,    setFiles]    = useState([]);
  const [previews, setPreviews] = useState([]);
  const [type,     setType]     = useState('photo');
  const [dragOver, setDragOver] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('original');
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState(null);
  const fileInputRef = useRef(null);
  const addMoreRef   = useRef(null);
  const videoRef     = useRef(null);

  /* caption */
  const [caption, setCaption] = useState('');
  const captionRef = useRef(null);
  const overlayRef = useRef(null);

  /* panels open/closed */
  const [mediaOpen,    setMediaOpen]    = useState(false);
  const [tagsOpen,     setTagsOpen]     = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  /* tags */
  const [tags,     setTags]     = useState([]);
  const [tagInput, setTagInput] = useState('');

  /* location */
  const [location, setLocation] = useState('');

  /* schedule */
  const [scheduleDate, setScheduleDate] = useState('');

  /* platforms */
  const [platforms, setPlatforms] = useState(['Instagram', 'TikTok', 'YouTube']);

  /* upload */
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* draft auto-save indicator */
  const [draftSaved, setDraftSaved] = useState(false);
  const draftTimer = useRef(null);

  /* ── edit / media tools ── */
  const [editTab,       setEditTab]       = useState(null); // 'filter' | 'adjust' | 'trim'
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [adjustments,  setAdjustments]   = useState({ brightness: 100, contrast: 100, saturation: 100 });
  const [trimStart,    setTrimStart]      = useState(0);   // seconds
  const [trimEnd,      setTrimEnd]        = useState(0);   // seconds (0 = unset = full)
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted,      setIsMuted]        = useState(false);

  /* track mounted state so async callbacks don't set state after unmount */
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      previews.forEach(p => URL.revokeObjectURL(p));
    };
  }, []); // eslint-disable-line

  /* block page unload while uploading */
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!mountedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    if (uploading) window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [uploading]);

  /* auto-save draft badge flicker */
  useEffect(() => {
    if (!caption && !files.length) return;
    clearTimeout(draftTimer.current);
    setDraftSaved(false);
    draftTimer.current = setTimeout(() => setDraftSaved(true), 3000);
    return () => clearTimeout(draftTimer.current);
  }, [caption, files.length]);

  /* ── computed filter string ── */
  const filterPreset = FILTERS[selectedFilter]?.css === 'none' ? '' : (FILTERS[selectedFilter]?.css || '');
  const adjFilter    = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
  const computedFilter = [filterPreset, adjFilter].filter(Boolean).join(' ') || 'none';

  /* ── file handling ── */
  const handleFiles = useCallback((incoming) => {
    const MAX_IMAGE = 20 * 1024 * 1024;   // 20 MB — compressed before upload
    const MAX_VIDEO = 200 * 1024 * 1024;  // 200 MB

    const all = Array.from(incoming);
    const oversized = all.filter(f => {
      if (f.type.startsWith('video/')) return f.size > MAX_VIDEO;
      return f.size > MAX_IMAGE;
    });
    if (oversized.length) {
      oversized.forEach(f => {
        const limit = f.type.startsWith('video/') ? '200 MB' : '20 MB';
        toast.error(`"${f.name}" is too large (max ${limit})`, { duration: 5000 });
      });
      return;
    }

    const valid = all.filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (!valid.length) { toast.error('Please select image or video files'); return; }
    setFiles(prev => {
      const next = [...prev, ...valid];
      setPreviews(next.map(f => URL.createObjectURL(f)));
      setType(detectType(next));
      return next;
    });
    setMediaOpen(true);
    setEditTab(null);
    setSelectedFilter(0);
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
    setTrimStart(0); setTrimEnd(0);
  }, []);

  const removeFile = (i) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      setPreviews(next.map(f => URL.createObjectURL(f)));
      if (next.length) setType(detectType(next));
      else { setMediaOpen(false); setEditTab(null); }
      return next;
    });
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  /* ── caption ── */
  const handleCaptionInput = (e) => {
    const val = e.target.value;
    if (val.length > 2200) return;
    setCaption(val);
    if (overlayRef.current)
      overlayRef.current.innerHTML = highlightCaption(val) + '\u200b';
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
  };

  /* ── tags ── */
  const addTag = () => {
    const t = tagInput.replace(/^#/, '').trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!t || tags.length >= 10 || tags.includes(t)) { setTagInput(''); return; }
    setTags(p => [...p, t]);
    setTagInput('');
  };
  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && tags.length) setTags(t => t.slice(0, -1));
  };

  /* ── video thumbnail capture ── */
  const captureFrame = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setThumbnailDataUrl(c.toDataURL('image/jpeg', 0.85));
    toast.success('Thumbnail captured!');
  };

  /* ── platform toggle ── */
  const togglePlatform = (id) => {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  /* ── post ── */
  const canPost = caption.trim().length > 0 || files.length > 0;
  const progressTimer = useRef(null);

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

      // Upload files in parallel — track each one completing
      const total = files.length + (thumbnailDataUrl ? 1 : 0);
      let done = 0;
      const tick = () => {
        done++;
        const pct = Math.round((done / Math.max(total, 1)) * 70) + 15;
        if (mountedRef.current) {
          clearInterval(progressTimer.current);
          setUploadProgress(pct);
          animateProgress(pct, Math.min(pct + 10, 85));
        }
      };

      const urls = await Promise.all(
        files.map(f => uploadContentFile(user.id, f).then(url => { tick(); return url; }))
      );

      let thumbUrl = urls[0] || null;
      if (thumbnailDataUrl) {
        const blob = await (await fetch(thumbnailDataUrl)).blob();
        const thumbFile = new File([blob], 'thumb.jpg', { type: 'image/jpeg' });
        thumbUrl = await uploadContentFile(user.id, thumbFile);
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
      toast.success(asDraft ? 'Draft saved!' : 'Posted! 🎉');

      // Small delay so user sees 100% before navigating
      setTimeout(() => navigate('/creator/feed'), 400);
    } catch (err) {
      clearInterval(progressTimer.current);
      const msg = err.message || '';
      if (msg.includes('foreign key') || msg.includes('creator_id_fkey')) {
        toast.error('Complete your creator profile first.', { duration: 5000 });
        navigate('/creator/settings?setup=true');
      } else if (msg.toLowerCase().includes('exceeded') || msg.toLowerCase().includes('too large') || msg.toLowerCase().includes('size')) {
        toast.error('File is too large. Max 20 MB for images, 200 MB for videos.', { duration: 6000 });
      } else {
        toast.error(msg || 'Upload failed — please try again');
      }
      if (mountedRef.current) { setUploading(false); setUploadProgress(0); }
    }
  };

  const isVideo   = files[0]?.type.startsWith('video/');
  const arCss     = ASPECT_RATIOS.find(a => a.value === aspectRatio)?.css;
  const previewStyle = arCss
    ? { aspectRatio: arCss, maxHeight: '420px', objectFit: 'cover', width: '100%' }
    : { maxHeight: '420px', width: '100%', objectFit: 'contain' };

  const toggleEditTab = (tab) => setEditTab(prev => prev === tab ? null : tab);

  return (
    <DashboardLayout>
      <SEO title="New Post" noindex={true} />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">New Post</h1>
            <p className="text-sm text-gray-500 mt-0.5">Share content with your audience</p>
          </div>
          <button onClick={() => navigate('/creator/feed')}
            className="btn btn-outline btn-sm">
            Cancel
          </button>
        </div>

        {/* Composer card */}
        <div className="card overflow-hidden">

          {/* Author row */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-creator to-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                {user?.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (user?.user_metadata?.name?.[0] || user?.email?.[0] || 'C').toUpperCase()
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                  {user?.user_metadata?.name || 'Creator'}
                </p>
                <p className="text-xs text-gray-400">Posting to OgisBack</p>
              </div>
            </div>

            {/* Draft saved badge */}
            <AnimatePresence>
              {draftSaved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full"
                >
                  Draft saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Caption area */}
          <div className="relative px-5 pb-2">
            <div ref={overlayRef} aria-hidden="true"
              className="absolute inset-0 mx-5 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words overflow-hidden font-sans pt-0.5"
              style={{ color: 'transparent', zIndex: 1 }}
              dangerouslySetInnerHTML={{ __html: highlightCaption(caption) + '\u200b' }}
            />
            <textarea
              ref={captionRef}
              value={caption}
              onChange={handleCaptionInput}
              onScroll={() => {
                if (overlayRef.current && captionRef.current)
                  overlayRef.current.scrollTop = captionRef.current.scrollTop;
              }}
              placeholder="What's on your mind? Use #hashtags and @mentions…"
              className="relative w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none border-none focus:ring-0 leading-relaxed"
              style={{ caretColor: 'auto', zIndex: 2, minHeight: 80 }}
            />
            {caption.length > 1800 && (
              <div className="flex justify-end">
                <span className={`text-[11px] ${caption.length > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                  {caption.length} / 2200
                </span>
              </div>
            )}
          </div>

          {/* ── Inline panels ── */}

          {/* MEDIA panel */}
          <AnimatePresence>
            {mediaOpen && (
              <motion.div
                key="media-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-3">
                  {files.length === 0 ? (
                    /* Drop zone */
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        dragOver
                          ? 'border-creator bg-creator/5 scale-[1.01]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-creator/50 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-creator/10 flex items-center justify-center">
                          <Upload size={22} className="text-creator" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">Drag & drop or <span className="text-creator">browse</span></p>
                          <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF, MP4, MOV · up to 500 MB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Main preview */}
                      <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                        {isVideo ? (
                          <>
                            <video
                              ref={videoRef}
                              src={previews[0]}
                              controls
                              muted={isMuted}
                              onLoadedMetadata={e => {
                                const dur = e.target.duration;
                                setVideoDuration(dur);
                                setTrimEnd(dur);
                              }}
                              className="w-full rounded-2xl"
                              style={{ ...previewStyle, filter: computedFilter }}
                            />
                            {/* Mute toggle */}
                            <button
                              onClick={() => setIsMuted(m => !m)}
                              className="absolute top-2 left-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all"
                              title={isMuted ? 'Unmute' : 'Mute'}
                            >
                              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                            </button>
                          </>
                        ) : (
                          <img
                            src={previews[0]}
                            alt=""
                            className="rounded-2xl transition-all duration-300"
                            style={{ ...previewStyle, filter: computedFilter }}
                          />
                        )}
                        {/* OgisBack watermark */}
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                          <div className="w-3 h-3 rounded-full bg-gradient-creator flex items-center justify-center">
                            <span className="text-white text-[7px] font-bold">O</span>
                          </div>
                          <span className="text-white text-[10px] font-medium">OgisBack</span>
                        </div>
                        <button onClick={() => { previews.forEach(p => URL.revokeObjectURL(p)); setFiles([]); setPreviews([]); setThumbnailDataUrl(null); setEditTab(null); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all">
                          <X size={13} />
                        </button>
                      </div>

                      {/* ── Edit tool tabs ── */}
                      <div className="flex items-center gap-1.5 border border-gray-100 dark:border-gray-700 rounded-xl p-1 bg-gray-50 dark:bg-gray-800/50">
                        <button
                          onClick={() => toggleEditTab('filter')}
                          className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            editTab === 'filter' ? 'bg-white dark:bg-gray-700 text-creator shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          <Palette size={13} /> Filter
                        </button>
                        <button
                          onClick={() => toggleEditTab('adjust')}
                          className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            editTab === 'adjust' ? 'bg-white dark:bg-gray-700 text-creator shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          <Sliders size={13} /> Adjust
                        </button>
                        {isVideo && (
                          <button
                            onClick={() => toggleEditTab('trim')}
                            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              editTab === 'trim' ? 'bg-white dark:bg-gray-700 text-creator shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            <Scissors size={13} /> Trim
                          </button>
                        )}
                        {isVideo && (
                          <button
                            onClick={() => toggleEditTab('thumb')}
                            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              editTab === 'thumb' ? 'bg-white dark:bg-gray-700 text-creator shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            <Camera size={13} /> Cover
                          </button>
                        )}
                      </div>

                      {/* ── Filter panel ── */}
                      <AnimatePresence>
                        {editTab === 'filter' && (
                          <motion.div
                            key="filter-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide pt-1">
                              {FILTERS.map((f, i) => (
                                <button
                                  key={f.name}
                                  onClick={() => setSelectedFilter(i)}
                                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all ${selectedFilter === i ? 'opacity-100' : 'opacity-60 hover:opacity-90'}`}
                                >
                                  <div className={`w-16 h-16 rounded-xl overflow-hidden ring-2 transition-all ${selectedFilter === i ? 'ring-creator' : 'ring-transparent'}`}>
                                    {isVideo ? (
                                      <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center"
                                        style={{ filter: f.css === 'none' ? 'none' : f.css }}>
                                        <span className="text-white text-[9px] font-medium opacity-80">{f.name}</span>
                                      </div>
                                    ) : (
                                      <img src={previews[0]} alt={f.name}
                                        className="w-full h-full object-cover"
                                        style={{ filter: f.css === 'none' ? 'none' : f.css }} />
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-medium ${selectedFilter === i ? 'text-creator' : 'text-gray-500'}`}>{f.name}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Adjust panel ── */}
                      <AnimatePresence>
                        {editTab === 'adjust' && (
                          <motion.div
                            key="adjust-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-4 pt-1">
                              {[
                                { key: 'brightness', label: 'Brightness', min: 50, max: 150 },
                                { key: 'contrast',   label: 'Contrast',   min: 50, max: 150 },
                                { key: 'saturation', label: 'Saturation', min: 0,  max: 200 },
                              ].map(({ key, label, min, max }) => (
                                <div key={key}>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400 tabular-nums">{adjustments[key]}%</span>
                                      <button
                                        onClick={() => setAdjustments(a => ({ ...a, [key]: 100 }))}
                                        className="text-[10px] text-creator hover:underline"
                                      >
                                        Reset
                                      </button>
                                    </div>
                                  </div>
                                  <input
                                    type="range"
                                    min={min}
                                    max={max}
                                    value={adjustments[key]}
                                    onChange={e => setAdjustments(a => ({ ...a, [key]: Number(e.target.value) }))}
                                    className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-creator cursor-pointer"
                                  />
                                </div>
                              ))}
                              <button
                                onClick={() => setAdjustments({ brightness: 100, contrast: 100, saturation: 100 })}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                Reset all adjustments
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Trim panel (video only) ── */}
                      <AnimatePresence>
                        {editTab === 'trim' && isVideo && (
                          <motion.div
                            key="trim-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-4 pt-1">
                              <div className="flex justify-between text-xs text-gray-500 font-medium">
                                <span>Duration: {fmtTime(videoDuration)}</span>
                                <span className="text-creator font-semibold">
                                  Selected: {fmtTime(trimEnd - trimStart)}
                                </span>
                              </div>

                              {/* Trim track */}
                              <div className="relative h-10 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                                {/* Highlighted region */}
                                <div
                                  className="absolute top-0 bottom-0 bg-creator/20 border-x-2 border-creator"
                                  style={{
                                    left:  `${videoDuration ? (trimStart / videoDuration) * 100 : 0}%`,
                                    right: `${videoDuration ? ((videoDuration - trimEnd) / videoDuration) * 100 : 0}%`,
                                  }}
                                />
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-500">Start</span>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{fmtTime(trimStart)}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={videoDuration}
                                    step={0.1}
                                    value={trimStart}
                                    onChange={e => {
                                      const v = Number(e.target.value);
                                      if (v < trimEnd) {
                                        setTrimStart(v);
                                        if (videoRef.current) videoRef.current.currentTime = v;
                                      }
                                    }}
                                    className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-creator cursor-pointer"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-500">End</span>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{fmtTime(trimEnd)}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={videoDuration}
                                    step={0.1}
                                    value={trimEnd}
                                    onChange={e => {
                                      const v = Number(e.target.value);
                                      if (v > trimStart) {
                                        setTrimEnd(v);
                                        if (videoRef.current) videoRef.current.currentTime = v;
                                      }
                                    }}
                                    className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-creator cursor-pointer"
                                  />
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400">Trim points are saved as metadata. Final cut happens on export.</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Thumbnail / cover panel (video only) ── */}
                      <AnimatePresence>
                        {editTab === 'thumb' && isVideo && (
                          <motion.div
                            key="thumb-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 pt-1">
                              <p className="text-xs text-gray-500">Scrub the video to the frame you want, then capture it as your cover thumbnail.</p>
                              <div className="flex items-center gap-3">
                                <button onClick={captureFrame} className="btn btn-outline btn-sm gap-1.5 flex-1">
                                  <Camera size={13} /> Capture Current Frame
                                </button>
                                {thumbnailDataUrl && (
                                  <div className="relative flex-shrink-0">
                                    <img src={thumbnailDataUrl} alt="thumb" className="w-12 h-12 rounded-xl object-cover ring-2 ring-creator" />
                                    <button onClick={() => setThumbnailDataUrl(null)}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                                      <X size={9} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {thumbnailDataUrl && (
                                <p className="text-[10px] text-creator font-medium">✓ Custom thumbnail set</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Aspect ratio (images only) */}
                      {!isVideo && (
                        <div className="flex gap-1.5 flex-wrap">
                          {ASPECT_RATIOS.map(ar => (
                            <button key={ar.value} onClick={() => setAspectRatio(ar.value)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                                aspectRatio === ar.value
                                  ? 'bg-creator text-white border-creator'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-creator/50'
                              }`}>
                              {ar.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Carousel strip + add more */}
                      {previews.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {previews.map((p, i) => (
                            <div key={i} className="relative flex-shrink-0 group">
                              {files[i]?.type.startsWith('video/') ? (
                                <div className={`w-14 h-14 rounded-xl bg-gray-900 flex items-center justify-center ${i === 0 ? 'ring-2 ring-creator' : 'opacity-70'}`}>
                                  <video src={p} className="w-full h-full object-cover rounded-xl" preload="metadata" />
                                </div>
                              ) : (
                                <img src={p} alt="" className={`w-14 h-14 rounded-xl object-cover ${i === 0 ? 'ring-2 ring-creator' : 'opacity-70'}`} />
                              )}
                              <button onClick={() => removeFile(i)}
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
                      )}
                      {previews.length === 1 && (
                        <button onClick={() => addMoreRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-creator transition-colors">
                          <Plus size={13} /> Add more files
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAGS panel */}
          <AnimatePresence>
            {tagsOpen && (
              <motion.div
                key="tags-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                    Tags ({tags.length}/10)
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl min-h-[44px] items-center border border-gray-100 dark:border-gray-700">
                    {tags.map(t => (
                      <span key={t} className="flex items-center gap-1 bg-creator/15 text-creator text-xs font-medium px-2.5 py-1 rounded-full">
                        #{t}
                        <button onClick={() => setTags(p => p.filter(x => x !== t))} className="hover:text-red-500 transition-colors ml-0.5">
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                    {tags.length < 10 && (
                      <input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKey}
                        onBlur={addTag}
                        placeholder={tags.length === 0 ? 'Add tags… press Enter' : ''}
                        className="flex-1 min-w-[100px] bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOCATION panel */}
          <AnimatePresence>
            {locationOpen && (
              <motion.div
                key="location-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Location</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Add a location…"
                      className="input pl-9 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SCHEDULE panel */}
          <AnimatePresence>
            {scheduleOpen && (
              <motion.div
                key="schedule-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Schedule for later</label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="input text-sm"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload progress */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-3"
              >
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{uploadProgress < 100 ? 'Uploading…' : 'Finishing up…'}</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-creator to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-800 mx-0" />

          {/* ── Toolbar ── */}
          <div className="px-4 py-3 flex items-center gap-1 flex-wrap">

            {/* Icon buttons */}
            <button
              onClick={() => { setMediaOpen(o => !o); if (!mediaOpen && files.length === 0) fileInputRef.current?.click(); }}
              title="Add media"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                mediaOpen || files.length > 0
                  ? 'bg-creator/10 text-creator'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Image size={16} />
              <span className="text-xs">Media</span>
              {files.length > 0 && (
                <span className="w-4 h-4 bg-creator text-white text-[10px] rounded-full flex items-center justify-center">{files.length}</span>
              )}
            </button>

            <button
              onClick={() => setTagsOpen(o => !o)}
              title="Add tags"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                tagsOpen || tags.length > 0
                  ? 'bg-creator/10 text-creator'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Hash size={16} />
              <span className="text-xs">Tags</span>
              {tags.length > 0 && (
                <span className="w-4 h-4 bg-creator text-white text-[10px] rounded-full flex items-center justify-center">{tags.length}</span>
              )}
            </button>

            <button
              onClick={() => setLocationOpen(o => !o)}
              title="Add location"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                locationOpen || location
                  ? 'bg-creator/10 text-creator'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <MapPin size={16} />
              <span className="text-xs">Location</span>
            </button>

            <button
              onClick={() => setScheduleOpen(o => !o)}
              title="Schedule post"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                scheduleOpen || scheduleDate
                  ? 'bg-creator/10 text-creator'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Clock size={16} />
              <span className="text-xs">Schedule</span>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Platform chips */}
            <div className="flex items-center gap-1.5">
              {PLATFORM_CONFIG.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    platforms.includes(p.id) ? p.active : p.inactive
                  }`}
                >
                  {p.id === 'Instagram' ? 'IG' : p.id === 'TikTok' ? 'TT' : 'YT'}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Post actions */}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <button
              onClick={() => handlePost(true)}
              disabled={!canPost || uploading}
              className="btn btn-outline btn-sm disabled:opacity-40 text-xs"
            >
              Save Draft
            </button>

            <button
              onClick={() => handlePost(false)}
              disabled={!canPost || uploading}
              className="btn btn-creator btn-md disabled:opacity-40 gap-2 min-w-[120px]"
            >
              {uploading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
              ) : (
                <><Upload size={15} /> Post Now</>
              )}
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
        <input ref={addMoreRef} type="file" accept="image/*,video/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>
    </DashboardLayout>
  );
}
