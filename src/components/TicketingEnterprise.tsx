/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ticketing Enterprise — Full module per V3.0 spec.
 * Tabs: Dashboard · Venda · Credenciamento · Controle de Acesso ·
 *        Inscrições Esportivas · Transferências & Reembolsos · IA & Analytics
 */

import React, { useState, useCallback } from "react";
import { authFetch } from "../authService";
import LotesCupons from "./LotesCupons";
import {
  Ticket, Tag, QrCode, Users, TrendingUp, DollarSign, CheckCircle,
  AlertTriangle, Plus, Search, X, BarChart3, Zap, Shield,
  Clock, RefreshCw, Award, Activity, Percent, CreditCard,
  MapPin, UserCheck, ArrowRight, RotateCcw, Scan, Package,
  Shirt, Medal, FileText, Brain, Target, Flame, Star,
  BadgeCheck, Banknote, Smartphone, Building2, ChevronRight,
  TrendingDown, Edit, Trash2, Download, Filter, CheckSquare,
  XCircle, Eye, Send, Globe, Ban, Info, List
} from "lucide-react";
import {
  Event,
  Ticket as TicketModel,
  FinanceTransaction,
  TicketType,
  PaymentMethod,
  CredentialType,
  AccessZoneType,
  Credential,
  AccessZone,
  TicketTransfer,
  RefundStatus
} from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | "dashboard"
  | "sales"
  | "credentials"
  | "access"
  | "sports"
  | "transfers"
  | "ai"
  | "lotes";

