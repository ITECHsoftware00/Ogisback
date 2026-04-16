import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Crown, Headphones, ChevronRight, Minimize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const QUICK_REPLIES = [
  'How does escrow work?',
  'When do I get paid?',
  'How to set my rates?',
  'What is the AI bargain agent?',
];

/* ── Knowledge base: keywords → response ── */
const KNOWLEDGE_BASE = [
  {
    keywords: ['escrow', 'secure hold', 'payment hold', 'fund hold', 'protected'],
    response: 'Escrow protects both sides 🔒 The brand pays into a secure hold before work starts. Once you deliver and they approve, funds release automatically to your wallet. If there\'s a dispute, our team mediates within 48 hours.',
  },
  {
    keywords: ['paid', 'payout', 'get paid', 'payment release', 'receive money', 'earn', 'earnings', 'when do i'],
    response: 'Payment releases to your OgisBack wallet as soon as the brand approves your delivery 💸 You can withdraw anytime via bank transfer, PayPal, Payoneer, or Flutterwave — usually processed within 1–3 business days.',
  },
  {
    keywords: ['rate', 'price', 'pricing', 'how much', 'set rate', 'charge', 'fee'],
    response: 'To set your rates, go to Edit Profile → Rates 💰 Set your base price per content type (photo, video, reel, story). Mini & Max plan members also get dynamic pricing suggestions based on your niche and follower data.',
  },
  {
    keywords: ['ai bargain', 'bargain agent', 'negotiate', 'negotiat', 'counter offer', 'ai agent'],
    response: 'The AI Bargain Agent (Mini & Max plans) 🤖 analyzes market rates, your profile value, and deal history to negotiate on your behalf — or suggest counter-offers you can accept in one click. It saves you hours of back-and-forth!',
  },
  {
    keywords: ['withdraw', 'withdrawal', 'cash out', 'bank', 'paypal', 'payoneer', 'flutterwave', 'transfer money'],
    response: 'To withdraw your earnings, go to Wallet → Withdraw 💳 We support bank transfer, PayPal, Payoneer, and Flutterwave. Minimum withdrawal is $10. Funds typically arrive within 1–3 business days depending on your method.',
  },
  {
    keywords: ['campaign', 'apply', 'application', 'brand deal', 'collab', 'collaboration', 'job', 'gig'],
    response: 'To find brand campaigns, go to Campaigns in your sidebar 🎯 Browse by niche, budget, and platform. Click a campaign to read the brief, then hit Apply — submit your pitch and proposed rate. Brands usually respond within 48 hours.',
  },
  {
    keywords: ['order', 'delivery', 'deliver', 'submit', 'revision', 'revise'],
    response: 'To submit your order delivery, go to Orders → select the order → click Deliver 📦 Upload your content files and add a delivery note. The brand then has 5 days to approve or request a revision. You get up to 3 free revisions per order.',
  },
  {
    keywords: ['subscription', 'plan', 'upgrade', 'mini', 'max', 'free plan', 'pricing'],
    response: 'OgisBack has 3 plans 📋\n• Free — 20% platform fee, 5 posts/mo\n• Mini ($49/mo) — 18% fee, 50 posts, live chat support\n• Max ($149/mo) — 15% fee, unlimited posts, dedicated account manager + AI bargain agent\n\nAll paid plans start with a 7-day free trial!',
  },
  {
    keywords: ['profile', 'edit profile', 'bio', 'avatar', 'photo', 'setup', 'complete', 'verify', 'verified'],
    response: 'To complete your profile, go to My Profile in the sidebar ✏️ Add your bio, niche, social handles, follower counts, and rates. A complete profile gets 3x more brand views and unlocks the "Verified Creator" badge once our team reviews it.',
  },
  {
    keywords: ['message', 'chat', 'contact brand', 'dm', 'inbox', 'conversation'],
    response: 'You can message brands directly from the Messages section in your sidebar 💬 Or from any campaign or creator profile page. Brands can also initiate a conversation with you. You\'ll get a notification bell alert for new messages.',
  },
  {
    keywords: ['pitch', 'pitch brand', 'reach out', 'cold outreach', 'propos'],
    response: 'Use Pitch Brands (⚡ in the sidebar) to reach out directly to brands without waiting for a campaign 🚀 Write a custom pitch, attach your media kit, and propose your rate. It\'s a great way to land deals proactively!',
  },
  {
    keywords: ['review', 'rating', 'star', 'feedback', 'reputation'],
    response: 'Your creator rating (1–5 stars) is the average of all brand reviews after completed orders ⭐ A higher rating boosts your visibility in brand searches. You can see all your reviews on your public profile page.',
  },
  {
    keywords: ['refund', 'cancel', 'dispute', 'problem', 'issue', 'complaint', 'wrong'],
    response: 'If there\'s an issue with an order, go to the order page and click Report Issue 🚨 Our team will review the dispute within 24–48 hours. If a refund is warranted, escrow funds are returned to the brand\'s wallet automatically. We always aim for a fair resolution.',
  },
  {
    keywords: ['follower', 'follow', 'audience', 'subscriber'],
    response: 'Your follower count on OgisBack combines your linked social platform followers (Instagram, TikTok, YouTube) 📊 Keep these up to date in Edit Profile so brands see your real reach. Users can also follow your OgisBack profile to see your new posts in their feed.',
  },
  {
    keywords: ['post', 'content', 'upload', 'photo', 'video', 'reel', 'story'],
    response: 'To upload content, go to New Post (or click Upload Content) 📸 You can post photos, videos, reels, or carousels. Add a caption, tags, and platform label. Posts are public on your profile and appear in the Explore feed for brands to discover you.',
  },
  {
    keywords: ['login', 'sign in', 'sign up', 'register', 'account', 'password', 'forgot', 'google', 'oauth'],
    response: 'OgisBack supports Google OAuth and Facebook/Instagram login — just click the button on the login page 🔐 If you forgot your password, hit "Forgot password" on the login screen and we\'ll email you a reset link within a few minutes.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup'],
    response: 'Hey there! 👋 I\'m the OgisBack support bot. Ask me anything about escrow, payments, campaigns, orders, subscriptions, or your creator profile — I\'ve got you covered!',
  },
  {
    keywords: ['thank', 'thanks', 'appreciate', 'helpful', 'great'],
    response: 'Happy to help! 😊 If you have more questions, I\'m right here. Good luck with your creator journey on OgisBack! 🚀',
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'later'],
    response: 'Goodbye! 👋 Feel free to come back anytime you have questions. Best of luck!',
  },
];

