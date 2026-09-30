ALTER TABLE tables ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE tables ADD CONSTRAINT tables_status_check CHECK (status IN ('available', 'occupied'));

UPDATE branches b SET table_count = (
  SELECT COUNT(*) FROM tables t WHERE t.branch_id = b.branch_id AND t.is_active
);

CREATE INDEX IF NOT EXISTS idx_transactions_table_time
  ON transactions (table_id, transaction_at DESC) WHERE table_id IS NOT NULL;