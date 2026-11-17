-- T025 (US1): catálogo, estoque, pedido e lote de produção (data-model.md).
-- Valores numéricos inteiros com o sufixo da unidade (data-model.md, "Unidades e representação").

CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  payment_terms TEXT,
  average_lead_time_days INTEGER CHECK (average_lead_time_days IS NULL OR average_lead_time_days >= 0),
  contact TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE colors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  hex TEXT CHECK (hex IS NULL OR (length(hex) = 7 AND hex GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'))
);

CREATE TABLE materials (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('Filament', 'Resin', 'SparePart', 'Packaging', 'Other')),
  brand TEXT,
  diameter_um INTEGER CHECK (diameter_um IS NULL OR diameter_um > 0),
  color_id INTEGER REFERENCES colors(id),
  reference_cost_cents_per_kg INTEGER NOT NULL DEFAULT 0 CHECK (reference_cost_cents_per_kg >= 0),
  reorder_point_mg INTEGER CHECK (reorder_point_mg IS NULL OR reorder_point_mg >= 0)
);

CREATE TABLE material_lots (
  id INTEGER PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  lot_code TEXT NOT NULL CHECK (length(lot_code) > 0),
  received_at TEXT NOT NULL,
  initial_weight_mg INTEGER NOT NULL CHECK (initial_weight_mg > 0),
  current_weight_mg INTEGER NOT NULL CHECK (current_weight_mg >= 0 AND current_weight_mg <= initial_weight_mg),
  cost_cents_per_kg INTEGER NOT NULL CHECK (cost_cents_per_kg >= 0),
  UNIQUE (material_id, lot_code)
);

CREATE TABLE stock_items (
  id INTEGER PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  material_lot_id INTEGER REFERENCES material_lots(id),
  quantity_mg INTEGER NOT NULL CHECK (quantity_mg >= 0),
  reserved_mg INTEGER NOT NULL DEFAULT 0 CHECK (reserved_mg >= 0 AND reserved_mg <= quantity_mg)
);

-- print_run_id e purchase_receipt_id ganham chave estrangeira lógica quando
-- suas tabelas existirem (0005 e 0006); o SQLite não permite acrescentá-la depois.
CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('PurchaseIn', 'ProductionOut', 'Adjustment', 'Reserve', 'Unreserve', 'Waste')),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  stock_item_id INTEGER REFERENCES stock_items(id),
  quantity_mg INTEGER NOT NULL CHECK (quantity_mg > 0),
  unit_cost_cents_per_kg INTEGER NOT NULL CHECK (unit_cost_cents_per_kg >= 0),
  created_at TEXT NOT NULL,
  user_id TEXT NOT NULL,
  production_lot_id INTEGER,
  print_run_id INTEGER,
  purchase_receipt_id INTEGER
);

CREATE TABLE print_profiles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  material_id INTEGER REFERENCES materials(id),
  pieces_per_plate INTEGER NOT NULL CHECK (pieces_per_plate >= 1),
  seconds_per_plate INTEGER NOT NULL CHECK (seconds_per_plate > 0),
  mg_per_plate INTEGER NOT NULL CHECK (mg_per_plate > 0)
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  sku TEXT NOT NULL UNIQUE,
  default_sell_price_cents INTEGER NOT NULL CHECK (default_sell_price_cents >= 0),
  default_print_profile_id INTEGER REFERENCES print_profiles(id),
  default_material_id INTEGER REFERENCES materials(id),
  is_for_sale INTEGER NOT NULL DEFAULT 1 CHECK (is_for_sale IN (0, 1))
);

CREATE TABLE product_colors (
  product_id INTEGER NOT NULL REFERENCES products(id),
  color_id INTEGER NOT NULL REFERENCES colors(id),
  PRIMARY KEY (product_id, color_id)
);

CREATE TABLE product_sizes (
  product_id INTEGER NOT NULL REFERENCES products(id),
  size TEXT NOT NULL CHECK (length(size) > 0),
  PRIMARY KEY (product_id, size)
);

