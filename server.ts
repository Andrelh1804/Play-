/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
import {
  getDatabase,
  saveDatabase,
  DatabaseState
} from "./src/dbService";
import {
  EventType,
  EventStatus,
  TicketType,
  TransactionType,
  TransactionStatus,
  LeadType,
  PipelineStage,
  SupplierCategory,
  StaffRole,
  ContractStatus,
  Event,
  Ticket,
  FinanceTransaction,
  CRMLead,
  Booking,
  Sponsorship,
  PurchaseOrder,
  StaffMember,
  DocumentContract,
  MarketingCampaign,
  GatewayLog,
  EventPlanning,
  StaffTeam,
  StaffShift,
  TimeClock,
  FreelancerPayment,
  StaffMessage,
  LeadFlow,
  SalesFunnel
} from "./src/types";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// --- SECURITY MIDDLEWARE ---
// Helmet: safe HTTP headers (CSP off for Vite dev compatibility)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS: allow Replit domains + configured APP_URL
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / server-to-server
    const allowed = [
      process.env.APP_URL,
      /\.replit\.dev$/,
      /\.repl\.co$/,
      /^http:\/\/localhost/
    ];
    const ok = allowed.some(p => p && (typeof p === "string" ? origin === p : p.test(origin)));
    cb(ok ? null : new Error("CORS blocked"), ok);
  },
  credentials: true
}));

// Rate limiting: 200 req / 15 min general; 30 req / 15 min for AI route
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const aiLimiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 30,  standardHeaders: true, legacyHeaders: false });
app.use("/api/", generalLimiter);
app.use("/api/ai/", aiLimiter);

app.use(express.json({ limit: "1mb" }));

// --- HELPER TO ADD AUDIT LOGS ---
function addAuditLog(contractId: string, log: string) {
  const db = getDatabase();
  const c = db.contracts.find(x => x.id === contractId);
  if (c) {
    c.auditTrail.push(`${new Date().toISOString()}: ${log}`);
    saveDatabase(db);
  }
}

// --- API ENDPOINTS ---

