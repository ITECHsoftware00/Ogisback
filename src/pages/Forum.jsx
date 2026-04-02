import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import {
  MessageSquare, ThumbsUp, Eye, Pin, Crown, Star,
  Search, TrendingUp, Flame, Clock, Plus, Tag, ChevronRight
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

const POSTS = [
  {
    id: 1, title: 'How I went from 0 to $8,000/mo in 6 months on OgisBack',
    author: 'Sarah Chen', avatar: 'https://i.pravatar.cc/40?img=47', role: 'creator',
    plan: 'max', category: 'creator-tips', pinned: true,
    body: 'When I started, I had 30K followers and zero brand deals. Here\'s exactly what I changed — including how the AI bargain agent helped me close my first $2,000 deal...',
    likes: 284, replies: 47, views: 3200, time: '2 days ago',
    tags: ['earnings', 'growth', 'beginner'],
  },
  {
    id: 2, title: 'Dynamic pricing saved our Q3 campaign budget by 23%',
    author: 'NovaSkin', avatar: 'https://i.pravatar.cc/40?img=20', role: 'brand',
    plan: 'max', category: 'brand-collab', pinned: false,
    body: 'We ran 4 campaigns last quarter using the dynamic pricing engine on the Max plan. The budget optimizer flagged two creators who were priced below market — we got better ROI while paying creators fairly...',
    likes: 156, replies: 23, views: 1800, time: '4 days ago',
    tags: ['brands', 'roi', 'pricing'],
  },
  {
    id: 3, title: 'What rate should I charge for a 90-second Reel? (beauty niche, 150K followers)',
    author: 'Priya Sharma', avatar: 'https://i.pravatar.cc/40?img=25', role: 'creator',
    plan: 'mini', category: 'pricing', pinned: false,
    body: 'I\'ve been quoted everything from $300 to $1,500 for the same deliverable. Is there a standard? I know Max plan has the dynamic pricing engine but I\'m on Mini right now...',
    likes: 98, replies: 61, views: 2400, time: '6 days ago',
    tags: ['rates', 'beauty', 'reels'],
  },
  {
    id: 4, title: '🎉 OgisBack just launched Mini & Max plans — here\'s what\'s new',
    author: 'OgisBack Team', avatar: 'https://i.pravatar.cc/40?img=60', role: 'brand',
    plan: 'max', category: 'announcements', pinned: true,
    body: 'Big news: we\'ve launched our subscription plans with AI bargain agent, dynamic pricing, featured profile listings, and dedicated support. Here\'s everything you need to know...',
    likes: 512, replies: 89, views: 8900, time: '1 week ago',
    tags: ['announcement', 'plans', 'new'],
  },
  {
    id: 5, title: 'The AI bargain agent lowballed my rate — how to override it',
    author: 'Marcus Williams', avatar: 'https://i.pravatar.cc/40?img=52', role: 'creator',
    plan: 'mini', category: 'creator-tips', pinned: false,
    body: 'I love the bargain agent but last week it suggested $600 for a campaign I\'d normally charge $900 for. Here\'s how to set your floor price so it never goes below your minimum...',
    likes: 143, replies: 38, views: 1900, time: '1 week ago',
    tags: ['ai-agent', 'tips', 'pricing'],
  },
  {
    id: 6, title: 'Featured listing actually works — proof inside',
    author: 'Emma Rodriguez', avatar: 'https://i.pravatar.cc/40?img=45', role: 'creator',
    plan: 'max', category: 'creator-tips', pinned: false,
    body: 'I upgraded to Max 3 weeks ago. Profile views: +340%. Brand inquiries: +5x. Here are the screenshots. If you\'re a serious creator, the $30/mo pays for itself in one deal...',
    likes: 327, replies: 52, views: 4100, time: '2 weeks ago',
    tags: ['featured', 'growth', 'proof'],
  },
];

const planBadge = (plan) => {
  if (plan === 'max') return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"><Crown size={9} />MAX</span>;
  if (plan === 'mini') return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-creator/10 text-creator"><Star size={9} />MINI</span>;
  return null;
};

export default function Forum() {
  const { isLoggedIn, user, plan } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('trending');
  const [search, setSearch] = useState('');

  const filtered = POSTS.filter(p => {
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
    toast.success('New post editor coming soon!');
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
                  onClick={() => toast.success('Full thread view coming soon!')}
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
                          <span className="flex items-center gap-1"><ThumbsUp size={12} /> {post.likes}</span>
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
                  { label: 'Posts this week', val: '284' },
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
                {POSTS.slice(0, 4).map(p => (
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
    </div>
  );
}
