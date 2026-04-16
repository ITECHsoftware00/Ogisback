-- ═══════════════════════════════════════════════════════════════
-- OgisBack Community Forum
-- ═══════════════════════════════════════════════════════════════

-- ── forum_posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  user_role     TEXT NOT NULL DEFAULT 'creator' CHECK (user_role IN ('creator', 'brand', 'admin')),
  author_name   TEXT NOT NULL,
  author_avatar TEXT,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'mini', 'max')),
  title         TEXT NOT NULL CHECK (length(trim(title)) > 0),
  body          TEXT NOT NULL CHECK (length(trim(body)) > 0),
  category      TEXT NOT NULL DEFAULT 'creator-tips' CHECK (
    category IN ('creator-tips', 'brand-collab', 'pricing', 'announcements', 'general')
  ),
  pinned        BOOLEAN DEFAULT false,
  tags          TEXT[] DEFAULT '{}',
  likes         INT DEFAULT 0,
  reply_count   INT DEFAULT 0,
  view_count    INT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forum posts"
  ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create forum posts"
  ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own forum posts"
  ON forum_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own forum posts"
  ON forum_posts FOR DELETE USING (auth.uid() = user_id);

-- ── forum_replies ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID NOT NULL,
  user_role     TEXT NOT NULL DEFAULT 'creator' CHECK (user_role IN ('creator', 'brand', 'admin')),
  author_name   TEXT NOT NULL,
  author_avatar TEXT,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'mini', 'max')),
  body          TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forum replies"
  ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can reply"
  ON forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies"
  ON forum_replies FOR DELETE USING (auth.uid() = user_id);

-- ── forum_post_likes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forum likes"   ON forum_post_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like forum posts" ON forum_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike forum posts"  ON forum_post_likes FOR DELETE USING (auth.uid() = user_id);

-- ── Sync reply_count trigger ──────────────────────────────────
CREATE OR REPLACE FUNCTION sync_forum_reply_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET reply_count = reply_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_reply_count ON forum_replies;
CREATE TRIGGER trg_forum_reply_count
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION sync_forum_reply_count();

