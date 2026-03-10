CREATE TABLE IF NOT EXISTS split_bills (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  currency TEXT NOT NULL,
  payer_type TEXT NOT NULL DEFAULT 'user',
  payer_friend_id UUID REFERENCES friends(id),
  participant_friend_ids UUID[] NOT NULL DEFAULT '{}',
  items_json JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS split_bills_user_id_idx ON split_bills(user_id);
