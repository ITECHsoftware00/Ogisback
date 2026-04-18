import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Reply, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getConversationById, getMessages, sendMessage, deleteMessage, subscribeToMessages } from '../../lib/db';
import { timeAgo } from '../../lib/normalize';

function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function CreatorMessageThread() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conv, setConv]       = useState(null);
  const [msgs, setMsgs]       = useState([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);   // { id, body, senderRole }
  const [hoverId, setHoverId] = useState(null);
  const bottomRef   = useRef();
  const textareaRef = useRef();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (msgs.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: isInitialLoad.current ? 'instant' : 'smooth' });
    isInitialLoad.current = false;
  }, [msgs]);

  useEffect(() => {
    if (!id) return;
    isInitialLoad.current = true;
    Promise.all([getConversationById(id), getMessages(id)])
      .then(([c, m]) => { setConv(c); setMsgs(m); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const sub = subscribeToMessages(id, msg => {
      setMsgs(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });
    return () => sub.unsubscribe();
  }, [id]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !user?.id) return;
    setInput('');
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = '44px';

    const tempId = `temp-${Date.now()}`;
    setMsgs(prev => [...prev, {
      id: tempId, body: text, sender_id: user.id, sender_role: 'creator',
      conversation_id: id, created_at: new Date().toISOString(), _pending: true,
      reply_to: replyTo ? { body: replyTo.body, senderRole: replyTo.senderRole } : null,
    }]);

    try {
      const saved = await sendMessage(id, user.id, 'creator', text);
      setMsgs(prev => prev.map(m => m.id === tempId ? saved : m));
    } catch {
      setMsgs(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
    }
  }, [id, input, replyTo, user?.id]);

  const handleDelete = async (msgId) => {
    setMsgs(prev => prev.filter(m => m.id !== msgId));
    try {
      await deleteMessage(msgId);
    } catch {
      toast.error('Could not delete message');
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = '44px';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === 'Escape' && replyTo) setReplyTo(null);
  };

  const brandName   = conv?.brand_profiles?.name    || 'Brand';
  const brandAvatar = conv?.brand_profiles?.logo_url || `https://i.pravatar.cc/40?u=${conv?.brand_id}`;

  return (
    <DashboardLayout>
      <SEO title="Conversation" noindex={true} />
      <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
          <Link to="/creator/messages"
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 transition-all flex-shrink-0">
            <ArrowLeft size={17} />
          </Link>
          {loading ? (
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <img src={brandAvatar} alt="" className="w-10 h-10 rounded-2xl object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-[#0f0f17]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-gray-900 dark:text-white leading-tight">{brandName}</p>
                <p className="text-xs text-green-500 font-medium">Active now</p>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pb-2 scrollbar-hide space-y-1">
          {msgs.map((msg, i) => {
            const isMe    = msg.sender_role === 'creator';
            const prev    = msgs[i - 1];
            const next    = msgs[i + 1];
            const showDay = !prev || !sameDay(prev.created_at, msg.created_at);
            const isFirst = !prev || prev.sender_role !== msg.sender_role || showDay;
            const isLast  = !next || next.sender_role !== msg.sender_role || !sameDay(msg.created_at, next?.created_at);
            const isHover = hoverId === msg.id;

            return (
              <div key={msg.id}>
                {showDay && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
                    <span className="text-[11px] text-gray-400 font-medium px-2">{formatDay(msg.created_at)}</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  onMouseEnter={() => setHoverId(msg.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isLast ? 'mb-2' : 'mb-0.5'} group`}
                >
                  {/* Other avatar */}
                  {!isMe && (
                    <div className="w-7 flex-shrink-0">
                      {isLast && <img src={brandAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />}
                    </div>
                  )}

                  {/* Action buttons — shown on hover, left side for my msgs, right side for others */}
                  {isMe && isHover && !msg._pending && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setReplyTo({ id: msg.id, body: msg.body, senderRole: msg.sender_role })}
                        className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/[0.14] transition-all"
                        title="Reply"
                      >
                        <Reply size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                    {/* Reply preview */}
                    {msg.reply_to && (
                      <div className={`flex items-start gap-1.5 mb-1 px-3 py-1.5 rounded-xl text-xs max-w-full
                        ${isMe ? 'bg-black/10 text-white/70' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500'}`}
                      >
                        <Reply size={10} className="flex-shrink-0 mt-0.5 rotate-180" />
                        <span className="truncate">{msg.reply_to.body}</span>
                      </div>
                    )}

                    <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words transition-opacity
                      ${isMe
                        ? `bg-gradient-creator text-white ${msg._pending ? 'opacity-50' : 'opacity-100'}
                           ${isFirst && isLast ? 'rounded-2xl' : isFirst ? 'rounded-2xl rounded-br-md' : isLast ? 'rounded-2xl rounded-tr-md' : 'rounded-xl rounded-r-md'}`
                        : `bg-white dark:bg-white/[0.06] text-gray-800 dark:text-gray-100 shadow-sm
                           ${isFirst && isLast ? 'rounded-2xl' : isFirst ? 'rounded-2xl rounded-bl-md' : isLast ? 'rounded-2xl rounded-tl-md' : 'rounded-xl rounded-l-md'}`
                      }`}
                    >
                      {msg.body}
                    </div>
                    {isLast && (
                      <p className="text-[10px] mt-1 mx-1 text-gray-400">
                        {msg._pending ? 'Sending…' : timeAgo(msg.created_at)}
                      </p>
                    )}
                  </div>

                  {/* Action buttons for other person's messages */}
                  {!isMe && isHover && !msg._pending && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setReplyTo({ id: msg.id, body: msg.body, senderRole: msg.sender_role })}
                        className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/[0.14] transition-all"
                        title="Reply"
                      >
                        <Reply size={13} />
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
          {/* Reply preview bar */}
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] rounded-xl text-xs text-gray-500">
                  <Reply size={12} className="text-creator flex-shrink-0" />
                  <span className="flex-1 truncate">
                    <span className="font-semibold text-creator mr-1">
                      {replyTo.senderRole === 'creator' ? 'You' : brandName}
                    </span>
                    {replyTo.body}
                  </span>
                  <button onClick={() => setReplyTo(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] rounded-2xl px-3 py-2">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 self-end mb-0.5">
              <Paperclip size={17} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder={replyTo ? 'Write a reply…' : `Message ${brandName}…`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none border-none focus:ring-0 leading-relaxed py-1.5"
              style={{ minHeight: '36px', maxHeight: '128px' }}
            />
            <AnimatePresence>
              {input.trim() && (
                <motion.button
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  onClick={send}
                  className="w-8 h-8 rounded-xl bg-creator text-white flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0 self-end mb-0.5"
                >
                  <Send size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </DashboardLayout>
  );
}
