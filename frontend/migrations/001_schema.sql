-- Base schema for BudgetApp backend (PostgreSQL)

CREATE TABLE IF NOT EXISTS countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  timezone TEXT NOT NULL,
  default_language TEXT NOT NULL,
  legal_notes TEXT,
  banking_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  country_code TEXT REFERENCES countries(code),
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'individual',
  billing_user_id UUID REFERENCES users(id),
  currency TEXT NOT NULL,
  members_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banks (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  institution_code TEXT,
  country_code TEXT REFERENCES countries(code),
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bank_id UUID REFERENCES banks(id),
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  external_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bank_id UUID REFERENCES banks(id),
  card_name TEXT,
  card_type TEXT,
  credit_limit NUMERIC,
  available_credit NUMERIC,
  currency TEXT,
  expiration DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bank_id UUID REFERENCES banks(id),
  card_id UUID REFERENCES cards(id),
  account_id UUID REFERENCES accounts(id),
  debt_type TEXT NOT NULL,
  principal NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  minimum_payment NUMERIC,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY,
  debt_id UUID REFERENCES debts(id),
  user_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  primary_goal TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_objectives (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  frequency TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_selections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  profile_id UUID REFERENCES profiles(id),
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY,
  owner_type TEXT NOT NULL,
  owner_id UUID,
  household_id UUID REFERENCES households(id),
  period TEXT NOT NULL,
  country_code TEXT REFERENCES countries(code),
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  start_balance NUMERIC NOT NULL DEFAULT 0,
  categories_json JSONB NOT NULL,
  totals_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  budget_id UUID REFERENCES budgets(id),
  account_id UUID REFERENCES accounts(id),
  country_code TEXT REFERENCES countries(code),
  date TIMESTAMPTZ NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  category_id TEXT,
  method TEXT,
  status TEXT NOT NULL DEFAULT 'posted',
  source TEXT,
  notes TEXT,
  tags_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  household_id UUID REFERENCES households(id),
  type TEXT NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  payload_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  criteria_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata_json JSONB
);

CREATE TABLE IF NOT EXISTS gamification_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT,
  reference_id UUID,
  details_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT,
  channel TEXT,
  payload_json JSONB,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
