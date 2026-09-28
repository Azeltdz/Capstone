ALTER TABLE transactions
  ADD COLUMN customer_name VARCHAR(100),
  ADD COLUMN guest_count   INT CHECK (guest_count IS NULL OR guest_count > 0);