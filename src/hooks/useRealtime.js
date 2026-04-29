import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getMessages,
  subscribeToMessages,
} from '../lib/db';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    getNotifications(userId, 40)
      .then(data => {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(c => c + 1);
          toast(payload.new.title, {
            icon: getNotifIcon(payload.new.type),
            duration: 4000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n)
          );
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.read).length);
            return prev;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await markAllNotificationsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markRead, markAllRead, loading };
}

export function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) { setLoading(false); return; }

    getMessages(conversationId, 100)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));

    const channel = subscribeToMessages(conversationId, newMsg => {
      setMessages(prev => {
        // Avoid duplicates (optimistic update may have added it already)
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  return { messages, setMessages, loading };
}

export function useOrderStatus(orderId, initialOrder = null) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);

  useEffect(() => {
    if (!orderId) return;

    if (!initialOrder) {
      supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
        .then(({ data }) => { setOrder(data); setLoading(false); });
    }

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        payload => {
          setOrder(prev => ({ ...prev, ...payload.new }));
          toast(`Order status updated: ${formatStatus(payload.new.status)}`, { icon: '📦' });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [orderId]);

  return { order, setOrder, loading };
}

export function usePresence(userId) {
  useEffect(() => {
    if (!userId) return;

    supabase.from('creator_profiles').update({ is_online: true }).eq('id', userId);

    const handleUnload = () => {
      supabase.from('creator_profiles').update({ is_online: false }).eq('id', userId);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      supabase.from('creator_profiles').update({ is_online: false }).eq('id', userId);
    };
  }, [userId]);
}

function getNotifIcon(type) {
  const icons = {
    order: '📦',
    message: '💬',
    payment: '💰',
    campaign: '📢',
    review: '⭐',
    revision: '🔄',
  };
  return icons[type] || '🔔';
}

function formatStatus(status) {
  return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || status;
}
