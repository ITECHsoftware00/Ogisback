import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ThumbsUp, Eye, Pin, Crown, Star,
  Search, TrendingUp, Flame, Clock, Plus, Tag, ChevronRight,
  X, Send, ArrowLeft,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Flame },
  { id: 'creator-tips', label: 'Creator Tips', icon: Star },
  { id: 'brand-collab', label: 'Brand Collab', icon: TrendingUp },
  { id: 'pricing', label: 'Pricing Help', icon: Tag },
  { id: 'announcements', label: 'Announcements', icon: Pin },
];

const INITIAL_POSTS = [
  {
    id: 1, title: 'How I went from 0 to $8,000/mo in 6 months on OgisBack',
    author: 'Sarah Chen', avatar: 'https://i.pravatar.cc/40?img=47', role: 'creator',
    plan: 'max', category: 'creator-tips', pinned: true,
    body: 'When I started, I had 30K followers and zero brand deals. Here\'s exactly what I changed — including how the AI bargain agent helped me close my first $2,000 deal...',
    fullBody: `When I started, I had 30K followers and zero brand deals. Here's exactly what I changed.\n\n**1. Profile completeness matters more than follower count.**\nI filled every field — rates, bio, platform stats, niche tags. Brands filter by profile completeness first.\n\n**2. The AI bargain agent closed my first deal.**\nI set a floor rate of $1,500 for reels. The agent negotiated a $2,000 deal with NovaSkin within 48 hours. I didn't have to lift a finger.\n\n**3. Post consistently even when you have no deals.**\nI posted 3 times a week for 2 months before my first brand reached out. Your feed is your portfolio.\n\nBy month 6, I had $8K/mo from 4 recurring brand relationships. Happy to answer any questions below.`,
    likes: 284, replies: 47, views: 3200, time: '2 days ago',
    tags: ['earnings', 'growth', 'beginner'],
    comments: [
      { id: 'c1', author: 'Priya Sharma', avatar: 'https://i.pravatar.cc/40?img=25', plan: 'mini', text: 'This is super helpful! What niche are you in?', time: '1 day ago' },
      { id: 'c2', author: 'Marcus Williams', avatar: 'https://i.pravatar.cc/40?img=52', plan: 'mini', text: 'The agent tip is gold. Setting floor rates changed everything for me too.', time: '18h ago' },
    ],
  },
  {
    id: 2, title: 'Dynamic pricing saved our Q3 campaign budget by 23%',
    author: 'NovaSkin', avatar: 'https://i.pravatar.cc/40?img=20', role: 'brand',
    plan: 'max', category: 'brand-collab', pinned: false,
    body: 'We ran 4 campaigns last quarter using the dynamic pricing engine on the Max plan. The budget optimizer flagged two creators who were priced below market — we got better ROI while paying creators fairly...',
    fullBody: `We ran 4 campaigns last quarter using the dynamic pricing engine on the Max plan.\n\nThe budget optimizer flagged two creators who were priced below market — we negotiated fairly and got better content quality as a result. The creators appreciated being paid closer to market rates.\n\n**Results:**\n- 23% budget savings vs. manual negotiation baseline\n- 4.2× average engagement rate across all deliverables\n- 2 creators became recurring partners\n\nIf you're on Max and haven't explored the pricing engine, you're leaving money on the table.`,
    likes: 156, replies: 23, views: 1800, time: '4 days ago',
    tags: ['brands', 'roi', 'pricing'],
    comments: [],
  },
  {
    id: 3, title: 'What rate should I charge for a 90-second Reel? (beauty niche, 150K followers)',
    author: 'Priya Sharma', avatar: 'https://i.pravatar.cc/40?img=25', role: 'creator',
    plan: 'mini', category: 'pricing', pinned: false,
    body: 'I\'ve been quoted everything from $300 to $1,500 for the same deliverable. Is there a standard? I know Max plan has the dynamic pricing engine but I\'m on Mini right now...',
    fullBody: `I've been quoted everything from $300 to $1,500 for the same deliverable. Is there a standard?\n\nI know Max plan has the dynamic pricing engine but I'm on Mini right now. Here's my situation:\n- 150K Instagram followers\n- 4.1% engagement rate\n- Beauty niche\n- 90-second sponsored Reel, full usage rights\n\nWhat are you all charging? I don't want to undersell myself but I also don't want to lose deals by pricing too high.`,
    likes: 98, replies: 61, views: 2400, time: '6 days ago',
    tags: ['rates', 'beauty', 'reels'],
    comments: [
      { id: 'c3', author: 'Sarah Chen', avatar: 'https://i.pravatar.cc/40?img=47', plan: 'max', text: 'With your stats, I\'d start at $800 and go up to $1,200 with usage rights. Don\'t go below $700.', time: '5 days ago' },
      { id: 'c4', author: 'Emma Rodriguez', avatar: 'https://i.pravatar.cc/40?img=45', plan: 'max', text: 'Industry benchmark for 150K beauty is $700-1,100 per reel. You\'re in a good spot.', time: '4 days ago' },
    ],
  },
  {
    id: 4, title: '🎉 OgisBack just launched Mini & Max plans — here\'s what\'s new',
    author: 'OgisBack Team', avatar: 'https://i.pravatar.cc/40?img=60', role: 'brand',
    plan: 'max', category: 'announcements', pinned: true,
    body: 'Big news: we\'ve launched our subscription plans with AI bargain agent, dynamic pricing, featured profile listings, and dedicated support. Here\'s everything you need to know...',
    fullBody: `Big news: we've launched our subscription plans!\n\n**Creator Plans:**\n- Free: 20% platform fee, 5 posts/month\n- Mini ($19/mo): 18% fee, 50 posts/month, priority support\n- Max ($30/mo): 15% fee, unlimited posts, AI bargain agent, featured listing\n\n**Brand Plans:**\n- Free: Basic discovery access\n- Mini ($49/mo): Advanced filters, unlimited campaigns\n- Max ($149/mo): Dynamic pricing engine, dedicated account manager, analytics dashboard\n\nAll paid plans include a 7-day free trial. Upgrade anytime from your Settings page.`,
    likes: 512, replies: 89, views: 8900, time: '1 week ago',
    tags: ['announcement', 'plans', 'new'],
    comments: [],
  },
  {
    id: 5, title: 'The AI bargain agent lowballed my rate — how to override it',
    author: 'Marcus Williams', avatar: 'https://i.pravatar.cc/40?img=52', role: 'creator',
    plan: 'mini', category: 'creator-tips', pinned: false,
    body: 'I love the bargain agent but last week it suggested $600 for a campaign I\'d normally charge $900 for. Here\'s how to set your floor price so it never goes below your minimum...',
    fullBody: `I love the bargain agent but last week it suggested $600 for a campaign I'd normally charge $900 for.\n\nHere's the fix: go to your Profile Edit page → Rates section. Set your rate fields. The AI bargain agent uses these as its floor — it will never negotiate below what you set.\n\nThe issue is that if your rate fields are empty or set to $0, the agent has no floor and will optimize purely for deal volume, which can mean underpricing.\n\nSet your rates, review the agent's proposals before accepting, and you're good.`,
    likes: 143, replies: 38, views: 1900, time: '1 week ago',
    tags: ['ai-agent', 'tips', 'pricing'],
    comments: [],
  },
  {
    id: 6, title: 'Featured listing actually works — proof inside',
    author: 'Emma Rodriguez', avatar: 'https://i.pravatar.cc/40?img=45', role: 'creator',
    plan: 'max', category: 'creator-tips', pinned: false,
    body: 'I upgraded to Max 3 weeks ago. Profile views: +340%. Brand inquiries: +5x. Here are the screenshots. If you\'re a serious creator, the $30/mo pays for itself in one deal...',
    fullBody: `I upgraded to Max 3 weeks ago. Here are my actual numbers:\n\n**Before (Mini plan):**\n- Profile views: ~120/week\n- Brand inquiries: 2/month\n- Deals closed: 1/month avg\n\n**After (Max plan, week 3):**\n- Profile views: ~528/week (+340%)\n- Brand inquiries: 11/month\n- Deals closed: 4/month\n\nThe featured listing puts you at the top of brand search results in your niche. The math is simple: $30/mo for one extra deal that pays $300+ is a no-brainer.\n\nIf you're serious about this as a business, upgrade.`,
    likes: 327, replies: 52, views: 4100, time: '2 weeks ago',
    tags: ['featured', 'growth', 'proof'],
    comments: [],
  },
];

