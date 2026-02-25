-- Expenses and movements table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('expense','saving','investment','transfer')),
  date DATE NOT NULL,
  detail TEXT NOT NULL,
  notes TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT,
  subcategory TEXT,
  edge TEXT,
  method TEXT NOT NULL,
  bank TEXT,
  card TEXT,
  currency TEXT NOT NULL DEFAULT 'COP',
  tags TEXT[],
  attachments TEXT[],
  transfer_from TEXT,
  transfer_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
