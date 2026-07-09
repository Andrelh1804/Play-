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
  -- Public page fields (FASE 1 — Master Prompt V8.2)
  slug                 TEXT UNIQUE,
  hero_image           TEXT,
  regulations          TEXT,
  faq                  JSONB DEFAULT '[]',
  sponsors             JSONB DEFAULT '[]',
  gallery              JSONB DEFAULT '[]',
  cancellation_policy  TEXT,
  refund_policy        TEXT,
  route_map            TEXT,
  kit_info             TEXT,
  awards               TEXT,
  prize_info           TEXT,
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TICKET CATEGORIES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id       UUID REFERENCES events(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  type           TEXT NOT NULL DEFAULT 'STANDARD',
  color          TEXT DEFAULT '#6366f1',
  total_capacity INTEGER NOT NULL DEFAULT 100,
  sold_count     INTEGER NOT NULL DEFAULT 0,
  active         BOOLEAN NOT NULL DEFAULT true,
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TICKET BATCHES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id          UUID REFERENCES events(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES ticket_categories(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  price             NUMERIC(12,2) NOT NULL DEFAULT 0,
  original_price    NUMERIC(12,2),
  quantity          INTEGER NOT NULL DEFAULT 100,
  sold_count        INTEGER NOT NULL DEFAULT 0,
  start_date        DATE,
  end_date          DATE,
  start_time        TEXT,
  end_time          TEXT,
  status            TEXT NOT NULL DEFAULT 'SCHEDULED',
  sort_order        INTEGER DEFAULT 0,
  promotional_price NUMERIC(12,2),
  discount_pct      NUMERIC(5,2) DEFAULT 0,
  fees_pct          NUMERIC(5,2) DEFAULT 0,
  max_per_purchase  INTEGER DEFAULT 10,
  max_per_cpf       INTEGER DEFAULT 1,
  promo_code        TEXT,
  auto_next         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── COST TEMPLATES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cost_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'Outros',
  subcategory      TEXT,
  unit             TEXT DEFAULT 'unidade',
  default_price    NUMERIC(12,2) DEFAULT 0,
  default_supplier TEXT,
  notes            TEXT,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EVENT FINANCIAL PLANS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_financial_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  name       TEXT NOT NULL DEFAULT 'Planejamento Financeiro',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EVENT REVENUES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_revenues (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID REFERENCES event_financial_plans(id) ON DELETE CASCADE,
  tenant_id        UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES events(id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  description      TEXT,
  estimated_value  NUMERIC(14,2) DEFAULT 0,
  contracted_value NUMERIC(14,2) DEFAULT 0,
  received_value   NUMERIC(14,2) DEFAULT 0,
  status           TEXT DEFAULT 'PREVISTO',
  responsible      TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EVENT EXPENSES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID REFERENCES event_financial_plans(id) ON DELETE CASCADE,
  tenant_id        UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id         UUID REFERENCES events(id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  subcategory      TEXT,
  description      TEXT NOT NULL,
  quantity         INTEGER DEFAULT 1,
  unit_price       NUMERIC(12,2) DEFAULT 0,
  total_price      NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  supplier         TEXT,
  status           TEXT DEFAULT 'PREVISTO',
  notes            TEXT,
  cost_template_id UUID REFERENCES cost_templates(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  '$2b$12$PfR8iQslVXmbgsoyzXjxx.brYKgYlpamPnLz7HqeRuWe8.GLaYnDi',
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

-- ── COST TEMPLATES (reusable event cost bank — 25 default items) ─────────────
INSERT INTO cost_templates (tenant_id, name, category, subcategory, unit, default_price, notes)
VALUES
  ('00000000-0000-0000-0000-000000000001','Palco principal','Estrutura','Palco','unidade',15000.00,'Palco 10x8m com cobertura'),
  ('00000000-0000-0000-0000-000000000001','Pórtico de largada/chegada','Estrutura','Pórtico','unidade',3500.00,'Inflável 6m'),
  ('00000000-0000-0000-0000-000000000001','Gradil metálico','Estrutura','Gradil','metro',25.00,'Por metro linear'),
  ('00000000-0000-0000-0000-000000000001','Barricadas','Estrutura','Barricadas','unidade',80.00,'Barricada de segurança'),
  ('00000000-0000-0000-0000-000000000001','Tenda 10x10','Estrutura','Tendas','unidade',1200.00,'Tenda gazebo'),
  ('00000000-0000-0000-0000-000000000001','Banheiro químico','Estrutura','Banheiros','unidade',350.00,'Locação diária'),
  ('00000000-0000-0000-0000-000000000001','Sistema PA completo','Sonorização','PA','serviço',8000.00,'PA + sub + processamento'),
  ('00000000-0000-0000-0000-000000000001','Técnico de som','Sonorização','Técnicos','diária',600.00,'Técnico especializado'),
  ('00000000-0000-0000-0000-000000000001','Moving head','Iluminação','Moving','unidade',400.00,'Locação diária por unidade'),
  ('00000000-0000-0000-0000-000000000001','Painel LED','Iluminação','LED','m²',300.00,'Por metro quadrado'),
  ('00000000-0000-0000-0000-000000000001','Banner 3x2','Comunicação Visual','Banner','unidade',180.00,'Impressão + estrutura'),
  ('00000000-0000-0000-0000-000000000001','Backdrop personalizado','Comunicação Visual','Backdrop','unidade',800.00,'3x2m impresso'),
  ('00000000-0000-0000-0000-000000000001','Chip de cronometragem','Esportes','Cronometragem','unidade',15.00,'Por atleta'),
  ('00000000-0000-0000-0000-000000000001','Medalha personalizada','Esportes','Medalhas','unidade',12.00,'Medalha de zinco com fita'),
  ('00000000-0000-0000-0000-000000000001','Troféu','Esportes','Troféus','unidade',85.00,'Troféu acrílico com base'),
  ('00000000-0000-0000-0000-000000000001','Kit do atleta','Esportes','Kits','unidade',45.00,'Sacola, camiseta, boné'),
  ('00000000-0000-0000-0000-000000000001','Camiseta técnica','Esportes','Camisas','unidade',28.00,'Dry-fit sublimada'),
  ('00000000-0000-0000-0000-000000000001','Bombeiro civil','Segurança','Bombeiros','diária',500.00,'Por bombeiro'),
  ('00000000-0000-0000-0000-000000000001','Ambulância UTI','Segurança','Ambulância','diária',2500.00,'Com paramédico'),
  ('00000000-0000-0000-0000-000000000001','Segurança patrimonial','Segurança','Segurança privada','diária',200.00,'Por agente'),
  ('00000000-0000-0000-0000-000000000001','Staff operacional','Operação','Staff','diária',150.00,'Por colaborador'),
  ('00000000-0000-0000-0000-000000000001','Limpeza e zeladoria','Operação','Limpeza','serviço',1200.00,'Equipe completa'),
  ('00000000-0000-0000-0000-000000000001','Tráfego pago (Meta/Google)','Marketing','Tráfego pago','serviço',3000.00,'Verba de mídia'),
  ('00000000-0000-0000-0000-000000000001','Fotografia profissional','Marketing','Fotografia','diária',1800.00,'Fotógrafo + edição'),
  ('00000000-0000-0000-0000-000000000001','Filmagem + drone','Marketing','Filmagem','diária',2500.00,'Cinegrafista + drone')
ON CONFLICT DO NOTHING;

-- ── DEMO EVENT WITH PUBLIC PAGE ───────────────────────────────────────────────
INSERT INTO events (
  tenant_id, name, code, type, modality, date, description, status,
  location, city, state, address, capacity, ticket_price,
  slug, regulations, faq, schedule, cancellation_policy, refund_policy
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Corrida PLAY+ 10k 2025',
  'PE-CORRIDA-001',
  'CORRIDA','PRESENCIAL',
  '2025-11-15 07:00:00',
  'A maior corrida de rua da cidade! Percursos de 5km e 10km com largada no Centro Olímpico. Medalha para todos os finishers, kit especial para inscritos até o 1º lote e premiação em dinheiro para os 3 primeiros de cada categoria.',
  'ACTIVE',
  'Centro Olímpico Municipal','São Paulo','SP','Av. Paulista, 1578 — Bela Vista',
  3000, 89.90,
  'corrida-play-10k-2025',
  'REGULAMENTO\n\n1. A largada ocorre às 07h00 (10km) e 07h30 (5km).\n2. Obrigatório apresentar documento com foto na retirada do kit.\n3. Proibido o uso de fones de ouvido na prova.\n4. A prova terá pontos de hidratação a cada 2km.\n5. Medalha garantida para todos que cruzarem a linha de chegada.',
  '[{"question":"Como retiro o kit?","answer":"A retirada do kit acontece nos dias 13 e 14/11 no ginásio municipal, das 9h às 18h."},{"question":"Posso transferir minha inscrição?","answer":"Sim, a transferência pode ser feita até 7 dias antes do evento pelo painel."},{"question":"Qual o percurso?","answer":"Largada na Av. Paulista, percurso plano pela Faria Lima, retorno pela Av. Brasil."},{"question":"Tem estacionamento?","answer":"Sim, estacionamento gratuito para participantes no shopping próximo ao local de largada."}]'::jsonb,
  '[{"time":"05:30","title":"Abertura do evento e entrega de dorsais"},{"time":"06:30","title":"Aquecimento coletivo com personal trainer"},{"time":"07:00","title":"Largada oficial 10km","location":"Av. Paulista"},{"time":"07:30","title":"Largada 5km e Caminhada"},{"time":"09:00","title":"Primeiras chegadas e cerimônia de premiação"},{"time":"10:30","title":"Encerramento — Coffee break para finishers"}]'::jsonb,
  'Inscrições canceladas até 30 dias antes do evento serão reembolsadas integralmente. De 15 a 29 dias, 50% do valor. Menos de 15 dias não há reembolso.',
  'Reembolso processado em até 10 dias úteis via PIX para o CPF do inscrito.'
) ON CONFLICT (slug) DO NOTHING;

-- Demo event categories (4 inscription categories)
INSERT INTO ticket_categories (tenant_id, event_id, name, description, type, color, total_capacity, sort_order)
SELECT
  '00000000-0000-0000-0000-000000000001', e.id,
  c.name, c.description, c.type, c.color, c.cap, c.sord
FROM events e
CROSS JOIN (VALUES
  ('Corrida 10km','Categoria principal — percurso completo de 10km','SPORTS','#f59e0b',1500,1),
  ('Corrida 5km','Percurso de 5km — ideal para iniciantes','SPORTS','#10b981',1000,2),
  ('Caminhada','Percurso de 5km no ritmo livre','STANDARD','#6366f1',300,3),
  ('VIP Premium','Acesso ao camarote VIP + kit exclusivo + massagem pós-prova','VIP','#ec4899',200,4)
) AS c(name,description,type,color,cap,sord)
WHERE e.slug = 'corrida-play-10k-2025'
ON CONFLICT DO NOTHING;

-- Demo event batches (7 batches across 4 categories)
INSERT INTO ticket_batches (tenant_id, event_id, category_id, name, description, price, original_price, quantity, status, sort_order, max_per_purchase, fees_pct, auto_next)
SELECT
  '00000000-0000-0000-0000-000000000001', e.id, tc.id,
  b.name, b.description, b.price, b.orig_price, b.qty, b.status::text, b.sord, 5, 10, true
FROM events e
JOIN ticket_categories tc ON tc.event_id = e.id
CROSS JOIN (VALUES
  ('Corrida 10km','1º Lote 10km','Lote promocional — vagas limitadas',79.90,89.90,300,'ACTIVE',1),
  ('Corrida 10km','2º Lote 10km',NULL,89.90,NULL,500,'SCHEDULED',2),
  ('Corrida 10km','Último Lote 10km','Últimas vagas',99.90,NULL,700,'SCHEDULED',3),
  ('Corrida 5km','1º Lote 5km','Lote inaugural',59.90,69.90,400,'ACTIVE',1),
  ('Corrida 5km','2º Lote 5km',NULL,69.90,NULL,600,'SCHEDULED',2),
  ('Caminhada','Inscrição Caminhada','Percurso livre',39.90,NULL,300,'ACTIVE',1),
  ('VIP Premium','VIP Premium','Ingresso VIP com camarote exclusivo',249.90,299.90,200,'ACTIVE',1)
) AS b(cat_name,name,description,price,orig_price,qty,status,sord)
WHERE e.slug = 'corrida-play-10k-2025' AND tc.name = b.cat_name
ON CONFLICT DO NOTHING;
