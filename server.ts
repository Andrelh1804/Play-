/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PLAY+EVENTOS Enterprise Server V2.0
 * PostgreSQL-backed, JWT-authenticated, RBAC-protected
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne, queryAll, healthCheck } from "./src/pgService.js";
import {
  requireAuth, requireRole, requireTenant,
  handleLogin, handleRefreshToken, handleLogout,
  type AuthRequest, type JWTPayload
} from "./src/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.set("trust proxy", 1);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = [
      process.env.APP_URL,
      /\.replit\.dev$/,
      /\.replit\.app$/,
      /\.repl\.co$/,
      /\.riker\.replit\.dev$/,
      /\.kirk\.replit\.dev$/,
      /^https?:\/\/localhost/,
      /^https?:\/\/127\.0\.0\.1/
    ];
    const ok = allowed.some(p => p && (typeof p === "string" ? origin === p : p.test(origin)));
    cb(null, true);
  },
  credentials: true
}));

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const aiLimiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 30,  standardHeaders: true, legacyHeaders: false });
const authLimiter   = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  standardHeaders: true, legacyHeaders: false });
app.use("/api/", generalLimiter);
app.use("/api/ai/", aiLimiter);
app.use("/api/auth/", authLimiter);

app.use(express.json({ limit: "2mb" }));

// ─── STRUCTURED LOGGING ───────────────────────────────────────────────────────

function log(level: "INFO" | "WARN" | "ERROR", message: string, meta?: Record<string, any>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...meta }));
}

// ─── AUDIT LOGGING MIDDLEWARE ─────────────────────────────────────────────────