const DEFAULT_RESPONSES = [
  'I\'m not sure about that specific question, but I can help with escrow, payments, campaigns, orders, withdrawals, and subscriptions. Try rephrasing or pick a quick reply below 👇',
  'Hmm, I didn\'t catch that. Try asking about escrow, payments, rates, campaigns, or your profile — those are my specialties! 🤖',
  'That\'s a bit outside my knowledge base. For detailed help, Max plan members have a dedicated account manager, and all users can visit our community Forum for peer advice.',
];

let defaultIndex = 0;

function findResponse(text) {
  const lower = text.toLowerCase().trim();

  // Exact match first (for quick replies)
  const exactKey = Object.keys(
    Object.fromEntries(KNOWLEDGE_BASE.map(k => [k.keywords[0], k.response]))
  ).find(k => lower === k.toLowerCase());
  if (exactKey) return KNOWLEDGE_BASE.find(k => k.keywords[0] === exactKey)?.response;

  // Score each entry by how many keywords match
  let best = null;
  let bestScore = 0;
  for (const entry of KNOWLEDGE_BASE) {
    const score = entry.keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore > 0) return best.response;

  // Rotate through default responses so repeated unknowns feel natural
  const reply = DEFAULT_RESPONSES[defaultIndex % DEFAULT_RESPONSES.length];
  defaultIndex++;
  return reply;
}

export default function LiveSupport() {
  const { isLoggedIn, plan, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1, from: 'bot',
      text: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm the OgisBack support bot. How can I help you today?`,
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg = { id: Date.now(), from: 'user', text: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      const reply = findResponse(msg);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: reply, time: new Date() }]);
      setTyping(false);
    }, 800 + Math.random() * 500);
  };

  const supportLabel = plan === 'max' ? 'Dedicated Support' : plan === 'mini' ? 'Live Chat' : 'Support';
  const supportColor = plan === 'max' ? 'from-primary to-violet-700' : plan === 'mini' ? 'from-creator to-pink-600' : 'from-gray-600 to-gray-800';

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-br ${supportColor} text-white shadow-2xl font-semibold text-sm`}
          >
            {plan === 'max' ? <Headphones size={18} /> : <MessageCircle size={18} />}
            {supportLabel}
            {plan !== 'free' && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: minimized ? 0.95 : 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[340px] shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111118]"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${supportColor} p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  {plan === 'max' ? <Headphones size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{supportLabel}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <p className="text-white/80 text-xs">
                      {plan === 'max' ? 'Account manager online' : plan === 'mini' ? 'Live agent available' : 'Bot support'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMinimized(m => !m)} className="p-1.5 rounded-lg hover:bg-white/20 transition-all text-white/80 hover:text-white">
                  <Minimize2 size={14} />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-all text-white/80 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Plan upgrade nudge for free users */}
                {plan === 'free' && (
                  <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Crown size={14} className="text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">Upgrade for live agent support</p>
                    </div>
                    <Link to="/pricing" onClick={() => setOpen(false)} className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 hover:underline flex-shrink-0">
                      Plans <ChevronRight size={11} />
                    </Link>
                  </div>
                )}

                {/* Messages */}
                <div className="h-64 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                      {msg.from === 'bot' && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-auto">
                          <Bot size={13} className="text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.from === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot size={13} className="text-primary" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2.5 rounded-2xl rounded-bl-sm flex gap-1">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Quick replies */}
                <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
                  {QUICK_REPLIES.map(q => (
                    <button key={q} onClick={() => sendMessage(q)} className="text-[11px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full hover:border-primary/40 hover:text-primary transition-all">
                      {q}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-gray-200"
                  />
                  <button onClick={() => sendMessage()} disabled={!input.trim()} className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-600 transition-all flex-shrink-0">
                    <Send size={13} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
