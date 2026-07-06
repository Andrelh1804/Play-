import React, { useState } from "react";
import { Tag, Plus, X, Percent, Clock, CheckCircle, AlertTriangle, Ticket, Users, TrendingUp, RefreshCw, ListChecks } from "lucide-react";

interface TicketBatch {
  id: string;
  eventId?: string;
  name: string;
  type: "STANDARD" | "VIP" | "STUDENT" | "CORPORATE" | "EARLY_BIRD" | "LAST_MINUTE";
  price: number;
  originalPrice?: number;
  quantity: number;
  sold: number;
  startDate: string;
  endDate: string;
  status: "SCHEDULED" | "ACTIVE" | "SOLD_OUT" | "EXPIRED" | "PAUSED";
  description?: string;
}

interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder?: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  applicableTo: string;
  createdBy: string;
}

interface Waitlist {
  id: string;
  eventName: string;
  batchName: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  position: number;
  notified: boolean;
}

interface Refund {
  id: string;
  ticketCode: string;
  buyerName: string;
  eventName: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  requestedAt: string;
  processedAt?: string;
}

const BATCH_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SOLD_OUT: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
  PAUSED: "bg-amber-100 text-amber-700",
};

const COUPON_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  EXPIRED: "bg-red-100 text-red-600",
};

const REFUND_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  PROCESSED: "bg-emerald-100 text-emerald-700",
};

const SEED_BATCHES: TicketBatch[] = [
  { id: "b-1", name: "1º Lote — Early Bird", type: "EARLY_BIRD", price: 89, originalPrice: 150, quantity: 500, sold: 500, startDate: "2026-01-01", endDate: "2026-03-31", status: "SOLD_OUT", description: "Preço especial para os primeiros inscritos" },
  { id: "b-2", name: "2º Lote — Standard", type: "STANDARD", price: 120, quantity: 1000, sold: 743, startDate: "2026-04-01", endDate: "2026-06-30", status: "ACTIVE", description: "Ingresso padrão com chip RFID" },
  { id: "b-3", name: "3º Lote — Last Minute", type: "LAST_MINUTE", price: 170, quantity: 300, sold: 48, startDate: "2026-07-01", endDate: "2026-07-06", status: "ACTIVE" },
  { id: "b-4", name: "Camarote VIP Premium", type: "VIP", price: 380, quantity: 150, sold: 128, startDate: "2026-01-01", endDate: "2026-07-05", status: "ACTIVE", description: "Acesso VIP com open bar e vista privilegiada" },
  { id: "b-5", name: "Meia-Entrada Estudante", type: "STUDENT", price: 60, quantity: 200, sold: 167, startDate: "2026-04-01", endDate: "2026-07-06", status: "ACTIVE", description: "Mediante apresentação de documento estudantil" },
  { id: "b-6", name: "4º Lote — Corporativo", type: "CORPORATE", price: 140, quantity: 400, sold: 0, startDate: "2026-08-01", endDate: "2026-09-30", status: "SCHEDULED" },
];

const SEED_COUPONS: Coupon[] = [
  { id: "cp-1", code: "BEMVINDO20", type: "PERCENT", value: 20, minOrder: 100, maxUses: 500, usedCount: 213, validFrom: "2026-01-01", validUntil: "2026-12-31", status: "ACTIVE", applicableTo: "Todos os lotes", createdBy: "Henrique Silva" },
  { id: "cp-2", code: "VIP50OFF", type: "FIXED", value: 50, minOrder: 200, maxUses: 100, usedCount: 47, validFrom: "2026-05-01", validUntil: "2026-07-06", status: "ACTIVE", applicableTo: "Camarote VIP", createdBy: "Marketing" },
  { id: "cp-3", code: "PARCEIRO15", type: "PERCENT", value: 15, maxUses: 1000, usedCount: 391, validFrom: "2026-01-01", validUntil: "2026-06-30", status: "EXPIRED", applicableTo: "Todos os lotes", createdBy: "Comercial" },
  { id: "cp-4", code: "PRESS100", type: "FIXED", value: 100, maxUses: 50, usedCount: 12, validFrom: "2026-06-01", validUntil: "2026-07-06", status: "ACTIVE", applicableTo: "Imprensa credenciada", createdBy: "Marketing" },
  { id: "cp-5", code: "LASTCHANCE", type: "PERCENT", value: 10, maxUses: 200, usedCount: 0, validFrom: "2026-07-01", validUntil: "2026-07-06", status: "ACTIVE", applicableTo: "3º Lote", createdBy: "Henrique Silva" },
];

