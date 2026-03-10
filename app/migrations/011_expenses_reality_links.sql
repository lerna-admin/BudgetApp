ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS source_account_id UUID,
  ADD COLUMN IF NOT EXISTS debt_id UUID,
  ADD COLUMN IF NOT EXISTS savings_goal_id UUID;

CREATE INDEX IF NOT EXISTS idx_expenses_source_account ON expenses(source_account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_destination_account ON expenses(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_debt_id ON expenses(debt_id);
CREATE INDEX IF NOT EXISTS idx_expenses_savings_goal_id ON expenses(savings_goal_id);
