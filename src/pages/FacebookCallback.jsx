import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeFacebookCode } from '../lib/socialApi';
import { updateCreatorProfile } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function FacebookCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('Connecting Facebook…');

  useEffect(() => {
    const code  = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      toast.error('Facebook connection cancelled');
      navigate('/creator/profile/edit');
      return;
    }

    const savedState = sessionStorage.getItem('fb_oauth_state');
    if (!code || state !== savedState) {
      toast.error('Invalid Facebook callback');
      navigate('/creator/profile/edit');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/facebook`;

    exchangeFacebookCode(code, redirectUri).then(async (data) => {
      if (!data || data.error) {
        setStatus('Failed to connect Facebook');
        toast.error('Could not connect Facebook. Try again.');
        navigate('/creator/profile/edit');
        return;
      }

      if (user?.id) {
        const updates = {
          facebook_page:      data.facebookPageName  || null,
          facebook_followers: data.facebookFollowers || 0,
        };
        if (data.instagramUsername) {
          updates.instagram           = data.instagramUsername;
          updates.instagram_followers = data.instagramFollowers || 0;
        }
        if (data.instagramBusinessId) {
          updates.instagram_business_id = data.instagramBusinessId;
          updates.instagram_page_token  = data.instagramPageToken;
        }
        await updateCreatorProfile(user.id, updates);
      }

      sessionStorage.removeItem('fb_oauth_state');

      const parts = [];
      if (data.facebookFollowers)  parts.push(`${(data.facebookFollowers).toLocaleString()} Facebook followers`);
      if (data.instagramFollowers) parts.push(`${(data.instagramFollowers).toLocaleString()} Instagram followers`);
      if (data.instagramBusinessId) parts.push('Instagram Insights unlocked');
      toast.success(parts.length ? `Connected! ${parts.join(' · ')}.` : 'Facebook connected.');

      navigate('/creator/profile/edit');
    });
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">{status}</p>
      </div>
    </div>
  );
}
