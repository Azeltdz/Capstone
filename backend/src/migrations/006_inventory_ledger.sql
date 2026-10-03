-- 1) normalise unit spellings so the fixed list fits existing data
UPDATE ingredients SET unit = CASE lower(btrim(unit))
  WHEN 'g' THEN 'g' WHEN 'gram' THEN 'g' WHEN 'grams' THEN 'g'
  WHEN 'kg' THEN 'kg' WHEN 'kgs' THEN 'kg' WHEN 'kilo' THEN 'kg' WHEN 'kilogram' THEN 'kg' WHEN 'kilograms' THEN 'kg'
  WHEN 'ml' THEN 'mL' WHEN 'milliliter' THEN 'mL' WHEN 'milliliters' THEN 'mL'
  WHEN 'l' THEN 'L' WHEN 'liter' THEN 'L' WHEN 'liters' THEN 'L' WHEN 'litre' THEN 'L' WHEN 'litres' THEN 'L'
  WHEN 'pc' THEN 'pcs' WHEN 'pcs' THEN 'pcs' WHEN 'piece' THEN 'pcs' WHEN 'pieces' THEN 'pcs'
  WHEN 'dozen' THEN 'dozen'
  ELSE unit END;
UPDATE bill_of_materials b SET unit = i.unit
FROM ingredients i WHERE i.ingredient_id = b.ingredient_id AND b.unit IS DISTINCT FROM i.unit;

-- 2) the unit's kind, computed by the database so it can never disagree with the unit
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS unit_type VARCHAR(10) GENERATED ALWAYS AS (
  CASE WHEN unit IN ('g','kg') THEN 'weight'
        WHEN unit IN ('mL','L') THEN 'volume'
        WHEN unit IN ('pcs','dozen') THEN 'count'
        ELSE 'other' END) STORED;

-- 3) the ledger
CREATE TABLE IF NOT EXISTS inventory_movements (
  movement_id    BIGSERIAL PRIMARY KEY,
  inventory_id   INT NOT NULL REFERENCES inventory(inventory_id),
  movement_type  VARCHAR(12) NOT NULL
                  CHECK (movement_type IN ('opening','sale','restock','spoilage','adjustment')),
  quantity_delta NUMERIC(12,3) NOT NULL,
  quantity_after NUMERIC(12,3) NOT NULL CHECK (quantity_after >= 0),
  reason         TEXT,
  reference_type VARCHAR(20),
  reference_id   INT,
  performed_by   INT REFERENCES users(user_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movements_inventory_time
  ON inventory_movements (inventory_id, created_at DESC, movement_id DESC);

-- 4) today's stock becomes each record's opening balance (safe to re-run)
INSERT INTO inventory_movements (inventory_id, movement_type, quantity_delta, quantity_after, reason)
SELECT i.inventory_id, 'opening', i.quantity_on_hand, i.quantity_on_hand, 'Balance when stock tracking started'
FROM inventory i
WHERE NOT EXISTS (SELECT 1 FROM inventory_movements m WHERE m.inventory_id = i.inventory_id);