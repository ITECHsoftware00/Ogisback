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

const BOT_RESPONSES = {
  'How does escrow work?': 'Escrow protects both sides: the brand pays into a secure hold before work starts. Once you deliver and they approve, the funds release automatically to your wallet. If there\'s a dispute, our team mediates.',
  'When do I get paid?': 'Payment is released to your OgisBack wallet as soon as the brand approves your delivery. You can then withdraw anytime via bank transfer, PayPal, Payoneer, or Flutterwave.',
  'How to set my rates?': 'Go to Edit Profile → Rates. Set your base price per content type. Mini & Max plan members also get dynamic pricing suggestions based on your niche and follower data.',
  'What is the AI bargain agent?': 'The AI bargain agent (Mini & Max plans) analyzes market rates, your profile value, and deal history to negotiate on your behalf — or suggest counter-offers you can accept in one click.',
};

const DEFAULT_RESPONSE = 'Great question! For detailed help, our support team is standing by. Max plan members get dedicated 1-on-1 support with a real account manager. Free users can browse our community forum for peer advice.';

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
      const reply = BOT_RESPONSES[msg] || DEFAULT_RESPONSE;
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: reply, time: new Date() }]);
      setTyping(false);
    }, 1000 + Math.random() * 600);
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
