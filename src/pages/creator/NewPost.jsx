import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Image, Film, Play, Images, ChevronRight, ChevronLeft,
  X, Plus, MapPin, Hash, Check, Camera, RotateCcw,
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

const ASPECT_RATIOS = [
  { label: 'Original', value: 'original', css: null },
  { label: '1:1',      value: '1:1',      css: '1 / 1' },
  { label: '4:5',      value: '4:5',      css: '4 / 5' },
  { label: '9:16',     value: '9:16',     css: '9 / 16' },
];

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Original'];

const TYPE_OPTIONS = [
  { value: 'photo',    label: 'Photo',      icon: Image,  desc: 'Single image' },
  { value: 'carousel', label: 'Carousel',   icon: Images, desc: 'Multiple images' },
  { value: 'reel',     label: 'Reel',       icon: Film,   desc: 'Short video' },
  { value: 'video',    label: 'Long Video', icon: Play,   desc: 'YouTube-style' },
];

const STEPS = ['Select Media', 'Edit Details', 'Share'];

export default function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step,    setStep]    = useState(1);
  const [stepDir, setStepDir] = useState(1);

  /* media */
  const [files,    setFiles]    = useState([]);
  const [previews, setPreviews] = useState([]);
  const [type,     setType]     = useState('photo');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const addMoreRef   = useRef(null);

  /* step 2 */
  const [aspectRatio,      setAspectRatio]      = useState('original');
  const [caption,          setCaption]          = useState('');
  const [tags,             setTags]             = useState([]);
  const [tagInput,         setTagInput]         = useState('');
  const [platform,         setPlatform]         = useState('');
  const [location,         setLocation]         = useState('');
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState(null);
  const captionRef = useRef(null);
  const overlayRef = useRef(null);
  const videoRef   = useRef(null);

  /* step 3 */
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* cleanup object URLs on unmount */
  useEffect(() => {
    return () => previews.forEach(p => URL.revokeObjectURL(p));
  }, []); // eslint-disable-line

  /* ── file handling ── */
  const handleFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (!valid.length) { toast.error('Please select image or video files'); return; }
    setFiles(prev => {
      const next = [...prev, ...valid];
      setPreviews(next.map(f => URL.createObjectURL(f)));
      setType(detectType(next));
      return next;
    });
  }, []);

  const removeFile = (i) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      setPreviews(next.map(f => URL.createObjectURL(f)));
      if (next.length) setType(detectType(next));
      return next;
    });
  };

  const resetMedia = () => {
    previews.forEach(p => URL.revokeObjectURL(p));
    setFiles([]); setPreviews([]); setThumbnailDataUrl(null);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  /* ── caption overlay sync ── */
  const handleCaptionInput = (e) => {
    const val = e.target.value;
    if (val.length > 2200) return;
    setCaption(val);
    if (overlayRef.current)
      overlayRef.current.innerHTML = highlightCaption(val) + '\u200b';
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
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
    if (e.key === 'Backspace' && !tagInput && tags.length)
      setTags(t => t.slice(0, -1));
  };

  /* ── video thumbnail ── */
  const captureFrame = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setThumbnailDataUrl(c.toDataURL('image/jpeg', 0.85));
    toast.success('Thumbnail captured!');
  };

  /* ── navigation ── */
  const goNext = () => { setStepDir(1);  setStep(s => s + 1); };
  const goBack = () => { setStepDir(-1); setStep(s => s - 1); };

  /* ── upload & post ── */
  const handleShare = async (asDraft = false) => {
    if (uploading) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(Math.round((i / files.length) * 75));
        urls.push(await uploadContentFile(user.id, files[i]));
      }
      setUploadProgress(85);

      let thumbUrl = urls[0];
      if (thumbnailDataUrl) {
        const blob = await (await fetch(thumbnailDataUrl)).blob();
        const thumbFile = new File([blob], 'thumb.jpg', { type: 'image/jpeg' });
        thumbUrl = await uploadContentFile(user.id, thumbFile);
      }

      setUploadProgress(95);
      await createContentPost({
        creatorId:    user.id,
        type,
        mediaUrl:     urls[0],
        mediaUrls:    urls,
        thumbnailUrl: thumbUrl,
        caption,
        tags,
        platform:     platform || null,
        status:       asDraft ? 'draft' : 'published',
      });
      setUploadProgress(100);
      toast.success(asDraft ? 'Draft saved!' : 'Posted! 🎉');
      navigate('/creator/feed');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /* ── aspect ratio style ── */
  const arCss = ASPECT_RATIOS.find(a => a.value === aspectRatio)?.css;
  const previewStyle = arCss
    ? { aspectRatio: arCss, maxHeight: '55vh', objectFit: 'cover', width: '100%' }
    : { maxHeight: '55vh', width: '100%', objectFit: 'contain' };

  /* ── motion variants ── */
  const variants = {
    enter:  d => ({ x: d > 0 ?  50 : -50, opacity: 0 }),
    center:   { x: 0, opacity: 1 },
    exit:   d => ({ x: d > 0 ? -50 :  50, opacity: 0 }),
  };

  return (
    <DashboardLayout>
      <SEO title="New Post" noindex={true} />

      <div className="max-w-4xl mx-auto">
        {/* ── Header + step indicator ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">New Post</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your content gets an OgisBack watermark and appears in the public feed</p>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  i + 1 === step ? 'bg-creator text-white shadow-sm' :
                  i + 1 <  step ? 'bg-creator/20 text-creator' :
                                  'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {i + 1 < step ? <Check size={11} /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-5 h-px bg-gray-200 dark:bg-gray-700" />}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={stepDir}>

          {/* ════════════════ STEP 1: SELECT MEDIA ════════════════ */}
          {step === 1 && (
            <motion.div key="step1" custom={stepDir} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <div className="card p-6">
                {/* Type selector */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {TYPE_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => setType(t.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                        type === t.value
                          ? 'bg-creator/10 border-creator text-creator'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-creator/40'
                      }`}
                    >
                      <t.icon size={14} /> {t.label}
                    </button>
                  ))}
                </div>

                {/* Drop zone / preview */}
                {previews.length === 0 ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center min-h-[340px] rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                      dragOver
                        ? 'border-creator bg-creator/5 scale-[1.01]'
                        : 'border-gray-300 dark:border-gray-700 hover:border-creator/60 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3 text-center p-10">
                      <div className="w-16 h-16 rounded-2xl bg-creator/10 flex items-center justify-center">
                        <Upload size={28} className="text-creator" />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-gray-900 dark:text-white text-lg">Drag & drop your media</p>
                        <p className="text-sm text-gray-500 mt-1">or <span className="text-creator font-medium">browse files</span></p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-center text-xs text-gray-400">
                        {['JPG, PNG, GIF', 'MP4, MOV', 'Up to 500 MB'].map(l => (
                          <span key={l} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">{l}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Main preview */}
                    <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center" style={{ minHeight: 260 }}>
                      {files[0]?.type.startsWith('video/') ? (
                        <video src={previews[0]} controls className="max-h-72 w-full object-contain" />
                      ) : (
                        <img src={previews[0]} alt="" className="max-h-72 w-full object-contain" />
                      )}
                      {/* watermark badge */}
                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                        <div className="w-3 h-3 rounded-full bg-gradient-creator flex items-center justify-center">
                          <span className="text-white text-[7px] font-bold">O</span>
                        </div>
                        <span className="text-white text-[10px] font-medium">OgisBack</span>
                      </div>
                      <button onClick={resetMedia}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all">
                        <RotateCcw size={13} />
                      </button>
                    </div>

                    {/* Carousel strip */}
                    {previews.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {previews.map((p, i) => (
                          <div key={i} className="relative flex-shrink-0 group">
                            <img src={p} alt="" className="w-16 h-16 rounded-xl object-cover" />
                            <button onClick={() => removeFile(i)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addMoreRef.current?.click()}
                          className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-creator hover:text-creator transition-all flex-shrink-0">
                          <Plus size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
                  onChange={e => handleFiles(e.target.files)} />
                <input ref={addMoreRef} type="file" accept="image/*,video/*" multiple className="hidden"
                  onChange={e => handleFiles(e.target.files)} />
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={() => navigate('/creator/feed')} className="btn btn-outline btn-md">Cancel</button>
                <button onClick={goNext} disabled={files.length === 0}
                  className="btn btn-creator btn-lg disabled:opacity-40 gap-2">
                  Next <ChevronRight size={17} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ════════════════ STEP 2: EDIT DETAILS ════════════════ */}
          {step === 2 && (
            <motion.div key="step2" custom={stepDir} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-5 items-start">

                {/* LEFT — preview */}
                <div className="card p-4 flex flex-col gap-3 sticky top-20">
                  <div className="relative bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 280 }}>
                    {files[0]?.type.startsWith('video/') ? (
                      <video ref={videoRef} src={previews[0]} controls className="w-full rounded-xl" style={previewStyle} />
                    ) : (
                      <img src={previews[0]} alt="" className="rounded-xl transition-all duration-300" style={previewStyle} />
                    )}
                    {/* watermark */}
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                      <div className="w-3 h-3 rounded-full bg-gradient-creator flex items-center justify-center">
                        <span className="text-white text-[7px] font-bold">O</span>
                      </div>
                      <span className="text-white text-[10px] font-medium">OgisBack</span>
                    </div>
                  </div>

                  {/* Aspect ratio (images only) */}
                  {!files[0]?.type.startsWith('video/') && (
                    <div className="flex gap-1.5 flex-wrap">
                      {ASPECT_RATIOS.map(ar => (
                        <button key={ar.value} onClick={() => setAspectRatio(ar.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            aspectRatio === ar.value
                              ? 'bg-creator text-white border-creator'
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-creator/50'
                          }`}>
                          {ar.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Video thumbnail capture */}
                  {files[0]?.type.startsWith('video/') && (
                    <div className="flex items-center gap-3">
                      <button onClick={captureFrame} className="btn btn-outline btn-sm gap-1.5 flex-1">
                        <Camera size={13} /> Capture Thumbnail
                      </button>
                      {thumbnailDataUrl && (
                        <div className="relative">
                          <img src={thumbnailDataUrl} alt="thumb" className="w-10 h-10 rounded-lg object-cover ring-2 ring-creator" />
                          <button onClick={() => setThumbnailDataUrl(null)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                            <X size={8} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Carousel strip */}
                  {previews.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {previews.map((p, i) => (
                        <img key={i} src={p} alt=""
                          className={`w-12 h-12 rounded-lg object-cover flex-shrink-0 transition-all ${i === 0 ? 'ring-2 ring-creator' : 'opacity-70'}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT — editing panel */}
                <div className="card p-5 flex flex-col gap-5">

                  {/* Caption with hashtag highlight */}
                  <div className="form-group">
                    <label className="label">Caption</label>
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {/* highlight overlay */}
                      <div ref={overlayRef} aria-hidden="true"
                        className="absolute inset-0 p-3 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words overflow-hidden font-sans"
                        style={{ color: 'transparent', zIndex: 1 }}
                        dangerouslySetInnerHTML={{ __html: highlightCaption(caption) + '\u200b' }}
                      />
                      <textarea ref={captionRef} value={caption} onChange={handleCaptionInput}
                        onScroll={() => { if (overlayRef.current && captionRef.current) overlayRef.current.scrollTop = captionRef.current.scrollTop; }}
                        placeholder="Write a caption… use #hashtags and @mentions"
                        rows={4}
                        className="relative w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 px-3 py-3 resize-none outline-none border-none focus:ring-0 leading-relaxed"
                        style={{ caretColor: 'auto', zIndex: 2, minHeight: 96, maxHeight: 200 }}
                      />
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className={`text-[11px] ${caption.length > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                        {caption.length} / 2200
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="form-group">
                    <label className="label flex items-center gap-1">
                      <Hash size={12} /> Tags
                      <span className="text-gray-400 font-normal ml-1">({tags.length}/10)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl min-h-[44px] items-center">
                      {tags.map(t => (
                        <span key={t} className="flex items-center gap-1 bg-creator/15 text-creator text-xs font-medium px-2.5 py-1 rounded-full">
                          #{t}
                          <button onClick={() => setTags(p => p.filter(x => x !== t))} className="hover:text-red-500 transition-colors ml-0.5">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      {tags.length < 10 && (
                        <input value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={handleTagKey}
                          onBlur={addTag}
                          placeholder={tags.length === 0 ? 'Add tags… press Enter' : ''}
                          className="flex-1 min-w-[100px] bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
                        />
                      )}
                    </div>
                  </div>

                  {/* Platform */}
                  <div className="form-group">
                    <label className="label">Platform</label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map(p => (
                        <button key={p} onClick={() => setPlatform(platform === p ? '' : p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            platform === p
                              ? 'bg-creator text-white border-creator'
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-creator/50'
                          }`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="form-group">
                    <label className="label flex items-center gap-1">
                      <MapPin size={12} /> Location
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="Add a location…" className="input" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={goBack} className="btn btn-outline btn-md gap-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={goNext} className="btn btn-creator btn-lg gap-2">
                  Next <ChevronRight size={17} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ════════════════ STEP 3: SHARE ════════════════ */}
          {step === 3 && (
            <motion.div key="step3" custom={stepDir} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <div className="max-w-md mx-auto">
                <div className="card p-6">
                  <h2 className="font-heading font-bold text-gray-900 dark:text-white text-lg mb-5">Ready to share?</h2>

                  {/* Post preview card */}
                  <div className="flex gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black">
                      {files[0]?.type.startsWith('video/') ? (
                        thumbnailDataUrl
                          ? <img src={thumbnailDataUrl} alt="" className="w-full h-full object-cover" />
                          : <video src={previews[0]} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={previews[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-creator/15 text-creator uppercase tracking-wide">
                          {TYPE_OPTIONS.find(t => t.value === type)?.label}
                        </span>
                        {platform && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">{platform}</span>
                        )}
                        {previews.length > 1 && (
                          <span className="text-[10px] text-gray-400">{previews.length} files</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {caption || <span className="text-gray-400 italic">No caption</span>}
                      </p>
                      {tags.length > 0 && (
                        <p className="text-xs text-creator mt-1.5 truncate">{tags.map(t => `#${t}`).join(' ')}</p>
                      )}
                      {location && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Upload progress */}
                  {uploading && (
                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>{uploadProgress < 100 ? 'Uploading…' : 'Finishing up…'}</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-creator to-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ ease: 'easeOut', duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col gap-3">
                    <button onClick={() => handleShare(false)} disabled={uploading}
                      className="btn btn-creator btn-lg w-full disabled:opacity-60 text-base gap-2">
                      {uploading ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                      ) : (
                        <><Upload size={17} /> Share Now</>
                      )}
                    </button>
                    <button onClick={() => handleShare(true)} disabled={uploading}
                      className="btn btn-outline btn-lg w-full disabled:opacity-40 gap-2">
                      Save as Draft
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <button onClick={goBack} disabled={uploading}
                    className="btn btn-outline btn-md gap-2 disabled:opacity-40">
                    <ChevronLeft size={16} /> Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
