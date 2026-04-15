/**
 * MessageNotificationContext
 * Global listener for incoming messages — plays a ding, shows a popup toast,
 * and exposes an unread count for the sidebar badge.
 */
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { getConversations } from '../lib/db';
import { supabase } from '../supabaseClient';

const Ctx = createContext({ unreadCount: 0 });

/* ── Soft two-tone ding via Web Audio API (no audio file needed) ── */
function playDing() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
    setTimeout(() => ctx.close(), 1200);
  } catch { /* browser blocked audio — silently skip */ }
}

export function MessageNotificationProvider({ children }) {
  const { user, activeRole } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  /* Stable refs so realtime callback always reads latest values */
  const locationRef  = useRef(location.pathname);
  const navigateRef  = useRef(navigate);
  const userRef      = useRef(user);
  const roleRef      = useRef(activeRole);
  const convsRef     = useRef(new Map());

  useEffect(() => { locationRef.current = location.pathname; }, [location.pathname]);
  useEffect(() => { navigateRef.current = navigate; },         [navigate]);
  useEffect(() => { userRef.current     = user; },             [user]);
  useEffect(() => { roleRef.current     = activeRole; },       [activeRole]);

  /* ── Fetch initial unread count ── */
  useEffect(() => {
    if (!user?.id) return;
    getConversations(user.id, activeRole)
      .then(convs => {
        convsRef.current = new Map(convs.map(c => [c.id, c]));
        setUnreadCount(convs.reduce((s, c) => s + (c.unread_count || 0), 0));
      })
      .catch(() => {});
  }, [user?.id, activeRole]);

  /* ── Re-sync count when user visits the messages list ── */
  useEffect(() => {
    if (!user?.id || !location.pathname.includes('/messages')) return;
    getConversations(user.id, activeRole)
      .then(convs => setUnreadCount(convs.reduce((s, c) => s + (c.unread_count || 0), 0)))
      .catch(() => {});
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Global realtime subscription ── */
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`inbox:${user.id}`, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const msg    = payload.new;
          const myId   = userRef.current?.id;
          const role   = roleRef.current;

          /* Skip messages I sent */
          if (!msg || msg.sender_id === myId) return;

          /* Skip if already viewing this conversation */
          if (locationRef.current.includes(msg.conversation_id)) return;

          /* Increment unread badge */
          setUnreadCount(n => n + 1);

          /* Play sound */
          playDing();

          /* Resolve sender name from cached conversations */
          const conv       = convsRef.current.get(msg.conversation_id);
          const senderName = role === 'brand'
            ? conv?.creator_profiles?.name || 'New message'
            : conv?.brand_profiles?.name   || 'New message';
          const threadPath = role === 'brand'
            ? `/brand/messages/${msg.conversation_id}`
            : `/creator/messages/${msg.conversation_id}`;

          /* Show popup toast */
          toast.custom(
            t => (
              <div
                className={`flex items-center gap-3 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 shadow-glass rounded-2xl px-4 py-3 cursor-pointer max-w-xs w-full transition-all duration-300 ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                onClick={() => {
                  toast.dismiss(t.id);
                  navigateRef.current(threadPath);
                }}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-creator flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-sm font-bold">
                    {senderName.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                      {senderName}
                    </p>
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {msg.body}
                  </p>
                </div>
                {/* Dismiss */}
                <button
                  className="flex-shrink-0 text-gray-300 hover:text-gray-500 text-lg leading-none ml-1"
                  onClick={e => { e.stopPropagation(); toast.dismiss(t.id); }}
                >
                  ×
                </button>
              </div>
            ),
            { duration: 6000, position: 'bottom-right', id: `msg-${msg.id}` }
          );
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user?.id]); // only re-run when user changes, not on every role change

  return <Ctx.Provider value={{ unreadCount }}>{children}</Ctx.Provider>;
}

export const useMessageNotifications = () => useContext(Ctx);
