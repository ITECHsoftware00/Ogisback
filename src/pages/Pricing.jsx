import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import {
  Check, Zap, Crown, Shield, MessageCircle, Bot, TrendingUp,
  Star, Users, Headphones, ChevronDown, ArrowRight, Sparkles
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CREATOR_PLANS = [
  {
    id: 'free', name: 'Free', price: { monthly: 0, annual: 0 },
    badge: null, color: 'gray',
    tagline: 'Get started for free',
    fee: '20%',
    features: [
      { text: '5 posts per month', included: true },
      { text: 'Standard profile listing', included: true },
      { text: 'Community forum access', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Priority profile listing', included: false },
      { text: 'AI bargain agent', included: false },
      { text: 'Dynamic pricing engine', included: false },
      { text: 'Live support chat', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'mini', name: 'Mini', price: { monthly: 9.99, annual: 7.99 },
    badge: 'Popular', color: 'creator',
    tagline: 'For growing creators',
    fee: '18%',
    features: [
      { text: '50 posts per month', included: true },
      { text: 'Priority profile listing', included: true },
      { text: 'Community forum + badge', included: true },
      { text: 'Full analytics dashboard', included: true },
      { text: 'AI bargain agent (5/mo)', included: true },
      { text: 'Dynamic pricing suggestions', included: true },
      { text: 'Live support chat', included: true },
      { text: 'Dedicated account manager', included: false },
      { text: 'Featured #1 profile slot', included: false },
    ],
  },
  {
    id: 'max', name: 'Max', price: { monthly: 29.99, annual: 23.99 },
    badge: 'Best Value', color: 'primary',
    tagline: 'For professional creators',
    fee: '15%',
    features: [
      { text: 'Unlimited posts', included: true },
      { text: 'Featured #1 profile slot', included: true },
      { text: 'Forum + verified creator badge', included: true },
      { text: 'Advanced analytics + exports', included: true },
      { text: 'Unlimited AI bargain agent', included: true },
      { text: 'Dynamic pricing engine', included: true },
      { text: 'Live support chat', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Early access to new features', included: true },
    ],
  },
];

const BRAND_PLANS = [
  {
    id: 'free', name: 'Free', price: { monthly: 0, annual: 0 },
    badge: null, color: 'gray',
    tagline: 'Try before you commit',
    fee: '20%',
    features: [
      { text: '2 active campaigns', included: true },
      { text: 'Standard creator discovery', included: true },
      { text: 'Community forum access', included: true },
      { text: 'Basic campaign analytics', included: true },
      { text: 'Priority creator matching', included: false },
      { text: 'AI negotiation agent', included: false },
      { text: 'Dynamic budget optimizer', included: false },
      { text: 'Live support chat', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'mini', name: 'Mini', price: { monthly: 49, annual: 39 },
    badge: 'Popular', color: 'brand',
    tagline: 'For growing brands',
    fee: '15%',
    features: [
      { text: '10 active campaigns', included: true },
      { text: 'Priority creator matching', included: true },
      { text: 'Forum + brand badge', included: true },
      { text: 'Full campaign analytics', included: true },
      { text: 'AI negotiation agent (5/mo)', included: true },
      { text: 'Dynamic budget optimizer', included: true },
      { text: 'Live support chat', included: true },
      { text: 'Dedicated account manager', included: false },
      { text: 'First access to top creators', included: false },
    ],
  },
  {
    id: 'max', name: 'Max', price: { monthly: 149, annual: 119 },
    badge: 'Enterprise', color: 'primary',
    tagline: 'For serious marketers',
    fee: '10%',
    features: [
      { text: 'Unlimited campaigns', included: true },
      { text: 'First access to top creators', included: true },
      { text: 'Forum + verified brand badge', included: true },
      { text: 'Advanced analytics + exports', included: true },
      { text: 'Unlimited AI negotiation agent', included: true },
      { text: 'Dynamic budget optimizer', included: true },
      { text: 'Live support chat', included: true },
      { text: 'Dedicated account manager', included: true },
    ],
  },
];

const FEATURE_HIGHLIGHTS = [
  {
    icon: Bot,
    title: 'AI Bargain Agent',
    desc: 'Our AI negotiates campaign deals on your behalf — analyzing market rates, creator value, and optimal pricing to close better deals automatically.',
    plans: 'Mini & Max',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Pricing Engine',
    desc: 'Real-time pricing suggestions based on creator niche, follower count, engagement rate, seasonal demand, and market benchmarks.',
    plans: 'Mini & Max',
    color: 'from-creator to-pink-600',
  },
  {
    icon: Crown,
    title: 'Featured Profile Listing',
    desc: 'Max plan creators appear first in brand discovery — above all standard and Mini listings — with a prominent "Featured" badge.',
    plans: 'Max only',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    desc: 'Max plan users get a personal account manager available via phone, email, and priority chat — not just a ticketing queue.',
    plans: 'Max only',
    color: 'from-brand to-teal-600',
  },
];

function PlanCard({ plan, billing, role, currentPlan, onUpgrade }) {
  const isCurrentPlan = currentPlan === plan.id;
  const price = billing === 'annual' ? plan.price.annual : plan.price.monthly;
  const colorMap = {
    gray: { ring: 'ring-gray-200 dark:ring-gray-700', badge: 'bg-gray-100 text-gray-600', btn: 'btn-outline', header: 'bg-gray-50 dark:bg-gray-900' },
    creator: { ring: 'ring-creator/40', badge: 'bg-creator/10 text-creator', btn: 'btn-creator', header: 'bg-creator/5' },
    brand: { ring: 'ring-brand/40', badge: 'bg-brand/10 text-brand', btn: 'btn-brand', header: 'bg-brand/5' },
    primary: { ring: 'ring-primary/40', badge: 'bg-primary/10 text-primary', btn: 'btn-primary', header: 'bg-gradient-to-br from-primary/5 to-creator/5' },
  };
  const c = colorMap[plan.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative card ring-2 ${c.ring} flex flex-col h-full ${plan.badge === 'Best Value' || plan.badge === 'Enterprise' ? 'scale-[1.02]' : ''}`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${c.badge}`}>
            {plan.badge === 'Best Value' || plan.badge === 'Enterprise' ? <Crown size={10} /> : <Star size={10} />}
            {plan.badge}
          </span>
        </div>
      )}

      <div className={`p-6 rounded-t-2xl ${c.header}`}>
        <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{plan.tagline}</p>
        <div className="mt-4 flex items-end gap-1">
          {price === 0 ? (
            <span className="text-4xl font-heading font-extrabold text-gray-900 dark:text-white">Free</span>
          ) : (
            <>
              <span className="text-4xl font-heading font-extrabold text-gray-900 dark:text-white">${price}</span>
              <span className="text-gray-400 text-sm mb-1">/mo</span>
            </>
          )}
        </div>
        {billing === 'annual' && price > 0 && (
          <p className="text-xs text-green-600 font-semibold mt-1">Save {Math.round((1 - plan.price.annual / plan.price.monthly) * 100)}% annually</p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 bg-white/60 dark:bg-white/5 px-3 py-1 rounded-full">
          <span className="text-xs text-gray-500">Platform fee:</span>
          <span className="text-xs font-bold text-gray-800 dark:text-white">{plan.fee}</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <ul className="space-y-2.5 flex-1">
          {plan.features.map(f => (
            <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>
              <Check size={15} className={`mt-0.5 flex-shrink-0 ${f.included ? 'text-green-500' : 'text-gray-200 dark:text-gray-700'}`} />
              {f.text}
            </li>
          ))}
        </ul>
        <button
          onClick={() => onUpgrade(plan.id)}
          disabled={isCurrentPlan}
          className={`btn ${c.btn} btn-md w-full mt-6 disabled:opacity-60 disabled:cursor-default`}
        >
          {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : `Upgrade to ${plan.name}`}
          {!isCurrentPlan && plan.id !== 'free' && <ArrowRight size={14} />}
        </button>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const { isLoggedIn, activeRole, plan: currentPlan, upgradePlan } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(isLoggedIn ? (activeRole || 'creator') : 'creator');
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  const plans = role === 'creator' ? CREATOR_PLANS : BRAND_PLANS;

  const handleUpgrade = (planId) => {
    if (!isLoggedIn) { navigate('/signup'); return; }
    if (planId === currentPlan) return;
    upgradePlan(planId);
    toast.success(planId === 'free' ? 'Downgraded to Free plan' : `Upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan! 🎉`);
  };

  const faqs = [
    { q: 'Can I switch plans anytime?', a: 'Yes, upgrade or downgrade at any time. Changes take effect immediately. If you downgrade mid-cycle, you keep the premium features until the end of your billing period.' },
    { q: 'How does the AI Bargain Agent work?', a: 'The agent analyzes the creator\'s niche, follower count, engagement rate, and comparable deals to suggest or auto-negotiate a fair price — saving both sides time and awkward back-and-forth.' },
    { q: 'What is Dynamic Pricing?', a: 'Dynamic pricing uses real-time market data, seasonal demand, and your profile performance to suggest optimal rates for each deal type — so you\'re never leaving money on the table.' },
    { q: 'What does "Profile Listed First" mean?', a: 'Max plan creators appear at the top of brand discovery results with a Featured badge, above all Free and Mini profiles. This dramatically increases your visibility to incoming brand budgets.' },
    { q: 'Is the platform fee charged per deal?', a: 'Yes. The platform fee is a percentage of each completed deal, deducted automatically when escrow is released. Your plan tier directly reduces this fee.' },
    { q: 'What is Dedicated Support?', a: 'Max plan users are assigned a personal account manager who handles onboarding, resolves disputes, and is available via direct phone, email, and priority chat — not a shared ticket queue.' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <SEO
        title="Pricing — Plans for Creators & Brands"
        description="Choose a plan that fits your goals. Free, Mini, Pro, and Max plans for creators and brands. Keep 80% of every deal on OgisBack."
        url="/pricing"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-5">
            <Sparkles size={14} /> Simple, transparent pricing
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-5xl font-heading font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            Invest in your growth.<br />
            <span className="gradient-text">Keep more of what you earn.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Lower platform fees, AI-powered deal tools, featured listings, and dedicated support — all in two affordable tiers.
          </motion.p>

          {/* Role + Billing toggles */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Role toggle */}
            <div className="flex items-center bg-white dark:bg-[#111118] rounded-2xl p-1 border border-gray-100 dark:border-gray-800 shadow-card">
              <button onClick={() => setRole('creator')} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${role === 'creator' ? 'bg-gradient-creator text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
                For Creators
              </button>
              <button onClick={() => setRole('brand')} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${role === 'brand' ? 'bg-gradient-brand text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
                For Brands
              </button>
            </div>
            {/* Billing toggle */}
            <div className="flex items-center bg-white dark:bg-[#111118] rounded-2xl p-1 border border-gray-100 dark:border-gray-800 shadow-card gap-1">
              <button onClick={() => setBilling('monthly')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
                Monthly
              </button>
              <button onClick={() => setBilling('annual')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${billing === 'annual' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
                Annual <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans grid */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                role={role}
                currentPlan={isLoggedIn && activeRole === role ? currentPlan : null}
                onUpgrade={handleUpgrade}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-20 px-4 bg-white dark:bg-[#111118] border-t border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3">Premium features, explained</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything that makes OgisBack paid plans worth it — not just badges, but real tools that move the needle.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURE_HIGHLIGHTS.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card p-6 flex gap-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-gray-900 dark:text-white">{f.title}</h3>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f.plans}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison: Free vs Paid fee */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3">Lower fee = more in your pocket</h2>
            <p className="text-gray-500">On a $1,000 deal, here's what each plan means for you.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(role === 'creator' ? [
              { plan: 'Free', fee: '20%', keep: '$800', color: 'border-gray-200' },
              { plan: 'Mini', fee: '18%', keep: '$820', color: 'border-creator/40' },
              { plan: 'Max', fee: '15%', keep: '$850', color: 'border-primary/40' },
            ] : [
              { plan: 'Free', fee: '20%', keep: '$800 value', color: 'border-gray-200' },
              { plan: 'Mini', fee: '15%', keep: '$850 value', color: 'border-brand/40' },
              { plan: 'Max', fee: '10%', keep: '$900 value', color: 'border-primary/40' },
            ]).map(item => (
              <div key={item.plan} className={`card p-5 text-center border-2 ${item.color}`}>
                <p className="text-sm font-semibold text-gray-500 mb-1">{item.plan}</p>
                <p className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white">{item.keep}</p>
                <p className="text-xs text-gray-400 mt-1">after {item.fee} fee</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white dark:bg-[#111118]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-sm pr-4">{faq.q}</span>
                  <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center card p-10">
          <Shield size={36} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">30-day money-back guarantee</h2>
          <p className="text-gray-500 mb-6">Try any paid plan risk-free. Not happy? We'll refund every penny, no questions asked.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/signup" className="btn btn-primary btn-lg">Get started free <ArrowRight size={16} /></Link>
            <Link to="/forum" className="btn btn-outline btn-lg"><MessageCircle size={16} /> Visit the Forum</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-4 text-center">
        <p className="text-gray-400 text-sm">© 2025 OgisBack · <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link> · <Link to="/forum" className="hover:text-gray-600 transition-colors">Forum</Link> · <Link to="/explore" className="hover:text-gray-600 transition-colors">Explore</Link></p>
      </footer>
    </div>
  );
}
