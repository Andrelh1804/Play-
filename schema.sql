-- PLAY+EVENTOS Enterprise V2.0 — PostgreSQL Schema
-- Run once to initialize the database

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TENANTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'enterprise',
  active        BOOLEAN NOT NULL DEFAULT true,
  currency      TEXT NOT NULL DEFAULT 'BRL',
  language      TEXT NOT NULL DEFAULT 'pt-BR',
  custom_domain TEXT,
  cnpj          TEXT,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'VIEWER',
  active        BOOLEAN NOT NULL DEFAULT true,
  last_login    TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, tenant_id)
);

-- ── REFRESH TOKENS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EVENTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  code                 TEXT,
  type                 TEXT NOT NULL DEFAULT 'SHOW',
  modality             TEXT NOT NULL DEFAULT 'PRESENCIAL',
  date                 TEXT NOT NULL,
  description          TEXT,
  status               TEXT NOT NULL DEFAULT 'PLANNING',
  organizer            TEXT,
  contractor           TEXT,
  technical_responsible TEXT,
  objectives           TEXT,
  target_audience      TEXT,
  age_classification   TEXT,
  primary_language     TEXT DEFAULT 'pt-BR',
  location             TEXT,
  country              TEXT,
  state                TEXT,
  city                 TEXT,
  address              TEXT,
  zip_code             TEXT,
  coordinates          JSONB,
  map_link             TEXT,
  emergency_routes     TEXT,
  capacity             INTEGER NOT NULL DEFAULT 1000,
  expected_participants INTEGER,
  ticket_price         NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url            TEXT,
  budget_ratio         NUMERIC(5,4) DEFAULT 0.7,
  phases               JSONB DEFAULT '[]',
  checklist            JSONB DEFAULT '[]',
  schedule             JSONB DEFAULT '[]',
  infrastructure       JSONB DEFAULT '[]',
  logistics            JSONB DEFAULT '[]',
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TICKETS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'STANDARD',
  price               NUMERIC(12,2) NOT NULL DEFAULT 0,
  buyer_name          TEXT,
  buyer_email         TEXT,
  qr_code             TEXT,
  checked_in          BOOLEAN DEFAULT false,
  checked_in_at       TIMESTAMPTZ,
  check_out_at        TIMESTAMPTZ,
  reentry_count       INTEGER DEFAULT 0,
  seat                TEXT,
  cpf                 TEXT,
  batch_id            TEXT,
  batch_name          TEXT,
  payment_method      TEXT,
  payment_status      TEXT DEFAULT 'PAID',
  coupon_code         TEXT,
  discount_amount     NUMERIC(12,2),
  original_price      NUMERIC(12,2),
  category            TEXT,
  distance            TEXT,
  team                TEXT,
  club                TEXT,
  federation          TEXT,
  bib_number          TEXT,
  chip_number         TEXT,
  shirt_size          TEXT,
  has_term_signed     BOOLEAN DEFAULT false,
  has_medical_cert    BOOLEAN DEFAULT false,
  has_insurance       BOOLEAN DEFAULT false,
  kit_delivered       BOOLEAN DEFAULT false,
  credential_type     TEXT,
  credential_printed  BOOLEAN DEFAULT false,
  access_zones        JSONB DEFAULT '[]',
  transferred_to_name  TEXT,
  transferred_to_email TEXT,
  transferred_at      TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancel_reason       TEXT,
  refund_status       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── COUPONS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id       UUID REFERENCES events(id) ON DELETE SET NULL,
  code           TEXT NOT NULL,
  discount_type  TEXT NOT NULL DEFAULT 'pct',
  discount_value NUMERIC(12,2) NOT NULL,
  max_uses       INTEGER,
  used_count     INTEGER NOT NULL DEFAULT 0,
  valid_from     DATE,
  valid_until    DATE,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code, tenant_id)
);

-- ── FINANCE TRANSACTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,
  category    TEXT,
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  description TEXT,
  date        DATE,
  status      TEXT DEFAULT 'PAID',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SUPPLIERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  category       TEXT,
  rating         NUMERIC(3,2) DEFAULT 5,
  price_per_hour NUMERIC(12,2) DEFAULT 0,
  email          TEXT,
  phone          TEXT,
  availability   JSONB DEFAULT '[]',
  portfolio_url  TEXT,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BOOKINGS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
  date        DATE,
  cost        NUMERIC(12,2) DEFAULT 0,
  status      TEXT DEFAULT 'APPROVED',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CRM LEADS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_leads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  company        TEXT,
  type           TEXT DEFAULT 'CLIENT',
  email          TEXT,
  phone          TEXT,
  pipeline_stage TEXT DEFAULT 'LEAD',
  value          NUMERIC(12,2) DEFAULT 0,
  notes          TEXT,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SPONSORSHIPS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsorships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  quota_name   TEXT,
  value        NUMERIC(12,2) DEFAULT 0,
  deliverables JSONB DEFAULT '[]',
  status       TEXT DEFAULT 'PROPOSAL',
  roi_ratio    NUMERIC(6,4) DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PURCHASE ORDERS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  amount        NUMERIC(12,2) DEFAULT 0,
  status        TEXT DEFAULT 'PENDING',
  supplier_name TEXT,
  date          DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── STAFF MEMBERS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id        UUID REFERENCES events(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  role            TEXT,
  email           TEXT,
  phone           TEXT,
  check_in_status TEXT DEFAULT 'offline',
  gps_coords      JSONB,
  hours_worked    NUMERIC(8,2) DEFAULT 0,
  uniform_size    TEXT,
  hourly_rate     NUMERIC(8,2) DEFAULT 25,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── STAFF TEAMS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  area          TEXT,
  leader_name   TEXT,
  members_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── STAFF SHIFTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  staff_name      TEXT,
  event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
  event_name      TEXT,
  date            DATE,
  start_time      TEXT,
  end_time        TEXT,
  hours_allocated NUMERIC(6,2) DEFAULT 8,
  role            TEXT,
  status          TEXT DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TIME CLOCKS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_clocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  staff_name    TEXT,
  event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type          TEXT NOT NULL,
  method        TEXT DEFAULT 'DIGITAL_GPS',
  gps_coords    JSONB,
  location_name TEXT
);

