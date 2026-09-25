CREATE TABLE branches (
  branch_id       SERIAL PRIMARY KEY,
  branch_name     VARCHAR NOT NULL,
  location        TEXT,
  contact_number  VARCHAR,
  table_count     INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tables (
  table_id        SERIAL PRIMARY KEY,
  branch_id       INT NOT NULL REFERENCES branches(branch_id),
  table_number    INT NOT NULL,
  guest_capacity  INT DEFAULT 4,
  status          VARCHAR(10) NOT NULL DEFAULT 'available',
  UNIQUE (branch_id, table_number)
);

CREATE TABLE users (
  user_id     SERIAL PRIMARY KEY,
  branch_id   INT REFERENCES branches(branch_id),
  full_name   VARCHAR NOT NULL,
  user_name   VARCHAR UNIQUE NOT NULL,
  password    VARCHAR NOT NULL,
  role        VARCHAR(10) NOT NULL CHECK (role IN ('owner','cashier')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
  item_id       SERIAL PRIMARY KEY,
  item_name     VARCHAR NOT NULL,
  category      VARCHAR,
  selling_price NUMERIC(10,2) NOT NULL,
  is_available  BOOLEAN DEFAULT TRUE,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingredients (
  ingredient_id   SERIAL PRIMARY KEY,
  ingredient_name VARCHAR NOT NULL,
  unit            VARCHAR NOT NULL,
  unit_cost       NUMERIC(10,2) NOT NULL,
  supplier_name   VARCHAR,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bill_of_materials (
  bom_id             SERIAL PRIMARY KEY,
  item_id            INT NOT NULL REFERENCES menu_items(item_id),
  ingredient_id      INT NOT NULL REFERENCES ingredients(ingredient_id),
  quantity_per_unit  NUMERIC(10,3) NOT NULL,
  unit               VARCHAR,
  notes              TEXT
);

CREATE TABLE inventory (
  inventory_id        SERIAL PRIMARY KEY,
  branch_id           INT NOT NULL REFERENCES branches(branch_id),
  ingredient_id       INT NOT NULL REFERENCES ingredients(ingredient_id),
  quantity_on_hand    NUMERIC(10,3) NOT NULL DEFAULT 0,
  reorder_threshold   NUMERIC(10,3) NOT NULL,   -- drives low-stock alert
  last_updated        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (branch_id, ingredient_id)
);

CREATE TABLE transactions (
  transaction_id  SERIAL PRIMARY KEY,
  branch_id       INT NOT NULL REFERENCES branches(branch_id),
  cashier_id      INT NOT NULL REFERENCES users(user_id),
  table_id        INT REFERENCES tables(table_id),
  order_type      VARCHAR(10) NOT NULL CHECK (order_type IN ('dine-in','take-out','delivery')),
  status          VARCHAR(10) NOT NULL DEFAULT 'pending',
  total_amount    NUMERIC(10,2) NOT NULL,
  payment_method  VARCHAR(20),
  receipt_url     TEXT,
  transaction_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transaction_items (
  tx_item_id      SERIAL PRIMARY KEY,
  transaction_id  INT NOT NULL REFERENCES transactions(transaction_id),
  item_id         INT NOT NULL REFERENCES menu_items(item_id),
  quantity        INT NOT NULL,
  unit_price      NUMERIC(10,2) NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL
);

CREATE TABLE ai_forecasts (
  forecast_id      SERIAL PRIMARY KEY,
  branch_id        INT NOT NULL REFERENCES branches(branch_id),
  item_id          INT NOT NULL REFERENCES menu_items(item_id),
  computed_date    DATE NOT NULL,
  moving_avg_qty   NUMERIC(10,2),
  trend_label      VARCHAR(10) CHECK (trend_label IN ('increasing','stable','decreasing')),
  recommendation   TEXT,
  reorder_qty      NUMERIC(10,2),
  computed_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_settings (
  setting_key    VARCHAR PRIMARY KEY,
  setting_value  VARCHAR NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE receipt_settings (
  branch_id       INT PRIMARY KEY REFERENCES branches(branch_id),
  business_name   VARCHAR,
  footer_message  TEXT
);