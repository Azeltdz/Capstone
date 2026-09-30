CREATE INDEX IF NOT EXISTS idx_transactions_time ON transactions (transaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_branch_time ON transactions (branch_id, transaction_at DESC);