CREATE TABLE IF NOT EXISTS recurring_bills (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bill_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  goal_name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount >= 0),
  current_amount NUMERIC NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  monthly_target NUMERIC CHECK (monthly_target IS NULL OR monthly_target >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  target_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_bills_user ON recurring_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_active ON recurring_bills(is_active);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON savings_goals(status);