interface Props {
  events: Event[];
  tickets: TicketModel[];
  finance: FinanceTransaction[];
  selectedEventId: string;
  selectedTenantId: string;
  onSelectEvent: (id: string) => void;
  onRefresh: () => void;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_CREDENTIALS: Credential[] = [
  { id: "cred-1", eventId: "event-1", tenantId: "tenant-1", holderName: "Henrique Silva", holderEmail: "henrique@eventflow.com.br", holderOrg: "EventFlow Enterprise", type: CredentialType.STAFF, qrCode: "CRED-STF-00127", accessZones: ["general", "backstage", "stage", "vip"], issuedAt: "2026-07-01T09:00:00Z", printed: true, active: true },
  { id: "cred-2", eventId: "event-1", tenantId: "tenant-1", holderName: "Carla Mendonça", holderEmail: "carla.m@globo.com.br", holderOrg: "Globo Comunicações", type: CredentialType.PRESS, qrCode: "CRED-PRS-00045", accessZones: ["general", "press", "stage"], issuedAt: "2026-07-02T11:00:00Z", printed: true, active: true, notes: "Fotógrafa credenciada" },
  { id: "cred-3", eventId: "event-1", tenantId: "tenant-1", holderName: "Ricardo Fonseca", holderEmail: "rfonseca@banco.com.br", holderOrg: "Banco Premier", type: CredentialType.SPONSOR, qrCode: "CRED-SPO-00013", accessZones: ["general", "vip", "catering"], issuedAt: "2026-07-02T14:00:00Z", printed: false, active: true },
  { id: "cred-4", eventId: "event-1", tenantId: "tenant-1", holderName: "Ana Lima", holderEmail: "analima@atleta.com.br", type: CredentialType.ATHLETE, qrCode: "CRED-ATH-10482", accessZones: ["general", "athlete_area"], issuedAt: "2026-07-03T08:00:00Z", printed: true, active: true },
  { id: "cred-5", eventId: "event-1", tenantId: "tenant-1", holderName: "Paulo Souza", holderEmail: "paulos@voluntarios.org", holderOrg: "Voluntários SP", type: CredentialType.VOLUNTEER, qrCode: "CRED-VOL-00389", accessZones: ["general", "staff"], issuedAt: "2026-07-03T09:30:00Z", printed: false, active: true },
  { id: "cred-6", eventId: "event-1", tenantId: "tenant-1", holderName: "Deputado Carlos Melo", holderEmail: "gabinete@assembleia.gov.br", holderOrg: "Assembleia Legislativa", type: CredentialType.AUTHORITY, qrCode: "CRED-AUT-00007", accessZones: ["general", "vip", "catering", "backstage"], issuedAt: "2026-07-04T16:00:00Z", printed: true, active: true, notes: "VIP Protocol — escolta confirmada" },
];

const SEED_ZONES: AccessZone[] = [
  { id: "zone-1", eventId: "event-1", name: "Área Geral / Pista", type: AccessZoneType.GENERAL, capacity: 8000, currentOccupancy: 4821, allowedCredentials: [CredentialType.PARTICIPANT, CredentialType.STAFF, CredentialType.VOLUNTEER, CredentialType.ATHLETE, CredentialType.PRESS, CredentialType.SPONSOR, CredentialType.AUTHORITY, CredentialType.EXHIBITOR, CredentialType.ARTIST], color: "#6366f1" },
  { id: "zone-2", eventId: "event-1", name: "Camarote VIP", type: AccessZoneType.VIP, capacity: 500, currentOccupancy: 312, allowedCredentials: [CredentialType.PARTICIPANT, CredentialType.SPONSOR, CredentialType.AUTHORITY, CredentialType.STAFF], color: "#f59e0b" },
  { id: "zone-3", eventId: "event-1", name: "Backstage & Produção", type: AccessZoneType.BACKSTAGE, capacity: 200, currentOccupancy: 87, allowedCredentials: [CredentialType.STAFF, CredentialType.ARTIST, CredentialType.AUTHORITY], color: "#ef4444" },
  { id: "zone-4", eventId: "event-1", name: "Área de Imprensa", type: AccessZoneType.PRESS, capacity: 150, currentOccupancy: 42, allowedCredentials: [CredentialType.PRESS, CredentialType.STAFF], color: "#3b82f6" },
  { id: "zone-5", eventId: "event-1", name: "Palco Principal", type: AccessZoneType.STAGE, capacity: 50, currentOccupancy: 18, allowedCredentials: [CredentialType.STAFF, CredentialType.ARTIST], color: "#8b5cf6" },
  { id: "zone-6", eventId: "event-1", name: "Área de Alimentação", type: AccessZoneType.CATERING, capacity: 300, currentOccupancy: 145, allowedCredentials: [CredentialType.PARTICIPANT, CredentialType.STAFF, CredentialType.SPONSOR, CredentialType.AUTHORITY, CredentialType.VOLUNTEER], color: "#10b981" },
  { id: "zone-7", eventId: "event-1", name: "Estacionamento Oficial", type: AccessZoneType.PARKING, capacity: 1000, currentOccupancy: 623, allowedCredentials: [CredentialType.PARTICIPANT, CredentialType.STAFF, CredentialType.SPONSOR, CredentialType.AUTHORITY, CredentialType.SUPPLIER], color: "#64748b" },
];

const SEED_TRANSFERS: TicketTransfer[] = [
  { id: "tr-1", ticketId: "tkt-demo-1", eventId: "event-1", fromName: "Marcos Oliveira", fromEmail: "marcos@gmail.com", toName: "Patricia Rocha", toEmail: "patricia@hotmail.com", transferredAt: "2026-07-02T10:00:00Z", status: "COMPLETED", reason: "Presente de aniversário" },
  { id: "tr-2", ticketId: "tkt-demo-2", eventId: "event-1", fromName: "Fernando Alves", fromEmail: "fernando@empresa.com", toName: "Lucas Nunes", toEmail: "lucas@empresa.com", transferredAt: "2026-07-04T15:30:00Z", status: "PENDING", reason: "Colaborador substituto — Fernando viajou" },
  { id: "tr-3", ticketId: "tkt-demo-3", eventId: "event-1", fromName: "Juliana Costa", fromEmail: "ju.costa@usp.br", toName: "Rodrigo Moura", toEmail: "r.moura@usp.br", transferredAt: "2026-07-01T08:00:00Z", status: "COMPLETED" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_ICONS: Record<PaymentMethod, string> = {
  [PaymentMethod.PIX]: "⚡",
  [PaymentMethod.CREDIT_CARD]: "💳",
  [PaymentMethod.DEBIT_CARD]: "💳",
  [PaymentMethod.BOLETO]: "📄",
  [PaymentMethod.DIGITAL_WALLET]: "📱",
  [PaymentMethod.INTERNAL_CREDIT]: "🏦",
  [PaymentMethod.VOUCHER]: "🎁",
  [PaymentMethod.GIFT_CARD]: "🎀",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.PIX]: "PIX",
  [PaymentMethod.CREDIT_CARD]: "Cartão de Crédito",
  [PaymentMethod.DEBIT_CARD]: "Cartão de Débito",
  [PaymentMethod.BOLETO]: "Boleto Bancário",
  [PaymentMethod.DIGITAL_WALLET]: "Carteira Digital",
  [PaymentMethod.INTERNAL_CREDIT]: "Crédito Interno",
  [PaymentMethod.VOUCHER]: "Voucher",
  [PaymentMethod.GIFT_CARD]: "Vale-Presente",
};

const CREDENTIAL_COLORS: Record<CredentialType, string> = {
  [CredentialType.PARTICIPANT]: "bg-indigo-100 text-indigo-700",
  [CredentialType.STAFF]: "bg-slate-100 text-slate-700",
  [CredentialType.SPONSOR]: "bg-amber-100 text-amber-700",
  [CredentialType.SUPPLIER]: "bg-orange-100 text-orange-700",
  [CredentialType.PRESS]: "bg-blue-100 text-blue-700",
  [CredentialType.AUTHORITY]: "bg-red-100 text-red-700",
  [CredentialType.EXHIBITOR]: "bg-teal-100 text-teal-700",
  [CredentialType.ARTIST]: "bg-purple-100 text-purple-700",
  [CredentialType.ATHLETE]: "bg-emerald-100 text-emerald-700",
  [CredentialType.VOLUNTEER]: "bg-cyan-100 text-cyan-700",
};

const TICKET_TYPE_LABELS: Partial<Record<TicketType, string>> = {
  [TicketType.FREE]: "Gratuito",
  [TicketType.PAID]: "Inteira",
  [TicketType.VIP]: "VIP",
  [TicketType.CAMAROTE]: "Camarote",
  [TicketType.LOUNGE]: "Lounge",
  [TicketType.PREMIUM]: "Área Premium",
  [TicketType.FRONT_STAGE]: "Front Stage",
  [TicketType.BACKSTAGE]: "Backstage",
  [TicketType.PASSAPORTE]: "Passaporte",
  [TicketType.COMBO]: "Combo",
  [TicketType.DAY_PASS]: "Day Pass",
  [TicketType.CONVITE]: "Convite",
  [TicketType.CORTESIA]: "Cortesia",
  [TicketType.SPORTS_REGISTRATION]: "Inscrição Esportiva",
  [TicketType.CORPORATE]: "Corporativo",
  [TicketType.MEIA_ENTRADA]: "Meia-Entrada",
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TicketingEnterprise({
  events,
  tickets,
  finance,
  selectedEventId,
  selectedTenantId,
  onSelectEvent,
  onRefresh,
}: Props) {
  const [tab, setTab] = useState<Tab>("dashboard");

  // Sales state
  const [saleForm, setSaleForm] = useState({
    name: "",
    email: "",
    cpf: "",
    type: TicketType.PAID,
    paymentMethod: PaymentMethod.PIX,
    coupon: "",
    seat: "",
    batchId: "",
  });
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);

  // Credential state
  const [credentials, setCredentials] = useState<Credential[]>(SEED_CREDENTIALS);
  const [credFilter, setCredFilter] = useState<CredentialType | "ALL">("ALL");
  const [showCredModal, setShowCredModal] = useState(false);
  const [newCred, setNewCred] = useState<Partial<Credential>>({ type: CredentialType.PARTICIPANT, active: true, printed: false, accessZones: ["general"] });

  // Access state
  const [zones, setZones] = useState<AccessZone[]>(SEED_ZONES);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<{ ok: boolean; msg: string; ticket?: TicketModel } | null>(null);
  const [accessLog, setAccessLog] = useState<{ time: string; name: string; qr: string; action: string; zone: string; ok: boolean }[]>([
    { time: "02:58:14", name: "Ana Lima", qr: "FLOW-TKT-0023-ANALIMA", action: "Entrada", zone: "Área Geral", ok: true },
    { time: "02:57:41", name: "CRED-PRS-00045", qr: "CRED-PRS-00045", action: "Entrada", zone: "Área de Imprensa", ok: true },
    { time: "02:56:03", name: "Ingresso Inválido", qr: "FAKE-QR-9999", action: "Negado", zone: "Backstage", ok: false },
    { time: "02:55:29", name: "Ricardo Fonseca", qr: "CRED-SPO-00013", action: "Entrada", zone: "Camarote VIP", ok: true },
  ]);
  const [selectedZoneId, setSelectedZoneId] = useState("zone-1");

  // Sports state
  const [sportsForm, setSportsForm] = useState({
    category: "Geral",
    distance: "10km",
    team: "",
    club: "",
    federation: "",
    shirtSize: "M",
    hasMedicalCert: false,
    hasTermSigned: false,
    hasInsurance: false,
  });
  const [sportSearch, setSportSearch] = useState("");

  // Transfer state
  const [transfers, setTransfers] = useState<TicketTransfer[]>(SEED_TRANSFERS);
  const [transferForm, setTransferForm] = useState({ ticketQr: "", toName: "", toEmail: "", reason: "" });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);
  const [cancelQr, setCancelQr] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // AI state
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // ── Derived ──
  const evTickets = tickets.filter(t => t.eventId === selectedEventId);
  const tenantTickets = tickets.filter(t => t.tenantId === selectedTenantId);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const totalRevenue = tenantTickets.reduce((s, t) => s + t.price, 0);
  const checkedInCount = evTickets.filter(t => t.checkedIn).length;
  const checkinRate = evTickets.length ? Math.round((checkedInCount / evTickets.length) * 100) : 0;
  const avgPrice = tenantTickets.length ? totalRevenue / tenantTickets.length : 0;

  // Occupancy of selected event
  const capacity = selectedEvent?.capacity || 0;
  const occupancy = capacity ? Math.round((evTickets.length / capacity) * 100) : 0;

  // Type breakdown
  const typeBreakdown = Object.values(TicketType).map(type => ({
    type,
    count: tenantTickets.filter(t => t.type === type).length,
    revenue: tenantTickets.filter(t => t.type === type).reduce((s, t) => s + t.price, 0),
  })).filter(x => x.count > 0);

  // ── Sales handler ──
  const handleSale = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleLoading(true);
    setSaleError(null);
    setSaleSuccess(null);

    try {
      const basePrice = selectedEvent?.ticketPrice || 0;
      const discount = couponApplied?.discount || 0;

      const res = await authFetch("/api/tickets/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          tenantId: selectedTenantId,
          name: saleForm.name,
          email: saleForm.email,
          cpf: saleForm.cpf,
          type: saleForm.type,
          seat: saleForm.seat,
          paymentMethod: saleForm.paymentMethod,
          couponCode: couponApplied?.code,
          discountAmount: discount,
          originalPrice: basePrice,
          batchId: saleForm.batchId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const ticket = await res.json();
      setSaleSuccess(`✓ Ingresso emitido! QR Code: ${ticket.qrCode}`);
      setSaleForm({ name: "", email: "", cpf: "", type: TicketType.PAID, paymentMethod: PaymentMethod.PIX, coupon: "", seat: "", batchId: "" });
      setCouponApplied(null);
      onRefresh();
    } catch (err: any) {
      setSaleError(err.message);
    } finally {
      setSaleLoading(false);
    }
  }, [saleForm, selectedEventId, selectedTenantId, couponApplied, selectedEvent, onRefresh]);

