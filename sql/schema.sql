-- P&L Simulation — Database Schema
-- Run: psql $DATABASE_URL -f sql/schema.sql

CREATE TABLE IF NOT EXISTS projects (
  id         BIGSERIAL PRIMARY KEY,
  code       TEXT NOT NULL DEFAULT '',
  name       TEXT NOT NULL DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date   TEXT DEFAULT '',
  currency   TEXT DEFAULT 'USD',
  status     TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS versions (
  id         BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'bidding',
  date       TEXT DEFAULT '',
  note       TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actual_entries (
  id                 BIGSERIAL PRIMARY KEY,
  project_id         BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tab                TEXT NOT NULL,           -- 'prime' | 'supplier'
  month              TEXT DEFAULT '',
  imported_at        TEXT DEFAULT '',
  file_name          TEXT DEFAULT '',
  selected_codes     TEXT[] DEFAULT '{}',
  offshore_actual_mm NUMERIC DEFAULT 0,
  onsite_actual_mm   NUMERIC DEFAULT 0,
  actual_revenue     NUMERIC DEFAULT 0,
  actual_direct_cost NUMERIC DEFAULT 0,
  calendar_effort    NUMERIC DEFAULT 0,
  rows               JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS admin_config (
  id                      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  target_gross_margin     NUMERIC DEFAULT 40,
  target_direct_margin    NUMERIC DEFAULT 54,
  project_income_pct      NUMERIC DEFAULT 30,
  roles                   JSONB DEFAULT '[]',
  contract_types          JSONB DEFAULT '[]',
  locations               JSONB DEFAULT '[]',
  other_cost_cats         JSONB DEFAULT '[]',
  cost_ref                JSONB DEFAULT '{}',
  last_updated_roles      TEXT,
  last_updated_contracts  TEXT,
  last_updated_locations  TEXT,
  last_updated_other_cats TEXT,
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