const SEED_WAITLIST: Waitlist[] = [
  { id: "w-1", eventName: "Maratona SP 2026", batchName: "1º Lote — Early Bird", name: "Ricardo Alves", email: "ricardo.alves@gmail.com", phone: "(11) 99001-2345", registeredAt: "2026-04-01T10:00:00Z", position: 1, notified: true },
  { id: "w-2", eventName: "Maratona SP 2026", batchName: "1º Lote — Early Bird", name: "Carla Mendonça", email: "carla.m@hotmail.com", phone: "(11) 91234-5678", registeredAt: "2026-04-02T14:30:00Z", position: 2, notified: false },
  { id: "w-3", eventName: "Maratona SP 2026", batchName: "Camarote VIP Premium", name: "Fábio Martins", email: "fabio.martins@empresa.com.br", phone: "(11) 98765-4321", registeredAt: "2026-05-10T09:00:00Z", position: 1, notified: false },
];

const SEED_REFUNDS: Refund[] = [
  { id: "rf-1", ticketCode: "TKT-001482", buyerName: "Ana Lima", eventName: "Maratona SP 2026", amount: 120, reason: "Lesão — médico impossibilitou participação", status: "PROCESSED", requestedAt: "2026-06-30T15:00:00Z", processedAt: "2026-07-01T10:00:00Z" },
  { id: "rf-2", ticketCode: "TKT-002071", buyerName: "José Santos", eventName: "Maratona SP 2026", amount: 170, reason: "Compra duplicada por falha no sistema", status: "APPROVED", requestedAt: "2026-07-02T11:00:00Z" },
  { id: "rf-3", ticketCode: "TKT-003344", buyerName: "Beatriz Rocha", eventName: "Congresso Tech", amount: 350, reason: "Viagem cancelada imprevista", status: "PENDING", requestedAt: "2026-07-05T16:30:00Z" },
  { id: "rf-4", ticketCode: "TKT-001009", buyerName: "Paulo Carvalho", eventName: "Maratona SP 2026", amount: 89, reason: "Insatisfação — esperava parque temático no percurso", status: "REJECTED", requestedAt: "2026-06-15T08:00:00Z", processedAt: "2026-06-16T14:00:00Z" },
];

type Section = "batches" | "coupons" | "waitlist" | "refunds";

