ALTER TABLE expenses ADD COLUMN IF NOT EXISTS destination_account_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS destination_note TEXT;
