import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Inbox, MessageSquareDashed, Clock } from 'lucide-react';
import { timeAgo } from '../../lib/normalize';

/* ── avatar with fallback initials ── */
function Avatar({ src, name, size = 'md', online = false, accentColor }) {
  const [err, setErr] = useState(false);
  const dim = size === 'lg' ? 'w-14 h-14' : 'w-12 h-12';
  const initial = (name || '?')[0].toUpperCase();

  return (
    <div className={`relative flex-shrink-0 ${dim}`}>
      {src && !err ? (
        <img src={src} alt={name} onError={() => setErr(true)}
          className={`${dim} rounded-2xl object-cover`} />
      ) : (
        <div className={`${dim} rounded-2xl flex items-center justify-center font-bold text-lg text-white`}
          style={{ background: accentColor || '#7C3AED' }}>
          {initial}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-[#09090F] shadow-sm" />
      )}
    </div>
  );
}

/* ── single conversation card ── */
function ConvCard({ conv, to, getName, getAvatar, index, accentClass, accentColor, accentRing }) {
  const name   = getName(conv);
  const avatar = getAvatar(conv);
  const unread = conv.unread_count || 0;
  const last   = conv.last_message || 'No messages yet';
  const time   = conv.last_message_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={to(conv.id)} className="group block">
        <div className={`
          relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200
          ${unread > 0
            ? 'bg-white dark:bg-white/[0.05] border-gray-200/80 dark:border-white/[0.1] shadow-sm shadow-black/[0.04]'
            : 'bg-white/60 dark:bg-white/[0.025] border-gray-100 dark:border-white/[0.05]'
          }
          hover:shadow-md hover:shadow-black/[0.07] hover:-translate-y-[1px] hover:border-gray-200 dark:hover:border-white/[0.12]
        `}>
          {/* Unread left accent */}
          {unread > 0 && (
            <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${accentClass}`} />
          )}

          <Avatar src={avatar} name={name} size="lg" accentColor={accentColor} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1">
              <p className={`truncate leading-tight ${unread > 0 ? 'font-bold text-gray-900 dark:text-white text-[15px]' : 'font-semibold text-gray-600 dark:text-gray-300 text-sm'}`}>
                {name}
              </p>
              {time && (
                <span className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
                  ${unread > 0
                    ? `bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-gray-300`
                    : 'text-gray-400 dark:text-gray-600'
                  }`}>
                  {unread > 0 && <Clock size={9} />}
                  {timeAgo(time)}
                </span>
              )}
            </div>
            <p className={`text-sm truncate leading-snug ${unread > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
              {last}
            </p>
          </div>

          {/* Unread badge */}
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`flex-shrink-0 min-w-[22px] h-[22px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-sm ${accentClass}`}
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ── skeleton loader ── */
function Skeleton({ i }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/[0.025] border border-gray-100 dark:border-white/[0.05] animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-2/5" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-3/5" />
      </div>
      <div className="h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
  );
}

/* ── main export ── */
export default function MessagesPage({
  role,           // 'creator' | 'brand'
  convs,
  loading,
  getName,
  getAvatar,
  getTo,
  emptyAction,
  accentClass,    // e.g. 'bg-creator'
  accentColor,    // hex for avatar fallback
  accentRing,     // e.g. 'ring-creator/30'
}) {
  const [search, setSearch] = useState('');

  const filtered = convs.filter(c => {
    if (!search) return true;
    const name = getName(c).toLowerCase();
    const last = (c.last_message || '').toLowerCase();
    return name.includes(search.toLowerCase()) || last.includes(search.toLowerCase());
  });

  const unread      = filtered.filter(c => c.unread_count > 0);
  const read        = filtered.filter(c => !c.unread_count);
  const unreadCount = convs.filter(c => c.unread_count > 0).length;
  const total       = convs.length;

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
                Inbox
              </h1>
              {total > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-gray-400 text-sm font-semibold tabular-nums">
                  {total}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
              {unreadCount > 0
                ? <span className={`font-semibold ${role === 'creator' ? 'text-creator' : 'text-brand'}`}>{unreadCount} unread</span>
                : 'All caught up'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations…"
          className="w-full h-11 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-2xl pl-11 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': accentColor + '40' }}
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.1] text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={12} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} i={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center gap-4"
        >
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
            {search
              ? <Search size={26} className="text-gray-400" />
              : <MessageSquareDashed size={26} className="text-gray-400" />
            }
          </div>
          <div>
            <p className="font-heading font-bold text-gray-700 dark:text-gray-300 text-lg">
              {search ? 'No results' : 'No conversations yet'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1 max-w-xs mx-auto">
              {search
                ? `Nothing matches "${search}"`
                : role === 'creator'
                  ? 'When brands reach out, conversations appear here.'
                  : 'Start by discovering a creator and sending a message.'}
            </p>
          </div>
          {!search && emptyAction}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {/* Unread section */}
          {unread.length > 0 && (
            <>
              <div className="flex items-center gap-3 px-1 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">Unread</p>
                <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.05]" />
              </div>
              {unread.map((conv, i) => (
                <ConvCard key={conv.id} conv={conv} to={getTo} getName={getName} getAvatar={getAvatar}
                  index={i} accentClass={accentClass} accentColor={accentColor} accentRing={accentRing} />
              ))}
            </>
          )}

          {/* Read section */}
          {read.length > 0 && (
            <>
              {unread.length > 0 && (
                <div className="flex items-center gap-3 px-1 mt-5 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">Earlier</p>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.05]" />
                </div>
              )}
              {read.map((conv, i) => (
                <ConvCard key={conv.id} conv={conv} to={getTo} getName={getName} getAvatar={getAvatar}
                  index={unread.length + i} accentClass={accentClass} accentColor={accentColor} accentRing={accentRing} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
