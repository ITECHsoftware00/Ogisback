import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, Image, Film, Play, Images, Hash, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';

const contentTypes = [
  { id: 'photo', icon: Image, label: 'Photo', desc: 'Single image post' },
  { id: 'carousel', icon: Images, label: 'Carousel', desc: 'Multiple images' },
  { id: 'reel', icon: Film, label: 'Reel', desc: 'Short video (< 60s)' },
  { id: 'video', icon: Play, label: 'Long Video', desc: 'YouTube-style video' },
];

export default function CreatorNewPost() {
  const navigate = useNavigate();
  const [type, setType] = useState('photo');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace('#', '');
      if (!tags.includes(t) && tags.length < 10) setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handlePost = async () => {
    if (!caption.trim()) { toast.error('Please add a caption'); return; }
    setPosting(true);
    await new Promise(r => setTimeout(r, 1500));
    setPosting(false);
    toast.success('Post uploaded successfully! OgisBack watermark applied.');
    navigate('/creator/feed');
  };

  return (
    <DashboardLayout>
      <SEO title="New Post" noindex={true} />
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">New Post</h1>
          <p className="page-subtitle">Your content gets an OgisBack watermark and appears in the public feed</p>
        </div>

        {/* Content type */}
        <div className="card p-6 mb-6">
          <h2 className="section-title">Content Type</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {contentTypes.map(ct => (
              <button
                key={ct.id}
                onClick={() => setType(ct.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${type === ct.id ? 'border-creator bg-creator/5 text-creator' : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-creator/40'}`}
              >
                <ct.icon size={22} />
                <div className="text-center">
                  <p className="text-sm font-semibold">{ct.label}</p>
                  <p className="text-[11px] opacity-70">{ct.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <div className="card p-6 mb-6">
          <h2 className="section-title">Upload Media</h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-creator bg-creator/5' : 'border-gray-200 dark:border-gray-700 hover:border-creator/50'}`}
          >
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl object-cover" />
                {/* Preview watermark */}
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-creator" />
                  <span className="text-white text-[10px] font-medium">OgisBack</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setPreview(null); }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div>
                <Upload size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">Drag & drop or click to upload</p>
                <p className="text-sm text-gray-400 mt-1">JPG, PNG, MP4, MOV up to 500MB</p>
                <p className="text-xs text-creator mt-2 font-medium">✦ OgisBack watermark will be applied automatically</p>
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        <div className="card p-6 mb-6">
          <h2 className="section-title">Caption</h2>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption for your post... (use # for hashtags)"
            rows={4}
            className="input resize-none"
            maxLength={2200}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{caption.length}/2200</p>

          {/* Tags */}
          <div className="mt-4">
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  #{t}
                  <button onClick={() => setTags(tags.filter(x => x !== t))}><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Add tags (press Enter)"
                className="input pl-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Watermark info */}
        <div className="rounded-2xl bg-gradient-creator p-4 text-white mb-6">
          <p className="font-semibold text-sm mb-1">✦ OgisBack Watermark</p>
          <p className="text-white/80 text-xs">Every post automatically gets an OgisBack watermark in the bottom-right corner. This protects your content and brands it as part of the OgisBack network.</p>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/creator/feed')} className="btn btn-outline btn-lg flex-1">Cancel</button>
          <button onClick={handlePost} disabled={posting} className="btn btn-creator btn-lg flex-1 disabled:opacity-70">
            {posting ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</span>
            ) : (
              <><Upload size={18} /> Publish Post</>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
