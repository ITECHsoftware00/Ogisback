import { useState, useEffect } from 'react';
import { fetchInstagramProfile } from '../lib/socialApi';
import { getCreatorProfile } from '../lib/db';

export function useInstagramData(creatorId) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!creatorId) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const profile = await getCreatorProfile(creatorId);
        const handle  = profile?.instagram;

        if (!handle) {
          if (!cancelled) setLoading(false);
          return;
        }

        const live = await fetchInstagramProfile(handle);

        if (!live?.profile) {
          if (!cancelled) setLoading(false);
          return;
        }

        if (!cancelled) {
          setData({
            source:    'live',
            fetchedAt: new Date().toISOString(),
            profile:   live.profile,
            posts:     live.posts ?? [],
          });
        }
      } catch (err) {
        // Silently fall back to DB data on API credit/network errors
        const isCredit = String(err).includes('402') || String(err).toLowerCase().includes('credit');
        if (!isCredit) console.error('[useInstagramData]', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [creatorId]);

  return { data, loading, error };
}
