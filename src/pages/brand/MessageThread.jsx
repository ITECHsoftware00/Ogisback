import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Zap } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getConversationById, getMessages, sendMessage, subscribeToMessages } from '../../lib/db';
import { timeAgo } from '../../lib/normalize';

export default function BrandMessageThread() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();
  const textareaRef = useRef();
  const isInitialLoad = useRef(true);

  // Scroll to bottom — instant on load, smooth for new messages
  useEffect(() => {
    if (msgs.length === 0) return;
    bottomRef.current?.scrollIntoView({
      behavior: isInitialLoad.current ? 'instant' : 'smooth',
    });
    isInitialLoad.current = false;
  }, [msgs]);

  useEffect(() => {
    if (!id) return;
    isInitialLoad.current = true;
    Promise.all([getConversationById(id), getMessages(id)])
      .then(([c, m]) => { setConv(c); setMsgs(m); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Realtime: deduplicate — ignore messages we already added optimistically
    const sub = subscribeToMessages(id, msg => {
      setMsgs(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => sub.unsubscribe();
  }, [id]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !user?.id) return;

    // Clear input immediately + resize textarea back
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    // Optimistic message — appears instantly
    const tempId = `temp-${Date.now()}`;
    setMsgs(prev => [...prev, {
      id: tempId,
      body: text,
      sender_id: user.id,
      sender_role: 'brand',
      conversation_id: id,
      created_at: new Date().toISOString(),
      _pending: true,
    }]);

    try {
      const saved = await sendMessage(id, user.id, 'brand', text);
      // Swap temp for real DB row (has correct id + created_at)
      setMsgs(prev => prev.map(m => m.id === tempId ? saved : m));
    } catch {
      // Remove temp and restore input so the user can retry
      setMsgs(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
    }
  }, [id, input, user?.id]);

  // Auto-grow textarea up to 128px
  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = '44px';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const creatorName   = conv?.creator_profiles?.name     || 'Creator';
  const creatorAvatar = conv?.creator_profiles?.avatar_url || `https://i.pravatar.cc/40?u=${conv?.creator_id}`;

  return (
    <DashboardLayout>
      <SEO title="Conversation" noindex={true} />
      <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Link to="/brand/messages" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all">
            <ArrowLeft size={18} />
          </Link>
          {loading ? (
            <div className="flex-1 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <>
              <img src={creatorAvatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-heading font-semibold text-gray-900 dark:text-white">{creatorName}</p>
                <p className="text-xs text-gray-500">Creator · @{conv?.creator_profiles?.username || ''}</p>
              </div>
              <Link
                to={`/brand/discover/${conv?.creator_profiles?.username}`}
                className="btn btn-brand btn-sm"
              >
                <Zap size={13} /> Hire
              </Link>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-2 scrollbar-hide">
          {msgs.map(msg => {
            const isMe = msg.sender_role === 'brand';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <img src={creatorAvatar} alt="" className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 self-end" />
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm transition-opacity ${
                    isMe
                      ? `bg-gradient-brand text-white rounded-br-md ${msg._pending ? 'opacity-60' : 'opacity-100'}`
                      : 'bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                    {msg._pending ? 'Sending…' : timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-end gap-2">
            <button className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-shrink-0">
              <Paperclip size={18} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder={`Message ${creatorName}…`}
              rows={1}
              className="input resize-none flex-1 overflow-hidden"
              style={{ minHeight: '44px', maxHeight: '128px' }}
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-brand text-white hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </DashboardLayout>
  );
}
