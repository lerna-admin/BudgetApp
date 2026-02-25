CREATE TABLE IF NOT EXISTS expense_custom_subcategories (
  id UUID PRIMARY KEY,
  category_label TEXT NOT NULL,
  name TEXT NOT NULL,
  edges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_subcategory_unique
  ON expense_custom_subcategories (LOWER(category_label), LOWER(name));
