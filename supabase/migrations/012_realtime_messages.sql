-- Enable Supabase Realtime on the messages table so the global
-- notification listener in MessageNotificationContext can receive
-- new message events across all conversations.

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Also enable realtime on conversations so unread counts update live
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