-- ── Toggle forum like (atomic) ────────────────────────────────
CREATE OR REPLACE FUNCTION toggle_forum_like(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  already BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM forum_post_likes WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO already;

  IF already THEN
    DELETE FROM forum_post_likes WHERE post_id = p_post_id AND user_id = p_user_id;
    UPDATE forum_posts SET likes = GREATEST(0, likes - 1) WHERE id = p_post_id;
    RETURN FALSE;
  ELSE
    INSERT INTO forum_post_likes (post_id, user_id) VALUES (p_post_id, p_user_id);
    UPDATE forum_posts SET likes = likes + 1 WHERE id = p_post_id;
    RETURN TRUE;
  END IF;
END;
$$;

-- ── Increment view count ──────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_forum_post_views(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_posts SET view_count = view_count + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Seed data (initial community posts) ──────────────────────
INSERT INTO forum_posts (user_id, user_role, author_name, plan, title, body, category, pinned, tags, likes, reply_count, view_count)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'creator', 'Sarah Chen',     'max',  'How I went from 0 to $8,000/mo in 6 months on OgisBack',        E'When I started, I had 30K followers and zero brand deals. Here''s exactly what I changed — including how the AI bargain agent helped me close my first $2,000 deal...\n\n**1. Profile completeness matters more than follower count.**\nI filled every field — rates, bio, platform stats, niche tags. Brands filter by profile completeness first.\n\n**2. The AI bargain agent closed my first deal.**\nI set a floor rate of $1,500 for reels. The agent negotiated a $2,000 deal with NovaSkin within 48 hours.\n\n**3. Post consistently even when you have no deals.**\nI posted 3 times a week for 2 months before my first brand reached out. Your feed is your portfolio.\n\nBy month 6, I had $8K/mo from 4 recurring brand relationships.',                                                        'creator-tips',   true,  ARRAY['earnings','growth','beginner'], 284, 2, 3200),
  ('00000000-0000-0000-0000-000000000002', 'brand',   'NovaSkin',        'max',  'Dynamic pricing saved our Q3 campaign budget by 23%',             E'We ran 4 campaigns last quarter using the dynamic pricing engine on the Max plan.\n\nThe budget optimizer flagged two creators who were priced below market — we negotiated fairly and got better content quality as a result.\n\n**Results:**\n- 23% budget savings vs. manual negotiation baseline\n- 4.2× average engagement rate across all deliverables\n- 2 creators became recurring partners\n\nIf you''re on Max and haven''t explored the pricing engine, you''re leaving money on the table.',                                                                                                                                                                                                 'brand-collab',   false, ARRAY['brands','roi','pricing'],        156, 0, 1800),
  ('00000000-0000-0000-0000-000000000003', 'creator', 'Priya Sharma',    'mini', 'What rate should I charge for a 90-second Reel? (beauty niche, 150K followers)', E'I''ve been quoted everything from $300 to $1,500 for the same deliverable. Is there a standard?\n\nI know Max plan has the dynamic pricing engine but I''m on Mini right now. Here''s my situation:\n- 150K Instagram followers\n- 4.1% engagement rate\n- Beauty niche\n- 90-second sponsored Reel, full usage rights\n\nWhat are you all charging? I don''t want to undersell myself but I also don''t want to lose deals by pricing too high.', 'pricing',        false, ARRAY['rates','beauty','reels'],        98,  2, 2400),
  ('00000000-0000-0000-0000-000000000004', 'brand',   'OgisBack Team',   'max',  E'🎉 OgisBack just launched Mini & Max plans — here''s what''s new',    E'Big news: we''ve launched our subscription plans!\n\n**Creator Plans:**\n- Free: 20% platform fee, 5 posts/month\n- Mini ($19/mo): 18% fee, 50 posts/month, priority support\n- Max ($30/mo): 15% fee, unlimited posts, AI bargain agent, featured listing\n\n**Brand Plans:**\n- Free: Basic discovery access\n- Mini ($49/mo): Advanced filters, unlimited campaigns\n- Max ($149/mo): Dynamic pricing engine, dedicated account manager, analytics dashboard\n\nAll paid plans include a 7-day free trial. Upgrade anytime from your Settings page.',                                                                      'announcements',  true,  ARRAY['announcement','plans','new'],   512, 0, 8900),
  ('00000000-0000-0000-0000-000000000005', 'creator', 'Marcus Williams', 'mini', 'The AI bargain agent lowballed my rate — how to override it',      E'I love the bargain agent but last week it suggested $600 for a campaign I''d normally charge $900 for.\n\nHere''s the fix: go to your Profile Edit page → Rates section. Set your rate fields. The AI bargain agent uses these as its floor — it will never negotiate below what you set.\n\nThe issue is that if your rate fields are empty or set to $0, the agent has no floor and will optimize purely for deal volume, which can mean underpricing.\n\nSet your rates, review the agent''s proposals before accepting, and you''re good.',                                                                                            'creator-tips',   false, ARRAY['ai-agent','tips','pricing'],     143, 0, 1900),
  ('00000000-0000-0000-0000-000000000006', 'creator', 'Emma Rodriguez',  'max',  'Featured listing actually works — proof inside',                   E'I upgraded to Max 3 weeks ago. Here are my actual numbers:\n\n**Before (Mini plan):**\n- Profile views: ~120/week\n- Brand inquiries: 2/month\n- Deals closed: 1/month avg\n\n**After (Max plan, week 3):**\n- Profile views: ~528/week (+340%)\n- Brand inquiries: 11/month\n- Deals closed: 4/month\n\nThe featured listing puts you at the top of brand search results in your niche. The math is simple: $30/mo for one extra deal that pays $300+ is a no-brainer.',                                                                                                                                                            'creator-tips',   false, ARRAY['featured','growth','proof'],     327, 0, 4100)
ON CONFLICT DO NOTHING;
