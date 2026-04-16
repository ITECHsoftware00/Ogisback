import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeTikTokCode } from '../lib/socialApi';
import { updateCreatorProfile } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function TikTokCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('Connecting TikTok…');

  useEffect(() => {
    const code  = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      toast.error('TikTok connection cancelled');
      navigate('/creator/settings');
      return;
    }

    const savedState = sessionStorage.getItem('tt_oauth_state');
    if (!code || state !== savedState) {
      toast.error('Invalid TikTok callback');
      navigate('/creator/settings');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/tiktok`;

    exchangeTikTokCode(code, redirectUri).then(async (data) => {
      if (!data || data.error) {
        setStatus('Failed to connect TikTok');
        toast.error('Could not connect TikTok. Try again.');
        navigate('/creator/settings');
        return;
      }

      if (user?.id) {
        await updateCreatorProfile(user.id, {
          tiktok:           data.username  || null,
          tiktok_followers: data.followerCount || 0,
        });
      }

      sessionStorage.removeItem('tt_oauth_state');
      toast.success(`TikTok connected! ${(data.followerCount || 0).toLocaleString()} followers synced.`);
      navigate('/creator/settings');
    });
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">{status}</p>
      </div>
    </div>
  );
}