const planBadge = (plan) => {
  if (plan === 'max') return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"><Crown size={9} />MAX</span>;
  if (plan === 'mini') return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-creator/10 text-creator"><Star size={9} />MINI</span>;
  return null;
};

export default function Forum() {
  const { isLoggedIn, user, plan } = useAuth();
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('trending');
  const [search, setSearch] = useState('');

  // Thread view
  const [selectedPost, setSelectedPost] = useState(null);
  const [replyText, setReplyText] = useState('');

  // New post modal
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', category: 'creator-tips', body: '', tags: '' });
  const [posting, setPosting] = useState(false);

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sort === 'trending') return b.likes - a.likes;
    if (sort === 'new') return a.id < b.id ? 1 : -1;
    return b.replies - a.replies;
  });

  const handlePost = () => {
    if (!isLoggedIn) { toast.error('Sign in to post in the forum'); return; }
    setShowNewPost(true);
  };

  const submitPost = async () => {
    if (!newPost.title.trim()) { toast.error('Title is required'); return; }
    if (!newPost.body.trim()) { toast.error('Post body is required'); return; }
    setPosting(true);
    await new Promise(r => setTimeout(r, 600));
    const tags = newPost.tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
    const created = {
      id: Date.now(),
      title: newPost.title.trim(),
      author: user?.name || 'You',
      avatar: user?.avatar || `https://i.pravatar.cc/40?u=${user?.id}`,
      role: user?.role || 'creator',
      plan: plan || 'free',
      category: newPost.category,
      pinned: false,
      body: newPost.body.trim().slice(0, 200),
      fullBody: newPost.body.trim(),
      likes: 0, replies: 0, views: 1,
      time: 'just now',
      tags,
      comments: [],
    };
    setPosts(ps => [created, ...ps]);
    setPosting(false);
    setShowNewPost(false);
    setNewPost({ title: '', category: 'creator-tips', body: '', tags: '' });
    toast.success('Post published!');
  };

  const submitReply = () => {
    if (!isLoggedIn) { toast.error('Sign in to reply'); return; }
    if (!replyText.trim()) return;
    const comment = {
      id: `c${Date.now()}`,
      author: user?.name || 'You',
      avatar: user?.avatar || `https://i.pravatar.cc/40?u=${user?.id}`,
      plan: plan || 'free',
      text: replyText.trim(),
      time: 'just now',
    };
    setPosts(ps => ps.map(p =>
      p.id === selectedPost.id
        ? { ...p, replies: p.replies + 1, comments: [...p.comments, comment] }
        : p
    ));
    setSelectedPost(prev => ({ ...prev, replies: prev.replies + 1, comments: [...prev.comments, comment] }));
    setReplyText('');
    toast.success('Reply posted');
  };

  const likePost = (postId) => {
    if (!isLoggedIn) { toast.error('Sign in to like posts'); return; }
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    if (selectedPost?.id === postId) setSelectedPost(prev => ({ ...prev, likes: prev.likes + 1 }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <SEO
        title="Community Forum — Tips, Collabs & Creator Talk"
        description="Join the OgisBack community. Share creator tips, find brand collaboration advice, discuss pricing strategies, and connect with other influencers and marketers."
        url="/forum"
      />
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-primary via-primary-600 to-creator py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-white mb-1">OgisBack Community</h1>
            <p className="text-white/70 text-sm">Tips, deals, pricing help — from creators and brands who've been there.</p>
          </div>
          <div className="flex items-center gap-3">
            {plan !== 'free' && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white`}>
                {plan === 'max' ? <Crown size={12} /> : <Star size={12} />}
                {plan.toUpperCase()} Member
              </div>
            )}
            <button onClick={handlePost} className="btn bg-white text-primary btn-md font-bold hover:bg-white/90 shadow-lg">
              <Plus size={15} /> New Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main feed */}
          <div className="flex-1 min-w-0">
            {/* Search + Sort */}
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search discussions..."
                  className="input pl-9 py-2.5"
                />
              </div>
              <div className="flex bg-white dark:bg-[#111118] rounded-xl border border-gray-100 dark:border-gray-800 p-1">
                {[{ id: 'trending', icon: Flame }, { id: 'new', icon: Clock }, { id: 'active', icon: MessageSquare }].map(s => (
                  <button key={s.id} onClick={() => setSort(s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${sort === s.id ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
                    <s.icon size={13} /> {s.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeCategory === cat.id ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/40'}`}>
                  <cat.icon size={12} /> {cat.label}
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="space-y-3">
              {filtered.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-5 hover:shadow-card-hover transition-all cursor-pointer group"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex items-start gap-4">
                    <img src={post.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {post.pinned && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                            <Pin size={9} /> Pinned
                          </span>
                        )}
                        <span className="text-xs text-gray-400 capitalize">{post.category.replace('-', ' ')}</span>
                      </div>
                      <h3 className="font-heading font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors leading-snug mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.body}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{post.author}</span>
                          {planBadge(post.plan)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 ml-auto">
                          <button
                            onClick={e => { e.stopPropagation(); likePost(post.id); }}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <ThumbsUp size={12} /> {post.likes}
                          </button>
                          <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.replies}</span>
                          <span className="flex items-center gap-1"><Eye size={12} /> {post.views}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {post.time}</span>
                        </div>
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {post.tags.map(t => (
                            <span key={t} className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-64 space-y-4 flex-shrink-0">
            {/* Premium CTA */}
            {plan === 'free' && (
              <div className="card p-5 bg-gradient-to-br from-primary/5 to-creator/5 border-primary/20">
                <Crown size={20} className="text-primary mb-3" />
                <h3 className="font-heading font-bold text-gray-900 dark:text-white mb-1 text-sm">Get a Forum Badge</h3>
                <p className="text-xs text-gray-500 mb-4">Mini & Max members get a verified badge on all their posts, boosting trust and engagement.</p>
                <Link to="/pricing" className="btn btn-primary btn-sm w-full">View Plans <ChevronRight size={13} /></Link>
              </div>
            )}

            {/* Stats */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4 text-sm">Community Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Members', val: '6,412' },
                  { label: 'Posts this week', val: String(284 + posts.length - INITIAL_POSTS.length) },
                  { label: 'Active discussions', val: '91' },
                  { label: 'Brands in forum', val: '340' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top contributors */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4 text-sm">Top Contributors</h3>
              <div className="space-y-3">
                {INITIAL_POSTS.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <img src={p.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{p.author}</p>
                    </div>
                    {planBadge(p.plan)}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3 text-sm">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: 'Pricing Plans', to: '/pricing' },
                  { label: 'Explore Creators', to: '/explore' },
                  { label: 'Post a Campaign', to: '/signup' },
                  { label: 'Creator Login', to: '/login' },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors py-1">
                    {l.label} <ChevronRight size={13} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Thread View Modal ── */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedPost(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-2xl my-8 z-10"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 flex-shrink-0"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-xs text-gray-400 capitalize">{selectedPost.category.replace('-', ' ')}</span>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Post body */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img src={selectedPost.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{selectedPost.author}</span>
                      {planBadge(selectedPost.plan)}
                    </div>
                    <span className="text-xs text-gray-400">{selectedPost.time}</span>
                  </div>
                </div>

                <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-4 leading-snug">{selectedPost.title}</h2>

                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line mb-5">
                  {selectedPost.fullBody || selectedPost.body}
                </div>

                {selectedPost.tags.length > 0 && (
                  <div className="flex gap-1.5 mb-5 flex-wrap">
                    {selectedPost.tags.map(t => (
                      <span key={t} className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">#{t}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-400 pb-5 border-b border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => likePost(selectedPost.id)}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <ThumbsUp size={14} /> {selectedPost.likes} likes
                  </button>
                  <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {selectedPost.replies} replies</span>
                  <span className="flex items-center gap-1.5"><Eye size={14} /> {selectedPost.views} views</span>
                </div>

                {/* Comments */}
                <div className="mt-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedPost.comments.length > 0 ? `${selectedPost.comments.length} Replies` : 'No replies yet'}
                  </h3>
                  {selectedPost.comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.author}</span>
                          {planBadge(c.plan)}
                          <span className="text-xs text-gray-400 ml-auto">{c.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply input */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {isLoggedIn ? (
                    <div className="flex gap-3">
                      <img
                        src={user?.avatar || `https://i.pravatar.cc/40?u=${user?.id}`}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                      />
                      <div className="flex-1 flex gap-2">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
                          placeholder="Write a reply..."
                          rows={2}
                          className="input resize-none flex-1 text-sm"
                        />
                        <button
                          onClick={submitReply}
                          disabled={!replyText.trim()}
                          className="btn btn-primary btn-sm self-end disabled:opacity-40"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-gray-400">
                      <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link> to join the discussion
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── New Post Modal ── */}
      <AnimatePresence>
        {showNewPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !posting && setShowNewPost(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-gray-900 dark:text-white">New Discussion</h2>
                <button onClick={() => setShowNewPost(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Title <span className="text-red-400">*</span></label>
                  <input
                    value={newPost.title}
                    onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                    placeholder="What's your discussion about?"
                    className="input"
                    maxLength={120}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Category</label>
                  <select
                    value={newPost.category}
                    onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                    className="input appearance-none cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Body <span className="text-red-400">*</span></label>
                  <textarea
                    value={newPost.body}
                    onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
                    placeholder="Share your experience, question, or insight..."
                    rows={6}
                    className="input resize-none"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Tags <span className="text-xs text-gray-400 font-normal">(comma-separated)</span></label>
                  <input
                    value={newPost.tags}
                    onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
                    placeholder="e.g. pricing, growth, beauty"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowNewPost(false)} className="btn btn-outline btn-md flex-1" disabled={posting}>Cancel</button>
                <button onClick={submitPost} disabled={posting} className="btn btn-primary btn-md flex-1 disabled:opacity-60">
                  {posting ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting...</span>
                  ) : (
                    <><Send size={15} /> Publish Post</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
