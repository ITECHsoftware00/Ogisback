import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import MessagesPage from '../../components/messaging/MessagesPage';
import { useAuth } from '../../context/AuthContext';
import { getConversations } from '../../lib/db';

export default function CreatorMessages() {
  const { user } = useAuth();
  const [convs,   setConvs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getConversations(user.id, 'creator')
      .then(setConvs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <DashboardLayout>
      <SEO title="Messages" noindex={true} />
      <MessagesPage
        role="creator"
        convs={convs}
        loading={loading}
        getName={c => c.brand_profiles?.name || 'Brand'}
        getAvatar={c => c.brand_profiles?.logo_url || `https://i.pravatar.cc/48?u=${c.brand_id}`}
        getTo={id => `/creator/messages/${id}`}
        accentClass="bg-creator"
        accentColor="#7C3AED"
        accentRing="ring-creator/30"
      />
    </DashboardLayout>
  );
}
