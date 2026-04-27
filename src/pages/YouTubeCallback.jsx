import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeYouTubeCode, fetchYouTubeAudienceInsights } from '../lib/socialApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function YouTubeCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('Connecting YouTube Analytics…');

  useEffect(() => {
    const code  = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      toast.error('YouTube connection cancelled');
      navigate('/creator/profile/edit');
      return;
    }

    const savedState = sessionStorage.getItem('yt_oauth_state');
    if (!code || state !== savedState) {
      toast.error('Invalid YouTube callback');
      navigate('/creator/profile/edit');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/youtube`;

    (async () => {
      try {
        const data = await exchangeYouTubeCode(code, redirectUri, user?.id);
        if (!data || data.error) {
          setStatus('Failed to connect YouTube');
          toast.error('Could not connect YouTube. Try again.');
          navigate('/creator/profile/edit');
          return;
        }

        sessionStorage.removeItem('yt_oauth_state');

        // Kick off the first audience insights sync
        if (user?.id && data.connected) {
          setStatus('Syncing audience insights…');
          try {
            await fetchYouTubeAudienceInsights(user.id);
            toast.success('YouTube Analytics connected & audience insights synced!');
          } catch (e) {
            // YouTube Analytics API may not be enabled or channel may be too small
            toast.success('YouTube connected. Audience insights may take a moment.');
            console.warn('[YouTubeCallback] audience sync failed:', e.message);
          }
          navigate('/creator/analytics');
          return;
        }

        const parts = [];
        if (data.subscribers) parts.push(`${data.subscribers.toLocaleString()} subscribers`);
        if (data.channelTitle) parts.push(data.channelTitle);
        toast.success(parts.length ? `Connected! ${parts.join(' · ')}` : 'YouTube connected.');
        navigate('/creator/profile/edit');
      } catch (e) {
        toast.error('YouTube connection error');
        navigate('/creator/profile/edit');
      }
    })();
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-red-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">{status}</p>
      </div>
    </div>
  );
}
