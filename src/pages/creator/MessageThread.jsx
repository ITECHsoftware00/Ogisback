import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, MoreVertical } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getConversationById, getMessages, sendMessage, subscribeToMessages } from '../../lib/db';
import { timeAgo } from '../../lib/normalize';

export default function CreatorMessageThread() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getConversationById(id), getMessages(id)])
      .then(([c, m]) => { setConv(c); setMsgs(m); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const sub = subscribeToMessages(id, msg => setMsgs(prev => [...prev, msg]));
    return () => sub.unsubscribe();
  }, [id]);

  const send = async () => {
    if (!input.trim() || !user?.id || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await sendMessage(id, user.id, 'creator', text);
    } catch {
      setInput(text);
    } finally { setSending(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const brandName = conv?.brand_profiles?.name || 'Brand';
  const brandAvatar = conv?.brand_profiles?.logo_url || `https://i.pravatar.cc/40?u=${conv?.brand_id}`;

  return (
    <DashboardLayout>
      <SEO title="Conversation" noindex={true} />
      <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Link to="/creator/messages" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all">
            <ArrowLeft size={18} />
          </Link>
          {loading ? (
            <div className="flex-1 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <>
              <img src={brandAvatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-heading font-semibold text-gray-900 dark:text-white">{brandName}</p>
                <p className="text-xs text-gray-500">Brand · Usually replies within 4h</p>
              </div>
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <MoreVertical size={18} />
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-2 scrollbar-hide">
          {msgs.map(msg => {
            const isMe = msg.sender_role === 'creator';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <img src={brandAvatar} alt="" className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 self-end" />}
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-gradient-creator text-white rounded-br-md' : 'bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'}`}>
                  <p className="leading-relaxed">{msg.body}</p>
                  <p className={`text-[10px] mt-1.5 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>{timeAgo(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-end gap-2">
            <button className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-shrink-0">
              <Paperclip size={18} />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Message ${brandName}...`}
                rows={1}
                className="input resize-none max-h-32 pr-4"
                style={{ minHeight: '44px' }}
              />
            </div>
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="p-2.5 rounded-xl bg-creator text-white hover:bg-creator-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
