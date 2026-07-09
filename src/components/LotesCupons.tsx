/**
 * LotesCupons — Gestão de Categorias, Lotes, Cupons e Reembolsos
 * Master Prompt V8.2 — Fases 2, 3, 4
 * DB-backed via /api/events/:id/categories, /api/events/:id/batches, /api/coupons
 */
import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "../authService";
import {
  Tag, Plus, X, Percent, Clock, CheckCircle, AlertTriangle, Ticket,
  Users, TrendingUp, RefreshCw, ListChecks, Edit3, Trash2, Zap,
  ChevronDown, ChevronRight, Layers, DollarSign, Calendar, Shield,
  ToggleLeft, ToggleRight, Info, ArrowRight, Package, Circle
} from "lucide-react";
import { Event } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketCategory {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  type: string;
  color: string;
  totalCapacity: number;
  soldCount: number;
  active: boolean;
  sortOrder: number;
}

interface TicketBatch {
  id: string;
  eventId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  soldCount: number;
  available: number;
  startDate?: string;
  endDate?: string;
  status: "SCHEDULED" | "ACTIVE" | "SOLD_OUT" | "EXPIRED" | "PAUSED";
  sortOrder: number;
  promotionalPrice?: number;
  discountPct: number;
  feesPct: number;
  maxPerPurchase: number;
  maxPerCpf: number;
  promoCode?: string;
  autoNext: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discountType: "pct" | "fixed";
  discountValue: number;
  minOrder?: number;
  maxUses?: number;
  usedCount: number;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
  applicableTo?: string;
}

interface Props {
  events: Event[];
  selectedEventId: string;
  selectedTenantId: string;
  onRefresh: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type Section = "categories" | "batches" | "coupons";

const BATCH_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SOLD_OUT: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
  PAUSED: "bg-amber-100 text-amber-700",
};

const BATCH_STATUS_ICON: Record<string, React.ReactNode> = {
  SCHEDULED: <Clock size={11} />,
  ACTIVE: <CheckCircle size={11} />,
  SOLD_OUT: <AlertTriangle size={11} />,
  EXPIRED: <X size={11} />,
  PAUSED: <Circle size={11} />,
};

const CATEGORY_TYPES = [
  "STANDARD", "VIP", "CAMAROTE", "STUDENT", "CORPORATE", "SPORTS",
  "PRESS", "STAFF", "FREE", "PCD", "KIDS"
];

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Component ────────────────────────────────────────────────────────────────