export default function LotesCupons() {
  const [section, setSection] = useState<Section>("batches");
  const [batches, setBatches] = useState<TicketBatch[]>(SEED_BATCHES);
  const [coupons, setCoupons] = useState<Coupon[]>(SEED_COUPONS);
  const [waitlist, setWaitlist] = useState<Waitlist[]>(SEED_WAITLIST);
  const [refunds, setRefunds] = useState<Refund[]>(SEED_REFUNDS);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newBatch, setNewBatch] = useState<Partial<TicketBatch>>({ type: "STANDARD", status: "SCHEDULED" });
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ type: "PERCENT", status: "ACTIVE" });

  const totalRevenue = batches.reduce((s, b) => s + b.sold * b.price, 0);
  const totalSold = batches.reduce((s, b) => s + b.sold, 0);
  const totalAvail = batches.reduce((s, b) => s + (b.quantity - b.sold), 0);
  const couponSavings = coupons.reduce((s, c) => s + (c.type === "FIXED" ? c.value * c.usedCount : 0), 0);

  const handleAddBatch = () => {
    if (!newBatch.name || !newBatch.price || !newBatch.quantity) return;
    const b: TicketBatch = {
      id: `b-${Date.now()}`,
      name: newBatch.name!,
      type: (newBatch.type || "STANDARD") as TicketBatch["type"],
      price: Number(newBatch.price),
      originalPrice: newBatch.originalPrice ? Number(newBatch.originalPrice) : undefined,
      quantity: Number(newBatch.quantity),
      sold: 0,
      startDate: newBatch.startDate || new Date().toISOString().split("T")[0],
      endDate: newBatch.endDate || "",
      status: (newBatch.status || "SCHEDULED") as TicketBatch["status"],
      description: newBatch.description,
    };
    setBatches(prev => [...prev, b]);
    setShowBatchModal(false);
    setNewBatch({ type: "STANDARD", status: "SCHEDULED" });
  };

  const handleAddCoupon = () => {
    if (!newCoupon.code || !newCoupon.value) return;
    const c: Coupon = {
      id: `cp-${Date.now()}`,
      code: (newCoupon.code || "").toUpperCase(),
      type: (newCoupon.type || "PERCENT") as Coupon["type"],
      value: Number(newCoupon.value),
      minOrder: newCoupon.minOrder ? Number(newCoupon.minOrder) : undefined,
      maxUses: Number(newCoupon.maxUses) || 100,
      usedCount: 0,
      validFrom: newCoupon.validFrom || new Date().toISOString().split("T")[0],
      validUntil: newCoupon.validUntil || "",
      status: "ACTIVE",
      applicableTo: newCoupon.applicableTo || "Todos os lotes",
      createdBy: "Henrique Silva",
    };
    setCoupons(prev => [...prev, c]);
    setShowCouponModal(false);
    setNewCoupon({ type: "PERCENT", status: "ACTIVE" });
  };

  const advanceRefund = (id: string) => {
    const next: Record<string, Refund["status"]> = { PENDING: "APPROVED", APPROVED: "PROCESSED", REJECTED: "PENDING" };
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: next[r.status] || r.status, processedAt: next[r.status] === "PROCESSED" ? new Date().toISOString() : r.processedAt } : r));
  };

  const rejectRefund = (id: string) => {
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "REJECTED", processedAt: new Date().toISOString() } : r));
  };

  const TYPE_COLOR: Record<string, string> = {
    STANDARD: "bg-slate-100 text-slate-700",
    VIP: "bg-amber-100 text-amber-700",
    STUDENT: "bg-blue-100 text-blue-700",
    CORPORATE: "bg-indigo-100 text-indigo-700",
    EARLY_BIRD: "bg-emerald-100 text-emerald-700",
    LAST_MINUTE: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lotes, Cupons & Reembolsos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de lotes de ingressos, cupons de desconto, lista de espera e reembolsos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {([
            ["batches", Ticket, "Lotes"],
            ["coupons", Percent, "Cupons"],
            ["waitlist", ListChecks, "Lista de Espera"],
            ["refunds", RefreshCw, "Reembolsos"],
          ] as [Section, any, string][]).map(([k, Icon, l]) => (
            <button key={k} onClick={() => setSection(k)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${section === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <Icon size={13}/>{l}
            </button>
          ))}
          {section === "batches" && (
            <button onClick={() => setShowBatchModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <Plus size={13}/> Novo Lote
            </button>
          )}
          {section === "coupons" && (
            <button onClick={() => setShowCouponModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <Plus size={13}/> Novo Cupom
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Receita Total Lotes", value: `R$ ${(totalRevenue/1000).toFixed(0)}k`, sub: "todos os lotes", color: "from-emerald-500 to-emerald-600", icon: "💰" },
          { label: "Ingressos Vendidos", value: totalSold.toLocaleString("pt-BR"), sub: `${totalAvail} disponíveis`, color: "from-violet-500 to-violet-600", icon: "🎫" },
          { label: "Cupons Ativos", value: coupons.filter(c => c.status === "ACTIVE").length, sub: `${coupons.reduce((s, c) => s + c.usedCount, 0)} utilizados`, color: "from-blue-500 to-blue-600", icon: "🏷" },
          { label: "Reembolsos Pendentes", value: refunds.filter(r => r.status === "PENDING").length, sub: `R$ ${refunds.filter(r => r.status === "PENDING").reduce((s, r) => s + r.amount, 0)} em análise`, color: refunds.filter(r => r.status === "PENDING").length > 0 ? "from-amber-500 to-amber-600" : "from-slate-400 to-slate-500", icon: "🔄" },
        ].map((k, i) => (
          <div key={i} className={`bg-gradient-to-br ${k.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-2xl font-black">{k.value}</div>
            <div className="text-[10px] opacity-70 font-medium">{k.label}</div>
            <div className="text-[9px] opacity-50">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* BATCHES */}
      {section === "batches" && (
        <div className="space-y-3">
          {batches.map(b => {
            const pct = Math.round((b.sold / b.quantity) * 100);
            const remaining = b.quantity - b.sold;
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Ticket size={18} className="text-slate-600"/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-800">{b.name}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLOR[b.type]}`}>{b.type.replace("_"," ")}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${BATCH_STATUS_COLOR[b.status]}`}>{b.status.replace("_"," ")}</span>
                      </div>
                      {b.description && <p className="text-[10px] text-slate-400 mt-0.5">{b.description}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {b.originalPrice && <span className="text-xs line-through text-slate-300">R$ {b.originalPrice}</span>}
                      <span className="text-xl font-black text-slate-800">R$ {b.price}</span>
                    </div>
                    {b.originalPrice && <span className="text-[10px] text-emerald-600 font-bold">{Math.round((1 - b.price/b.originalPrice)*100)}% off</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {[
                    { label: "Capacidade", value: b.quantity.toLocaleString("pt-BR") },
                    { label: "Vendidos", value: b.sold.toLocaleString("pt-BR") },
                    { label: "Disponíveis", value: remaining.toLocaleString("pt-BR") },
                    { label: "Receita", value: `R$ ${(b.sold * b.price).toLocaleString("pt-BR")}` },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-slate-400">{s.label}</p>
                      <p className="text-sm font-black text-slate-800">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-400">Vendas {b.startDate} → {b.endDate}</span>
                    <span className={`font-black ${pct >= 100 ? "text-red-500" : pct >= 80 ? "text-amber-500" : "text-emerald-500"}`}>{pct}% vendido</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct)}%` }}/>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(["SCHEDULED","ACTIVE","PAUSED"] as TicketBatch["status"][]).map(s => (
                    <button key={s} onClick={() => setBatches(prev => prev.map(x => x.id === b.id ? { ...x, status: s } : x))}
                      className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${b.status === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {s === "SCHEDULED" ? "Agendar" : s === "ACTIVE" ? "Ativar" : "Pausar"}
                    </button>
                  ))}
                  <button onClick={() => setBatches(prev => prev.filter(x => x.id !== b.id))}
                    className="ml-auto text-[9px] font-bold text-red-400 hover:text-red-600 transition-all">Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COUPONS */}
      {section === "coupons" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map(c => {
            const usagePct = Math.round((c.usedCount / c.maxUses) * 100);
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center"><Percent size={14} className="text-emerald-600"/></div>
                    <div>
                      <span className="text-sm font-black text-slate-800 font-mono tracking-wider">{c.code}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${COUPON_STATUS_COLOR[c.status]}`}>{c.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-600">
                      {c.type === "PERCENT" ? `-${c.value}%` : `-R$ ${c.value}`}
                    </p>
                    <p className="text-[9px] text-slate-400">{c.type === "PERCENT" ? "de desconto" : "de desconto fixo"}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3 text-[10px] text-slate-500">
                  <p>🎯 {c.applicableTo}</p>
                  {c.minOrder && <p>💳 Pedido mínimo: R$ {c.minOrder}</p>}
                  <p>📅 {c.validFrom} → {c.validUntil}</p>
                  <p>👤 Criado por: {c.createdBy}</p>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-400">Uso: {c.usedCount}/{c.maxUses}</span>
                    <span className={`font-bold ${usagePct >= 90 ? "text-red-500" : "text-slate-600"}`}>{usagePct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${usagePct >= 90 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100,usagePct)}%` }}/>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, status: x.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : x))}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${c.status === "ACTIVE" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
                    {c.status === "ACTIVE" ? "Desativar" : "Ativar"}
                  </button>
                  <button onClick={() => setCoupons(prev => prev.filter(x => x.id !== c.id))} className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-400 hover:bg-red-50 transition-all">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WAITLIST */}
      {section === "waitlist" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Lista de Espera</h3>
            <span className="text-xs text-slate-500">{waitlist.length} pessoas aguardando</span>
          </div>
          <div className="space-y-3">
            {waitlist.map(w => (
              <div key={w.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {w.position}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-slate-800">{w.name}</span>
                    {w.notified && <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">✉ Notificado</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                    <span>{w.email}</span>
                    <span>{w.phone}</span>
                    <span>📅 {new Date(w.registeredAt).toLocaleDateString("pt-BR")}</span>
                    <span className="font-medium text-slate-600">{w.eventName} · {w.batchName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!w.notified && (
                    <button onClick={() => setWaitlist(prev => prev.map(x => x.id === w.id ? { ...x, notified: true } : x))}
                      className="text-[10px] font-bold px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all">
                      Notificar
                    </button>
                  )}
                  <button onClick={() => setWaitlist(prev => prev.filter(x => x.id !== w.id))}
                    className="text-[10px] font-bold text-red-400 hover:text-red-600 px-2 py-1.5 transition-all">Remover</button>
                </div>
              </div>
            ))}
            {waitlist.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">
                <CheckCircle size={28} className="mx-auto mb-2 text-emerald-300"/>
                Nenhuma pessoa na lista de espera.
              </div>
            )}
          </div>
        </div>
      )}

      {/* REFUNDS */}
      {section === "refunds" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-800 mb-4">Gestão de Reembolsos</h3>
          <div className="space-y-3">
            {refunds.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-800">{r.buyerName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{r.ticketCode}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${REFUND_STATUS_COLOR[r.status]}`}>{r.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-1">{r.eventName} · Motivo: <em>{r.reason}</em></p>
                    <p className="text-[10px] text-slate-400">Solicitado: {new Date(r.requestedAt).toLocaleString("pt-BR")}
                      {r.processedAt && ` · Processado: ${new Date(r.processedAt).toLocaleString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-xl font-black text-slate-800">R$ {r.amount}</p>
                  </div>
                </div>
                {(r.status === "PENDING" || r.status === "APPROVED") && (
                  <div className="flex gap-2 pt-2 border-t border-slate-50">
                    <button onClick={() => advanceRefund(r.id)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all">
                      {r.status === "PENDING" ? "✓ Aprovar" : "💳 Processar Reembolso"}
                    </button>
                    {r.status === "PENDING" && (
                      <button onClick={() => rejectRefund(r.id)}
                        className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-[10px] font-bold transition-all">
                        ✕ Rejeitar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500">
            Total reembolsado: <strong className="text-slate-800">R$ {refunds.filter(r => r.status === "PROCESSED").reduce((s, r) => s + r.amount, 0).toLocaleString("pt-BR")}</strong> em {refunds.filter(r => r.status === "PROCESSED").length} transações · 
            Pendente: <strong className="text-amber-700">R$ {refunds.filter(r => r.status === "PENDING").reduce((s, r) => s + r.amount, 0).toLocaleString("pt-BR")}</strong>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">Criar Novo Lote de Ingressos</h3>
              <button onClick={() => setShowBatchModal(false)}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome do Lote</label>
                <input value={newBatch.name || ""} onChange={e => setNewBatch({...newBatch, name: e.target.value})} placeholder="Ex: 3º Lote — Last Minute"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo</label>
                  <select value={newBatch.type} onChange={e => setNewBatch({...newBatch, type: e.target.value as TicketBatch["type"]})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    <option value="STANDARD">Standard</option><option value="VIP">VIP</option>
                    <option value="STUDENT">Estudante</option><option value="CORPORATE">Corporativo</option>
                    <option value="EARLY_BIRD">Early Bird</option><option value="LAST_MINUTE">Last Minute</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status Inicial</label>
                  <select value={newBatch.status} onChange={e => setNewBatch({...newBatch, status: e.target.value as TicketBatch["status"]})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    <option value="SCHEDULED">Agendado</option><option value="ACTIVE">Ativo</option><option value="PAUSED">Pausado</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Preço (R$)</label>
                  <input type="number" value={newBatch.price || ""} onChange={e => setNewBatch({...newBatch, price: Number(e.target.value)})} placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Preço Original (R$)</label>
                  <input type="number" value={newBatch.originalPrice || ""} onChange={e => setNewBatch({...newBatch, originalPrice: Number(e.target.value) || undefined})} placeholder="Opcional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Quantidade de Ingressos</label>
                <input type="number" value={newBatch.quantity || ""} onChange={e => setNewBatch({...newBatch, quantity: Number(e.target.value)})} placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Início das Vendas</label>
                  <input type="date" value={newBatch.startDate || ""} onChange={e => setNewBatch({...newBatch, startDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fim das Vendas</label>
                  <input type="date" value={newBatch.endDate || ""} onChange={e => setNewBatch({...newBatch, endDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrição</label>
                <textarea value={newBatch.description || ""} onChange={e => setNewBatch({...newBatch, description: e.target.value})} rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400 resize-none"/>
              </div>
              <button onClick={handleAddBatch} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all">
                Criar Lote de Ingressos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">Criar Cupom de Desconto</h3>
              <button onClick={() => setShowCouponModal(false)}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Código do Cupom</label>
                <input value={newCoupon.code || ""} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} placeholder="Ex: PROMO20"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400 uppercase font-mono"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo</label>
                  <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value as Coupon["type"]})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    <option value="PERCENT">Percentual (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Valor do Desconto</label>
                  <input type="number" value={newCoupon.value || ""} onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})}
                    placeholder={newCoupon.type === "PERCENT" ? "Ex: 20" : "Ex: 50"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pedido Mínimo (R$)</label>
                  <input type="number" value={newCoupon.minOrder || ""} onChange={e => setNewCoupon({...newCoupon, minOrder: Number(e.target.value)})} placeholder="Opcional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Máximo de Usos</label>
                  <input type="number" value={newCoupon.maxUses || ""} onChange={e => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})} placeholder="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Válido de</label>
                  <input type="date" value={newCoupon.validFrom || ""} onChange={e => setNewCoupon({...newCoupon, validFrom: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Válido até</label>
                  <input type="date" value={newCoupon.validUntil || ""} onChange={e => setNewCoupon({...newCoupon, validUntil: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Aplicável a</label>
                <input value={newCoupon.applicableTo || ""} onChange={e => setNewCoupon({...newCoupon, applicableTo: e.target.value})} placeholder="Todos os lotes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <button onClick={handleAddCoupon} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all">
                Criar Cupom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