-- ── FREELANCER PAYMENTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS freelancer_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id       UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  staff_name     TEXT,
  event_id       UUID REFERENCES events(id) ON DELETE SET NULL,
  role           TEXT,
  amount         NUMERIC(12,2) DEFAULT 0,
  hours_total    NUMERIC(8,2) DEFAULT 0,
  status         TEXT DEFAULT 'PENDING',
  payment_date   DATE,
  payment_method TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── STAFF MESSAGES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_role TEXT,
  message     TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  channel     TEXT DEFAULT 'GENERAL'
);

-- ── DOCUMENT CONTRACTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_contracts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  type        TEXT,
  content     TEXT,
  status      TEXT DEFAULT 'DRAFT',
  signed_by   JSONB DEFAULT '[]',
  signed_at   TIMESTAMPTZ,
  audit_trail JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MARKETING CAMPAIGNS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES events(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  channel          TEXT,
  subject          TEXT,
  content          TEXT,
  scheduled_at     TIMESTAMPTZ,
  target_segment   TEXT,
  status           TEXT DEFAULT 'DRAFT',
  sent_count       INTEGER DEFAULT 0,
  conversion_rate  NUMERIC(5,4) DEFAULT 0,
  opens            INTEGER DEFAULT 0,
  clicks           INTEGER DEFAULT 0,
  conversions      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LEAD FLOWS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_flows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  trigger_event TEXT NOT NULL,
  steps         JSONB DEFAULT '[]',
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SALES FUNNELS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_funnels (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id       UUID REFERENCES events(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  target_product TEXT,
  stages         JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EVENT PLANNINGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_plannings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  strategic_goal TEXT,
  phases         JSONB DEFAULT '[]',
  risks          JSONB DEFAULT '[]',
  milestones     JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SUPPORT TICKETS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT DEFAULT 'ti',
  priority    TEXT DEFAULT 'medium',
  status      TEXT DEFAULT 'open',
  sla_hours   INTEGER DEFAULT 24,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
  resolution  TEXT,
  resolved_at TIMESTAMPTZ,
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SUPPORT TICKET COMMENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_role TEXT,
  content     TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DOCUMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'other',
  description TEXT,
  file_name   TEXT,
  file_path   TEXT,
  file_size   BIGINT DEFAULT 0,
  mime_type   TEXT,
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  tags        JSONB DEFAULT '[]',
  ai_summary  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOGS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT,
  resource      TEXT,
  resource_id   TEXT,
  resource_type TEXT,
  details       JSONB DEFAULT '{}',
  metadata      JSONB DEFAULT '{}',
  ip_address    TEXT,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── GATEWAY LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gateway_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method        TEXT,
  path          TEXT,
  client_ip     TEXT,
  status_code   INTEGER,
  duration_ms   INTEGER,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE SET NULL,
  audit_details TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SEED DATA ─────────────────────────────────────────────────────────────────

-- Default tenant
INSERT INTO tenants (id, name, plan, active, currency, language)
VALUES ('00000000-0000-0000-0000-000000000001', 'PLAY+EVENTOS Demo', 'enterprise', true, 'BRL', 'pt-BR')
ON CONFLICT DO NOTHING;

-- Default admin user (password: Admin@123)
-- bcryptjs $2b$ hash of "Admin@123" with cost 12
INSERT INTO users (tenant_id, name, email, password_hash, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Administrador',
  'admin@eventflow.com.br',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgkuWXBpFYhfJjDPBkrJAG',
  'SUPER_ADMIN'
)
ON CONFLICT (email, tenant_id) DO NOTHING;

-- Demo supplier
INSERT INTO suppliers (name, category, rating, price_per_hour, email, phone, availability)
VALUES
  ('Som & Luz Eventos', 'Audiovisual', 4.9, 350, 'contato@somluz.com.br', '(11) 99999-0001', '["Segunda","Quarta","Sexta","Sábado","Domingo"]'),
  ('Buffet Gourmet Plus', 'Alimentação', 4.7, 180, 'buffet@gourmetplus.com.br', '(11) 99999-0002', '["Todos os dias"]'),
  ('Segurança Total', 'Segurança', 4.8, 120, 'ops@segurancatotal.com.br', '(11) 99999-0003', '["Sexta","Sábado","Domingo"]')
ON CONFLICT DO NOTHING;