CREATE TABLE printers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  model TEXT,
  cost_cents_per_hour INTEGER NOT NULL CHECK (cost_cents_per_hour >= 0),
  energy_wh_per_hour INTEGER CHECK (energy_wh_per_hour IS NULL OR energy_wh_per_hour >= 0),
  maintenance_limit_hours INTEGER NOT NULL CHECK (maintenance_limit_hours > 0),
  accumulated_seconds INTEGER NOT NULL DEFAULT 0 CHECK (accumulated_seconds >= 0),
  preparation_seconds INTEGER NOT NULL DEFAULT 0 CHECK (preparation_seconds >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  operational_status TEXT NOT NULL DEFAULT 'Available'
    CHECK (operational_status IN ('Available', 'Printing', 'AwaitingPickup', 'Preparing', 'InMaintenance', 'Unavailable')),
  hour_rate_excludes_filament_and_energy INTEGER NOT NULL DEFAULT 1 CHECK (hour_rate_excludes_filament_and_energy = 1)
);

CREATE TABLE printer_materials (
  printer_id INTEGER NOT NULL REFERENCES printers(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  PRIMARY KEY (printer_id, material_id)
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) > 0),
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE sales_orders (
  id INTEGER PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  quote_id INTEGER,
  commercial_status TEXT NOT NULL CHECK (commercial_status IN
    ('QuotePending', 'Approved', 'InProduction', 'AwaitingFinishing', 'ReadyToShip', 'Delivered', 'Cancelled')),
  promised_date TEXT,
  freight_cents INTEGER NOT NULL DEFAULT 0 CHECK (freight_cents >= 0),
  packaging_cents INTEGER NOT NULL DEFAULT 0 CHECK (packaging_cents >= 0),
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE order_lines (
  id INTEGER PRIMARY KEY,
  sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  material_id INTEGER REFERENCES materials(id),
  color_id INTEGER REFERENCES colors(id),
  size TEXT
);

CREATE TABLE production_lots (
  id INTEGER PRIMARY KEY,
  sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id),
  order_line_id INTEGER NOT NULL REFERENCES order_lines(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  lot_index INTEGER NOT NULL CHECK (lot_index >= 1),
  qty_planned INTEGER NOT NULL CHECK (qty_planned > 0),
  qty_completed INTEGER NOT NULL DEFAULT 0 CHECK (qty_completed >= 0 AND qty_completed <= qty_planned),
  status TEXT NOT NULL CHECK (status IN
    ('AwaitingPlanning', 'Released', 'Queued', 'Printing', 'Paused', 'AwaitingPickup', 'Completed', 'Failed', 'Cancelled')),
  planned_mg INTEGER NOT NULL CHECK (planned_mg > 0),
  planned_seconds INTEGER NOT NULL CHECK (planned_seconds > 0),
  created_at TEXT NOT NULL,
  released_at TEXT,
  completed_at TEXT,
  UNIQUE (sales_order_id, lot_index)
);

CREATE TABLE production_material_reservations (
  id INTEGER PRIMARY KEY,
  production_lot_id INTEGER NOT NULL REFERENCES production_lots(id),
  stock_item_id INTEGER NOT NULL REFERENCES stock_items(id),
  reserved_mg INTEGER NOT NULL CHECK (reserved_mg > 0)
);

CREATE TABLE print_queue_items (
  id INTEGER PRIMARY KEY,
  production_lot_id INTEGER NOT NULL UNIQUE REFERENCES production_lots(id),
  printer_id INTEGER REFERENCES printers(id),
  priority INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL CHECK (position >= 1),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_material_lots_material ON material_lots (material_id, received_at, id);
CREATE INDEX idx_stock_items_material ON stock_items (material_id);
CREATE INDEX idx_production_lots_order ON production_lots (sales_order_id, order_line_id);
CREATE INDEX idx_production_lots_status ON production_lots (status);
