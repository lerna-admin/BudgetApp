ALTER TABLE friends ADD COLUMN IF NOT EXISTS contact_normalized TEXT;

UPDATE friends
SET contact_normalized = LOWER(REGEXP_REPLACE(TRIM(contact), E'\\s+', '', 'g'))
WHERE contact_normalized IS NULL OR contact_normalized = '';

ALTER TABLE friends ALTER COLUMN contact_normalized SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS friends_user_contact_normalized_idx
  ON friends(user_id, contact_normalized);
