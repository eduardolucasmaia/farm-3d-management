-- T010: usuários e parâmetros da farm (data-model.md, "User" e "FarmSettings").

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  name TEXT NOT NULL CHECK (length(name) > 0),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Sales', 'Production', 'Purchasing', 'Operator')),
  failed_login_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE farm_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  energy_tariff_cents_per_mwh INTEGER CHECK (energy_tariff_cents_per_mwh IS NULL OR energy_tariff_cents_per_mwh >= 0),
  calendar_summary TEXT NOT NULL CHECK (length(calendar_summary) > 0),
  work_days TEXT NOT NULL,
  work_start TEXT NOT NULL,
  work_end TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  examples_are_fictional INTEGER NOT NULL CHECK (examples_are_fictional = 1)
);

INSERT INTO farm_settings (
  id, energy_tariff_cents_per_mwh, calendar_summary, work_days, work_start, work_end, time_zone, examples_are_fictional
) VALUES (
  1, NULL, 'segunda a sexta, 08:00–18:00', '1,2,3,4,5', '08:00', '18:00', 'America/Sao_Paulo', 1
);