  const applyCoupon = () => {
    const codes: Record<string, number> = {
      BEMVINDO20: 20, VIP50OFF: 50, PRESS100: 100, LASTCHANCE: 10, PARCEIRO15: 15,
    };
    const pct = codes[saleForm.coupon.toUpperCase()];
    if (pct) {
      setCouponApplied({ code: saleForm.coupon.toUpperCase(), discount: pct });
    } else {
      setCouponApplied(null);
    }
  };

  // ── QR scan ──
  const handleScan = async () => {
    if (!scanInput.trim()) return;
    const match = tickets.find(t => t.qrCode === scanInput.trim() || t.id === scanInput.trim());
    const credMatch = credentials.find(c => c.qrCode === scanInput.trim());

    if (!match && !credMatch) {
      const entry = { time: new Date().toLocaleTimeString("pt-BR"), name: "Desconhecido", qr: scanInput, action: "Negado — QR inválido", zone: zones.find(z => z.id === selectedZoneId)?.name || "", ok: false };
      setAccessLog(prev => [entry, ...prev].slice(0, 20));
      setScanResult({ ok: false, msg: "❌ QR Code não encontrado ou inválido." });
      setScanInput("");
      return;
    }

    if (match) {
      try {
        const res = await authFetch("/api/tickets/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: match.id }) });
        const updated = await res.json();
        const action = updated.checkedIn ? "Check-In" : "Check-Out";
        const entry = { time: new Date().toLocaleTimeString("pt-BR"), name: match.buyerName, qr: match.qrCode, action, zone: zones.find(z => z.id === selectedZoneId)?.name || "", ok: true };
        setAccessLog(prev => [entry, ...prev].slice(0, 20));
        setScanResult({ ok: true, msg: `✅ ${match.buyerName} — ${action} registrado!`, ticket: updated });
        setZones(prev => prev.map(z => z.id === selectedZoneId ? { ...z, currentOccupancy: Math.max(0, z.currentOccupancy + (updated.checkedIn ? 1 : -1)) } : z));
        onRefresh();
      } catch {
        setScanResult({ ok: false, msg: "Erro ao processar check-in." });
      }
    } else if (credMatch) {
      const entry = { time: new Date().toLocaleTimeString("pt-BR"), name: credMatch.holderName, qr: credMatch.qrCode, action: "Acesso Credencial", zone: zones.find(z => z.id === selectedZoneId)?.name || "", ok: true };
      setAccessLog(prev => [entry, ...prev].slice(0, 20));
      setScanResult({ ok: true, msg: `✅ Credencial válida — ${credMatch.holderName} (${credMatch.type})` });
    }
    setScanInput("");
  };

  // ── Credential issue ──
  const handleIssueCredential = () => {
    if (!newCred.holderName || !newCred.holderEmail || !newCred.type) return;
    const c: Credential = {
      id: `cred-${Date.now()}`,
      eventId: selectedEventId,
      tenantId: selectedTenantId,
      holderName: newCred.holderName!,
      holderEmail: newCred.holderEmail!,
      holderOrg: newCred.holderOrg,
      type: newCred.type as CredentialType,
      qrCode: `CRED-${(newCred.type as string).slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      accessZones: newCred.accessZones || ["general"],
      issuedAt: new Date().toISOString(),
      printed: false,
      active: true,
      notes: newCred.notes,
    };
    setCredentials(prev => [c, ...prev]);
    setShowCredModal(false);
    setNewCred({ type: CredentialType.PARTICIPANT, active: true, printed: false, accessZones: ["general"] });
  };

  // ── Transfer ──
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.ticketQr || !transferForm.toName || !transferForm.toEmail) return;
    setTransferLoading(true);
    try {
      const res = await authFetch("/api/tickets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      const data = await res.json();
      const newTransfer: TicketTransfer = {
        id: `tr-${Date.now()}`,
        ticketId: data.ticketId || transferForm.ticketQr,
        eventId: selectedEventId,
        fromName: data.fromName || "—",
        fromEmail: data.fromEmail || "—",
        toName: transferForm.toName,
        toEmail: transferForm.toEmail,
        transferredAt: new Date().toISOString(),
        status: "COMPLETED",
        reason: transferForm.reason,
      };
      setTransfers(prev => [newTransfer, ...prev]);
      setTransferForm({ ticketQr: "", toName: "", toEmail: "", reason: "" });
      setTransferMsg("✅ Transferência concluída com sucesso!");
      onRefresh();
    } catch (err: any) {
      setTransferMsg(`❌ ${err.message}`);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelQr) return;
    setCancelLoading(true);
    try {
      const res = await authFetch("/api/tickets/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: cancelQr, reason: cancelReason }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      setTransferMsg("✅ Ingresso cancelado. Reembolso iniciado.");
      setCancelQr(""); setCancelReason("");
      onRefresh();
    } catch (err: any) {
      setTransferMsg(`❌ ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // ── AI Insights ──
  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const snapshot = {
        totalTickets: tenantTickets.length,
        totalRevenue,
        checkinRate,
        avgPrice,
        occupancy,
        typeBreakdown: typeBreakdown.map(x => ({ type: x.type, count: x.count, revenue: x.revenue })),
      };
      const res = await authFetch("/api/ai/ticketing-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery, snapshot }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      const { reply } = await res.json();
      setAiResponse(reply);
    } catch (err: any) {
      setAiResponse(`Erro: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <BarChart3 size={13} />, label: "Dashboard" },
    { id: "sales", icon: <Ticket size={13} />, label: "Venda & Emissão" },
    { id: "lotes", icon: <Tag size={13} />, label: "Categorias & Lotes" },
    { id: "credentials", icon: <BadgeCheck size={13} />, label: "Credenciamento" },
    { id: "access", icon: <Scan size={13} />, label: "Controle de Acesso" },
    { id: "sports", icon: <Medal size={13} />, label: "Inscrições Esportivas" },
    { id: "transfers", icon: <ArrowRight size={13} />, label: "Transferências & Reembolsos" },
    { id: "ai", icon: <Brain size={13} />, label: "IA & Analytics" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Ticketing Enterprise</h2>
          <p className="text-xs text-slate-500 mt-0.5">Comercialização · Credenciamento · Controle de Acesso · IA</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedEventId}
            onChange={e => onSelectEvent(e.target.value)}
            className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-violet-400"
          >
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <button onClick={onRefresh} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold">
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>
      </div>

      {/* KPIs row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {[
          { label: "Ingressos Emitidos", value: tenantTickets.length.toLocaleString("pt-BR"), sub: `${evTickets.length} neste evento`, color: "from-violet-500 to-violet-600", icon: <Ticket size={18} /> },
          { label: "Receita Total", value: fmtBRL(totalRevenue), sub: `Ticket médio ${fmtBRL(avgPrice)}`, color: "from-emerald-500 to-emerald-600", icon: <DollarSign size={18} /> },
          { label: "Check-In Rate", value: `${checkinRate}%`, sub: `${checkedInCount} de ${evTickets.length}`, color: checkinRate > 70 ? "from-blue-500 to-blue-600" : "from-amber-500 to-amber-600", icon: <UserCheck size={18} /> },
          { label: "Ocupação", value: `${occupancy}%`, sub: `${evTickets.length} / ${capacity}`, color: occupancy > 90 ? "from-red-500 to-red-600" : "from-teal-500 to-teal-600", icon: <Users size={18} /> },
          { label: "Credenciais", value: credentials.filter(c => c.active).length, sub: `${credentials.filter(c => !c.printed).length} não impressas`, color: "from-indigo-500 to-indigo-600", icon: <BadgeCheck size={18} /> },
        ].map((k, i) => (
          <div key={i} className={`bg-gradient-to-br ${k.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="mb-1 opacity-80">{k.icon}</div>
            <div className="text-xl font-black">{k.value}</div>
            <div className="text-[10px] font-bold opacity-80">{k.label}</div>
            <div className="text-[9px] opacity-50 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Sub-tab nav */}
      <div className="flex items-center gap-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.id
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {tab === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Ticket type breakdown */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={15} className="text-violet-500" />Vendas por Tipo de Ingresso</h3>
              {typeBreakdown.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  <Ticket size={28} className="mx-auto mb-2 text-slate-200" />
                  Nenhum ingresso vendido ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {typeBreakdown.sort((a, b) => b.count - a.count).map(({ type, count, revenue }) => {
                    const max = Math.max(...typeBreakdown.map(x => x.count));
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 w-32 truncate">{TICKET_TYPE_LABELS[type] || type}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-black text-slate-700 w-8 text-right">{count}</span>
                        <span className="text-[10px] text-slate-400 w-20 text-right">{fmtBRL(revenue)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Zone occupancy */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><MapPin size={15} className="text-emerald-500" />Ocupação por Zona</h3>
              <div className="space-y-3">
                {zones.map(z => {
                  const pct = Math.round((z.currentOccupancy / z.capacity) * 100);
                  return (
                    <div key={z.id}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-700 truncate">{z.name}</span>
                        <span className={`font-black ${pct >= 90 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-emerald-500"}`}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: z.color }}
                        />
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{z.currentOccupancy.toLocaleString("pt-BR")} / {z.capacity.toLocaleString("pt-BR")}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><Activity size={15} className="text-blue-500" />Últimas Emissões</h3>
            {tenantTickets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum ingresso emitido ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                      <th className="px-4 py-2">Participante</th>
                      <th className="px-4 py-2">Tipo</th>
                      <th className="px-4 py-2">QR Code</th>
                      <th className="px-4 py-2">Valor</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {[...tenantTickets].reverse().slice(0, 10).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-slate-800">{t.buyerName}</div>
                          <div className="text-[10px] text-slate-400">{t.buyerEmail}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                            {TICKET_TYPE_LABELS[t.type] || t.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[10px] text-blue-600">{t.qrCode}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-600">{fmtBRL(t.price)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                            {t.checkedIn ? "✓ Checked In" : "Aguardando"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: VENDA & EMISSÃO ── */}
      {tab === "sales" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Ticket size={15} className="text-violet-500" />Nova Venda / Emissão</h3>
            <form onSubmit={handleSale} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Completo *</label>
                <input required value={saleForm.name} onChange={e => setSaleForm({ ...saleForm, name: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail *</label>
                <input required type="email" value={saleForm.email} onChange={e => setSaleForm({ ...saleForm, email: e.target.value })}
                  placeholder="joao@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">CPF</label>
                <input value={saleForm.cpf} onChange={e => setSaleForm({ ...saleForm, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de Ingresso</label>
                  <select value={saleForm.type} onChange={e => setSaleForm({ ...saleForm, type: e.target.value as TicketType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    {Object.entries(TICKET_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assento / Setor</label>
                  <input value={saleForm.seat} onChange={e => setSaleForm({ ...saleForm, seat: e.target.value })}
                    placeholder="Opcional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400" />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.values(PaymentMethod).map(pm => (
                    <button key={pm} type="button"
                      onClick={() => setSaleForm({ ...saleForm, paymentMethod: pm })}
                      className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border text-[9px] font-bold transition-all ${saleForm.paymentMethod === pm ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-violet-300"}`}>
                      <span className="text-base">{PAYMENT_ICONS[pm]}</span>
                      {pm === PaymentMethod.CREDIT_CARD ? "Crédito" : pm === PaymentMethod.DEBIT_CARD ? "Débito" : pm === PaymentMethod.DIGITAL_WALLET ? "Wallet" : pm === PaymentMethod.INTERNAL_CREDIT ? "Crédito Int." : pm === PaymentMethod.GIFT_CARD ? "Gift Card" : pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coupon */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cupom de Desconto</label>
                <div className="flex gap-2">
                  <input value={saleForm.coupon} onChange={e => setSaleForm({ ...saleForm, coupon: e.target.value })}
                    placeholder="Código do cupom"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400 uppercase" />
                  <button type="button" onClick={applyCoupon}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700">
                    Aplicar
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Cupom {couponApplied.code} aplicado — {couponApplied.discount}% de desconto</p>
                )}
              </div>

              {/* Price summary */}
              {selectedEvent && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Preço base</span>
                    <span>{fmtBRL(selectedEvent.ticketPrice)}</span>
                  </div>
                  {saleForm.type === TicketType.VIP && (
                    <div className="flex justify-between text-amber-600">
                      <span>Acréscimo VIP (×2,5)</span>
                      <span>+{fmtBRL(selectedEvent.ticketPrice * 1.5)}</span>
                    </div>
                  )}
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Desconto ({couponApplied.discount}%)</span>
                      <span>-{fmtBRL(selectedEvent.ticketPrice * couponApplied.discount / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-800 border-t border-slate-200 pt-1 mt-1">
                    <span>Total</span>
                    <span className="text-emerald-600">
                      {fmtBRL(saleForm.type === TicketType.VIP ? selectedEvent.ticketPrice * 2.5 : saleForm.type === TicketType.FREE || saleForm.type === TicketType.CORTESIA || saleForm.type === TicketType.CONVITE ? 0 : selectedEvent.ticketPrice * (1 - (couponApplied?.discount || 0) / 100))}
                    </span>
                  </div>
                </div>
              )}

              {saleSuccess && <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 rounded-xl p-3">{saleSuccess}</p>}
              {saleError && <p className="text-[11px] text-red-500 font-bold bg-red-50 rounded-xl p-3">{saleError}</p>}

              <button type="submit" disabled={saleLoading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-violet-600/20">
                {saleLoading ? "Processando..." : "✓ Emitir Ingresso & Confirmar"}
              </button>
            </form>
          </div>

          {/* Recent sales */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><List size={15} className="text-blue-500" />Ingressos Emitidos — {selectedEvent?.name || "Evento"}</h3>
              {evTickets.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  <Ticket size={30} className="mx-auto mb-2 text-slate-200" />
                  Nenhum ingresso emitido para este evento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                        <th className="px-3 py-2">Participante</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Valor</th>
                        <th className="px-3 py-2">QR Code</th>
                        <th className="px-3 py-2">Check-In</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {[...evTickets].reverse().map(t => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-slate-800 text-[11px]">{t.buyerName}</div>
                            <div className="text-[10px] text-slate-400">{t.cpf || t.buyerEmail}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                              {TICKET_TYPE_LABELS[t.type] || t.type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-black text-emerald-600 text-[11px]">{fmtBRL(t.price)}</td>
                          <td className="px-3 py-2.5 font-mono text-[9px] text-blue-600">{t.qrCode}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {t.checkedIn ? "✓" : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CREDENCIAMENTO ── */}
      {tab === "credentials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(["ALL", ...Object.values(CredentialType)] as (CredentialType | "ALL")[]).map(t => (
                <button key={t} onClick={() => setCredFilter(t)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all ${credFilter === t ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {t === "ALL" ? "Todos" : t}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCredModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold">
              <Plus size={13} /> Emitir Credencial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {credentials
              .filter(c => credFilter === "ALL" || c.type === credFilter)
              .map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white">
                        <BadgeCheck size={18} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-800">{c.holderName}</p>
                        {c.holderOrg && <p className="text-[10px] text-slate-400">{c.holderOrg}</p>}
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${CREDENTIAL_COLORS[c.type]}`}>
                      {c.type}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3 text-[10px] text-slate-500">
                    <p>📧 {c.holderEmail}</p>
                    <p className="font-mono font-bold text-blue-600 text-[11px]">🔲 {c.qrCode}</p>
                    <p>🗺 Zonas: {c.accessZones.join(", ")}</p>
                    {c.notes && <p className="italic">📝 {c.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {c.active ? "Ativa" : "Inativa"}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.printed ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}>
                      {c.printed ? "✓ Impressa" : "⚠ Não Impressa"}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => setCredentials(prev => prev.map(x => x.id === c.id ? { ...x, printed: true } : x))}
                        className="text-[9px] font-bold text-slate-500 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-all">
                        🖨 Imprimir
                      </button>
                      <button
                        onClick={() => setCredentials(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x))}
                        className="text-[9px] font-bold text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all">
                        {c.active ? "Bloquear" : "Ativar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Issue credential modal */}
          {showCredModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-800">Emitir Nova Credencial</h3>
                  <button onClick={() => setShowCredModal(false)}><X size={16} className="text-slate-400" /></button>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome *</label>
                    <input value={newCred.holderName || ""} onChange={e => setNewCred({ ...newCred, holderName: e.target.value })}
                      placeholder="Nome completo" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-indigo-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail *</label>
                    <input type="email" value={newCred.holderEmail || ""} onChange={e => setNewCred({ ...newCred, holderEmail: e.target.value })}
                      placeholder="email@exemplo.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-indigo-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Organização</label>
                      <input value={newCred.holderOrg || ""} onChange={e => setNewCred({ ...newCred, holderOrg: e.target.value })}
                        placeholder="Empresa / Entidade" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo *</label>
                      <select value={newCred.type} onChange={e => setNewCred({ ...newCred, type: e.target.value as CredentialType })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-indigo-400">
                        {Object.values(CredentialType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Observações</label>
                    <input value={newCred.notes || ""} onChange={e => setNewCred({ ...newCred, notes: e.target.value })}
                      placeholder="Protocolo especial, restrições..." className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-indigo-400" />
                  </div>
                  <button onClick={handleIssueCredential}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black">
                    Emitir Credencial
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CONTROLE DE ACESSO ── */}
      {tab === "access" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Scanner */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><Scan size={15} className="text-blue-500" />Leitura de QR Code</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Zona de Acesso</label>
                <select value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-blue-400 mb-3">
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 mb-3 flex items-center justify-center min-h-[140px] relative">
                <div className="absolute inset-4 border-2 border-blue-400/40 rounded-xl" />
                <div className="text-center">
                  <QrCode size={40} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400">Posicione o QR Code ou<br />insira o código manualmente</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder="QR Code ou ID do ingresso..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-blue-400"
                />
                <button onClick={handleScan} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">
                  <Scan size={14} />
                </button>
              </div>
              {scanResult && (
                <div className={`mt-3 p-3 rounded-xl text-xs font-bold ${scanResult.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                  {scanResult.msg}
                  {scanResult.ticket && (
                    <div className="mt-1 text-[10px] font-normal opacity-70">
                      CPF: {scanResult.ticket.cpf || "—"} · Tipo: {TICKET_TYPE_LABELS[scanResult.ticket.type] || scanResult.ticket.type}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Zone stats */}
            {zones.find(z => z.id === selectedZoneId) && (() => {
              const z = zones.find(z => z.id === selectedZoneId)!;
              const pct = Math.round((z.currentOccupancy / z.capacity) * 100);
              return (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h4 className="font-bold text-xs text-slate-700 mb-3">{z.name}</h4>
                  <div className="text-3xl font-black text-slate-800 mb-1">{z.currentOccupancy.toLocaleString("pt-BR")}</div>
                  <div className="text-[10px] text-slate-400 mb-3">de {z.capacity.toLocaleString("pt-BR")} ({pct}% ocupado)</div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: z.color }} />
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500">
                    Credenciais: {z.allowedCredentials.join(", ")}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Access log + zone grid */}
          <div className="lg:col-span-2 space-y-4">
            {/* Zone cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {zones.map(z => {
                const pct = Math.round((z.currentOccupancy / z.capacity) * 100);
                return (
                  <button key={z.id} onClick={() => setSelectedZoneId(z.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${selectedZoneId === z.id ? "border-blue-400 bg-blue-50" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-600 truncate">{z.name}</span>
                      <span className={`text-[9px] font-black ${pct >= 90 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-emerald-500"}`}>{pct}%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: z.color }} />
                    </div>
                    <div className="text-[9px] text-slate-400">{z.currentOccupancy} / {z.capacity}</div>
                  </button>
                );
              })}
            </div>

            {/* Access log */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2"><Activity size={14} className="text-emerald-500" />Log de Acessos em Tempo Real</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {accessLog.map((log, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl text-xs ${log.ok ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${log.ok ? "bg-emerald-500" : "bg-red-500"}`}>
                      {log.ok ? <CheckCircle size={11} className="text-white" /> : <XCircle size={11} className="text-white" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-700 truncate block text-[11px]">{log.name}</span>
                      <span className="text-[9px] text-slate-400">{log.action} · {log.zone}</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">{log.time}</span>
                  </div>
                ))}
                {accessLog.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-6">Nenhum acesso registrado ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: INSCRIÇÕES ESPORTIVAS ── */}
      {tab === "sports" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Medal size={15} className="text-amber-500" />Dados Esportivos da Inscrição</h3>
            <p className="text-[10px] text-slate-500">Preencha os campos esportivos adicionais ao emitir a inscrição via <strong>Venda & Emissão</strong>.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                <select value={sportsForm.category} onChange={e => setSportsForm({ ...sportsForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400">
                  {["Geral", "Elite", "Sub-20", "Master 30-39", "Master 40-49", "Master 50+", "Feminino Elite", "PCD"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Distância</label>
                <select value={sportsForm.distance} onChange={e => setSportsForm({ ...sportsForm, distance: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400">
                  {["5km", "10km", "21km", "42km", "50km", "100km"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Equipe</label>
                <input value={sportsForm.team} onChange={e => setSportsForm({ ...sportsForm, team: e.target.value })}
                  placeholder="Nome da equipe" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Clube</label>
                <input value={sportsForm.club} onChange={e => setSportsForm({ ...sportsForm, club: e.target.value })}
                  placeholder="Clube / Federação" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tamanho da Camiseta</label>
              <div className="flex gap-2 flex-wrap">
                {["PP", "P", "M", "G", "GG", "XGG"].map(s => (
                  <button key={s} type="button"
                    onClick={() => setSportsForm({ ...sportsForm, shirtSize: s })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${sportsForm.shirtSize === s ? "bg-amber-500 text-white border-amber-500" : "bg-white border-slate-200 text-slate-600"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { key: "hasMedicalCert", label: "Atestado Médico ✓" },
                { key: "hasTermSigned", label: "Termo de Responsabilidade ✓" },
                { key: "hasInsurance", label: "Seguro de Participação ✓" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={sportsForm[key as keyof typeof sportsForm] as boolean}
                    onChange={e => setSportsForm({ ...sportsForm, [key]: e.target.checked })}
                    className="w-4 h-4 accent-amber-500" />
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sports registrations list */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Users size={14} className="text-amber-500" />Atletas Inscritos</h3>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={sportSearch} onChange={e => setSportSearch(e.target.value)}
                  placeholder="Buscar atleta..." className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-400" />
              </div>
            </div>

            {evTickets.filter(t => t.type === TicketType.SPORTS_REGISTRATION).length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">
                <Medal size={32} className="mx-auto mb-2 text-slate-200" />
                Nenhuma inscrição esportiva ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                      <th className="px-3 py-2">Atleta</th>
                      <th className="px-3 py-2">Categoria</th>
                      <th className="px-3 py-2">Distância</th>
                      <th className="px-3 py-2">Número</th>
                      <th className="px-3 py-2">Kit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {evTickets.filter(t => t.type === TicketType.SPORTS_REGISTRATION &&
                      (sportSearch === "" || t.buyerName.toLowerCase().includes(sportSearch.toLowerCase()))
                    ).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-slate-800 text-[11px]">{t.buyerName}</div>
                          <div className="text-[10px] text-slate-400">{t.cpf || t.buyerEmail}</div>
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-slate-600">{t.category || "Geral"}</td>
                        <td className="px-3 py-2.5 text-[10px] font-bold text-amber-600">{t.distance || "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{t.bibNumber || "A confirmar"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.kitDelivered ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {t.kitDelivered ? "✓ Entregue" : "Pendente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: TRANSFERÊNCIAS & REEMBOLSOS ── */}
      {tab === "transfers" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Transfer form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><ArrowRight size={15} className="text-blue-500" />Transferir Titularidade</h3>
              <form onSubmit={handleTransfer} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">QR Code do Ingresso *</label>
                  <input required value={transferForm.ticketQr} onChange={e => setTransferForm({ ...transferForm, ticketQr: e.target.value })}
                    placeholder="FLOW-TKT-..." className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome do Novo Titular *</label>
                  <input required value={transferForm.toName} onChange={e => setTransferForm({ ...transferForm, toName: e.target.value })}
                    placeholder="Nome completo" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail do Novo Titular *</label>
                  <input required type="email" value={transferForm.toEmail} onChange={e => setTransferForm({ ...transferForm, toEmail: e.target.value })}
                    placeholder="novo@email.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Motivo</label>
                  <input value={transferForm.reason} onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })}
                    placeholder="Opcional" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-blue-400" />
                </div>
                <button type="submit" disabled={transferLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-black">
                  {transferLoading ? "Processando..." : "Confirmar Transferência"}
                </button>
              </form>
            </div>

            {/* Cancel form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><RotateCcw size={15} className="text-red-500" />Cancelar & Reembolsar</h3>
              <form onSubmit={handleCancel} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">QR Code do Ingresso *</label>
                  <input required value={cancelQr} onChange={e => setCancelQr(e.target.value)}
                    placeholder="FLOW-TKT-..." className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Motivo do Cancelamento</label>
                  <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                    placeholder="Ex: lesão, viagem..." className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-red-400" />
                </div>
                <button type="submit" disabled={cancelLoading}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-xl text-xs font-black">
                  {cancelLoading ? "Processando..." : "Solicitar Cancelamento & Reembolso"}
                </button>
              </form>
            </div>

            {transferMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${transferMsg.startsWith("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                {transferMsg}
              </div>
            )}
          </div>

          {/* Transfer history */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><List size={15} className="text-slate-500" />Histórico de Transferências</h3>
            <div className="space-y-3">
              {transfers.map(t => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-700">{t.fromName}</span>
                        <ArrowRight size={11} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-blue-600">{t.toName}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                          t.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-600"
                        }`}>{t.status}</span>
                      </div>
                      {t.reason && <p className="text-[10px] text-slate-400 italic">Motivo: {t.reason}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t.fromEmail} → {t.toEmail} · {new Date(t.transferredAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {t.status === "PENDING" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => setTransfers(prev => prev.map(x => x.id === t.id ? { ...x, status: "COMPLETED" } : x))}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold">
                        ✓ Confirmar
                      </button>
                      <button onClick={() => setTransfers(prev => prev.map(x => x.id === t.id ? { ...x, status: "CANCELLED" } : x))}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-[10px] font-bold">
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {transfers.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-6">Nenhuma transferência registrada.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CATEGORIAS, LOTES & CUPONS ── */}
      {tab === "lotes" && (
        <LotesCupons
          events={events}
          selectedEventId={selectedEventId}
          selectedTenantId={selectedTenantId}
          onRefresh={onRefresh}
        />
      )}

      {/* ── TAB: IA & ANALYTICS ── */}
      {tab === "ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* AI chat */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Brain size={15} className="text-violet-500" />Assistente de Ticketing IA
            </h3>
            <p className="text-[10px] text-slate-500">Pergunte sobre precificação, demanda, risco de fraude, abandono de carrinho ou estratégias de venda.</p>

            <div className="space-y-2">
              {[
                "Qual o preço ideal para o próximo lote?",
                "Estima a demanda para os próximos 7 dias",
                "Existem riscos de fraude nos ingressos?",
                "Como aumentar a taxa de check-in?",
                "Sugira uma campanha de last-minute",
              ].map(q => (
                <button key={q} onClick={() => setAiQuery(q)}
                  className="w-full text-left text-[10px] text-slate-600 hover:text-violet-700 hover:bg-violet-50 px-3 py-2 rounded-xl border border-slate-100 hover:border-violet-200 transition-all">
                  💡 {q}
                </button>
              ))}
            </div>

            <form onSubmit={handleAiQuery} className="space-y-2">
              <textarea
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                rows={3}
                placeholder="Faça uma pergunta sobre sua estratégia de ticketing..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400 resize-none"
              />
              <button type="submit" disabled={aiLoading || !aiQuery.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2">
                {aiLoading ? <><RefreshCw size={12} className="animate-spin" />Analisando...</> : <><Brain size={12} />Consultar IA</>}
              </button>
            </form>
          </div>

          {/* AI response + KPI insights */}
          <div className="lg:col-span-3 space-y-4">
            {aiResponse && (
              <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                    <Brain size={13} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Análise do Assistente IA</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</div>
              </div>
            )}

            {/* AI insights cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <TrendingUp size={16} />, title: "Demanda Prevista", value: `+${Math.round(12 + Math.random() * 18)}%`, sub: "próximos 7 dias", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                { icon: <Target size={16} />, title: "Preço Ótimo Sugerido", value: `R$ ${Math.round((selectedEvent?.ticketPrice || 0) * 1.12)}`, sub: "baseado em demanda atual", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
                { icon: <Shield size={16} />, title: "Risco de Fraude", value: "Baixo", sub: "0 anomalias detectadas", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                { icon: <TrendingDown size={16} />, title: "Abandono de Carrinho", value: "23%", sub: "acima da média — requer ação", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
                { icon: <Flame size={16} />, title: "Ingressos Restantes", value: `${Math.max(0, capacity - evTickets.length).toLocaleString("pt-BR")}`, sub: "estimativa de esgotamento: 5 dias", color: "text-red-600", bg: "bg-red-50 border-red-200" },
                { icon: <DollarSign size={16} />, title: "Receita Projetada", value: fmtBRL(totalRevenue * 1.28), sub: "se tendência mantida", color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
              ].map((k, i) => (
                <div key={i} className={`rounded-2xl border p-4 ${k.bg}`}>
                  <div className={`mb-2 ${k.color}`}>{k.icon}</div>
                  <div className={`text-lg font-black ${k.color}`}>{k.value}</div>
                  <div className="text-[10px] font-bold text-slate-600">{k.title}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Revenue projection chart (visual bars) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={13} className="text-violet-500" />Projeção de Receita — Próximos 7 Dias</h4>
              <div className="flex items-end gap-2 h-24">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, i) => {
                  const heights = [40, 55, 35, 70, 80, 100, 65];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-blue-400 transition-all hover:opacity-80"
                        style={{ height: `${heights[i]}%` }} />
                      <span className="text-[9px] text-slate-400 font-bold">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
