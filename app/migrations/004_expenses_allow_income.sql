-- Allow income as movement_type and adjust check constraint
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_movement_type_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_movement_type_check
  CHECK (movement_type IN ('income','expense','saving','investment','transfer'));
