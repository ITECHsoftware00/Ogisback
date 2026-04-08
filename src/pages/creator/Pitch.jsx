import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Send, Building2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getBrands, getOrCreateConversation, sendMessage, getConversations } from '../../lib/db';
import { timeAgo } from '../../lib/normalize';

export default function CreatorPitch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [recentConvs, setRecentConvs] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getBrands({ limit: 50 }).then(setBrands).catch(() => {});
    if (user?.id) {
      getConversations(user.id, 'creator')
        .then(data => setRecentConvs(data.slice(0, 5)))
        .catch(() => {});
    }
  }, [user?.id]);

  const handleSend = async () => {
    if (!selectedBrand || !subject || !message) { toast.error('Please fill all required fields'); return; }
    setSending(true);
    try {
      const conv = await getOrCreateConversation(user.id, selectedBrand);
      const body = subject ? `**${subject}**\n\n${message}${proposedRate ? `\n\nProposed Rate: $${proposedRate}` : ''}` : message;
      await sendMessage(conv.id, user.id, 'creator', body);
      toast.success('Pitch sent! The brand will review your proposal.');
      setSelectedBrand(''); setSubject(''); setMessage(''); setProposedRate('');
      navigate(`/creator/messages/${conv.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to send pitch');
    } finally { setSending(false); }
  };

  const selectedBrandObj = brands.find(b => b.id === selectedBrand);

  return (
    <DashboardLayout>
      <SEO title="Submit Pitch" noindex={true} />
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2"><Zap size={22} className="text-creator" />Pitch to Brands</h1>
          <p className="page-subtitle">Reach out directly to brands you want to work with</p>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4 p-4 bg-gradient-creator rounded-2xl text-white mb-6">
            <Zap size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Pro tip: Personalise every pitch</p>
              <p className="text-white/80 text-sm">Brands receive many pitches. Stand out by referencing their specific products, recent campaigns, or how your audience aligns with their target market.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="form-group">
              <label className="label">Select Brand *</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="input pl-10 appearance-none cursor-pointer">
                  <option value="">Choose a brand to pitch...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}{b.industry ? ` — ${b.industry}` : ''}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {selectedBrandObj && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={selectedBrandObj.logo_url || `https://i.pravatar.cc/40?u=${selectedBrandObj.id}`} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{selectedBrandObj.name}</p>
                    <p className="text-xs text-gray-500">{selectedBrandObj.industry || 'Brand'}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="form-group">
              <label className="label">Subject Line *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Fashion Creator with 312K followers — collaboration proposal" className="input" />
            </div>

            <div className="form-group">
              <label className="label">Your Pitch *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Hi [Brand Name],\n\nI'm [your name], a [niche] creator with [X] followers on [platforms].\n\nI'd love to collaborate with you because...\n\nMy audience is primarily [demographics], which aligns perfectly with your...\n\nI'm proposing...\n\nI'd love to schedule a quick call to discuss further.`}
                rows={10}
                className="input resize-none text-sm"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{message.length}/5000</p>
            </div>

            <div className="form-group">
              <label className="label">Proposed Rate (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input type="number" value={proposedRate} onChange={e => setProposedRate(e.target.value)} placeholder="e.g. 1500" className="input pl-8" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave blank if you want to discuss rates in the conversation</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setSelectedBrand(''); setSubject(''); setMessage(''); setProposedRate(''); }} className="btn btn-outline btn-lg flex-1">Clear</button>
          <button onClick={handleSend} disabled={sending} className="btn btn-creator btn-lg flex-1 disabled:opacity-70">
            {sending ? 'Sending...' : <><Send size={16} /> Send Pitch</>}
          </button>
        </div>

        {recentConvs.length > 0 && (
          <div className="mt-8">
            <h2 className="section-title">Recent Conversations</h2>
            <div className="space-y-3">
              {recentConvs.map(conv => {
                const brandName = conv.brand_profiles?.name || 'Brand';
                const brandLogo = conv.brand_profiles?.logo_url;
                return (
                  <div key={conv.id} className="card flex items-center gap-4 p-4">
                    <img src={brandLogo || `https://i.pravatar.cc/40?u=${conv.brand_id}`} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{brandName}</p>
                      <p className="text-xs text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-gray-400">{timeAgo(conv.last_message_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