app.use(async (req: AuthRequest, res, next) => {
  const start = Date.now();
  res.on("finish", async () => {
    const durationMs = Date.now() - start;
    if (req.path.startsWith("/api/")) {
      try {
        await query(
          `INSERT INTO gateway_logs (method, path, client_ip, status_code, duration_ms, user_id, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [req.method, req.path, req.ip, res.statusCode, durationMs, req.user?.userId ?? null, req.user?.tenantId ?? null]
        );
      } catch (_) { /* non-fatal */ }
    }
  });
  next();
});

// ─── HELPER: write audit entry ────────────────────────────────────────────────

async function auditLog(
  action: string, resource: string, resourceId: string | null,
  user: JWTPayload | undefined, details?: Record<string, any>, ip?: string
) {
  try {
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user?.tenantId ?? null, user?.userId ?? null, action, resource, resourceId, JSON.stringify(details ?? {}), ip ?? null]
    );
  } catch (_) { /* non-fatal */ }
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get("/api/health", async (_req, res) => {
  const db = await healthCheck();
  const status = db.ok ? 200 : 503;
  res.status(status).json({
    status: db.ok ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    services: {
      database: { status: db.ok ? "up" : "down", latencyMs: db.latencyMs, error: db.error }
    }
  });
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post("/api/auth/login", handleLogin);
app.post("/api/auth/refresh", handleRefreshToken);
app.post("/api/auth/logout", requireAuth, (req: AuthRequest, res) => handleLogout(req, res));
app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// Register new user (admin only)
app.post("/api/auth/register", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email e password são obrigatórios." });

    const { hashPassword } = await import("./src/auth.js");
    const hash = await hashPassword(password);
    const tenantId = req.user!.role === "SUPER_ADMIN" ? (req.body.tenantId || req.user!.tenantId) : req.user!.tenantId;

    const newUser = await queryOne<{ id: string; name: string; email: string; role: string }>(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email, tenant_id) DO NOTHING
       RETURNING id, name, email, role`,
      [tenantId, name, email.toLowerCase().trim(), hash, role || "VIEWER"]
    );
    if (!newUser) return res.status(409).json({ error: "E-mail já cadastrado neste tenant." });
    res.status(201).json({ user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LEGACY DB ENDPOINT (read-only compatibility) ────────────────────────────

app.get("/api/db", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.role === "SUPER_ADMIN" ? undefined : req.user!.tenantId;
    const tFilter = tenantId ? "WHERE tenant_id = $1" : "";
    const tParam  = tenantId ? [tenantId] : [];

    const [tenants, events, tickets, finance, leads, suppliers, bookings,
           sponsorships, purchaseOrders, staff, contracts, campaigns,
           teams, shifts, clocks, payments, messages, flows, funnels, plannings] = await Promise.all([
      queryAll(`SELECT * FROM tenants WHERE deleted_at IS NULL`),
      queryAll(`SELECT * FROM events WHERE deleted_at IS NULL ${tenantId ? "AND tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT * FROM tickets ${tenantId ? "WHERE tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT * FROM finance_transactions ${tFilter}`, tParam),
      queryAll(`SELECT * FROM crm_leads WHERE deleted_at IS NULL ${tenantId ? "AND tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT * FROM suppliers WHERE deleted_at IS NULL`),
      queryAll(`SELECT b.* FROM bookings b JOIN events e ON b.event_id = e.id ${tenantId ? "WHERE e.tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT s.* FROM sponsorships s JOIN events e ON s.event_id = e.id ${tenantId ? "WHERE e.tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT * FROM purchase_orders ${tFilter}`, tParam),
      queryAll(`SELECT * FROM staff_members WHERE deleted_at IS NULL ${tenantId ? "AND tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT * FROM document_contracts ${tFilter}`, tParam),
      queryAll(`SELECT * FROM marketing_campaigns ${tFilter}`, tParam),
      queryAll(`SELECT * FROM staff_teams ${tFilter}`, tParam),
      queryAll(`SELECT sh.* FROM staff_shifts sh JOIN events e ON sh.event_id = e.id ${tenantId ? "WHERE e.tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT tc.* FROM time_clocks tc JOIN staff_members sm ON tc.staff_id = sm.id ${tenantId ? "WHERE sm.tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT fp.* FROM freelancer_payments fp JOIN staff_members sm ON fp.staff_id = sm.id ${tenantId ? "WHERE sm.tenant_id = $1" : ""}`, tParam),
      queryAll(`SELECT * FROM staff_messages ${tFilter}`, tParam),
      queryAll(`SELECT * FROM lead_flows ${tFilter}`, tParam),
      queryAll(`SELECT * FROM sales_funnels ${tFilter}`, tParam),
      queryAll(`SELECT ep.* FROM event_plannings ep JOIN events e ON ep.event_id = e.id ${tenantId ? "WHERE e.tenant_id = $1" : ""}`, tParam),
    ]);

    // Map snake_case DB columns to camelCase for frontend compatibility
    res.json({
      tenants: tenants.map(mapTenant),
      events: events.map(mapEvent),
      tickets: tickets.map(mapTicket),
      finance: finance.map(mapFinance),
      leads: leads.map(mapLead),
      suppliers: suppliers.map(mapSupplier),
      bookings: bookings.map(mapBooking),
      sponsorships: sponsorships.map(mapSponsorship),
      purchaseOrders: purchaseOrders.map(mapPurchaseOrder),
      staff: staff.map(mapStaff),
      contracts: contracts.map(mapContract),
      campaigns: campaigns.map(mapCampaign),
      teams: teams.map(mapTeam),
      shifts: shifts.map(mapShift),
      clocks: clocks.map(mapClock),
      payments: payments.map(mapPayment),
      messages: messages.map(mapMessage),
      flows: flows.map(mapFlow),
      funnels: funnels.map(mapFunnel),
      gatewayLogs: [],
      plannings: plannings.map(mapPlanning),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DB RESET (seeds back initial data — admin only) ─────────────────────────

app.post("/api/db/reset", requireAuth, requireRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    log("WARN", "Database reset initiated by admin");
    res.json({ message: "Reset não disponível nesta versão Enterprise. Use migrations controladas." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EVENTS ───────────────────────────────────────────────────────────────────

app.post("/api/events", requireAuth, requireRole("PRODUCER"), async (req: AuthRequest, res) => {
  try {
    const d = req.body;
    const tenantId = req.user!.role === "SUPER_ADMIN" ? (d.tenantId || req.user!.tenantId) : req.user!.tenantId;

    const ev = await queryOne<any>(
      `INSERT INTO events (tenant_id, name, code, type, modality, date, description, status, organizer, contractor,
        technical_responsible, objectives, target_audience, age_classification, primary_language, location, country,
        state, city, address, zip_code, coordinates, map_link, emergency_routes, capacity, expected_participants,
        ticket_price, image_url, budget_ratio, phases, checklist, schedule, infrastructure, logistics)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34)
       RETURNING *`,
      [tenantId, d.name, d.code||null, d.type, d.modality||"PRESENCIAL", d.date, d.description||null,
       d.status||"PLANNING", d.organizer||null, d.contractor||null, d.technicalResponsible||null,
       d.objectives||null, d.targetAudience||null, d.ageClassification||null, d.primaryLanguage||"pt-BR",
       d.location, d.country||null, d.state||null, d.city||null, d.address||null, d.zipCode||null,
       d.coordinates ? JSON.stringify(d.coordinates) : null,
       d.mapLink||null, d.emergencyRoutes||null,
       Number(d.capacity||1000), d.expectedParticipants ? Number(d.expectedParticipants) : null,
       Number(d.ticketPrice||0),
       d.imageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600",
       Number(d.budgetRatio||0.7),
       d.phases ? JSON.stringify(d.phases) : null,
       JSON.stringify(d.checklist||[]), JSON.stringify(d.schedule||[]),
       JSON.stringify(d.infrastructure||[]), JSON.stringify(d.logistics||[])
      ]
    );
    await auditLog("CREATE", "events", ev!.id, req.user, { name: d.name }, req.ip);
    res.status(201).json(mapEvent(ev!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/:id", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    const existing = await queryOne<any>(
      `SELECT id, tenant_id FROM events WHERE id = $1 AND deleted_at IS NULL`, [id]
    );
    if (!existing) return res.status(404).json({ error: "Evento não encontrado." });
    if (req.user!.role !== "SUPER_ADMIN" && existing.tenant_id !== tenantId)
      return res.status(403).json({ error: "Acesso negado." });

    const d = req.body;
    const ev = await queryOne<any>(
      `UPDATE events SET
        name = COALESCE($1, name), code = COALESCE($2, code), type = COALESCE($3, type),
        modality = COALESCE($4, modality), date = COALESCE($5, date), description = COALESCE($6, description),
        status = COALESCE($7, status), organizer = COALESCE($8, organizer), contractor = COALESCE($9, contractor),
        technical_responsible = COALESCE($10, technical_responsible), objectives = COALESCE($11, objectives),
        target_audience = COALESCE($12, target_audience), age_classification = COALESCE($13, age_classification),
        location = COALESCE($14, location), country = COALESCE($15, country), state = COALESCE($16, state),
        city = COALESCE($17, city), address = COALESCE($18, address), zip_code = COALESCE($19, zip_code),
        coordinates = COALESCE($20::jsonb, coordinates), map_link = COALESCE($21, map_link),
        emergency_routes = COALESCE($22, emergency_routes), capacity = COALESCE($23, capacity),
        expected_participants = COALESCE($24, expected_participants), ticket_price = COALESCE($25, ticket_price),
        image_url = COALESCE($26, image_url), budget_ratio = COALESCE($27, budget_ratio),
        phases = COALESCE($28::jsonb, phases), checklist = COALESCE($29::jsonb, checklist),
        schedule = COALESCE($30::jsonb, schedule), infrastructure = COALESCE($31::jsonb, infrastructure),
        logistics = COALESCE($32::jsonb, logistics), updated_at = NOW()
       WHERE id = $33 RETURNING *`,
      [d.name||null, d.code||null, d.type||null, d.modality||null, d.date||null, d.description||null,
       d.status||null, d.organizer||null, d.contractor||null, d.technicalResponsible||null,
       d.objectives||null, d.targetAudience||null, d.ageClassification||null, d.location||null,
       d.country||null, d.state||null, d.city||null, d.address||null, d.zipCode||null,
       d.coordinates ? JSON.stringify(d.coordinates) : null,
       d.mapLink||null, d.emergencyRoutes||null,
       d.capacity ? Number(d.capacity) : null,
       d.expectedParticipants ? Number(d.expectedParticipants) : null,
       d.ticketPrice !== undefined ? Number(d.ticketPrice) : null,
       d.imageUrl||null,
       d.budgetRatio !== undefined ? Number(d.budgetRatio) : null,
       d.phases ? JSON.stringify(d.phases) : null,
       d.checklist ? JSON.stringify(d.checklist) : null,
       d.schedule ? JSON.stringify(d.schedule) : null,
       d.infrastructure ? JSON.stringify(d.infrastructure) : null,
       d.logistics ? JSON.stringify(d.logistics) : null,
       id
      ]
    );
    await auditLog("UPDATE", "events", id, req.user, { fields: Object.keys(d) }, req.ip);
    res.json(mapEvent(ev!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/:id/status", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ev = await queryOne<any>(
      `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [status, id]
    );
    if (!ev) return res.status(404).json({ error: "Evento não encontrado." });
    await auditLog("STATUS_CHANGE", "events", id, req.user, { status }, req.ip);
    res.json(mapEvent(ev));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/:eventId/checklist/:itemId/toggle", requireAuth, requireRole("STAFF"), async (req: AuthRequest, res) => {
  try {
    const { eventId, itemId } = req.params;
    const ev = await queryOne<any>(`SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL`, [eventId]);
    if (!ev) return res.status(404).json({ error: "Evento não encontrado." });

    const checklist = (ev.checklist || []) as any[];
    const item = checklist.find((c: any) => c.id === itemId);
    if (!item) return res.status(404).json({ error: "Item de checklist não encontrado." });
    item.completed = !item.completed;

    const updated = await queryOne<any>(
      `UPDATE events SET checklist = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(checklist), eventId]
    );
    res.json(mapEvent(updated!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/events/:eventId/infrastructure/:itemId/status", requireAuth, requireRole("STAFF"), async (req: AuthRequest, res) => {
  try {
    const { eventId, itemId } = req.params;
    const { status } = req.body;
    const ev = await queryOne<any>(`SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL`, [eventId]);
    if (!ev) return res.status(404).json({ error: "Evento não encontrado." });

    const infra = (ev.infrastructure || []) as any[];
    const item = infra.find((i: any) => i.id === itemId);
    if (!item) return res.status(404).json({ error: "Item de infraestrutura não encontrado." });
    item.status = status;

    const updated = await queryOne<any>(
      `UPDATE events SET infrastructure = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(infra), eventId]
    );
    res.json(mapEvent(updated!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/events/:id", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await query(`UPDATE events SET deleted_at = NOW() WHERE id = $1`, [id]);
    await auditLog("DELETE", "events", id, req.user, {}, req.ip);
    res.json({ message: "Evento removido com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TENANTS ──────────────────────────────────────────────────────────────────

app.put("/api/tenants/:id", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, language, currency, customDomain, cnpj } = req.body;
    if (req.user!.role !== "SUPER_ADMIN" && req.user!.tenantId !== id)
      return res.status(403).json({ error: "Acesso negado: você só pode editar seu próprio tenant." });

    const tenant = await queryOne<any>(
      `UPDATE tenants SET
        name = COALESCE($1, name), language = COALESCE($2, language),
        currency = COALESCE($3, currency), custom_domain = COALESCE($4, custom_domain),
        cnpj = COALESCE($5, cnpj), updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name||null, language||null, currency||null, customDomain||null, cnpj||null, id]
    );
    if (!tenant) return res.status(404).json({ error: "Tenant não encontrado." });
    res.json(mapTenant(tenant));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TICKETING ────────────────────────────────────────────────────────────────

app.post("/api/tickets/buy", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { eventId, name, email, type, cpf, seat, paymentMethod, couponCode,
            batchId, category, distance, team, club, federation,
            shirtSize, hasMedicalCert, hasTermSigned, hasInsurance } = req.body;

    const tenantId = req.user!.tenantId;
    const ev = await queryOne<any>(`SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL`, [eventId]);
    if (!ev) return res.status(404).json({ error: "Evento não encontrado." });
    if (ev.tenant_id !== tenantId && req.user!.role !== "SUPER_ADMIN")
      return res.status(403).json({ error: "Acesso negado." });

    const freeTypes = ["FREE", "CORTESIA", "CONVITE"];
    const basePrice = parseFloat(ev.ticket_price);
    let ticketPrice = freeTypes.includes(type) ? 0 : (type === "VIP" || type === "CAMAROTE") ? basePrice * 2.5 : basePrice;

    // Server-side coupon validation from DB
    let couponRow: any = null;
    if (couponCode && ticketPrice > 0) {
      couponRow = await queryOne<any>(
        `SELECT * FROM coupons WHERE code = $1 AND tenant_id = $2 AND active = true
         AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
         AND (max_uses IS NULL OR used_count < max_uses)`,
        [String(couponCode).toUpperCase(), tenantId]
      );
      if (couponRow) {
        ticketPrice = couponRow.discount_type === "pct"
          ? ticketPrice * (1 - parseFloat(couponRow.discount_value) / 100)
          : Math.max(0, ticketPrice - parseFloat(couponRow.discount_value));
        ticketPrice = Math.round(ticketPrice * 100) / 100;
        await query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [couponRow.id]);
      }
    }

    const qrCode = `FLOW-TKT-${Date.now().toString().slice(-6)}-${String(name).replace(/\s+/g, "").toUpperCase().slice(0, 10)}`;
    const ticketName = type === "VIP" ? "Ingresso VIP Premium" : type === "CAMAROTE" ? "Camarote" :
      (type === "FREE" || type === "CORTESIA") ? "Cortesia" : "Ingresso";

    const tkt = await queryOne<any>(
      `INSERT INTO tickets (event_id, tenant_id, name, type, price, buyer_name, buyer_email, qr_code,
        payment_method, coupon_code, discount_amount, original_price, batch_id,
        category, distance, team, club, federation, shirt_size,
        has_medical_cert, has_term_signed, has_insurance, cpf, seat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       RETURNING *`,
      [eventId, tenantId, ticketName, type, ticketPrice, name, email, qrCode,
       paymentMethod||null, couponRow ? String(couponCode).toUpperCase() : null,
       couponRow ? (basePrice - ticketPrice) : null, basePrice,
       batchId||null, category||null, distance||null, team||null, club||null, federation||null,
       shirtSize||null, hasMedicalCert||false, hasTermSigned||false, hasInsurance||false,
       cpf||null, seat||null]
    );

    // Register income transaction
    if (ticketPrice > 0) {
      const pmLabel = paymentMethod ? ` via ${paymentMethod}` : "";
      const couponLabel = couponRow ? ` [cupom: ${couponCode}]` : "";
      await query(
        `INSERT INTO finance_transactions (tenant_id, event_id, type, category, amount, description, date, status)
         VALUES ($1,$2,'INCOME','Ticketing / Inscrições',$3,$4,CURRENT_DATE,'PAID')`,
        [tenantId, eventId, ticketPrice, `Inscrição (${type}) — ${name}${pmLabel}${couponLabel}`]
      );
    }

    await auditLog("BUY_TICKET", "tickets", tkt!.id, req.user, { type, price: ticketPrice }, req.ip);
    res.status(201).json(mapTicket(tkt!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tickets/checkin", requireAuth, requireRole("STAFF"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.body;
    const tkt = await queryOne<any>(`SELECT * FROM tickets WHERE id = $1`, [id]);
    if (!tkt) return res.status(404).json({ error: "Ingresso não encontrado." });

    const now = new Date().toISOString();
    const updated = await queryOne<any>(
      `UPDATE tickets SET checked_in = $1, checked_in_at = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [!tkt.checked_in, tkt.checked_in ? null : now, id]
    );
    await auditLog("CHECKIN", "tickets", id, req.user, { checkedIn: !tkt.checked_in }, req.ip);
    res.json(mapTicket(updated!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tickets/transfer", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { ticketQr, toName, toEmail, reason } = req.body;
    if (!ticketQr || !toName || !toEmail)
      return res.status(400).json({ error: "ticketQr, toName e toEmail são obrigatórios." });

    const tkt = await queryOne<any>(
      `SELECT * FROM tickets WHERE qr_code = $1 OR id = $1`, [ticketQr]
    );
    if (!tkt) return res.status(404).json({ error: "Ingresso não encontrado." });
    if (req.user!.role !== "SUPER_ADMIN" && tkt.tenant_id !== req.user!.tenantId)
      return res.status(403).json({ error: "Acesso negado." });
    if (tkt.checked_in) return res.status(400).json({ error: "Ingressos já utilizados não podem ser transferidos." });
    if (tkt.cancelled_at) return res.status(400).json({ error: "Ingressos cancelados não podem ser transferidos." });

    const updated = await queryOne<any>(
      `UPDATE tickets SET buyer_name=$1, buyer_email=$2, transferred_to_name=$1,
        transferred_to_email=$2, transferred_at=NOW(), updated_at=NOW() WHERE id=$3 RETURNING *`,
      [toName, toEmail, tkt.id]
    );
    await auditLog("TRANSFER", "tickets", tkt.id, req.user, { toName, toEmail, reason }, req.ip);
    res.json({ success: true, ticketId: tkt.id, fromName: tkt.buyer_name, toName, toEmail, reason });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tickets/cancel", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { qrCode, reason } = req.body;
    if (!qrCode) return res.status(400).json({ error: "qrCode é obrigatório." });

    const tkt = await queryOne<any>(`SELECT * FROM tickets WHERE qr_code = $1 OR id = $1`, [qrCode]);
    if (!tkt) return res.status(404).json({ error: "Ingresso não encontrado." });
    if (req.user!.role !== "SUPER_ADMIN" && tkt.tenant_id !== req.user!.tenantId)
      return res.status(403).json({ error: "Acesso negado." });
    if (tkt.cancelled_at)
      return res.status(409).json({ error: "Ingresso já foi cancelado.", refundStatus: tkt.refund_status });
    if (tkt.checked_in)
      return res.status(400).json({ error: "Ingressos já utilizados não podem ser cancelados." });

    const updated = await queryOne<any>(
      `UPDATE tickets SET cancelled_at=NOW(), cancel_reason=$1, refund_status='REQUESTED', updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [reason||"", tkt.id]
    );

    if (parseFloat(tkt.price) > 0) {
      await query(
        `INSERT INTO finance_transactions (tenant_id, event_id, type, category, amount, description, date, status)
         VALUES ($1,$2,'EXPENSE','Reembolso de Ingresso',$3,$4,CURRENT_DATE,'PENDING')`,
        [tkt.tenant_id, tkt.event_id, tkt.price, `Reembolso — ${tkt.buyer_name} (${qrCode}) — ${reason||"sem motivo"}`]
      );
    }
    await auditLog("CANCEL", "tickets", tkt.id, req.user, { reason }, req.ip);
    res.json({ success: true, ticket: mapTicket(updated!) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tickets/:id", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM tickets WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FINANCE ─────────────────────────────────────────────────────────────────

app.post("/api/finance", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { eventId, type, category, amount, description, status, date } = req.body;
    const tenantId = req.user!.tenantId;
    const txn = await queryOne<any>(
      `INSERT INTO finance_transactions (tenant_id, event_id, type, category, amount, description, date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [tenantId, eventId||null, type, category, Number(amount), description,
       date||new Date().toISOString().split("T")[0], status||"PAID"]
    );
    res.status(201).json(mapFinance(txn!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MARKETPLACE ──────────────────────────────────────────────────────────────

app.post("/api/marketplace/book", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { supplierId, eventId, date, hours } = req.body;
    const supplier = await queryOne<any>(`SELECT * FROM suppliers WHERE id = $1 AND deleted_at IS NULL`, [supplierId]);
    const ev = await queryOne<any>(`SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL`, [eventId]);
    if (!supplier || !ev) return res.status(404).json({ error: "Fornecedor ou Evento não encontrado." });

    const cost = parseFloat(supplier.price_per_hour) * Number(hours || 8);
    const bkg = await queryOne<any>(
      `INSERT INTO bookings (supplier_id, event_id, date, cost, status)
       VALUES ($1,$2,$3,$4,'APPROVED') RETURNING *`,
      [supplierId, eventId, date||ev.date, cost]
    );

    await query(
      `INSERT INTO finance_transactions (tenant_id, event_id, type, category, amount, description, date, status)
       VALUES ($1,$2,'EXPENSE','Marketplace / Fornecedores',$3,$4,$5,'PENDING')`,
      [ev.tenant_id, eventId, cost, `Contratação: ${supplier.name} (${hours||8}h)`, date||ev.date]
    );
    res.status(201).json(mapBooking(bkg!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CRM LEADS ───────────────────────────────────────────────────────────────

app.post("/api/leads", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { name, company, type, email, phone, pipelineStage, value, notes } = req.body;
    const tenantId = req.user!.tenantId;
    const lead = await queryOne<any>(
      `INSERT INTO crm_leads (tenant_id, name, company, type, email, phone, pipeline_stage, value, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [tenantId, name, company||null, type||"CLIENT", email||null, phone||null,
       pipelineStage||"LEAD", Number(value||0), notes||null]
    );
    res.status(201).json(mapLead(lead!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/leads/:id", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const d = req.body;
    const lead = await queryOne<any>(
      `UPDATE crm_leads SET
        name=COALESCE($1,name), company=COALESCE($2,company), pipeline_stage=COALESCE($3,pipeline_stage),
        value=COALESCE($4,value), notes=COALESCE($5,notes), updated_at=NOW()
       WHERE id=$6 AND deleted_at IS NULL RETURNING *`,
      [d.name||null, d.company||null, d.pipelineStage||null, d.value!==undefined?Number(d.value):null, d.notes||null, id]
    );
    if (!lead) return res.status(404).json({ error: "Lead não encontrado." });
    res.json(mapLead(lead));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SPONSORSHIPS ─────────────────────────────────────────────────────────────

app.post("/api/sponsorships", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { eventId, sponsorName, quotaName, value, deliverables, status, roiRatio } = req.body;
    const sps = await queryOne<any>(
      `INSERT INTO sponsorships (event_id, sponsor_name, quota_name, value, deliverables, status, roi_ratio)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [eventId, sponsorName, quotaName, Number(value||0),
       JSON.stringify(deliverables||[]), status||"PROPOSAL", Number(roiRatio||0)]
    );
    res.status(201).json(mapSponsorship(sps!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PURCHASE ORDERS ──────────────────────────────────────────────────────────

app.post("/api/purchase-orders", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { title, amount, supplierName, date } = req.body;
    const po = await queryOne<any>(
      `INSERT INTO purchase_orders (tenant_id, title, amount, status, supplier_name, date)
       VALUES ($1,$2,$3,'PENDING',$4,$5) RETURNING *`,
      [req.user!.tenantId, title, Number(amount||0), supplierName||null, date||new Date().toISOString().split("T")[0]]
    );
    res.status(201).json(mapPurchaseOrder(po!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STAFF ────────────────────────────────────────────────────────────────────

app.post("/api/staff/clocks", requireAuth, requireRole("STAFF"), async (req: AuthRequest, res) => {
  try {
    const { staffId, eventId, type, method, gpsCoords, locationName } = req.body;

    const staffMember = await queryOne<any>(
      `SELECT * FROM staff_members WHERE id = $1 AND deleted_at IS NULL`, [staffId]
    );
    if (!staffMember) return res.status(404).json({ error: "Membro não encontrado." });

    const clk = await queryOne<any>(
      `INSERT INTO time_clocks (staff_id, staff_name, event_id, type, method, gps_coords, location_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [staffId, staffMember.name, eventId||staffMember.event_id,
       type, method||"DIGITAL_GPS",
       gpsCoords ? JSON.stringify(gpsCoords) : null, locationName||"Check-In Geral"]
    );

    // Update staff status
    if (type === "IN") {
      await query(`UPDATE staff_members SET check_in_status='online', gps_coords=$1, updated_at=NOW() WHERE id=$2`,
        [gpsCoords ? JSON.stringify(gpsCoords) : null, staffId]);
    } else {
      await query(`UPDATE staff_members SET check_in_status='offline', hours_worked=hours_worked+8, updated_at=NOW() WHERE id=$1`, [staffId]);

      // Auto-generate payment record based on DB hourly rate
      const hourlyRate = parseFloat(staffMember.hourly_rate) || 25;
      await query(
        `INSERT INTO freelancer_payments (staff_id, staff_name, event_id, role, amount, hours_total, status)
         VALUES ($1,$2,$3,$4,$5,8,'PENDING')`,
        [staffId, staffMember.name, eventId||staffMember.event_id, staffMember.role, 8 * hourlyRate]
      );
    }

    res.status(201).json(mapClock(clk!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/staff/clock", requireAuth, requireRole("STAFF"), async (req: AuthRequest, res) => {
  try {
    const { staffId, eventId, type, method, lat, lng, locationName } = req.body;
    const staffMember = await queryOne<any>(`SELECT * FROM staff_members WHERE id = $1`, [staffId]);
    if (!staffMember) return res.status(404).json({ error: "Membro não encontrado." });

    const gpsCoords = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
    const clk = await queryOne<any>(
      `INSERT INTO time_clocks (staff_id, staff_name, event_id, type, method, gps_coords, location_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [staffId, staffMember.name, eventId||staffMember.event_id, type, method||"DIGITAL_GPS",
       gpsCoords ? JSON.stringify(gpsCoords) : null, locationName||"Check-In Geral"]
    );

    if (type === "IN") {
      await query(`UPDATE staff_members SET check_in_status='online', gps_coords=$1, updated_at=NOW() WHERE id=$2`,
        [gpsCoords ? JSON.stringify(gpsCoords) : null, staffId]);
    } else {
      await query(`UPDATE staff_members SET check_in_status='offline', hours_worked=hours_worked+8, updated_at=NOW() WHERE id=$1`, [staffId]);
      const hourlyRate = parseFloat(staffMember.hourly_rate) || 25;
      await query(
        `INSERT INTO freelancer_payments (staff_id, staff_name, event_id, role, amount, hours_total, status)
         VALUES ($1,$2,$3,$4,$5,8,'PENDING')`,
        [staffId, staffMember.name, eventId||staffMember.event_id, staffMember.role, 8 * hourlyRate]
      );
    }
    res.status(201).json(mapClock(clk!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/staff/pay-all", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const pending = await queryAll<any>(
      `SELECT fp.* FROM freelancer_payments fp
       JOIN staff_members sm ON fp.staff_id = sm.id
       WHERE sm.tenant_id = $1 AND fp.status = 'PENDING'`,
      [tenantId]
    );
    if (pending.length === 0) return res.json({ message: "Nenhum pagamento pendente." });

    const total = pending.reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
    const ids = pending.map((p: any) => p.id);

    await query(
      `UPDATE freelancer_payments SET status='PAID', payment_date=CURRENT_DATE, payment_method='PIX AUTOMÁTICO', updated_at=NOW()
       WHERE id = ANY($1::text[])`,
      [ids]
    );

    // Finance log entries
    for (const p of pending) {
      await query(
        `INSERT INTO finance_transactions (tenant_id, event_id, type, category, amount, description, date, status)
         VALUES ($1,$2,'EXPENSE','RH / Pagamento Staff',$3,$4,CURRENT_DATE,'PAID')`,
        [tenantId, p.event_id, p.amount, `Pagamento via PIX - ${p.staff_name} (${p.role})`]
      );
    }
    res.json({ message: `${pending.length} diárias pagas via PIX, total R$ ${total.toLocaleString("pt-BR")}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/staff/teams", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await queryAll<any>(`SELECT * FROM staff_teams WHERE tenant_id = $1`, [req.user!.tenantId]);
    res.json(rows.map(mapTeam));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/staff/teams", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { eventId, name, area, leaderName, membersCount } = req.body;
    if (!name || !area || !leaderName) return res.status(400).json({ error: "Nome, área e líder são obrigatórios." });
    const team = await queryOne<any>(
      `INSERT INTO staff_teams (tenant_id, event_id, name, area, leader_name, members_count)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user!.tenantId, eventId||null, name, area, leaderName, Number(membersCount||1)]
    );
    res.status(201).json(mapTeam(team!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/staff/shifts", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await queryAll<any>(
      `SELECT sh.* FROM staff_shifts sh JOIN staff_members sm ON sh.staff_id = sm.id WHERE sm.tenant_id = $1`,
      [req.user!.tenantId]
    );
    res.json(rows.map(mapShift));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/staff/shifts", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { staffId, eventId, date, startTime, endTime, role } = req.body;
    const sm = await queryOne<any>(`SELECT * FROM staff_members WHERE id = $1`, [staffId]);
    const ev = await queryOne<any>(`SELECT * FROM events WHERE id = $1`, [eventId]);
    if (!sm || !ev) return res.status(400).json({ error: "Staff ou Evento inválido." });

    const startMs = new Date(`${date}T${startTime}`).getTime();
    const endMs   = new Date(`${date}T${endTime}`).getTime();
    const hours   = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60)) || 8);

    const shift = await queryOne<any>(
      `INSERT INTO staff_shifts (staff_id, staff_name, event_id, event_name, date, start_time, end_time, hours_allocated, role, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PENDING') RETURNING *`,
      [staffId, sm.name, eventId, ev.name, date, startTime, endTime, hours, role||sm.role]
    );
    res.status(201).json(mapShift(shift!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/staff/clocks", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await queryAll<any>(
      `SELECT tc.* FROM time_clocks tc JOIN staff_members sm ON tc.staff_id = sm.id WHERE sm.tenant_id = $1 ORDER BY tc.timestamp DESC`,
      [req.user!.tenantId]
    );
    res.json(rows.map(mapClock));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/staff/payments", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await queryAll<any>(
      `SELECT fp.* FROM freelancer_payments fp JOIN staff_members sm ON fp.staff_id = sm.id WHERE sm.tenant_id = $1`,
      [req.user!.tenantId]
    );
    res.json(rows.map(mapPayment));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/staff/payments/pay", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res) => {
  try {
    const { id, paymentMethod } = req.body;
    const pay = await queryOne<any>(`SELECT fp.*, sm.tenant_id FROM freelancer_payments fp JOIN staff_members sm ON fp.staff_id = sm.id WHERE fp.id = $1`, [id]);
    if (!pay) return res.status(404).json({ error: "Pagamento não encontrado." });

    const updated = await queryOne<any>(
      `UPDATE freelancer_payments SET status='PAID', payment_date=CURRENT_DATE, payment_method=$1, updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [paymentMethod||"PIX", id]
    );
    await query(
      `INSERT INTO finance_transactions (tenant_id, event_id, type, category, amount, description, date, status)
       VALUES ($1,$2,'EXPENSE','RH / Freelancers',$3,$4,CURRENT_DATE,'PAID')`,
      [pay.tenant_id, pay.event_id, pay.amount, `Pagamento freelancer: ${pay.staff_name} (${pay.role}) via ${paymentMethod||"PIX"}`]
    );
    res.json(mapPayment(updated!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/staff/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await queryAll<any>(`SELECT * FROM staff_messages WHERE tenant_id = $1 ORDER BY timestamp DESC`, [req.user!.tenantId]);
    res.json(rows.map(mapMessage));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/staff/messages", requireAuth, requireRole("STAFF"), async (req: AuthRequest, res) => {
  try {
    const { eventId, senderName, senderRole, message, channel } = req.body;
    if (!message || !channel) return res.status(400).json({ error: "Mensagem e canal são obrigatórios." });
    const msg = await queryOne<any>(
      `INSERT INTO staff_messages (tenant_id, event_id, sender_name, sender_role, message, channel)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user!.tenantId, eventId||null, senderName||req.user!.name, senderRole||req.user!.role, message, channel]
    );
    res.status(201).json(mapMessage(msg!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── MARKETING ────────────────────────────────────────────────────────────────

app.get("/api/marketing/flows", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await queryAll<any>(`SELECT * FROM lead_flows WHERE tenant_id = $1`, [req.user!.tenantId]);
    res.json(rows.map(mapFlow));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/marketing/flows", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { name, description, triggerEvent, steps } = req.body;
    if (!name || !triggerEvent || !Array.isArray(steps))
      return res.status(400).json({ error: "Nome, gatilho e passos são obrigatórios." });

    const stepsWithIds = steps.map((s: any, i: number) => ({
      id: `step-${Date.now()}-${i}`,
      delayDays: Number(s.delayDays||1),
      channel: s.channel||"EMAIL",
      subject: s.subject||undefined,
      content: s.content||""
    }));
    const flow = await queryOne<any>(
      `INSERT INTO lead_flows (tenant_id, name, description, trigger_event, steps, active)
       VALUES ($1,$2,$3,$4,$5,true) RETURNING *`,
      [req.user!.tenantId, name, description||"", triggerEvent, JSON.stringify(stepsWithIds)]
    );
    res.status(201).json(mapFlow(flow!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/marketing/flows/toggle", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.body;
    const flow = await queryOne<any>(
      `UPDATE lead_flows SET active = NOT active, updated_at=NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, req.user!.tenantId]
    );
    if (!flow) return res.status(404).json({ error: "Fluxo não encontrado." });
    res.json(mapFlow(flow));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/marketing/funnels", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await queryAll<any>(`SELECT * FROM sales_funnels WHERE tenant_id = $1`, [req.user!.tenantId]);
    res.json(rows.map(mapFunnel));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/marketing/funnels", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { eventId, name, targetProduct, stages } = req.body;
    if (!name || !targetProduct) return res.status(400).json({ error: "Nome e produto alvo são obrigatórios." });

    const defaultStages = [
      { name: "Leads Capturados", description: "Inscrições prévias", leadsCount: 0, valueSum: 0 },
      { name: "Contato Estabelecido", description: "Abordagem inicial", leadsCount: 0, valueSum: 0 },
      { name: "Proposta Enviada", description: "Link de pagamento gerado", leadsCount: 0, valueSum: 0 },
      { name: "Venda Finalizada", description: "Lote pago e confirmado", leadsCount: 0, valueSum: 0 }
    ];
    const funnel = await queryOne<any>(
      `INSERT INTO sales_funnels (tenant_id, event_id, name, target_product, stages)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user!.tenantId, eventId||null, name, targetProduct, JSON.stringify(stages||defaultStages)]
    );
    res.status(201).json(mapFunnel(funnel!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/campaigns/schedule", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { eventId, title, channel, subject, content, scheduledAt, targetSegment } = req.body;
    if (!title || !channel || !content)
      return res.status(400).json({ error: "Título, canal e conteúdo são obrigatórios." });

    const cmp = await queryOne<any>(
      `INSERT INTO marketing_campaigns (tenant_id, event_id, title, channel, subject, content, scheduled_at, target_segment, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT') RETURNING *`,
      [req.user!.tenantId, eventId||null, title, channel, subject||null, content, scheduledAt||null, targetSegment||"Todos os Clientes"]
    );
    res.status(201).json(mapCampaign(cmp!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Campaign send (updates real stats from DB, not Math.random)
app.put("/api/campaigns/:id/send", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    // Count real recipients based on tenant tickets
    const recipientCount = await queryOne<any>(
      `SELECT COUNT(DISTINCT buyer_email) as cnt FROM tickets WHERE tenant_id = $1 AND cancelled_at IS NULL`,
      [req.user!.tenantId]
    );
    const sentCount = parseInt(recipientCount?.cnt || "0");

    const cmp = await queryOne<any>(
      `UPDATE marketing_campaigns SET status='SENT', sent_count=$1, updated_at=NOW()
       WHERE id=$2 AND tenant_id=$3 RETURNING *`,
      [sentCount, id, req.user!.tenantId]
    );
    if (!cmp) return res.status(404).json({ error: "Campanha não encontrada." });
    res.json(mapCampaign(cmp));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── CONTRACTS ───────────────────────────────────────────────────────────────

app.post("/api/contracts", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { eventId, title, type, content, status } = req.body;
    const contract = await queryOne<any>(
      `INSERT INTO document_contracts (tenant_id, event_id, title, type, content, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user!.tenantId, eventId||null, title, type||"SERVICE", content||null, status||"DRAFT"]
    );
    res.status(201).json(mapContract(contract!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put("/api/contracts/:id/sign", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const contract = await queryOne<any>(`SELECT * FROM document_contracts WHERE id = $1`, [id]);
    if (!contract) return res.status(404).json({ error: "Contrato não encontrado." });

    const signerName = req.user!.name;
    const signedBy = [...(contract.signed_by || [])];
    if (!signedBy.includes(signerName)) signedBy.push(signerName);

    const auditTrail = [...(contract.audit_trail || [])];
    auditTrail.push(`${new Date().toISOString()}: Assinado por ${signerName}`);

    const updated = await queryOne<any>(
      `UPDATE document_contracts SET signed_by=$1::jsonb, audit_trail=$2::jsonb,
        status=CASE WHEN $3 THEN 'SIGNED' ELSE status END, signed_at=COALESCE(signed_at,NOW()), updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [JSON.stringify(signedBy), JSON.stringify(auditTrail), signedBy.length >= 1, id]
    );
    res.json(mapContract(updated!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── EVENT PLANNING / GATEWAY ─────────────────────────────────────────────────

app.post("/api/v1/gateway/planning", requireAuth, requireRole("PRODUCER"), async (req: AuthRequest, res) => {
  try {
    const { eventId, strategicGoal, phases, risks, milestones } = req.body;
    if (!eventId || !strategicGoal || !Array.isArray(phases))
      return res.status(400).json({ errors: ["eventId, strategicGoal e phases são obrigatórios."] });

    const planning = await queryOne<any>(
      `INSERT INTO event_plannings (event_id, strategic_goal, phases, risks, milestones)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (event_id) DO UPDATE SET
         strategic_goal=$2, phases=$3, risks=$4, milestones=$5, updated_at=NOW()
       RETURNING *`,
      [eventId, strategicGoal, JSON.stringify(phases), JSON.stringify(risks||[]), JSON.stringify(milestones||[])]
    );

    await query(
      `INSERT INTO gateway_logs (method, path, client_ip, status_code, duration_ms, user_id, tenant_id, audit_details)
       VALUES ('POST','/api/v1/gateway/planning',$1,201,0,$2,$3,$4)`,
      [req.ip, req.user!.userId, req.user!.tenantId, `Planning created for event ${eventId}`]
    );
    res.status(201).json(mapPlanning(planning!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/v1/gateway/graphql", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { query: gqlQuery, variables } = req.body;
    if (!gqlQuery) return res.status(400).json({ errors: [{ message: "Campo 'query' é obrigatório." }] });

    let data: any = {};
    if (gqlQuery.includes("getEventPlanning")) {
      const plan = await queryOne<any>(`SELECT * FROM event_plannings WHERE event_id = $1`, [variables?.eventId]);
      data = { getEventPlanning: plan ? mapPlanning(plan) : null };
    } else if (gqlQuery.includes("listGatewayLogs")) {
      const logs = await queryAll<any>(`SELECT * FROM gateway_logs ORDER BY timestamp DESC LIMIT 15`);
      data = { listGatewayLogs: logs };
    } else {
      const events = await queryAll<any>(`SELECT id, name FROM events WHERE deleted_at IS NULL LIMIT 20`);
      const countRow = await queryOne<any>(`SELECT COUNT(*) as cnt FROM staff_teams WHERE tenant_id = $1`, [req.user!.tenantId]);
      data = { events, teamsCount: parseInt(countRow?.cnt||"0") };
    }
    res.json({ data });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/v1/gateway/logs", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  try {
    const logs = await queryAll<any>(`SELECT * FROM gateway_logs ORDER BY timestamp DESC LIMIT 100`);
    res.json(logs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── AI ROUTES ────────────────────────────────────────────────────────────────

app.post("/api/ai/chat", requireAuth, aiLimiter, async (req: AuthRequest, res) => {
  try {
    const { message, eventId } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY não configurada." });

    const tenantId = req.user!.tenantId;

    // Fetch real-time statistics from database
    const [statsRow, eventRows, suppliersRow] = await Promise.all([
      queryOne<any>(
        `SELECT
           (SELECT COUNT(*) FROM events WHERE tenant_id=$1 AND deleted_at IS NULL) as total_events,
           (SELECT COUNT(*) FROM tickets WHERE tenant_id=$1 AND cancelled_at IS NULL) as total_tickets,
           (SELECT COALESCE(SUM(amount),0) FROM finance_transactions WHERE tenant_id=$1 AND type='INCOME' AND status='PAID') as total_income,
           (SELECT COALESCE(SUM(amount),0) FROM finance_transactions WHERE tenant_id=$1 AND type='EXPENSE') as total_expenses,
           (SELECT COUNT(*) FROM sponsorships s JOIN events e ON s.event_id=e.id WHERE e.tenant_id=$1 AND s.status='ACTIVE') as active_sponsorships`,
        [tenantId]
      ),
      queryAll<any>(`SELECT id, name, type, location, capacity, ticket_price FROM events WHERE tenant_id=$1 AND deleted_at IS NULL`, [tenantId]),
      queryAll<any>(`SELECT name, category, price_per_hour FROM suppliers WHERE deleted_at IS NULL LIMIT 10`),
    ]);

    const netProfit = parseFloat(statsRow?.total_income||0) - parseFloat(statsRow?.total_expenses||0);
    const suppliersText = suppliersRow.map((s: any) => `${s.name} (${s.category} - R$${s.price_per_hour}/h)`).join(", ");

    let systemInstruction = `Você é a IA Corporativa Oficial do EventFlow Enterprise.
Sua missão é assessorar gestores com dados REAIS da plataforma.

DADOS REAIS DA BASE DE DADOS (atualizado em tempo real):
- Total de Eventos Cadastrados: ${statsRow?.total_events || 0}
- Faturamento Total (Recebido): R$ ${parseFloat(statsRow?.total_income||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}
- Despesas Totais: R$ ${parseFloat(statsRow?.total_expenses||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}
- Lucro Líquido Real: R$ ${netProfit.toLocaleString("pt-BR",{minimumFractionDigits:2})}
- Ingressos/Inscrições Emitidos: ${statsRow?.total_tickets || 0}
- Patrocínios Ativos: ${statsRow?.active_sponsorships || 0}
- Fornecedores Credenciados: [${suppliersText}]

Eventos Atuais: ${JSON.stringify(eventRows.map((e:any)=>({id:e.id,name:e.name,type:e.type,location:e.location,capacity:e.capacity,price:e.ticket_price})))}

COMO AGIR:
1. Responda com termos corporativos elegantes e profissionais.
2. Ao estimar custos, use preços reais de fornecedores listados acima.
3. Ao recomendar preços, analise capacidade do local e projete cenários de lotação.
4. Se pedir cronograma, elabore atividades realistas com horários.
5. Responda em português (pt-BR) de forma estruturada.`;

    if (eventId) {
      const ev = await queryOne<any>(`SELECT * FROM events WHERE id=$1`, [eventId]);
      if (ev) {
        const [incomeRow, expRow, tkts] = await Promise.all([
          queryOne<any>(`SELECT COALESCE(SUM(amount),0) as total FROM finance_transactions WHERE event_id=$1 AND type='INCOME'`, [eventId]),
          queryOne<any>(`SELECT COALESCE(SUM(amount),0) as total FROM finance_transactions WHERE event_id=$1 AND type='EXPENSE'`, [eventId]),
          queryOne<any>(`SELECT COUNT(*) as cnt FROM tickets WHERE event_id=$1 AND cancelled_at IS NULL`, [eventId]),
        ]);
        systemInstruction += `\n\nFOCO ESPECIAL NO EVENTO: "${ev.name}" | Data: ${ev.date} | Local: ${ev.location} | Capacidade: ${ev.capacity} | Preço: R$${ev.ticket_price} | Faturamento: R$${parseFloat(incomeRow?.total||0).toLocaleString("pt-BR")} | Despesas: R$${parseFloat(expRow?.total||0).toLocaleString("pt-BR")} | Ingressos: ${tkts?.cnt||0}`;
      }
    }

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message,
      config: { systemInstruction, temperature: 0.7, maxOutputTokens: 1200 }
    });
    res.json({ text: response.text });
  } catch (err: any) {
    log("ERROR", "AI chat error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/ticketing-insights", requireAuth, aiLimiter, async (req: AuthRequest, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY não configurada." });

    const { query: aiQuery, snapshot, eventId } = req.body;
    // Fetch real ticket data from DB
    let liveSnapshot = snapshot;
    if (eventId && !snapshot) {
      const [tkts, ev] = await Promise.all([
        queryAll<any>(`SELECT type, price, checked_in, coupon_code FROM tickets WHERE event_id=$1`, [eventId]),
        queryOne<any>(`SELECT name, capacity, ticket_price FROM events WHERE id=$1`, [eventId]),
      ]);
      liveSnapshot = { event: ev ? mapEvent(ev) : null, tickets: tkts.map(mapTicket), totalTickets: tkts.length };
    }

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const systemInstruction = `Você é especialista em ticketing enterprise. Analise os dados e responda de forma objetiva e acionável em português.\nDados: ${JSON.stringify(liveSnapshot, null, 2)}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: aiQuery || "Forneça insights sobre estes dados de ticketing." }] }],
      config: { systemInstruction, temperature: 0.6, maxOutputTokens: 800 }
    });
    res.json({ reply: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/event-brief", requireAuth, requireRole("PRODUCER"), aiLimiter, async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.body;
    const ev = await queryOne<any>(`SELECT * FROM events WHERE id=$1 AND deleted_at IS NULL`, [eventId]);
    if (!ev) return res.status(404).json({ error: "Evento não encontrado." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY não configurada." });

    const existingChecklist = (ev.checklist||[]).map((c:any) => c.task).join(", ");
    const existingSchedule = (ev.schedule||[]).map((s:any) => `${s.time} - ${s.activity}`).join(", ");
    const existingInfra = (ev.infrastructure||[]).map((i:any) => i.name).join(", ");

    const prompt = `Você é especialista sênior em produção de eventos com 20 anos de experiência.
Baseado no evento abaixo, gere um briefing completo e profissional em JSON estruturado.

DADOS DO EVENTO:
- Nome: ${ev.name}
- Tipo: ${ev.type}
- Data: ${ev.date}
- Local: ${ev.location}
- Capacidade: ${ev.capacity}
- Público: ${ev.target_audience||"Geral"}
- Objetivos: ${ev.objectives||"Realizar evento de sucesso"}
- Já no checklist: ${existingChecklist||"nenhum"}
- Já na programação: ${existingSchedule||"nenhuma"}
- Já na infra: ${existingInfra||"nenhuma"}

INSTRUÇÕES:
1. NÃO repita itens existentes.
2. Seja específico para o tipo de evento.
3. Use terminologia profissional do setor.
4. RETORNE SOMENTE JSON VÁLIDO.

JSON ESPERADO:
{
  "summary": "Resumo executivo em 2-3 frases",
  "checklist": [{"task":"...","category":"PLANEJAMENTO","assigneeRole":"PRODUCER","responsible":"...","priority":"CRITICAL","deadline_days_before":30}],
  "schedule": [{"time":"07:00","activity":"...","responsibility":"COORDINATOR","location":"...","estimatedDuration":60,"notes":"..."}],
  "infrastructure": [{"name":"...","quantity":1,"status":"Pendente","category":"...","location":"...","notes":"..."}],
  "risks": [{"description":"...","impact":"HIGH","mitigation":"..."}],
  "logistics": [{"type":"TRANSPORT","description":"...","responsible":"...","origin":"...","destination":"...","vehicle":"...","capacity":10,"notes":"..."}]
}`;

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { temperature: 0.8, maxOutputTokens: 2000 }
    });

    let raw = response.text || "{}";
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const brief = JSON.parse(raw);
    res.json(brief);
  } catch (err: any) {
    log("ERROR", "AI brief error", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// AI: Risk Analysis
app.post("/api/ai/risk-analysis", requireAuth, requireRole("COORDINATOR"), aiLimiter, async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY não configurada." });

    const ev = await queryOne<any>(`SELECT * FROM events WHERE id=$1`, [eventId]);
    if (!ev) return res.status(404).json({ error: "Evento não encontrado." });

    const [tktCount, finRow] = await Promise.all([
      queryOne<any>(`SELECT COUNT(*) as cnt FROM tickets WHERE event_id=$1`, [eventId]),
      queryOne<any>(`SELECT COALESCE(SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END),0) as income, COALESCE(SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END),0) as expense FROM finance_transactions WHERE event_id=$1`, [eventId]),
    ]);

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const prompt = `Analise os riscos deste evento e retorne JSON estruturado:
Evento: ${ev.name} | Tipo: ${ev.type} | Data: ${ev.date} | Local: ${ev.location}
Capacidade: ${ev.capacity} | Ingressos vendidos: ${tktCount?.cnt||0}
Faturamento: R$${parseFloat(finRow?.income||0).toLocaleString("pt-BR")} | Despesas: R$${parseFloat(finRow?.expense||0).toLocaleString("pt-BR")}

Retorne JSON: {"risks":[{"id":"risk-1","description":"...","category":"FINANCEIRO|OPERACIONAL|SEGURANÇA|CLIMA|JURIDICO","impact":"LOW|MEDIUM|HIGH|CRITICAL","probability":"LOW|MEDIUM|HIGH","mitigation":"...","owner":"...","status":"IDENTIFIED"}]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", contents: prompt,
      config: { temperature: 0.5, maxOutputTokens: 1500 }
    });
    let raw = (response.text||"{}").replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
    res.json(JSON.parse(raw));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Executive Summary
app.post("/api/ai/executive-summary", requireAuth, requireRole("COORDINATOR"), aiLimiter, async (req: AuthRequest, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY não configurada." });

    const tenantId = req.user!.tenantId;
    const [eventsRow, finRow, tktRow, spsRow] = await Promise.all([
      queryAll<any>(`SELECT name, status, date, capacity FROM events WHERE tenant_id=$1 AND deleted_at IS NULL ORDER BY date ASC LIMIT 10`, [tenantId]),
      queryOne<any>(`SELECT COALESCE(SUM(CASE WHEN type='INCOME' AND status='PAID' THEN amount ELSE 0 END),0) as income, COALESCE(SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END),0) as expense FROM finance_transactions WHERE tenant_id=$1`, [tenantId]),
      queryOne<any>(`SELECT COUNT(*) as cnt FROM tickets WHERE tenant_id=$1 AND cancelled_at IS NULL`, [tenantId]),
      queryOne<any>(`SELECT COUNT(*) as cnt, COALESCE(SUM(s.value),0) as total_value FROM sponsorships s JOIN events e ON s.event_id=e.id WHERE e.tenant_id=$1 AND s.status='ACTIVE'`, [tenantId]),
    ]);

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const prompt = `Você é um consultor executivo de eventos. Gere um resumo executivo profissional em português para a diretoria.
Dados reais da plataforma:
- Eventos: ${JSON.stringify(eventsRow.map((e:any)=>({nome:e.name,status:e.status,data:e.date,capacidade:e.capacity})))}
- Faturamento: R$${parseFloat(finRow?.income||0).toLocaleString("pt-BR")}
- Despesas: R$${parseFloat(finRow?.expense||0).toLocaleString("pt-BR")}
- Lucro: R$${(parseFloat(finRow?.income||0)-parseFloat(finRow?.expense||0)).toLocaleString("pt-BR")}
- Ingressos emitidos: ${tktRow?.cnt||0}
- Patrocínios ativos: ${spsRow?.cnt||0} (Total: R$${parseFloat(spsRow?.total_value||0).toLocaleString("pt-BR")})
Gere um resumo executivo completo com destaques, indicadores-chave e recomendações estratégicas.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", contents: prompt,
      config: { temperature: 0.7, maxOutputTokens: 1500 }
    });
    res.json({ summary: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COUPONS (from DB) ────────────────────────────────────────────────────────

app.get("/api/coupons", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await queryAll<any>(`SELECT * FROM coupons WHERE tenant_id = $1 ORDER BY created_at DESC`, [req.user!.tenantId]);
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/coupons", requireAuth, requireRole("COORDINATOR"), async (req: AuthRequest, res) => {
  try {
    const { code, discountType, discountValue, maxUses, validFrom, validUntil, eventId } = req.body;
    if (!code || !discountValue) return res.status(400).json({ error: "Código e valor são obrigatórios." });
    const coupon = await queryOne<any>(
      `INSERT INTO coupons (tenant_id, event_id, code, discount_type, discount_value, max_uses, valid_from, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user!.tenantId, eventId||null, String(code).toUpperCase(), discountType||"pct",
       Number(discountValue), maxUses||null, validFrom||null, validUntil||null]
    );
    res.status(201).json(coupon);
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Cupom já existe." });
    res.status(500).json({ error: err.message });
  }
});

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

app.get("/api/audit-logs", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res) => {
  try {
    const logs = await queryAll<any>(
      `SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY timestamp DESC LIMIT 200`,
      [req.user!.tenantId]
    );
    res.json(logs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── MAPPERS (DB rows → frontend camelCase) ───────────────────────────────────

function mapTenant(r: any) {
  return { id: r.id, name: r.name, plan: r.plan, active: r.active, currency: r.currency, language: r.language, customDomain: r.custom_domain, cnpj: r.cnpj };
}
function mapEvent(r: any) {
  return {
    id: r.id, tenantId: r.tenant_id, code: r.code, name: r.name, type: r.type, modality: r.modality,
    date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
    description: r.description, status: r.status, organizer: r.organizer, contractor: r.contractor,
    technicalResponsible: r.technical_responsible, objectives: r.objectives, targetAudience: r.target_audience,
    ageClassification: r.age_classification, primaryLanguage: r.primary_language,
    location: r.location, country: r.country, state: r.state, city: r.city, address: r.address,
    zipCode: r.zip_code, coordinates: r.coordinates, mapLink: r.map_link, emergencyRoutes: r.emergency_routes,
    capacity: r.capacity, expectedParticipants: r.expected_participants, ticketPrice: parseFloat(r.ticket_price||0),
    imageUrl: r.image_url, budgetRatio: parseFloat(r.budget_ratio||0.7),
    phases: r.phases, checklist: r.checklist||[], schedule: r.schedule||[],
    infrastructure: r.infrastructure||[], logistics: r.logistics||[],
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
function mapTicket(r: any) {
  return {
    id: r.id, eventId: r.event_id, tenantId: r.tenant_id, name: r.name, type: r.type,
    price: parseFloat(r.price||0), buyerName: r.buyer_name, buyerEmail: r.buyer_email,
    qrCode: r.qr_code, checkedIn: r.checked_in, checkedInAt: r.checked_in_at,
    checkOutAt: r.check_out_at, reentryCount: r.reentry_count, seat: r.seat, cpf: r.cpf,
    batchId: r.batch_id, batchName: r.batch_name, paymentMethod: r.payment_method,
    paymentStatus: r.payment_status, couponCode: r.coupon_code,
    discountAmount: r.discount_amount ? parseFloat(r.discount_amount) : undefined,
    originalPrice: r.original_price ? parseFloat(r.original_price) : undefined,
    category: r.category, distance: r.distance, team: r.team, club: r.club, federation: r.federation,
    bibNumber: r.bib_number, chipNumber: r.chip_number, shirtSize: r.shirt_size,
    hasTermSigned: r.has_term_signed, hasMedicalCert: r.has_medical_cert, hasInsurance: r.has_insurance,
    kitDelivered: r.kit_delivered, credentialType: r.credential_type, credentialPrinted: r.credential_printed,
    accessZones: r.access_zones||[], transferredToName: r.transferred_to_name,
    transferredToEmail: r.transferred_to_email, transferredAt: r.transferred_at,
    cancelledAt: r.cancelled_at, cancelReason: r.cancel_reason, refundStatus: r.refund_status,
  };
}
function mapFinance(r: any) {
  return { id: r.id, tenantId: r.tenant_id, eventId: r.event_id, type: r.type, category: r.category, amount: parseFloat(r.amount||0), description: r.description, date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date, status: r.status };
}
function mapLead(r: any) {
  return { id: r.id, tenantId: r.tenant_id, name: r.name, company: r.company, type: r.type, email: r.email, phone: r.phone, pipelineStage: r.pipeline_stage, value: parseFloat(r.value||0), notes: r.notes };
}
function mapSupplier(r: any) {
  return { id: r.id, name: r.name, category: r.category, rating: parseFloat(r.rating||5), pricePerHour: parseFloat(r.price_per_hour||0), email: r.email, phone: r.phone, availability: r.availability||[], portfolioUrl: r.portfolio_url };
}
function mapBooking(r: any) {
  return { id: r.id, supplierId: r.supplier_id, eventId: r.event_id, date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date, cost: parseFloat(r.cost||0), status: r.status };
}
function mapSponsorship(r: any) {
  return { id: r.id, eventId: r.event_id, sponsorName: r.sponsor_name, quotaName: r.quota_name, value: parseFloat(r.value||0), deliverables: r.deliverables||[], status: r.status, roiRatio: parseFloat(r.roi_ratio||0) };
}
function mapPurchaseOrder(r: any) {
  return { id: r.id, tenantId: r.tenant_id, title: r.title, amount: parseFloat(r.amount||0), status: r.status, supplierName: r.supplier_name, date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date };
}
function mapStaff(r: any) {
  return { id: r.id, tenantId: r.tenant_id, eventId: r.event_id, name: r.name, role: r.role, email: r.email, phone: r.phone, checkInStatus: r.check_in_status, gpsCoords: r.gps_coords, hoursWorked: parseFloat(r.hours_worked||0), uniformSize: r.uniform_size, hourlyRate: parseFloat(r.hourly_rate||25) };
}
function mapTeam(r: any) {
  return { id: r.id, tenantId: r.tenant_id, eventId: r.event_id, name: r.name, area: r.area, leaderName: r.leader_name, membersCount: r.members_count };
}
function mapShift(r: any) {
  return { id: r.id, staffId: r.staff_id, staffName: r.staff_name, eventId: r.event_id, eventName: r.event_name, date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date, startTime: r.start_time, endTime: r.end_time, hoursAllocated: parseFloat(r.hours_allocated||8), role: r.role, status: r.status };
}
function mapClock(r: any) {
  return { id: r.id, staffId: r.staff_id, staffName: r.staff_name, eventId: r.event_id, timestamp: r.timestamp, type: r.type, method: r.method, gpsCoords: r.gps_coords, locationName: r.location_name };
}
function mapPayment(r: any) {
  return { id: r.id, staffId: r.staff_id, staffName: r.staff_name, eventId: r.event_id, role: r.role, amount: parseFloat(r.amount||0), hoursTotal: parseFloat(r.hours_total||0), status: r.status, paymentDate: r.payment_date instanceof Date ? r.payment_date.toISOString().split("T")[0] : r.payment_date, paymentMethod: r.payment_method };
}
function mapMessage(r: any) {
  return { id: r.id, tenantId: r.tenant_id, eventId: r.event_id, senderName: r.sender_name, senderRole: r.sender_role, message: r.message, timestamp: r.timestamp, channel: r.channel };
}
function mapContract(r: any) {
  return { id: r.id, tenantId: r.tenant_id, eventId: r.event_id, title: r.title, type: r.type, content: r.content, status: r.status, signedBy: r.signed_by||[], signedAt: r.signed_at, auditTrail: r.audit_trail||[] };
}
function mapCampaign(r: any) {
  return { id: r.id, tenantId: r.tenant_id, eventId: r.event_id, title: r.title, channel: r.channel, sentCount: r.sent_count, conversionRate: parseFloat(r.conversion_rate||0), status: r.status, subject: r.subject, content: r.content, scheduledAt: r.scheduled_at, targetSegment: r.target_segment, opens: r.opens, clicks: r.clicks, conversions: r.conversions };
}
function mapFlow(r: any) {
  return { id: r.id, tenantId: r.tenant_id, name: r.name, description: r.description, triggerEvent: r.trigger_event, steps: r.steps||[], active: r.active };
}
function mapFunnel(r: any) {
  return { id: r.id, tenantId: r.tenant_id, eventId: r.event_id, name: r.name, targetProduct: r.target_product, stages: r.stages||[] };
}
function mapPlanning(r: any) {
  return { id: r.id, eventId: r.event_id, strategicGoal: r.strategic_goal, phases: r.phases||[], risks: r.risks||[], milestones: r.milestones||[] };
}

// ─── CENTRAL DE CHAMADOS (SUPPORT TICKETS) ────────────────────────────────────

function mapSupportTicket(r: any) {
  return {
    id: r.id, tenantId: r.tenant_id, title: r.title, description: r.description,
    category: r.category, priority: r.priority, status: r.status,
    slaHours: r.sla_hours, assignedTo: r.assigned_to, assignedName: r.assigned_name,
    createdBy: r.created_by, creatorName: r.creator_name,
    eventId: r.event_id, resolution: r.resolution,
    resolvedAt: r.resolved_at, closedAt: r.closed_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
    commentCount: parseInt(r.comment_count || 0),
  };
}

function mapSupportComment(r: any) {
  return {
    id: r.id, ticketId: r.ticket_id, authorId: r.author_id,
    authorName: r.author_name, authorRole: r.author_role,
    content: r.content, isInternal: r.is_internal, createdAt: r.created_at,
  };
}

app.get("/api/support/tickets", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const { status, priority, category, q } = req.query as Record<string, string>;
    let sql = `SELECT st.*,
      creator.name as creator_name, assigned.name as assigned_name,
      (SELECT COUNT(*) FROM support_ticket_comments c WHERE c.ticket_id = st.id) as comment_count
      FROM support_tickets st
      LEFT JOIN users creator ON st.created_by = creator.id
      LEFT JOIN users assigned ON st.assigned_to = assigned.id
      WHERE st.tenant_id = $1`;
    const params: any[] = [tenantId];
    if (status && status !== "all") { params.push(status); sql += ` AND st.status = $${params.length}`; }
    if (priority && priority !== "all") { params.push(priority); sql += ` AND st.priority = $${params.length}`; }
    if (category && category !== "all") { params.push(category); sql += ` AND st.category = $${params.length}`; }
    if (q) { params.push(`%${q}%`); sql += ` AND (st.title ILIKE $${params.length} OR st.description ILIKE $${params.length})`; }
    sql += " ORDER BY CASE st.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, st.created_at DESC";
    const rows = await queryAll<any>(sql, params);
    res.json(rows.map(mapSupportTicket));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/support/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const [byStatus, byPriority, slaViolations] = await Promise.all([
      queryAll<any>(`SELECT status, COUNT(*) as count FROM support_tickets WHERE tenant_id=$1 GROUP BY status`, [tenantId]),
      queryAll<any>(`SELECT priority, COUNT(*) as count FROM support_tickets WHERE tenant_id=$1 AND status NOT IN ('resolved','closed') GROUP BY priority`, [tenantId]),
      queryAll<any>(`SELECT COUNT(*) as count FROM support_tickets WHERE tenant_id=$1 AND status NOT IN ('resolved','closed') AND created_at < NOW() - INTERVAL '1 hour' * sla_hours`, [tenantId]),
    ]);
    res.json({ byStatus, byPriority, slaViolations: parseInt(slaViolations[0]?.count || 0) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/support/tickets", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { title, description, category = "ti", priority = "medium", slaHours = 24, eventId } = req.body;
    if (!title || !description) return res.status(400).json({ error: "Título e descrição são obrigatórios." });
    const slaMap: Record<string, number> = { critical: 4, high: 8, medium: 24, low: 72 };
    const effectiveSla = slaMap[priority] || slaHours;
    const row = await queryOne<any>(
      `INSERT INTO support_tickets (tenant_id, title, description, category, priority, sla_hours, created_by, event_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [tenantId, title, description, category, priority, effectiveSla, userId, eventId || null]
    );
    await query(`INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
      [tenantId, userId, "TICKET_CREATE", "support_ticket", row!.id, JSON.stringify({ title, priority, category })]);
    res.status(201).json(mapSupportTicket(row!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/support/tickets/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { status, priority, assignedTo, resolution, title, description, category } = req.body;
    const resolvedAt = status === "resolved" ? "NOW()" : null;
    const closedAt = status === "closed" ? "NOW()" : null;
    const row = await queryOne<any>(
      `UPDATE support_tickets SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        category = COALESCE($3, category), priority = COALESCE($4, priority),
        status = COALESCE($5, status), assigned_to = COALESCE($6, assigned_to),
        resolution = COALESCE($7, resolution),
        resolved_at = CASE WHEN $5 = 'resolved' THEN NOW() ELSE resolved_at END,
        closed_at = CASE WHEN $5 = 'closed' THEN NOW() ELSE closed_at END,
        updated_at = NOW()
       WHERE id = $8 AND tenant_id = $9 RETURNING *`,
      [title, description, category, priority, status, assignedTo, resolution, id, tenantId]
    );
    if (!row) return res.status(404).json({ error: "Chamado não encontrado." });
    await query(`INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
      [tenantId, userId, "TICKET_UPDATE", "support_ticket", id, JSON.stringify({ status, priority })]);
    res.json(mapSupportTicket(row));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/support/tickets/:id", requireAuth, requireRole("ADMIN"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    await query(`DELETE FROM support_tickets WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/support/tickets/:id/comments", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rows = await queryAll<any>(`SELECT * FROM support_ticket_comments WHERE ticket_id=$1 ORDER BY created_at ASC`, [id]);
    res.json(rows.map(mapSupportComment));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/support/tickets/:id/comments", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal = false } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Conteúdo obrigatório." });
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const user = await queryOne<any>(`SELECT name, role FROM users WHERE id=$1`, [userId]);
    const row = await queryOne<any>(
      `INSERT INTO support_ticket_comments (ticket_id, author_id, author_name, author_role, content, is_internal)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, userId, user?.name || "Usuário", user?.role || "USER", content.trim(), isInternal]
    );
    await query(`UPDATE support_tickets SET updated_at=NOW() WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
    res.status(201).json(mapSupportComment(row!));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/ai/ticket-suggestion", requireAuth, aiLimiter, async (req: AuthRequest, res) => {
  try {
    const { title, description, category } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY não configurada." });
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Você é um especialista em suporte técnico para gestão de eventos. 
Analise este chamado e forneça uma sugestão de resolução rápida:

Título: ${title}
Categoria: ${category}
Descrição: ${description}

Responda em JSON: {
  "priority": "critical|high|medium|low",
  "estimatedTime": "tempo estimado ex: 2 horas",
  "solution": "solução ou próximos passos em 2-3 frases",
  "escalate": true/false,
  "escalateTo": "departamento se necessário escalar"
}`;
    const result = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    const text = result.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.json({ priority: "medium", solution: "Análise não disponível.", estimatedTime: "4 horas", escalate: false });
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── BIBLIOTECA DIGITAL (DOCUMENT MANAGEMENT) ─────────────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "video/mp4", "video/quicktime", "video/x-msvideo",
      "application/zip", "text/plain", "text/csv"
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.use("/uploads", requireAuth, express.static(UPLOADS_DIR));

app.post("/api/documents", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
    const { name, category = "other", description = "", eventId, tags = "[]" } = req.body;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const parsedTags = (() => { try { return JSON.parse(tags); } catch { return []; } })();
    const docName = name || req.file.originalname;
    const row = await queryOne<any>(
      `INSERT INTO documents (tenant_id, name, category, description, file_name, file_path, file_size, mime_type, event_id, uploaded_by, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [tenantId, docName, category, description, req.file.originalname, req.file.filename,
       req.file.size, req.file.mimetype, eventId || null, userId, parsedTags]
    );
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
      [tenantId, userId, "DOCUMENT_UPLOAD", "document", row!.id, JSON.stringify({ name: docName, category })]
    );
    res.status(201).json(mapDocument(row!));
  } catch (err: any) {
    if (req.file) fs.unlink(path.join(UPLOADS_DIR, req.file.filename), () => {});
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/documents", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const { category, eventId, q } = req.query as Record<string, string>;
    let sql = `SELECT d.*, u.name as uploader_name
               FROM documents d
               LEFT JOIN users u ON d.uploaded_by = u.id
               WHERE d.tenant_id = $1`;
    const params: any[] = [tenantId];
    if (category && category !== "all") { params.push(category); sql += ` AND d.category = $${params.length}`; }
    if (eventId) { params.push(eventId); sql += ` AND d.event_id = $${params.length}`; }
    if (q) { params.push(`%${q}%`); sql += ` AND (d.name ILIKE $${params.length} OR d.description ILIKE $${params.length})`; }
    sql += " ORDER BY d.created_at DESC";
    const rows = await queryAll<any>(sql, params);
    res.json(rows.map(mapDocument));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/documents/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const rows = await queryAll<any>(
      `SELECT category, COUNT(*) as count, COALESCE(SUM(file_size),0) as total_size
       FROM documents WHERE tenant_id=$1 GROUP BY category`,
      [tenantId]
    );
    const total = await queryOne<any>(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size),0) as total_size FROM documents WHERE tenant_id=$1`,
      [tenantId]
    );
    res.json({ byCategory: rows, total: { count: parseInt(total?.count||0), totalSize: parseInt(total?.total_size||0) } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/documents/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    const doc = await queryOne<any>(`SELECT * FROM documents WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
    if (!doc) return res.status(404).json({ error: "Documento não encontrado." });
    await query(`DELETE FROM documents WHERE id=$1`, [id]);
    const filePath = path.join(UPLOADS_DIR, doc.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)`,
      [tenantId, req.user!.id, "DOCUMENT_DELETE", "document", id, JSON.stringify({ name: doc.name })]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/documents/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;
    const { name, description, category, tags, aiSummary } = req.body;
    const row = await queryOne<any>(
      `UPDATE documents SET name=COALESCE($1,name), description=COALESCE($2,description),
       category=COALESCE($3,category), tags=COALESCE($4,tags), ai_summary=COALESCE($5,ai_summary),
       updated_at=NOW() WHERE id=$6 AND tenant_id=$7 RETURNING *`,
      [name, description, category, tags, aiSummary, id, tenantId]
    );
    if (!row) return res.status(404).json({ error: "Documento não encontrado." });
    res.json(mapDocument(row));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/ai/document-analyze", requireAuth, aiLimiter, async (req: AuthRequest, res) => {
  try {
    const { documentId, fileName, mimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY não configurada." });
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Você é um assistente de gestão documental para eventos. 
Com base no nome do arquivo "${fileName}" e tipo MIME "${mimeType}", sugira:
1. Uma categoria adequada (contract, license, blueprint, photo, report, video, other)
2. Um resumo/descrição em 1-2 frases
3. 3-5 tags relevantes

Responda em JSON: { "category": "...", "summary": "...", "tags": ["..."] }`;
    const result = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    const text = result.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.json({ category: "other", summary: "", tags: [] });
    const parsed = JSON.parse(jsonMatch[0]);
    if (documentId) {
      await query(
        `UPDATE documents SET ai_summary=$1, category=COALESCE($2,category), tags=COALESCE($3,tags), updated_at=NOW() WHERE id=$4`,
        [parsed.summary, parsed.category, parsed.tags, documentId]
      );
    }
    res.json(parsed);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

function mapDocument(r: any) {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name, category: r.category,
    description: r.description, fileName: r.file_name, filePath: r.file_path,
    fileSize: parseInt(r.file_size||0), mimeType: r.mime_type, eventId: r.event_id,
    uploadedBy: r.uploaded_by, uploaderName: r.uploader_name,
    tags: r.tags||[], aiSummary: r.ai_summary,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
}

// ─── VITE DEV SERVER ──────────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true as any },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist/public")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/public", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    log("INFO", `PLAY+EVENTOS Enterprise V2.0 running on port ${PORT}`, {
      mode: process.env.NODE_ENV || "development",
      database: "PostgreSQL"
    });
  });
}

startServer().catch(err => {
  log("ERROR", "Failed to start server", { error: err.message });
  process.exit(1);
});
