import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { followCreator, unfollowCreator, checkFollowing } from '../lib/db';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/**
 * FollowButton — reusable Follow / Following toggle.
 *
 * Props:
 *   creatorId   — UUID of the creator being followed
 *   creatorName — display name (used in toast)
 *   size        — 'sm' | 'md' (default 'md')
 *   className   — extra Tailwind classes
 *   onCountChange(delta) — optional callback to update follower count in parent
 */
export default function FollowButton({ creatorId, creatorName, size = 'md', className = '', onCountChange }) {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing]   = useState(false);
  const [pending,   setPending]     = useState(false);
  const [checked,   setChecked]     = useState(false);

  // Don't show the button if viewing own profile
  const isSelf = user?.id === creatorId;

  useEffect(() => {
    if (!isLoggedIn || !user?.id || !creatorId || isSelf) { setChecked(true); return; }
    checkFollowing(user.id, creatorId)
      .then(v => { setFollowing(v); setChecked(true); })
      .catch(() => setChecked(true));
  }, [user?.id, creatorId, isLoggedIn, isSelf]);

  if (isSelf || !checked) return null;

  const toggle = async (e) => {
    e?.stopPropagation();
    if (!isLoggedIn) { navigate('/login'); return; }
    if (pending) return;
    const next = !following;
    setFollowing(next);
    setPending(true);
    onCountChange?.(next ? 1 : -1);
    try {
      if (next) {
        await followCreator(user.id, creatorId);
        toast.success(`Following ${creatorName || 'creator'}!`);
      } else {
        await unfollowCreator(user.id, creatorId);
        toast(`Unfollowed ${creatorName || 'creator'}`);
      }
    } catch {
      setFollowing(!next);
      onCountChange?.(next ? -1 : 1);
      toast.error('Something went wrong');
    } finally {
      setPending(false);
    }
  };

  const sm = size === 'sm';

  if (following) {
    return (
      <button
        onClick={toggle}
        disabled={pending}
        className={`group flex items-center gap-1.5 font-semibold border transition-all rounded-xl
          ${sm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
          border-brand/30 bg-brand/5 text-brand hover:bg-red-50 hover:border-red-300 hover:text-red-500
          disabled:opacity-50 ${className}`}
      >
        {pending
          ? <Loader2 size={sm ? 11 : 14} className="animate-spin" />
          : <UserCheck size={sm ? 11 : 14} className="group-hover:hidden" />}
        <span className="group-hover:hidden">{pending ? '' : 'Following'}</span>
        <span className="hidden group-hover:inline text-red-500">Unfollow</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-1.5 font-semibold border transition-all rounded-xl
        ${sm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
        bg-brand text-white border-brand hover:bg-brand/90
        disabled:opacity-50 ${className}`}
    >
      {pending
        ? <Loader2 size={sm ? 11 : 14} className="animate-spin" />
        : <UserPlus size={sm ? 11 : 14} />}
      Follow
    </button>
  );
}
