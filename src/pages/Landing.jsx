import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO, { websiteSchema, orgSchema } from '../components/SEO';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Play, Star, Shield, Zap, TrendingUp, Users,
  DollarSign, Camera, Globe, CheckCircle, ChevronRight, MapPin
} from 'lucide-react';
import { getAggregateStats } from '../lib/db';

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
import Navbar from '../components/layout/Navbar';
import { creators, contentFeed, formatNumber } from '../data';

const features = [
  { icon: Camera, title: 'Post Your Content', desc: 'Upload videos, reels, photos & carousels. Every post gets the OgisBack watermark automatically.', color: 'creator' },
  { icon: Globe, title: 'Get Discovered', desc: 'Brands browse your content and reach out directly. No cold pitching needed — just great content.', color: 'primary' },
  { icon: Shield, title: 'Secure Payments', desc: 'Every deal goes through escrow. Money is locked in until you deliver. 100% protected.', color: 'brand' },
  { icon: DollarSign, title: 'Earn 80%', desc: 'OgisBack takes just 20%. You keep 80% of every deal, paid directly to your wallet.', color: 'wallet' },
];

// stats is now computed dynamically inside the component

const howItWorks = [
  { step: '01', title: 'Creator posts content', desc: 'Upload your best content to OgisBack. Every post is watermarked and visible to thousands of brands.', role: 'creator' },
  { step: '02', title: 'Brand discovers & hires', desc: 'Brands browse the feed, find creators they love, and initiate a deal with payment upfront into escrow.', role: 'brand' },
  { step: '03', title: 'Creator delivers', desc: 'You create and deliver the agreed content. OgisBack facilitates communication and revisions.', role: 'creator' },
  { step: '04', title: 'Get paid instantly', desc: 'Brand approves the delivery. 80% goes directly to your OgisBack wallet. Withdraw anytime.', role: 'wallet' },
];

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [platformStats, setPlatformStats] = useState(null);
  useEffect(() => {
    getAggregateStats().then(setPlatformStats).catch(() => {});
  }, []);

  const displayStats = [
    { num: platformStats ? `${platformStats.totalCreators.toLocaleString()}+` : '6,000+', label: 'Active Creators', icon: Users },
    { num: platformStats ? formatNumber(platformStats.totalInstagram + platformStats.totalTikTok + platformStats.totalYouTube) : '50M+', label: 'Total Followers Reached', icon: TrendingUp },
    { num: '1,200+', label: 'Live Campaigns', icon: Zap },
    { num: '98%',    label: 'Satisfaction Rate', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <SEO
        url="/"
        structuredData={[websiteSchema, orgSchema]}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4">
        {/* Background gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 via-creator/10 to-wallet/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6"
            >
              <Zap size={14} /> Where Creators Meet Brands
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-gray-900 dark:text-white mb-6 leading-[1.05] text-balance"
            >
              The marketplace where<br />
              <span className="gradient-text">creators get paid</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto text-balance"
            >
              Post your content. Get discovered by top brands. Collaborate and earn — all through one secure platform.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <Link to="/signup" className="btn bg-gradient-creator text-white btn-xl shadow-glow-creator hover:opacity-90">
                <InstagramIcon size={20} /> Join as Creator
              </Link>
              <Link to="/signup" className="btn btn-outline btn-xl border-2">
                Post a Campaign <ArrowRight size={18} />
              </Link>
              <Link to="/explore" className="btn btn-ghost btn-md">
                <Play size={16} /> Browse content
              </Link>
            </motion.div>
          </div>

          {/* Content preview grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto"
          >
            {contentFeed.slice(0, 6).map((post, i) => (
              <div key={post.id} className="relative rounded-2xl overflow-hidden aspect-[3/4] group cursor-pointer" style={{ transform: i % 2 === 0 ? 'translateY(-8px)' : 'translateY(8px)' }}>
                <img src={post.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-[10px] font-medium truncate">@{post.creator.toLowerCase().replace(' ', '')}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-white/80 text-[9px]">❤ {formatNumber(post.likes)}</span>
                  </div>
                </div>
                {/* Watermark */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-creator" />
                  <span className="text-white text-[8px]">OgisBack</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Location-Based Advertising ── */}
      <section className="relative py-24 px-4 overflow-hidden bg-white dark:bg-[#111118]">
        {/* Mild blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-10 right-[10%] w-80 h-80 rounded-full bg-creator/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-brand/5 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <MapPin size={14} /> Location-Based Advertising
              </div>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-gray-900 dark:text-white leading-[1.05] mb-6 text-balance">
                Reach the right audience,<br />
                <span className="bg-gradient-to-r from-brand to-creator bg-clip-text text-transparent">in the right place</span>
              </h2>
              <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-balance">
                Connect with creators whose audiences are exactly where your brand needs to be.
                Every creator on OgisBack maps their audience by country — so you target smarter.
              </p>
            </div>
          </FadeIn>

          {/* Platform follower totals */}
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
              {[
                { label: 'Instagram', dot: 'bg-pink-500',  followers: platformStats?.totalInstagram },
                { label: 'TikTok',    dot: 'bg-gray-800 dark:bg-white', followers: platformStats?.totalTikTok },
                { label: 'YouTube',   dot: 'bg-red-500',   followers: platformStats?.totalYouTube },
              ].map(p => (
                <div key={p.label} className="card p-5 text-center">
                  <div className={`w-3 h-3 rounded-full ${p.dot} mx-auto mb-2`} />
                  <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                    {p.followers != null ? formatNumber(p.followers) : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.label} followers</p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Top audience countries */}
          {platformStats?.topCountries?.length > 0 && (
            <FadeIn delay={0.2}>
              <div className="flex flex-wrap justify-center gap-3">
                {platformStats.topCountries.map((loc, i) => (
                  <motion.div
                    key={loc.country}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-[#111118]/80 backdrop-blur-sm shadow-sm"
                  >
                    <MapPin size={11} className="text-brand flex-shrink-0" />
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{loc.country}</span>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-t border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111118]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {displayStats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div className="text-center">
                <p className="text-4xl font-heading font-extrabold text-gray-900 dark:text-white mb-1">{s.num}</p>
                <p className="text-gray-500 text-sm">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">Everything you need to grow</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">A complete platform built for creators and brands to connect, collaborate, and succeed together.</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div className="card p-6 h-full hover:shadow-card-hover transition-shadow">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${f.color === 'creator' ? 'bg-gradient-creator' : f.color === 'primary' ? 'bg-gradient-to-br from-primary to-primary-600' : f.color === 'brand' ? 'bg-gradient-brand' : 'bg-gradient-gold'}`}>
                    <f.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white dark:bg-[#111118]">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">How it works</h2>
              <p className="text-gray-500 text-lg">From post to payment in 4 simple steps</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.1}>
                <div className="relative">
                  <div className="card p-6 h-full">
                    <span className={`text-5xl font-heading font-extrabold mb-4 block ${step.role === 'creator' ? 'text-creator/20' : step.role === 'brand' ? 'text-brand/20' : 'text-wallet/20'}`}>{step.step}</span>
                    <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                  {i < 3 && <ChevronRight size={20} className="absolute -right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-700 hidden lg:block" />}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Top Creators */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">Top Creators</h2>
                <p className="text-gray-500 mt-1">Browse our most popular creators across niches</p>
              </div>
              <Link to="/explore" className="btn btn-outline btn-sm">See all <ArrowRight size={14} /></Link>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {creators.slice(0, 3).map((creator, i) => (
              <FadeIn key={creator.id} delay={i * 0.1}>
                <Link to={`/creator/${creator.username}`} className="card overflow-hidden group hover:shadow-card-hover transition-all">
                  <div className="relative h-32 overflow-hidden">
                    <img src={creator.cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <div className="p-4 flex items-center gap-3 -mt-6 relative">
                    <img src={creator.avatar} alt={creator.name} className="w-14 h-14 rounded-2xl border-2 border-white dark:border-gray-900 object-cover shadow-md" />
                    <div>
                      <p className="font-heading font-bold text-gray-900 dark:text-white">{creator.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-4">{creator.niche[0]} · {formatNumber(creator.totalFollowers)} followers</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <Star size={13} fill="#F59E0B" className="text-wallet" />
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{creator.rating}</span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Payment section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#0A0A0F] to-[#1E1E2E] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 bg-wallet/20 text-wallet px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Shield size={14} /> Secure Escrow Payments
            </div>
            <h2 className="text-4xl font-heading font-bold mb-4">Get paid securely, every time</h2>
            <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
              Every deal uses our escrow system. Brand pays upfront. You deliver. You get paid.
              No chasing invoices, no disputes, no late payments.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              {[
                { icon: DollarSign, title: 'Brand pays escrow', desc: 'Full campaign amount locked securely before you start any work' },
                { icon: Camera, title: 'You deliver content', desc: 'Create and submit your deliverables with full confidence' },
                { icon: Zap, title: '80% to your wallet', desc: 'Approve triggers instant release to your OgisBack wallet' },
              ].map(item => (
                <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-wallet/20 flex items-center justify-center mx-auto mb-3">
                    <item.icon size={22} className="text-wallet" />
                  </div>
                  <h3 className="font-heading font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <p className="text-white/60 text-sm">Withdraw to:</p>
              {['Bank Transfer', 'PayPal', 'Payoneer', 'Flutterwave', 'Paystack', 'Wise'].map(w => (
                <span key={w} className="bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full">{w}</span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center card p-12">
            <h2 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">Ready to start?</h2>
            <p className="text-gray-500 text-lg mb-8">Join thousands of creators and brands already on OgisBack.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/signup" className="btn bg-gradient-creator text-white btn-xl shadow-glow-creator hover:opacity-90">
                <InstagramIcon size={20} /> Start as Creator
              </Link>
              <Link to="/signup" className="btn btn-outline btn-xl">Post a Campaign</Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-creator flex items-center justify-center">
              <span className="text-white font-bold text-xs">O</span>
            </div>
            <span className="font-heading font-bold text-gray-900 dark:text-white">OgisBack</span>
          </div>
          <p className="text-gray-400 text-sm">© 2025 OgisBack. Where Creators Meet Brands.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
