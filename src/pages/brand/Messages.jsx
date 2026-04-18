import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import MessagesPage from '../../components/messaging/MessagesPage';
import { useAuth } from '../../context/AuthContext';
import { getConversations } from '../../lib/db';

export default function BrandMessages() {
  const { user } = useAuth();
  const [convs,   setConvs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getConversations(user.id, 'brand')
      .then(setConvs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <DashboardLayout>
      <SEO title="Messages" noindex={true} />
      <MessagesPage
        role="brand"
        convs={convs}
        loading={loading}
        getName={c => c.creator_profiles?.name || 'Creator'}
        getAvatar={c => c.creator_profiles?.avatar_url || `https://i.pravatar.cc/48?u=${c.creator_id}`}
        getTo={id => `/brand/messages/${id}`}
        accentClass="bg-brand"
        accentColor="#0D9488"
        accentRing="ring-brand/30"
        emptyAction={
          <Link to="/brand/discover" className="btn btn-brand btn-md mt-2">
            Discover Creators
          </Link>
        }
      />
    </DashboardLayout>
  );
}
