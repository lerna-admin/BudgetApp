ALTER TABLE debts
  ADD COLUMN IF NOT EXISTS debt_name TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS interest_rate_ea NUMERIC,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE debts
SET debt_name = COALESCE(NULLIF(TRIM(debt_name), ''), debt_type)
WHERE debt_name IS NULL OR TRIM(debt_name) = '';

UPDATE debts
SET interest_rate_ea = interest_rate
WHERE interest_rate_ea IS NULL;

CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);
