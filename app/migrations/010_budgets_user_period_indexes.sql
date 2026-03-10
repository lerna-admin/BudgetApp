CREATE INDEX IF NOT EXISTS idx_budgets_owner_period_status
  ON budgets(owner_type, owner_id, period, status);

CREATE INDEX IF NOT EXISTS idx_budgets_owner_updated
  ON budgets(owner_type, owner_id, updated_at DESC);