export default function LotesCupons({ events, selectedEventId, onRefresh }: Props) {
  const [section, setSection] = useState<Section>("batches");
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [batches, setBatches] = useState<TicketBatch[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState<TicketCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: "", type: "STANDARD", color: "#6366f1", totalCapacity: 100, description: "" });

  // Batch form
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editBatch, setEditBatch] = useState<TicketBatch | null>(null);
  const [batchForm, setBatchForm] = useState({
    name: "", description: "", price: 0, originalPrice: 0, quantity: 100,
    startDate: "", endDate: "", status: "SCHEDULED", categoryId: "",
    discountPct: 0, feesPct: 10, maxPerPurchase: 5, maxPerCpf: 1,
    promoCode: "", autoNext: true
  });

  // Coupon form
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", discountType: "pct", discountValue: 10, maxUses: 100, validUntil: "" });

  // Expand state for categories
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  // ── Load data ───────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!selectedEvent?.id) return;
    setLoading(true);
    try {
      const [catsRes, batchesRes, couponsRes] = await Promise.all([
        authFetch(`/api/events/${selectedEvent.id}/categories`),
        authFetch(`/api/events/${selectedEvent.id}/batches`),
        authFetch("/api/coupons")
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (batchesRes.ok) setBatches(await batchesRes.json());
      if (couponsRes.ok) {
        const data = await couponsRes.json();
        setCoupons(Array.isArray(data) ? data : data.coupons || []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedEvent?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Category CRUD ────────────────────────────────────────────────────────────

  const openCatForm = (cat?: TicketCategory) => {
    if (cat) {
      setEditCat(cat);
      setCatForm({ name: cat.name, type: cat.type, color: cat.color, totalCapacity: cat.totalCapacity, description: cat.description || "" });
    } else {
      setEditCat(null);
      setCatForm({ name: "", type: "STANDARD", color: "#6366f1", totalCapacity: 100, description: "" });
    }
    setShowCatForm(true);
  };

  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editCat
      ? `/api/events/${selectedEvent!.id}/categories/${editCat.id}`
      : `/api/events/${selectedEvent!.id}/categories`;
    const res = await authFetch(url, {
      method: editCat ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm)
    });
    if (res.ok) { setShowCatForm(false); loadData(); }
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Remover esta categoria?")) return;
    await authFetch(`/api/events/${selectedEvent!.id}/categories/${id}`, { method: "DELETE" });
    loadData();
  };

  // ── Batch CRUD ───────────────────────────────────────────────────────────────

  const openBatchForm = (batch?: TicketBatch) => {
    if (batch) {
      setEditBatch(batch);
      setBatchForm({
        name: batch.name, description: batch.description || "",
        price: batch.price, originalPrice: batch.originalPrice || 0,
        quantity: batch.quantity, startDate: batch.startDate || "", endDate: batch.endDate || "",
        status: batch.status, categoryId: batch.categoryId || "",
        discountPct: batch.discountPct, feesPct: batch.feesPct,
        maxPerPurchase: batch.maxPerPurchase, maxPerCpf: batch.maxPerCpf,
        promoCode: batch.promoCode || "", autoNext: batch.autoNext
      });
    } else {
      setEditBatch(null);
      setBatchForm({
        name: "", description: "", price: 0, originalPrice: 0, quantity: 100,
        startDate: "", endDate: "", status: "SCHEDULED", categoryId: categories[0]?.id || "",
        discountPct: 0, feesPct: 10, maxPerPurchase: 5, maxPerCpf: 1,
        promoCode: "", autoNext: true
      });
    }
    setShowBatchForm(true);
  };

  const saveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editBatch
      ? `/api/events/${selectedEvent!.id}/batches/${editBatch.id}`
      : `/api/events/${selectedEvent!.id}/batches`;
    const res = await authFetch(url, {
      method: editBatch ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...batchForm, sortOrder: batches.length })
    });
    if (res.ok) { setShowBatchForm(false); loadData(); }
  };

  const deleteBatch = async (id: string) => {
    if (!confirm("Remover este lote?")) return;
    await authFetch(`/api/events/${selectedEvent!.id}/batches/${id}`, { method: "DELETE" });
    loadData();
  };

  const toggleBatchPause = async (batch: TicketBatch) => {
    const newStatus = batch.status === "PAUSED" ? "ACTIVE" : "PAUSED";
    await authFetch(`/api/events/${selectedEvent!.id}/batches/${batch.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    loadData();
  };

  // ── Coupon CRUD ──────────────────────────────────────────────────────────────

  const saveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...couponForm,
        tenantId: selectedEvent?.tenantId,
        code: couponForm.code.toUpperCase()
      })
    });
    if (res.ok) { setShowCouponForm(false); loadData(); }
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const totalSold = batches.reduce((s, b) => s + b.soldCount, 0);
  const totalAvail = batches.reduce((s, b) => s + b.available, 0);
  const totalRevenue = batches.reduce((s, b) => s + b.soldCount * b.price, 0);
  const activeBatches = batches.filter(b => b.status === "ACTIVE").length;

  // ── Sections ───────────────────────────────────────────────────────────────

  const SECTIONS: { id: Section; icon: any; label: string; count: number }[] = [
    { id: "batches", icon: Ticket, label: "Lotes", count: batches.length },
    { id: "categories", icon: Layers, label: "Categorias", count: categories.length },
    { id: "coupons", icon: Percent, label: "Cupons", count: coupons.length },
  ];

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Selecione um evento para gerenciar lotes e cupons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Lotes, Categorias & Cupons</h2>
          <p className="text-xs text-slate-500 mt-0.5">{selectedEvent.name}</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-all self-start sm:self-auto">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Lotes Ativos", value: activeBatches, icon: <Ticket size={15} />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Ingressos Vendidos", value: totalSold.toLocaleString("pt-BR"), icon: <Users size={15} />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Disponíveis", value: totalAvail.toLocaleString("pt-BR"), icon: <Package size={15} />, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Receita Estimada", value: fmtBRL(totalRevenue), icon: <DollarSign size={15} />, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.color} mb-2`}>{kpi.icon}</div>
            <div className={`text-lg font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${section === s.id ? "bg-slate-800 text-white shadow" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <s.icon size={13} />{s.label}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${section === s.id ? "bg-white/20" : "bg-slate-100 text-slate-400"}`}>{s.count}</span>
          </button>
        ))}
      </div>

      {/* ── BATCHES ────────────────────────────────────────────────────────── */}
      {section === "batches" && (
        <div className="space-y-4">
          <button onClick={() => openBatchForm()} className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow transition-all">
            <Plus size={14} /> Novo Lote
          </button>

          {/* Auto-switch info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
            <Zap size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700">
              <strong>Virada Automática de Lote:</strong> O sistema atualiza automaticamente o status de cada lote com base na data atual e quantidade vendida. Lotes SOLD_OUT ou EXPIRED são encerrados automaticamente.
            </p>
          </div>

          {batches.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <Ticket size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">Nenhum lote cadastrado.</p>
              <p className="text-xs text-slate-400">Crie o primeiro lote para começar a vender ingressos.</p>
            </div>
          )}

          {/* Group by category */}
          {categories.length > 0 ? (
            categories.map(cat => {
              const catBatches = batches.filter(b => b.categoryId === cat.id);
              const uncatBatches = batches.filter(b => !b.categoryId);
              const isOpen = expandedCats.has(cat.id);
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedCats(prev => { const n = new Set(prev); isOpen ? n.delete(cat.id) : n.add(cat.id); return n; })}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                      <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">{cat.type}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{catBatches.length} lote{catBatches.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{cat.soldCount}/{cat.totalCapacity} vendidos</span>
                      {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100">
                      {catBatches.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Nenhum lote nesta categoria.</p>
                      ) : (
                        catBatches.map(batch => <BatchCard key={batch.id} batch={batch} onEdit={() => openBatchForm(batch)} onDelete={() => deleteBatch(batch.id)} onTogglePause={() => toggleBatchPause(batch)} />)
                      )}
                      <div className="p-2 border-t border-slate-50">
                        <button onClick={() => { setBatchForm(f => ({ ...f, categoryId: cat.id })); openBatchForm(); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition-all w-full">
                          <Plus size={11} /> Adicionar lote em {cat.name}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // No categories — show all batches flat
            <div className="space-y-3">
              {batches.map(batch => (
                <BatchCard key={batch.id} batch={batch} onEdit={() => openBatchForm(batch)} onDelete={() => deleteBatch(batch.id)} onTogglePause={() => toggleBatchPause(batch)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CATEGORIES ─────────────────────────────────────────────────────── */}
      {section === "categories" && (
        <div className="space-y-4">
          <button onClick={() => openCatForm()} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition-all">
            <Plus size={14} /> Nova Categoria
          </button>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <Layers size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">Nenhuma categoria cadastrada.</p>
                <p className="text-xs text-slate-400">Categorias permitem separar ingressos por tipo (5km, 10km, VIP, etc.)</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{["Categoria", "Tipo", "Capacidade", "Vendidos", "Disponível", ""].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wide text-[10px]">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categories.map(cat => {
                    const pct = cat.totalCapacity > 0 ? (cat.soldCount / cat.totalCapacity * 100) : 0;
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                            <span className="font-semibold text-slate-700">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">{cat.type}</span></td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700">{cat.totalCapacity.toLocaleString("pt-BR")}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-semibold">{cat.soldCount.toLocaleString("pt-BR")}</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-slate-400">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-emerald-600 font-semibold">{(cat.totalCapacity - cat.soldCount).toLocaleString("pt-BR")}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <button onClick={() => openCatForm(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={12} /></button>
                            <button onClick={() => deleteCat(cat.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── COUPONS ────────────────────────────────────────────────────────── */}
      {section === "coupons" && (
        <div className="space-y-4">
          <button onClick={() => setShowCouponForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow transition-all">
            <Plus size={14} /> Novo Cupom
          </button>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {coupons.length === 0 ? (
              <div className="text-center py-12">
                <Percent size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">Nenhum cupom cadastrado.</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{["Código", "Desconto", "Usos", "Válido até", "Status"].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-slate-400 uppercase tracking-wide text-[10px]">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5"><span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">{c.code}</span></td>
                      <td className="px-3 py-2.5 font-semibold text-purple-600">
                        {c.discountType === "pct" ? `${c.discountValue}%` : fmtBRL(c.discountValue)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-slate-600">{c.usedCount}</span>
                        {c.maxUses && <span className="text-slate-400">/{c.maxUses}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{c.validUntil || "—"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {c.active ? "ATIVO" : "INATIVO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Category Form Modal ─────────────────────────────────────────────── */}
      {showCatForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">{editCat ? "Editar Categoria" : "Nova Categoria"}</h3>
              <button onClick={() => setShowCatForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={saveCat} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nome *</label>
                <input required type="text" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="Ex: Corrida 5km, VIP, Kids..." className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tipo</label>
                  <select value={catForm.type} onChange={e => setCatForm({ ...catForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-indigo-400">
                    {CATEGORY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Cor</label>
                  <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })}
                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Capacidade Total</label>
                <input type="number" min={1} value={catForm.totalCapacity} onChange={e => setCatForm({ ...catForm, totalCapacity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Descrição</label>
                <input type="text" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Descrição opcional" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-indigo-400" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">
                {editCat ? "Salvar" : "Criar Categoria"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Batch Form Modal ────────────────────────────────────────────────── */}
      {showBatchForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-4">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">{editBatch ? "Editar Lote" : "Novo Lote"}</h3>
              <button onClick={() => setShowBatchForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={saveBatch} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nome do Lote *</label>
                <input required type="text" value={batchForm.name} onChange={e => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="Ex: 1º Lote — Early Bird" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
              </div>
              {categories.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Categoria</label>
                  <select value={batchForm.categoryId} onChange={e => setBatchForm({ ...batchForm, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400">
                    <option value="">Sem categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Preço (R$) *</label>
                  <input required type="number" min={0} step="0.01" value={batchForm.price} onChange={e => setBatchForm({ ...batchForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Preço Original (R$)</label>
                  <input type="number" min={0} step="0.01" value={batchForm.originalPrice} onChange={e => setBatchForm({ ...batchForm, originalPrice: Number(e.target.value) })}
                    placeholder="Opcional" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Quantidade *</label>
                  <input required type="number" min={1} value={batchForm.quantity} onChange={e => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
                  <select value={batchForm.status} onChange={e => setBatchForm({ ...batchForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400">
                    {["SCHEDULED", "ACTIVE", "PAUSED", "EXPIRED"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Data Início</label>
                  <input type="date" value={batchForm.startDate} onChange={e => setBatchForm({ ...batchForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Data Fim</label>
                  <input type="date" value={batchForm.endDate} onChange={e => setBatchForm({ ...batchForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Taxa (%)</label>
                  <input type="number" min={0} max={100} value={batchForm.feesPct} onChange={e => setBatchForm({ ...batchForm, feesPct: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Máx/Compra</label>
                  <input type="number" min={1} value={batchForm.maxPerPurchase} onChange={e => setBatchForm({ ...batchForm, maxPerPurchase: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Máx/CPF</label>
                  <input type="number" min={1} value={batchForm.maxPerCpf} onChange={e => setBatchForm({ ...batchForm, maxPerCpf: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Código Promocional</label>
                <input type="text" value={batchForm.promoCode} onChange={e => setBatchForm({ ...batchForm, promoCode: e.target.value.toUpperCase() })}
                  placeholder="Opcional (acesso exclusivo)" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-rose-400 font-mono" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={batchForm.autoNext} onChange={e => setBatchForm({ ...batchForm, autoNext: e.target.checked })}
                  className="rounded" />
                <span className="text-xs font-semibold text-slate-600">Virada automática ao esgotar ou vencer</span>
              </label>
              <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all">
                {editBatch ? "Salvar Alterações" : "Criar Lote"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Coupon Form Modal ───────────────────────────────────────────────── */}
      {showCouponForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">Novo Cupom de Desconto</h3>
              <button onClick={() => setShowCouponForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={saveCoupon} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Código *</label>
                <input required type="text" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: BEMVINDO20" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-purple-400 font-mono uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tipo</label>
                  <select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-purple-400">
                    <option value="pct">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    Valor {couponForm.discountType === "pct" ? "(%)" : "(R$)"}
                  </label>
                  <input required type="number" min={1} value={couponForm.discountValue} onChange={e => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-purple-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Máx. Usos</label>
                  <input type="number" min={1} value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Válido até</label>
                  <input type="date" value={couponForm.validUntil} onChange={e => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-purple-400" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all">
                Criar Cupom
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BatchCard ────────────────────────────────────────────────────────────────

function BatchCard({ batch, onEdit, onDelete, onTogglePause }: {
  key?: React.Key;
  batch: TicketBatch;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  onTogglePause: () => void | Promise<void>;
}) {
  const soldPct = batch.quantity > 0 ? (batch.soldCount / batch.quantity * 100) : 0;
  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors mx-4 mb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{batch.name}</span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              { SCHEDULED: "bg-blue-100 text-blue-700", ACTIVE: "bg-emerald-100 text-emerald-700", SOLD_OUT: "bg-red-100 text-red-700", EXPIRED: "bg-slate-100 text-slate-500", PAUSED: "bg-amber-100 text-amber-700" }[batch.status]
            }`}>
              {{ SCHEDULED: <Clock size={10} />, ACTIVE: <CheckCircle size={10} />, SOLD_OUT: <AlertTriangle size={10} />, EXPIRED: <X size={10} />, PAUSED: <Circle size={10} /> }[batch.status]}
              {batch.status}
            </span>
            {batch.autoNext && <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-semibold">AUTO</span>}
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <span className="text-sm font-black text-slate-900">{fmtBRL(batch.price)}</span>
            {batch.originalPrice && batch.originalPrice > batch.price && (
              <span className="text-xs text-slate-400 line-through">{fmtBRL(batch.originalPrice)}</span>
            )}
            {batch.startDate && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={10} />{batch.startDate}{batch.endDate ? ` → ${batch.endDate}` : ""}</span>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onTogglePause} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title={batch.status === "PAUSED" ? "Reativar" : "Pausar"}>
            {batch.status === "PAUSED" ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
          </button>
          <button onClick={onEdit} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={12} /></button>
          <button onClick={onDelete} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12} /></button>
        </div>
      </div>
      <div className="mt-2.5">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>{batch.soldCount.toLocaleString("pt-BR")} vendidos</span>
          <span>{batch.available.toLocaleString("pt-BR")} disponíveis / {batch.quantity.toLocaleString("pt-BR")} total</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${soldPct >= 90 ? "bg-red-400" : soldPct >= 70 ? "bg-amber-400" : "bg-emerald-400"}`}
            style={{ width: `${Math.min(soldPct, 100)}%` }} />
        </div>
        {batch.promoCode && (
          <p className="text-[10px] text-purple-500 mt-1.5 font-mono">Código: {batch.promoCode}</p>
        )}
      </div>
    </div>
  );
}