// Get complete database state
app.get("/api/db", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset database to initial state
app.post("/api/db/reset", (req, res) => {
  try {
    // Delete the local database file if exists to trigger regeneration
    const DB_PATH = path.resolve(process.cwd(), "db.json");
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
    const db = getDatabase();
    res.json({ message: "Banco de dados restaurado com sucesso!", db });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Event
app.post("/api/events", (req, res) => {
  try {
    const db = getDatabase();
    const eventData = req.body;
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      tenantId: eventData.tenantId || "tenant-1",
      name: eventData.name,
      code: eventData.code || undefined,
      type: eventData.type as EventType,
      modality: eventData.modality || undefined,
      date: eventData.date,
      description: eventData.description,
      status: (eventData.status || EventStatus.PLANNING) as EventStatus,
      organizer: eventData.organizer || undefined,
      contractor: eventData.contractor || undefined,
      technicalResponsible: eventData.technicalResponsible || undefined,
      objectives: eventData.objectives || undefined,
      targetAudience: eventData.targetAudience || undefined,
      ageClassification: eventData.ageClassification || undefined,
      primaryLanguage: eventData.primaryLanguage || "pt-BR",
      location: eventData.location,
      country: eventData.country || undefined,
      state: eventData.state || undefined,
      city: eventData.city || undefined,
      address: eventData.address || undefined,
      zipCode: eventData.zipCode || undefined,
      coordinates: eventData.coordinates || undefined,
      mapLink: eventData.mapLink || undefined,
      emergencyRoutes: eventData.emergencyRoutes || undefined,
      capacity: Number(eventData.capacity || 1000),
      expectedParticipants: eventData.expectedParticipants ? Number(eventData.expectedParticipants) : undefined,
      ticketPrice: Number(eventData.ticketPrice || 0),
      imageUrl: eventData.imageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600",
      budgetRatio: Number(eventData.budgetRatio || 0.7),
      phases: eventData.phases || undefined,
      checklist: eventData.checklist || [],
      schedule: eventData.schedule || [],
      infrastructure: eventData.infrastructure || [],
      logistics: eventData.logistics || []
    };

    db.events.push(newEvent);
    saveDatabase(db);
    res.status(201).json(newEvent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Event
app.put("/api/events/:id", (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const index = db.events.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ error: "Evento não encontrado." });

    db.events[index] = { ...db.events[index], ...req.body };
    saveDatabase(db);
    res.json(db.events[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Event Status
app.put("/api/events/:id/status", (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { status } = req.body;
    const event = db.events.find(e => e.id === id);
    if (!event) return res.status(404).json({ error: "Evento não encontrado." });

    event.status = status as EventStatus;
    saveDatabase(db);
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Checklist Item
app.put("/api/events/:eventId/checklist/:itemId/toggle", (req, res) => {
  try {
    const db = getDatabase();
    const { eventId, itemId } = req.params;
    const event = db.events.find(e => e.id === eventId);
    if (!event) return res.status(404).json({ error: "Evento não encontrado." });

    const item = event.checklist.find(c => c.id === itemId);
    if (!item) return res.status(404).json({ error: "Item de checklist não encontrado." });

    item.completed = !item.completed;
    saveDatabase(db);
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Infrastructure Status
app.put("/api/events/:eventId/infrastructure/:itemId/status", (req, res) => {
  try {
    const db = getDatabase();
    const { eventId, itemId } = req.params;
    const { status } = req.body;
    const event = db.events.find(e => e.id === eventId);
    if (!event) return res.status(404).json({ error: "Evento não encontrado." });

    const item = event.infrastructure.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: "Item de infraestrutura não encontrado." });

    item.status = status;
    saveDatabase(db);
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Tenant Config
app.put("/api/tenants/:id", (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, language, currency } = req.body;
    const tenant = db.tenants.find(t => t.id === id);
    if (!tenant) return res.status(404).json({ error: "Tenant não encontrado." });

    if (name) tenant.name = name;
    if (language) tenant.language = language;
    if (currency) tenant.currency = currency;

    saveDatabase(db);
    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Digital clock-in/out for Staff (GPS)
app.post("/api/staff/clocks", (req, res) => {
  try {
    const db = getDatabase();
    const { staffId, staffName, eventId, type, method, gpsCoords, locationName } = req.body;

    const newClock: TimeClock = {
      id: `clk-${Date.now()}`,
      staffId: staffId || "staff-1",
      staffName: staffName || "Henrique Silva",
      eventId: eventId || "event-1",
      timestamp: new Date().toISOString(),
      type: type as "IN" | "OUT",
      method: (method || "DIGITAL_GPS") as "PHYSICAL" | "DIGITAL_GPS",
      gpsCoords: gpsCoords || { lat: -23.5615, lng: -46.6562 },
      locationName: locationName || "Av. Paulista"
    };

    db.clocks.push(newClock);

    // Also update staff online status and hours
    const staffMember = db.staff.find(s => s.id === staffId);
    if (staffMember) {
      staffMember.checkInStatus = type === "IN" ? "online" : "offline";
      if (type === "OUT") {
        staffMember.hoursWorked += 8;
      }
    }

    saveDatabase(db);
    res.status(201).json(newClock);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Pay all Freelancers
app.post("/api/staff/pay-all", (req, res) => {
  try {
    const db = getDatabase();
    const { tenantId } = req.body;

    const pendingPayments = db.payments.filter(p => p.status === "PENDING");
    if (pendingPayments.length === 0) {
      return res.json({ message: "Nenhum pagamento pendente encontrado." });
    }

    let totalPaid = 0;
    pendingPayments.forEach(p => {
      p.status = "PAID";
      p.paymentDate = new Date().toISOString().split("T")[0];
      p.paymentMethod = "PIX AUTOMÁTICO";
      totalPaid += p.amount;

      // Log in finance ERP as expense
      const newTransaction: FinanceTransaction = {
        id: `fin-pay-${Date.now()}-${p.id}`,
        tenantId: tenantId || "tenant-1",
        eventId: p.eventId || db.events[0]?.id || "",
        type: TransactionType.EXPENSE,
        category: "RH / Pagamento Staff",
        amount: p.amount,
        description: `Pagamento de diária via PIX - ${p.staffName} (${p.role})`,
        date: new Date().toISOString().split("T")[0],
        status: TransactionStatus.PAID
      };
      db.finance.push(newTransaction);
    });

    saveDatabase(db);
    res.json({ message: `Sucesso! Total de ${pendingPayments.length} diárias pagas via PIX automáticos, somando R$ ${totalPaid.toLocaleString("pt-BR")}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Event
app.delete("/api/events/:id", (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    db.events = db.events.filter(e => e.id !== id);
    db.tickets = db.tickets.filter(t => t.eventId !== id);
    db.finance = db.finance.filter(f => f.eventId !== id);
    db.bookings = db.bookings.filter(b => b.eventId !== id);
    db.staff = db.staff.filter(s => s.eventId !== id);
    db.contracts = db.contracts.filter(c => c.eventId !== id);
    db.campaigns = db.campaigns.filter(c => c.eventId !== id);
    saveDatabase(db);
    res.json({ message: "Evento e dependências removidos com sucesso!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ticketing: Buy Ticket / Attendee registration
app.post("/api/tickets/buy", (req, res) => {
  try {
    const db = getDatabase();
    const { eventId, tenantId, name, email, type, cpf, seat } = req.body;
    
    const event = db.events.find(e => e.id === eventId);
    if (!event) return res.status(404).json({ error: "Evento não encontrado." });

    const ticketPrice = type === TicketType.VIP ? event.ticketPrice * 2.5 : (type === TicketType.FREE ? 0 : event.ticketPrice);
    
    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      eventId,
      tenantId: tenantId || event.tenantId,
      name: type === TicketType.VIP ? "Kit Atleta VIP Premium" : (type === TicketType.FREE ? "Cortesia de Staff" : "Kit Atleta Geral"),
      buyerName: name,
      buyerEmail: email,
      type: type as TicketType,
      price: ticketPrice,
      qrCode: `FLOW-TKT-${Date.now().toString().slice(-4)}-${name.replace(/\s+/g, "").toUpperCase()}`,
      checkedIn: false,
      cpf,
      seat
    };

    db.tickets.push(newTicket);

    // Dynamic finance income registration!
    if (ticketPrice > 0) {
      const newTransaction: FinanceTransaction = {
        id: `fin-${Date.now()}`,
        tenantId: event.tenantId,
        eventId,
        type: TransactionType.INCOME,
        category: "Ticketing / Inscrições",
        amount: ticketPrice,
        description: `Inscrição individual (${type}) - ${name}`,
        date: new Date().toISOString().split("T")[0],
        status: TransactionStatus.PAID
      };
      db.finance.push(newTransaction);
    }

    saveDatabase(db);
    res.status(201).json(newTicket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ticketing: Toggle Check-in
app.post("/api/tickets/checkin", (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.body;
    const ticket = db.tickets.find(t => t.id === id);
    if (!ticket) return res.status(404).json({ error: "Ingresso não encontrado." });

    ticket.checkedIn = !ticket.checkedIn;
    ticket.checkedInAt = ticket.checkedIn ? new Date().toISOString() : undefined;

    saveDatabase(db);
    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Finance: Add Manual Transaction
app.post("/api/finance", (req, res) => {
  try {
    const db = getDatabase();
    const { tenantId, eventId, type, category, amount, description, status, date } = req.body;

    const newTransaction: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      tenantId: tenantId || "tenant-1",
      eventId,
      type: type as TransactionType,
      category,
      amount: Number(amount),
      description,
      date: date || new Date().toISOString().split("T")[0],
      status: (status || TransactionStatus.PAID) as TransactionStatus
    };

    db.finance.push(newTransaction);
    saveDatabase(db);
    res.status(201).json(newTransaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Marketplace: Hire Supplier (Creates Booking & Expense log)
app.post("/api/marketplace/book", (req, res) => {
  try {
    const db = getDatabase();
    const { supplierId, eventId, date, hours } = req.body;

    const supplier = db.suppliers.find(s => s.id === supplierId);
    const event = db.events.find(e => e.id === eventId);

    if (!supplier || !event) {
      return res.status(404).json({ error: "Fornecedor ou Evento não encontrado." });
    }

    const calculatedCost = supplier.pricePerHour * Number(hours || 8);

    const newBooking: Booking = {
      id: `bkg-${Date.now()}`,
      supplierId,
      eventId,
      date: date || event.date,
      cost: calculatedCost,
      status: "APPROVED"
    };

    db.bookings.push(newBooking);

    // Dynamic finance expense registration!
    const newTransaction: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      tenantId: event.tenantId,
      eventId,
      type: TransactionType.EXPENSE,
      category: `Fornecedor / ${supplier.category}`,
      amount: calculatedCost,
      description: `Contratação de ${supplier.name} por ${hours || 8} horas de serviço`,
      date: new Date().toISOString().split("T")[0],
      status: TransactionStatus.PENDING
    };

    db.finance.push(newTransaction);

    // Auto-generate a legal DocumentContract for this supplier hire!
    const contractContent = `CONTRATO DIGITAL DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS

CONTRATANTE: Empresa parceira EventFlow Enterprise, tenant: ${event.tenantId}.
CONTRATADO: ${supplier.name} (${supplier.category}).

CLÁUSULA PRIMEIRA - DO OBJETO:
Contratação de serviços de infraestrutura para o evento "${event.name}" a realizar-se no dia ${event.date} em ${event.location}.

CLÁUSULA SEGUNDA - DO VALOR:
A Contratante pagará ao Contratado o valor total de R$ ${calculatedCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} referente às horas de serviços solicitadas.

CLÁUSULA TERCEIRA - RESPONSABILIDADES:
O Contratado garante o pleno funcionamento técnico, pontualidade e certificações técnicas necessárias.`;

    const newContract: DocumentContract = {
      id: `ctr-${Date.now()}`,
      tenantId: event.tenantId,
      eventId,
      title: `Contrato de Serviço - ${supplier.name} (${event.name})`,
      type: "Supplier Contract",
      content: contractContent,
      status: ContractStatus.PENDING_SIGNATURES,
      signedBy: ["Diretoria EventFlow"],
      auditTrail: [
        `Minuta gerada eletronicamente devido à contratação de fornecedor no marketplace em ${new Date().toISOString()}`,
        "Assinado eletronicamente por Diretoria EventFlow"
      ]
    };

    db.contracts.push(newContract);

    saveDatabase(db);
    res.status(201).json({ booking: newBooking, transaction: newTransaction, contract: newContract });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CRM: Add or Update Lead
app.post("/api/crm/lead", (req, res) => {
  try {
    const db = getDatabase();
    const { id, name, company, type, email, phone, pipelineStage, value, notes, tenantId } = req.body;

    if (id) {
      // Update
      const index = db.leads.findIndex(l => l.id === id);
      if (index !== -1) {
        db.leads[index] = { ...db.leads[index], name, company, type, email, phone, pipelineStage, value: Number(value), notes };
        saveDatabase(db);
        return res.json(db.leads[index]);
      }
    }

    // Create
    const newLead: CRMLead = {
      id: `lead-${Date.now()}`,
      tenantId: tenantId || "tenant-1",
      name,
      company,
      type: type as LeadType,
      email,
      phone,
      pipelineStage: (pipelineStage || PipelineStage.LEAD) as PipelineStage,
      value: Number(value || 0),
      notes: notes || ""
    };

    db.leads.push(newLead);
    saveDatabase(db);
    res.status(201).json(newLead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Document: Sign Contract
app.post("/api/contracts/sign", (req, res) => {
  try {
    const db = getDatabase();
    const { id, signerName } = req.body;

    const contract = db.contracts.find(c => c.id === id);
    if (!contract) return res.status(404).json({ error: "Contrato não encontrado." });

    if (!contract.signedBy.includes(signerName)) {
      contract.signedBy.push(signerName);
    }

    contract.auditTrail.push(`Assinado eletronicamente por ${signerName} (MFA Token: OK, IP: 192.168.0.x) em ${new Date().toISOString()}`);

    // If both sides signed, set to SIGNED status
    if (contract.signedBy.length >= 2) {
      contract.status = ContractStatus.SIGNED;
      contract.signedAt = new Date().toISOString();
      contract.auditTrail.push(`Contrato oficializado. Status atualizado para SIGNED.`);
    }

    saveDatabase(db);
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Document: Create Custom Contract (e.g. from template or scratch)
app.post("/api/contracts", (req, res) => {
  try {
    const db = getDatabase();
    const { tenantId, eventId, title, type, content } = req.body;

    const newContract: DocumentContract = {
      id: `ctr-${Date.now()}`,
      tenantId: tenantId || "tenant-1",
      eventId,
      title,
      type,
      content,
      status: ContractStatus.PENDING_SIGNATURES,
      signedBy: ["Diretoria EventFlow"],
      auditTrail: [
        `Contrato criado manualmente sob a plataforma em ${new Date().toISOString()}`,
        "Assinado eletronicamente por Diretoria EventFlow"
      ]
    };

    db.contracts.push(newContract);
    saveDatabase(db);
    res.status(201).json(newContract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Staff: Coordinate GPS simulation and hours worked logging
app.post("/api/staff/checkin", (req, res) => {
  try {
    const db = getDatabase();
    const { id, latitude, longitude } = req.body;

    const staff = db.staff.find(s => s.id === id);
    if (!staff) return res.status(404).json({ error: "Membro de Staff não encontrado." });

    staff.checkInStatus = staff.checkInStatus === "online" ? "offline" : "online";
    if (staff.checkInStatus === "online") {
      staff.gpsCoords = {
        lat: Number(latitude || -23.5615 + (Math.random() - 0.5) * 0.01),
        lng: Number(longitude || -46.6562 + (Math.random() - 0.5) * 0.01)
      };
      staff.hoursWorked += 8; // add standard work day session
    }

    saveDatabase(db);
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Marketing: Send/Publish Campaign
app.post("/api/campaigns/send", (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.body;

    const campaign = db.campaigns.find(c => c.id === id);
    if (!campaign) return res.status(404).json({ error: "Campanha não encontrada." });

    const event = db.events.find(e => e.id === campaign.eventId);
    const totalCap = event ? event.capacity : 1000;

    campaign.status = "SENT";
    campaign.sentCount = Math.floor(totalCap * (0.4 + Math.random() * 0.5));
    campaign.conversionRate = Number((5 + Math.random() * 15).toFixed(1));

    // Also register a small marketing cost in finance!
    if (event) {
      const marketingCost = Math.floor(campaign.sentCount * 0.05);
      const newTransaction: FinanceTransaction = {
        id: `fin-${Date.now()}`,
        tenantId: event.tenantId,
        eventId: event.id,
        type: TransactionType.EXPENSE,
        category: "Marketing / Campanhas",
        amount: marketingCost,
        description: `Disparo automático de campanha: ${campaign.title} (${campaign.channel})`,
        date: new Date().toISOString().split("T")[0],
        status: TransactionStatus.PAID
      };
      db.finance.push(newTransaction);
    }

    saveDatabase(db);
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase Orders: Approve/Update
app.post("/api/purchase-orders/approve", (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.body;

    const po = db.purchaseOrders.find(p => p.id === id);
    if (!po) return res.status(404).json({ error: "Pedido de Compra não encontrado." });

    po.status = "APPROVED";

    // Also inject as an EXPENSE in Finance
    const newTransaction: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      tenantId: po.tenantId,
      eventId: db.events[0]?.id || "", // associate to main event for billing
      type: TransactionType.EXPENSE,
      category: "Compras / Infraestrutura",
      amount: po.amount,
      description: `Aprovação de Pedido de Compra: ${po.title}`,
      date: new Date().toISOString().split("T")[0],
      status: TransactionStatus.PENDING
    };

    db.finance.push(newTransaction);

    saveDatabase(db);
    res.json({ po, transaction: newTransaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- API GATEWAY SIMULATION LAYER ---
function simulateGateway(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiKey = req.headers["x-flow-api-key"] || req.headers["authorization"] || "Bearer flow_enterprise_token_secure_99";
  const rateLimitMax = 100;
  const remaining = Math.max(0, rateLimitMax - Math.floor(Math.random() * 8));

  res.setHeader("X-RateLimit-Limit", rateLimitMax.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-Gateway-Audited", "true");

  const ip = req.ip || "127.0.0.1";
  const logEntry: GatewayLog = {
    id: `gw-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    clientIp: ip,
    statusCode: 200,
    durationMs: Math.floor(Math.random() * 40) + 5,
    headers: {
      host: req.headers.host || "localhost:3000",
      authorization: String(apiKey),
      "user-agent": req.headers["user-agent"] || "Mozilla/5.0"
    }
  };

  res.locals.gatewayLog = logEntry;
  next();
}

// REST endpoints for Gestão de Eventos Microsserviço via Gateway
app.get("/api/v1/gateway/events-service/planning", simulateGateway, (req, res) => {
  try {
    const db = getDatabase();
    const { eventId } = req.query;
    const log = res.locals.gatewayLog;

    if (!eventId) {
      log.statusCode = 400;
      log.validationErrors = ["Missing required query parameter 'eventId'"];
      db.gatewayLogs.unshift(log);
      saveDatabase(db);
      return res.status(400).json({ error: "O parâmetro query 'eventId' é obrigatório." });
    }

    const plan = db.plannings.find(p => p.eventId === eventId);
    log.auditDetails = `Planejamento consultado com sucesso para o evento ${eventId}.`;
    log.statusCode = plan ? 200 : 404;
    
    db.gatewayLogs.unshift(log);
    saveDatabase(db);

    if (!plan) {
      return res.status(404).json({ error: "Planejamento estratégico não encontrado para este evento." });
    }
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/gateway/events-service/planning", simulateGateway, (req, res) => {
  try {
    const db = getDatabase();
    const log = res.locals.gatewayLog;
    const { eventId, strategicGoal, phases, risks, milestones } = req.body;

    const errors: string[] = [];
    if (!eventId) errors.push("Campo 'eventId' é obrigatório.");
    if (!strategicGoal) errors.push("Campo 'strategicGoal' é obrigatório.");
    if (!phases || !Array.isArray(phases)) errors.push("Campo 'phases' deve ser uma lista.");

    if (errors.length > 0) {
      log.statusCode = 400;
      log.validationErrors = errors;
      db.gatewayLogs.unshift(log);
      saveDatabase(db);
      return res.status(400).json({ errors });
    }

    // Upsert planning
    let planIndex = db.plannings.findIndex(p => p.eventId === eventId);
    const updatedPlanning: EventPlanning = {
      id: planIndex !== -1 ? db.plannings[planIndex].id : `plan-${Date.now()}`,
      eventId,
      strategicGoal,
      phases: phases || [],
      risks: risks || [],
      milestones: milestones || []
    };

    if (planIndex !== -1) {
      db.plannings[planIndex] = updatedPlanning;
    } else {
      db.plannings.push(updatedPlanning);
    }

    log.auditDetails = `Planejamento estratégico criado/atualizado com sucesso para o evento ${eventId}.`;
    log.statusCode = 201;
    db.gatewayLogs.unshift(log);
    saveDatabase(db);

    res.status(201).json(updatedPlanning);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GraphQL simulated gateway query
app.post("/api/v1/gateway/graphql", simulateGateway, (req, res) => {
  try {
    const db = getDatabase();
    const log = res.locals.gatewayLog;
    const { query, variables } = req.body;

    if (!query) {
      log.statusCode = 400;
      log.validationErrors = ["O corpo da requisição GraphQL precisa conter um campo 'query'"];
      db.gatewayLogs.unshift(log);
      saveDatabase(db);
      return res.status(400).json({ errors: [{ message: "Falta o campo 'query'." }] });
    }

    let data: any = {};
    if (query.includes("getEventPlanning")) {
      const eId = variables?.eventId;
      const plan = db.plannings.find(p => p.eventId === eId);
      data = { getEventPlanning: plan || null };
    } else if (query.includes("listGatewayLogs")) {
      data = { listGatewayLogs: db.gatewayLogs.slice(0, 15) };
    } else {
      data = {
        events: db.events.map(e => ({ id: e.id, name: e.name })),
        teamsCount: db.teams?.length || 0
      };
    }

    log.auditDetails = "Query GraphQL analisada e resolvida com sucesso no Gateway.";
    log.statusCode = 200;
    db.gatewayLogs.unshift(log);
    saveDatabase(db);

    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get gateway logs
app.get("/api/v1/gateway/logs", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.gatewayLogs || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- STAFF & TEAMS ENDPOINTS ---
app.get("/api/staff/teams", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.teams || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/staff/teams", (req, res) => {
  try {
    const db = getDatabase();
    const { eventId, tenantId, name, area, leaderName, membersCount } = req.body;
    
    if (!name || !area || !leaderName) {
      return res.status(400).json({ error: "Os campos nome, área e líder são obrigatórios." });
    }

    const newTeam: StaffTeam = {
      id: `team-${Date.now()}`,
      tenantId: tenantId || "tenant-1",
      eventId: eventId || db.events[0]?.id || "",
      name,
      area,
      leaderName,
      membersCount: Number(membersCount || 1)
    };

    db.teams = db.teams || [];
    db.teams.push(newTeam);
    saveDatabase(db);
    res.status(201).json(newTeam);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/staff/shifts", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.shifts || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/staff/shifts", (req, res) => {
  try {
    const db = getDatabase();
    const { staffId, eventId, date, startTime, endTime, role } = req.body;

    const staffMember = db.staff.find(s => s.id === staffId);
    const event = db.events.find(e => e.id === eventId);

    if (!staffMember || !event) {
      return res.status(400).json({ error: "Staff ou Evento inválido." });
    }

    const startTimeSec = new Date(`${date}T${startTime}`).getTime();
    const endTimeSec = new Date(`${date}T${endTime}`).getTime();
    const hoursAllocated = Math.max(1, Math.round((endTimeSec - startTimeSec) / (1000 * 60 * 60)) || 8);

    const newShift: StaffShift = {
      id: `shf-${Date.now()}`,
      staffId,
      staffName: staffMember.name,
      eventId,
      eventName: event.name,
      date,
      startTime,
      endTime,
      hoursAllocated,
      role: role || staffMember.role,
      status: "PENDING"
    };

    db.shifts = db.shifts || [];
    db.shifts.push(newShift);
    saveDatabase(db);
    res.status(201).json(newShift);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar ponto com GPS ou físico
app.post("/api/staff/clock", (req, res) => {
  try {
    const db = getDatabase();
    const { staffId, eventId, type, method, lat, lng, locationName } = req.body;

    const staffMember = db.staff.find(s => s.id === staffId);
    if (!staffMember) return res.status(404).json({ error: "Membro de staff não encontrado." });

    const newClock: TimeClock = {
      id: `clk-${Date.now()}`,
      staffId,
      staffName: staffMember.name,
      eventId: eventId || staffMember.eventId,
      timestamp: new Date().toISOString(),
      type: type as "IN" | "OUT",
      method: method as "PHYSICAL" | "DIGITAL_GPS",
      gpsCoords: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
      locationName: locationName || "Check-In Geral"
    };

    db.clocks = db.clocks || [];
    db.clocks.push(newClock);

    // Update staff hours and status
    if (type === "IN") {
      staffMember.checkInStatus = "online";
      if (lat && lng) staffMember.gpsCoords = { lat: Number(lat), lng: Number(lng) };
    } else {
      staffMember.checkInStatus = "offline";
      staffMember.hoursWorked += 8; // add shift duration

      // Also calculate freelancer payout if applicable
      const hourlyRate = staffMember.role === "COORDINATOR" ? 50 : 25;
      const amount = 8 * hourlyRate;
      const newPay: FreelancerPayment = {
        id: `pay-${Date.now()}`,
        staffId,
        staffName: staffMember.name,
        eventId: eventId || staffMember.eventId,
        role: staffMember.role,
        amount,
        hoursTotal: 8,
        status: "PENDING"
      };
      db.payments = db.payments || [];
      db.payments.push(newPay);
    }

    saveDatabase(db);
    res.status(201).json(newClock);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/staff/clocks", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.clocks || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/staff/payments", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.payments || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/staff/payments/pay", (req, res) => {
  try {
    const db = getDatabase();
    const { id, paymentMethod } = req.body;

    const pay = db.payments.find(p => p.id === id);
    if (!pay) return res.status(404).json({ error: "Pagamento não encontrado." });

    pay.status = "PAID";
    pay.paymentDate = new Date().toISOString().split("T")[0];
    pay.paymentMethod = paymentMethod || "PIX";

    // Launch in ERP financial transaction
    const newTransaction: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      tenantId: "tenant-1",
      eventId: pay.eventId,
      type: TransactionType.EXPENSE,
      category: "RH / Freelancers",
      amount: pay.amount,
      description: `Pagamento de freelancer: ${pay.staffName} (${pay.role}) via ${pay.paymentMethod}`,
      date: pay.paymentDate,
      status: TransactionStatus.PAID
    };
    db.finance.push(newTransaction);

    saveDatabase(db);
    res.json(pay);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/staff/messages", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.messages || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/staff/messages", (req, res) => {
  try {
    const db = getDatabase();
    const { tenantId, eventId, senderName, senderRole, message, channel } = req.body;

    if (!message || !channel) {
      return res.status(400).json({ error: "Mensagem e canal são obrigatórios." });
    }

    const newMessage: StaffMessage = {
      id: `msg-${Date.now()}`,
      tenantId: tenantId || "tenant-1",
      eventId: eventId || db.events[0]?.id || "",
      senderName: senderName || "Henrique Silva (Gestor)",
      senderRole: senderRole || "PRODUCER",
      message,
      timestamp: new Date().toISOString(),
      channel
    };

    db.messages = db.messages || [];
    db.messages.push(newMessage);
    saveDatabase(db);
    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- MARKETING AUTOMATION ENDPOINTS ---
app.get("/api/marketing/flows", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.flows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/marketing/flows", (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, triggerEvent, steps } = req.body;

    if (!name || !triggerEvent || !steps || !Array.isArray(steps)) {
      return res.status(400).json({ error: "Nome, gatilho e passos são obrigatórios." });
    }

    const newFlow: LeadFlow = {
      id: `flow-${Date.now()}`,
      tenantId: "tenant-1",
      name,
      description: description || "",
      triggerEvent,
      steps: steps.map((s: any, idx: number) => ({
        id: `step-${Date.now()}-${idx}`,
        delayDays: Number(s.delayDays || 1),
        channel: s.channel || "EMAIL",
        subject: s.subject || undefined,
        content: s.content || ""
      })),
      active: true
    };

    db.flows = db.flows || [];
    db.flows.push(newFlow);
    saveDatabase(db);
    res.status(201).json(newFlow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/marketing/flows/toggle", (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.body;

    const flow = db.flows.find(f => f.id === id);
    if (!flow) return res.status(404).json({ error: "Fluxo não encontrado." });

    flow.active = !flow.active;
    saveDatabase(db);
    res.json(flow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/marketing/funnels", (req, res) => {
  try {
    const db = getDatabase();
    res.json(db.funnels || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/marketing/funnels", (req, res) => {
  try {
    const db = getDatabase();
    const { eventId, name, targetProduct, stages } = req.body;

    if (!name || !targetProduct) {
      return res.status(400).json({ error: "Nome do funil e produto alvo são obrigatórios." });
    }

    const newFunnel: SalesFunnel = {
      id: `fun-${Date.now()}`,
      tenantId: "tenant-1",
      eventId: eventId || db.events[0]?.id || "",
      name,
      targetProduct,
      stages: stages || [
        { name: "Leads Capturados", description: "Inscrições prévias", leadsCount: 150, valueSum: 22500 },
        { name: "Contato Estabelecido", description: "Abordagem comercial inicial", leadsCount: 50, valueSum: 7500 },
        { name: "Proposta Enviada", description: "Link de pagamento/contrato gerado", leadsCount: 15, valueSum: 2250 },
        { name: "Venda Finalizada", description: "Lote pago e confirmado", leadsCount: 20, valueSum: 3000 }
      ]
    };

    db.funnels = db.funnels || [];
    db.funnels.push(newFunnel);
    saveDatabase(db);
    res.status(201).json(newFunnel);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agendar ou disparar campanha
app.post("/api/campaigns/schedule", (req, res) => {
  try {
    const db = getDatabase();
    const { eventId, title, channel, subject, content, scheduledAt, targetSegment } = req.body;

    if (!title || !channel || !content) {
      return res.status(400).json({ error: "Título, canal e conteúdo são obrigatórios." });
    }

    const newCampaign: MarketingCampaign = {
      id: `cmp-${Date.now()}`,
      tenantId: "tenant-1",
      eventId: eventId || db.events[0]?.id || "",
      title,
      channel,
      sentCount: 0,
      conversionRate: 0,
      status: "DRAFT",
      subject: subject || undefined,
      content,
      scheduledAt: scheduledAt || undefined,
      targetSegment: targetSegment || "Todos os Clientes",
      opens: 0,
      clicks: 0,
      conversions: 0
    };

    db.campaigns.push(newCampaign);
    saveDatabase(db);
    res.status(201).json(newCampaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enterprise AI assistant
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, eventId } = req.body;
    const db = getDatabase();

    // Lazy initialization of Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "O seu GEMINI_API_KEY não está configurado. Por favor, adicione-o na aba Configurações > Secrets do painel superior do Google AI Studio para usufruir de inteligência artificial de padrão corporativo."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Extract dynamic statistics to make the system context alive and accurate
    const totalEvents = db.events.length;
    const totalTickets = db.tickets.length;
    const totalIncome = db.finance
      .filter(f => f.type === TransactionType.INCOME && f.status === TransactionStatus.PAID)
      .reduce((sum, f) => sum + f.amount, 0);
    const totalExpenses = db.finance
      .filter(f => f.type === TransactionType.EXPENSE)
      .reduce((sum, f) => sum + f.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    const activeSponsorships = db.sponsorships.length;
    const availableSuppliers = db.suppliers.map(s => `${s.name} (${s.category} - R$${s.pricePerHour}/h)`).join(", ");

    let systemInstruction = `Você é a IA Corporativa Oficial do EventFlow Enterprise.
Sua missão é assessorar gestores, produtores, diretores financeiros, equipe de marketing e patrocinadores com dados de negócio REAIS extraídos da plataforma.

Aqui está o estado consolidado atual do banco de dados (o usuário pode modificar esses dados livremente, logo, qualquer cálculo que você fizer deve se basear nisso):
- Total de Eventos Cadastrados: ${totalEvents}
- Faturamento Total (Contas Recebidas): R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Despesas Totais Lançadas (Pagas ou Pendentes): R$ ${totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Saldo/Lucro Líquido Real: R$ ${netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Quantidade de Ingressos/Inscrições Emitidos: ${totalTickets}
- Patrocínios Ativos: ${activeSponsorships}
- Fornecedores Credenciados no Marketplace: [${availableSuppliers}]

Eventos Atuais detalhados:
${JSON.stringify(db.events.map(e => ({ id: e.id, name: e.name, type: e.type, location: e.location, capacity: e.capacity, price: e.ticketPrice })))}

COMO AGIR:
1. Sempre responda de maneira consultiva, com termos corporativos elegantes, claros e com absoluto profissionalismo.
2. Quando solicitado a "Estimar Custos", sugira orçamentos detalhados com base no preço por hora de fornecedores reais e na taxa de orçamento do evento (budgetRatio).
3. Quando solicitado a "Recomendar Preços", analise a capacidade do local e projete cenários de lotação para maximizar o ticket médio.
4. Se o usuário pedir para gerar um cronograma, elabore um cronograma de atividades realista com horas.
5. Se pedir para produzir um contrato, redija uma minuta formal completa e mencione que a trilha de auditoria digital do EventFlow assegura sua validade jurídica.
6. Responda em português (pt-BR), de forma estruturada e profissional.`;

    if (eventId) {
      const selectedEvent = db.events.find(e => e.id === eventId);
      if (selectedEvent) {
        const eventTickets = db.tickets.filter(t => t.eventId === eventId);
        const eventFinance = db.finance.filter(f => f.eventId === eventId);
        const eventIncome = eventFinance.filter(f => f.type === TransactionType.INCOME).reduce((sum, f) => sum + f.amount, 0);
        const eventExpense = eventFinance.filter(f => f.type === TransactionType.EXPENSE).reduce((sum, f) => sum + f.amount, 0);

        systemInstruction += `\n\nATENÇÃO ESPECIAL: O usuário está focado no seguinte evento atualmente:\n` +
          `Nome: "${selectedEvent.name}"\n` +
          `Tipo: ${selectedEvent.type}\n` +
          `Data: ${selectedEvent.date}\n` +
          `Local: ${selectedEvent.location}\n` +
          `Capacidade máxima: ${selectedEvent.capacity}\n` +
          `Preço padrão do ingresso: R$ ${selectedEvent.ticketPrice}\n` +
          `Faturamento deste evento: R$ ${eventIncome.toLocaleString("pt-BR")}\n` +
          `Despesas deste evento: R$ ${eventExpense.toLocaleString("pt-BR")}\n` +
          `Ingressos vendidos: ${eventTickets.length} unidades.`;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na rota do assistente de IA:", error);
    res.status(500).json({ error: error.message || "Erro de processamento da Inteligência Artificial." });
  }
});

// --- AI EVENT BRIEF GENERATOR ---
app.post("/api/ai/event-brief", async (req, res) => {
  try {
    const { eventId } = req.body;
    const db = getDatabase();
    const event = db.events.find(e => e.id === eventId);
    if (!event) return res.status(404).json({ error: "Evento não encontrado." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "GEMINI_API_KEY não configurado. Adicione-o em Secrets para usar a IA." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const existingChecklistTasks = (event.checklist || []).map(c => c.task).join(", ");
    const existingScheduleActivities = (event.schedule || []).map(s => `${s.time} - ${s.activity}`).join(", ");
    const existingInfra = (event.infrastructure || []).map(i => i.name).join(", ");

    const prompt = `Você é um especialista sênior em produção de grandes eventos corporativos e esportivos do Brasil, com 20 anos de experiência.

Baseado no evento abaixo, gere um briefing completo, realista e profissional em JSON estruturado.

DADOS DO EVENTO:
- Nome: ${event.name}
- Tipo: ${event.type}
- Modalidade: ${(event as any).modality || "PRESENCIAL"}
- Data: ${event.date}
- Local: ${event.location}
- Cidade: ${(event as any).city || ""}
- Capacidade: ${event.capacity} pessoas
- Participantes esperados: ${(event as any).expectedParticipants || event.capacity}
- Público-alvo: ${(event as any).targetAudience || "Público geral"}
- Objetivos: ${(event as any).objectives || "Realização de um evento de sucesso"}
- Organizer: ${(event as any).organizer || ""}
- Já no checklist: ${existingChecklistTasks || "nenhum"}
- Já na programação: ${existingScheduleActivities || "nenhuma"}
- Já na infraestrutura: ${existingInfra || "nenhuma"}

INSTRUÇÕES CRÍTICAS:
1. NÃO repita itens que já existem (listados acima).
2. Seja MUITO específico para o tipo e contexto deste evento.
3. Use terminologia profissional do setor de eventos do Brasil.
4. Para maratonas/corridas: foque em percurso, hidratação, cronometragem, ambulâncias.
5. Para congressos/tech: foque em AV, credenciamento, trilhas, networking.
6. Para festivais/shows: foque em palco, som, luz, segurança de massa.
7. RETORNE SOMENTE JSON VÁLIDO — sem texto antes ou depois.

JSON ESPERADO (estrutura exata):
{
  "summary": "Resumo executivo de 2-3 frases sobre o briefing gerado para este evento",
  "checklist": [
    {
      "task": "Descrição clara e acionável da tarefa",
      "category": "PLANEJAMENTO",
      "assigneeRole": "PRODUCER",
      "responsible": "Nome do cargo responsável",
      "priority": "CRITICAL",
      "deadline_days_before": 30
    }
  ],
  "schedule": [
    {
      "time": "07:00",
      "activity": "Nome da atividade",
      "responsibility": "COORDINATOR",
      "location": "Local específico dentro do evento",
      "estimatedDuration": 60,
      "notes": "Observação relevante"
    }
  ],
  "infrastructure": [
    {
      "name": "Nome do item",
      "quantity": 1,
      "status": "Pendente",
      "category": "Segurança",
      "location": "Onde será instalado/utilizado",
      "notes": "Especificações técnicas"
    }
  ],
  "risks": [
    {
      "description": "Descrição clara do risco",
      "impact": "HIGH",
      "mitigation": "Medida de mitigação detalhada e praticável"
    }
  ],
  "logistics": [
    {
      "type": "TRANSPORT",
      "description": "Descrição do item logístico",
      "responsible": "Cargo responsável",
      "origin": "Origem",
      "destination": "Destino",
      "vehicle": "Tipo de veículo/empresa",
      "capacity": 10,
      "notes": "Detalhes adicionais"
    }
  ]
}

Gere 6-8 itens por seção (checklist, schedule, infrastructure, risks, logistics). Seja específico, realista e profissional.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: "application/json"
      }
    });

    let jsonText = response.text || "{}";
    jsonText = jsonText.trim();
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Erro no gerador de briefing IA:", error);
    res.status(500).json({ error: error.message || "Erro ao processar o briefing com IA." });
  }
});

// --- SPONSORSHIP CRUD ---
const sponsorshipSchema = z.object({
  eventId:      z.string().min(1),
  sponsorName:  z.string().min(2),
  quotaName:    z.string().min(1),
  value:        z.number().positive(),
  deliverables: z.array(z.string()).default([]),
  status:       z.enum(["PROPOSAL", "ACTIVE", "COMPLETED"]).default("PROPOSAL"),
  roiRatio:     z.number().min(0).max(100).default(0)
});

app.get("/api/sponsorships", (req, res) => {
  try {
    const db = getDatabase();
    const { tenantId, eventId } = req.query as Record<string, string>;
    let result = db.sponsorships;
    if (eventId) result = result.filter(s => s.eventId === eventId);
    if (tenantId) {
      const tenantEventIds = new Set(db.events.filter(e => e.tenantId === tenantId).map(e => e.id));
      result = result.filter(s => tenantEventIds.has(s.eventId));
    }
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/sponsorships", (req, res) => {
  try {
    const parsed = sponsorshipSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const db = getDatabase();
    const newSps: Sponsorship = { id: `sps-${Date.now()}`, ...parsed.data };
    db.sponsorships.push(newSps);
    // Log income to finance
    db.finance.push({
      id: `fin-${Date.now()}`,
      tenantId: db.events.find(e => e.id === parsed.data.eventId)?.tenantId || "tenant-1",
      eventId: parsed.data.eventId,
      type: "INCOME" as any,
      category: "Patrocínio",
      description: `Patrocínio: ${parsed.data.sponsorName} — ${parsed.data.quotaName}`,
      amount: parsed.data.value,
      date: new Date().toISOString().split("T")[0],
      status: "COMPLETED" as any
    });
    saveDatabase(db);
    res.status(201).json(newSps);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put("/api/sponsorships/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.sponsorships.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Patrocínio não encontrado." });
    db.sponsorships[idx] = { ...db.sponsorships[idx], ...req.body };
    saveDatabase(db);
    res.json(db.sponsorships[idx]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/sponsorships/:id", (req, res) => {
  try {
    const db = getDatabase();
    const idx = db.sponsorships.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Patrocínio não encontrado." });
    db.sponsorships.splice(idx, 1);
    saveDatabase(db);
    res.json({ message: "Patrocínio removido com sucesso." });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- VITE AND STATIC SERVING LAYER ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production built assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EventFlow Enterprise Server is running on port ${PORT}`);
  });
}

// ─── AI Event Chat ────────────────────────────────────────────────────────────
app.post("/api/ai/event-chat", async (req, res) => {
  try {
    const { eventId, message, history = [] } = req.body as {
      eventId: string;
      message: string;
      history: Array<{ role: "user" | "model"; text: string }>;
    };
    if (!message?.trim()) return res.status(400).json({ error: "Mensagem vazia." });

    const db = getDatabase();
    const event = db.events.find(e => e.id === eventId);
    if (!event) return res.status(404).json({ error: "Evento não encontrado." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "GEMINI_API_KEY não configurado. Adicione-o em Secrets." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const systemInstruction = `Você é um consultor sênior especializado em produção de grandes eventos corporativos, esportivos e culturais no Brasil, com 20 anos de experiência. Você está assistindo o planejamento do seguinte evento:

EVENTO: ${event.name}
Tipo: ${(event as any).type} | Modalidade: ${(event as any).modality || "PRESENCIAL"}
Data: ${event.date} | Local: ${event.location} | Cidade: ${(event as any).city || ""}
Capacidade: ${event.capacity} pessoas | Esperados: ${(event as any).expectedParticipants || event.capacity}
Público-alvo: ${(event as any).targetAudience || "Público geral"}
Objetivos: ${(event as any).objectives || "Realização de um evento de sucesso"}
Organizador: ${(event as any).organizer || ""}
Status: ${event.status}

CHECKLIST (${(event.checklist || []).length} itens):
${(event.checklist || []).map((c: any) => `- [${c.completed ? "✓" : " "}] ${c.task} (${c.priority}, ${c.category})`).join("\n") || "Nenhum item"}

PROGRAMAÇÃO (${(event.schedule || []).length} atividades):
${(event.schedule || []).map((s: any) => `- ${s.time}: ${s.activity} (${s.estimatedDuration}min)`).join("\n") || "Nenhuma atividade"}

INFRAESTRUTURA (${(event.infrastructure || []).length} itens):
${(event.infrastructure || []).map((i: any) => `- ${i.name} (qtd: ${i.quantity}, ${i.category})`).join("\n") || "Nenhum item"}

LOGÍSTICA (${(event.logistics || []).length} registros):
${(event.logistics || []).map((l: any) => `- [${l.type}] ${l.description}`).join("\n") || "Nenhum registro"}

INSTRUÇÕES:
- Responda SEMPRE em português do Brasil, com linguagem profissional e direta.
- Seja específico para o tipo e contexto DESTE evento — nunca genérico.
- Quando sugerir tarefas, leve em conta o que já existe no checklist/programação/infraestrutura.
- Use terminologia do setor de eventos brasileiro (produtora, staff, backstage, rider técnico, etc.).
- Respostas devem ser práticas, acionáveis e concisas (máx. 5 parágrafos ou uma lista objetiva).
- Se o usuário pedir algo fora do escopo de eventos, redirecione educadamente.`;

    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      history: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const response = await chat.sendMessage({ message: message.trim() });
    const reply = response.text || "Desculpe, não consegui gerar uma resposta. Tente novamente.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Erro no chat IA:", error);
    res.status(500).json({ error: error.message || "Erro ao processar mensagem com IA." });
  }
});

startServer();
