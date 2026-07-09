/**
 * PlanejamentoFinanceiro — Módulo de Planejamento Financeiro de Eventos
 * Fases 6, 7, 8 e 9 do Master Prompt V8.2
 * Receitas · Despesas · Orçamento · Proposta Comercial · Dashboard Financeiro
 */
import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "../authService";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Edit3, Save, X,
  RefreshCw, FileText, Zap, BarChart3, Target, Award, CheckCircle,
  AlertTriangle, Clock, Download, ChevronDown, ChevronRight, Package,
  Layers, Users, ShoppingCart, Megaphone, Shield, Wrench, Music,
  Building2, Shirt, Star, Banknote, Activity, PieChart
} from "lucide-react";
import { Event } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FinancialPlan {
  id: string;
  eventId: string;
  name: string;
  notes?: string;
}

interface Revenue {
  id: string;
  planId: string;
  category: string;
  description?: string;
  estimatedValue: number;
  contractedValue: number;
  receivedValue: number;
  status: string;
  responsible?: string;
  notes?: string;
  createdAt: string;
}

interface Expense {
  id: string;
  planId: string;
  category: string;
  subcategory?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier?: string;
  status: string;
  notes?: string;
  costTemplateId?: string;
  createdAt: string;
}

interface CostTemplate {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  unit: string;
  defaultPrice: number;
  defaultSupplier?: string;
}

interface Props {
  events: Event[];
  selectedEventId: string;
  selectedTenantId: string;
  onRefresh: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = "overview" | "revenues" | "expenses" | "templates" | "proposal";

const REVENUE_CATEGORIES = [
  "Venda de Ingressos", "Patrocínio Master", "Patrocínio Ouro", "Patrocínio Prata",
  "Patrocínio Bronze", "Venda de Praça de Alimentação", "Venda de Bebidas",
  "Venda de Espaços para Expositores", "Venda de Estandes", "Naming Rights",
  "Merchandising", "Camarotes", "Estacionamento", "Inscrições Esportivas",
  "Publicidade", "Streaming", "Licenciamento", "Outros"
];

const EXPENSE_CATEGORIES = [
  "Estrutura", "Sonorização", "Iluminação", "Comunicação Visual",
  "Esportes", "Segurança", "Operação", "Marketing", "Outros"
];

const STATUS_COLORS: Record<string, string> = {
  PREVISTO: "bg-blue-100 text-blue-700",
  CONTRATADO: "bg-amber-100 text-amber-700",
  PAGO: "bg-emerald-100 text-emerald-700",
  CANCELADO: "bg-red-100 text-red-600",
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CAT_ICONS: Record<string, React.ReactNode> = {
  Estrutura: <Building2 size={14} />, Sonorização: <Music size={14} />,
  Iluminação: <Zap size={14} />, "Comunicação Visual": <Megaphone size={14} />,
  Esportes: <Award size={14} />, Segurança: <Shield size={14} />,
  Operação: <Wrench size={14} />, Marketing: <TrendingUp size={14} />,
  Outros: <Package size={14} />
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlanejamentoFinanceiro({ events, selectedEventId, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [templates, setTemplates] = useState<CostTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState("");
  const [proposalLoading, setProposalLoading] = useState(false);

  // Revenue form
  const [showRevForm, setShowRevForm] = useState(false);
  const [editRev, setEditRev] = useState<Revenue | null>(null);
  const [revForm, setRevForm] = useState({ category: REVENUE_CATEGORIES[0], description: "", estimatedValue: 0, contractedValue: 0, receivedValue: 0, status: "PREVISTO", responsible: "" });

  // Expense form
  const [showExpForm, setShowExpForm] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);
  const [expForm, setExpForm] = useState({ category: "Estrutura", subcategory: "", description: "", quantity: 1, unitPrice: 0, supplier: "", status: "PREVISTO", notes: "" });

  // Template form
  const [showTplForm, setShowTplForm] = useState(false);
  const [tplForm, setTplForm] = useState({ name: "", category: "Estrutura", subcategory: "", unit: "unidade", defaultPrice: 0 });

  // Expand categories in expenses
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(EXPENSE_CATEGORIES));

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  const loadPlan = useCallback(async () => {
    if (!selectedEvent?.id) return;
    setLoading(true);
    try {
      const [planRes, tplRes] = await Promise.all([
        authFetch(`/api/events/${selectedEvent.id}/financial-plan`),
        authFetch("/api/cost-templates")
      ]);
      if (planRes.ok) {
        const data = await planRes.json();
        setPlan(data.plan);
        setRevenues(data.revenues || []);
        setExpenses(data.expenses || []);
      }
      if (tplRes.ok) setTemplates(await tplRes.json());
    } finally {
      setLoading(false);
    }
  }, [selectedEvent?.id]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  // ── Revenue handlers ──────────────────────────────────────────────────────

  const openRevForm = (rev?: Revenue) => {
    if (rev) {
      setEditRev(rev);
      setRevForm({ category: rev.category, description: rev.description || "", estimatedValue: rev.estimatedValue, contractedValue: rev.contractedValue, receivedValue: rev.receivedValue, status: rev.status, responsible: rev.responsible || "" });
    } else {
      setEditRev(null);
      setRevForm({ category: REVENUE_CATEGORIES[0], description: "", estimatedValue: 0, contractedValue: 0, receivedValue: 0, status: "PREVISTO", responsible: "" });
    }
    setShowRevForm(true);
  };

  const saveRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editRev
      ? `/api/events/${selectedEvent!.id}/financial-plan/revenues/${editRev.id}`
      : `/api/events/${selectedEvent!.id}/financial-plan/revenues`;
    const res = await authFetch(url, {
      method: editRev ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(revForm)
    });
    if (res.ok) { setShowRevForm(false); loadPlan(); }
  };

  const deleteRevenue = async (id: string) => {
    if (!confirm("Remover esta receita?")) return;
    await authFetch(`/api/events/${selectedEvent!.id}/financial-plan/revenues/${id}`, { method: "DELETE" });
    loadPlan();
  };

  // ── Expense handlers ──────────────────────────────────────────────────────

  const openExpForm = (exp?: Expense) => {
    if (exp) {
      setEditExp(exp);
      setExpForm({ category: exp.category, subcategory: exp.subcategory || "", description: exp.description, quantity: exp.quantity, unitPrice: exp.unitPrice, supplier: exp.supplier || "", status: exp.status, notes: exp.notes || "" });
    } else {
      setEditExp(null);
      setExpForm({ category: "Estrutura", subcategory: "", description: "", quantity: 1, unitPrice: 0, supplier: "", status: "PREVISTO", notes: "" });
    }
    setShowExpForm(true);
  };

  const applyTemplate = (tpl: CostTemplate) => {
    setExpForm(f => ({ ...f, description: tpl.name, category: tpl.category, subcategory: tpl.subcategory || "", unitPrice: tpl.defaultPrice, supplier: tpl.defaultSupplier || "" }));
  };

  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editExp
      ? `/api/events/${selectedEvent!.id}/financial-plan/expenses/${editExp.id}`
      : `/api/events/${selectedEvent!.id}/financial-plan/expenses`;
    const res = await authFetch(url, {
      method: editExp ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expForm)
    });
    if (res.ok) { setShowExpForm(false); loadPlan(); }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Remover esta despesa?")) return;
    await authFetch(`/api/events/${selectedEvent!.id}/financial-plan/expenses/${id}`, { method: "DELETE" });
    loadPlan();
  };

  // ── Template handlers ─────────────────────────────────────────────────────

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch("/api/cost-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tplForm)
    });
    if (res.ok) { setShowTplForm(false); loadPlan(); }
  };

  // ── Financial calculations ─────────────────────────────────────────────────

  const totalRevEstimado = revenues.reduce((s, r) => s + r.estimatedValue, 0);
  const totalRevContratado = revenues.reduce((s, r) => s + r.contractedValue, 0);
  const totalRevRecebido = revenues.reduce((s, r) => s + r.receivedValue, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.totalPrice, 0);
  const lucroEstimado = totalRevEstimado - totalExpenses;
  const margem = totalRevEstimado > 0 ? (lucroEstimado / totalRevEstimado * 100) : 0;
  const ticketPrice = selectedEvent ? (selectedEvent as any).ticketPrice || 150 : 150;
  const breakEven = totalExpenses > 0 && ticketPrice > 0
    ? Math.ceil(totalExpenses / ticketPrice) : 0;
  const roi = totalExpenses > 0 ? ((lucroEstimado / totalExpenses) * 100) : 0;
  const realization = totalRevEstimado > 0 ? (totalRevRecebido / totalRevEstimado * 100) : 0;

  // Group expenses by category
  const expByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat);
    return acc;
  }, {} as Record<string, Expense[]>);

  // ── Generate proposal ─────────────────────────────────────────────────────

  const generateProposal = async () => {
    if (!selectedEvent) return;
    setProposalLoading(true);
    setTab("proposal");
    try {
      const res = await authFetch(`/api/events/${selectedEvent.id}/proposal`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setProposal(data.proposal || "");
      } else {
        const err = await res.json();
        setProposal(`❌ Erro: ${err.error}`);
      }
    } finally {
      setProposalLoading(false);
    }
  };

  // ── No event selected ─────────────────────────────────────────────────────

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="text-center">
          <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
          <p>Selecione um evento para acessar o planejamento financeiro.</p>
        </div>
      </div>
    );
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Visão Geral", icon: <BarChart3 size={14} /> },
    { id: "revenues", label: `Receitas (${revenues.length})`, icon: <TrendingUp size={14} /> },
    { id: "expenses", label: `Despesas (${expenses.length})`, icon: <TrendingDown size={14} /> },
    { id: "templates", label: "Banco de Custos", icon: <Package size={14} /> },
    { id: "proposal", label: "Proposta Comercial", icon: <FileText size={14} /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Planejamento Financeiro</h2>
          <p className="text-xs text-slate-500 mt-0.5">{selectedEvent.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPlan} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-all">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
          <button onClick={generateProposal} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow transition-all">
            <Zap size={13} /> Gerar Proposta IA
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Receita Estimada", value: fmtBRL(totalRevEstimado), sub: `${fmtBRL(totalRevRecebido)} recebido`, icon: <TrendingUp size={16} />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Despesas Previstas", value: fmtBRL(totalExpenses), sub: `${expenses.length} itens`, icon: <TrendingDown size={16} />, color: "text-red-500", bg: "bg-red-50" },
          { label: "Resultado Estimado", value: fmtBRL(lucroEstimado), sub: `Margem ${margem.toFixed(1)}%`, icon: <DollarSign size={16} />, color: lucroEstimado >= 0 ? "text-blue-600" : "text-red-600", bg: lucroEstimado >= 0 ? "bg-blue-50" : "bg-red-50" },
          { label: "ROI Estimado", value: `${roi.toFixed(1)}%`, sub: `Break-even: ${breakEven.toLocaleString()} ingressos`, icon: <Target size={16} />, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.color} mb-2`}>
              {kpi.icon}
            </div>
            <div className={`text-lg font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{kpi.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalRevEstimado > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
            <span>Realização Financeira</span>
            <span>{realization.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(realization, 100)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Recebido: {fmtBRL(totalRevRecebido)}</span>
            <span>Meta: {fmtBRL(totalRevEstimado)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === t.id ? "bg-slate-800 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ──────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Revenue breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5"><TrendingUp size={13} className="text-emerald-500" />Receitas por Categoria</h3>
            <div className="space-y-2">
              {REVENUE_CATEGORIES.filter(cat => revenues.some(r => r.category === cat)).map(cat => {
                const catRevs = revenues.filter(r => r.category === cat);
                const total = catRevs.reduce((s, r) => s + r.estimatedValue, 0);
                const pct = totalRevEstimado > 0 ? (total / totalRevEstimado * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 truncate max-w-[60%]">{cat}</span>
                      <span className="font-semibold text-slate-800">{fmtBRL(total)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {revenues.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhuma receita cadastrada</p>}
            </div>
          </div>
          {/* Expense breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5"><TrendingDown size={13} className="text-red-400" />Despesas por Categoria</h3>
            <div className="space-y-2">
              {EXPENSE_CATEGORIES.filter(cat => expenses.some(e => e.category === cat)).map(cat => {
                const catExps = expenses.filter(e => e.category === cat);
                const total = catExps.reduce((s, e) => s + e.totalPrice, 0);
                const pct = totalExpenses > 0 ? (total / totalExpenses * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 flex items-center gap-1">{CAT_ICONS[cat]}{cat}</span>
                      <span className="font-semibold text-slate-800">{fmtBRL(total)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {expenses.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhuma despesa cadastrada</p>}
            </div>
          </div>
          {/* Financial summary */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm md:col-span-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Activity size={13} className="text-blue-500" />DRE Simplificado</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Receita Bruta Estimada", value: totalRevEstimado, color: "text-emerald-600" },
                { label: "(-) Despesas Totais", value: -totalExpenses, color: "text-red-500" },
                { label: "= Resultado Operacional", value: lucroEstimado, color: lucroEstimado >= 0 ? "text-blue-600" : "text-red-600", bold: true },
                { label: "Receita Contratada", value: totalRevContratado, color: "text-amber-600" },
                { label: "Receita Realizada", value: totalRevRecebido, color: "text-teal-600" },
                { label: "Margem Operacional", value: null, label2: `${margem.toFixed(1)}%`, color: margem >= 0 ? "text-purple-600" : "text-red-600", bold: true },
              ].map((item, i) => (
                <div key={i} className={`p-3 bg-slate-50 rounded-xl ${item.bold ? "ring-1 ring-blue-200" : ""}`}>
                  <div className={`text-sm font-black ${item.color}`}>
                    {item.value !== null ? fmtBRL(item.value) : item.label2}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
            {breakEven > 0 && (
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                <Target size={14} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Ponto de Equilíbrio:</strong> {breakEven.toLocaleString("pt-BR")} ingressos a R$ {ticketPrice.toFixed(2)} são necessários para cobrir todas as despesas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Revenues ──────────────────────────────────────────────────── */}
      {tab === "revenues" && (
        <div className="space-y-4">
          <button onClick={() => openRevForm()} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-all">
            <Plus size={14} /> Nova Receita Prevista
          </button>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Categoria", "Descrição", "Estimado", "Contratado", "Recebido", "Status", ""].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {revenues.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-slate-700 max-w-[140px]"><span className="truncate block">{r.category}</span></td>
                    <td className="px-3 py-2.5 text-slate-500">{r.description || "—"}</td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-600">{fmtBRL(r.estimatedValue)}</td>
                    <td className="px-3 py-2.5 text-amber-600">{fmtBRL(r.contractedValue)}</td>
                    <td className="px-3 py-2.5 text-teal-600">{fmtBRL(r.receivedValue)}</td>
                    <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"}`}>{r.status}</span></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => openRevForm(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={12} /></button>
                        <button onClick={() => deleteRevenue(r.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {revenues.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400">Nenhuma receita cadastrada. Adicione as receitas previstas para o evento.</td></tr>
                )}
              </tbody>
              {revenues.length > 0 && (
                <tfoot className="bg-emerald-50 border-t border-emerald-100">
                  <tr>
                    <td colSpan={2} className="px-3 py-2.5 font-bold text-emerald-700 text-xs uppercase">Total</td>
                    <td className="px-3 py-2.5 font-black text-emerald-700">{fmtBRL(totalRevEstimado)}</td>
                    <td className="px-3 py-2.5 font-black text-amber-700">{fmtBRL(totalRevContratado)}</td>
                    <td className="px-3 py-2.5 font-black text-teal-700">{fmtBRL(totalRevRecebido)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Expenses ──────────────────────────────────────────────────── */}
      {tab === "expenses" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => openExpForm()} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xs font-bold shadow transition-all">
              <Plus size={14} /> Nova Despesa
            </button>
            <button onClick={() => { setTab("templates"); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all">
              <Package size={14} /> Usar Banco de Custos
            </button>
          </div>
          {EXPENSE_CATEGORIES.map(cat => {
            const catExps = expByCategory[cat];
            if (catExps.length === 0) return null;
            const catTotal = catExps.reduce((s, e) => s + e.totalPrice, 0);
            const open = expandedCats.has(cat);
            return (
              <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setExpandedCats(prev => {
                      const n = new Set(prev);
                      open ? n.delete(cat) : n.add(cat);
                      return n;
                    });
                  }}>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{CAT_ICONS[cat]}</span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cat}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{catExps.length} item{catExps.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-red-500">{fmtBRL(catTotal)}</span>
                    {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </div>
                </button>
                {open && (
                  <table className="w-full text-xs border-t border-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Descrição", "Subcategoria", "Qtd", "Valor Unit.", "Total", "Fornecedor", "Status", ""].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-bold text-slate-400 uppercase tracking-wide text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {catExps.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-semibold text-slate-700">{exp.description}</td>
                          <td className="px-3 py-2.5 text-slate-400">{exp.subcategory || "—"}</td>
                          <td className="px-3 py-2.5 text-slate-600">{exp.quantity.toLocaleString("pt-BR")}</td>
                          <td className="px-3 py-2.5 text-slate-600">{fmtBRL(exp.unitPrice)}</td>
                          <td className="px-3 py-2.5 font-bold text-red-500">{fmtBRL(exp.totalPrice)}</td>
                          <td className="px-3 py-2.5 text-slate-400">{exp.supplier || "—"}</td>
                          <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[exp.status] || "bg-slate-100 text-slate-600"}`}>{exp.status}</span></td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <button onClick={() => openExpForm(exp)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={12} /></button>
                              <button onClick={() => deleteExpense(exp.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
          {expenses.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <TrendingDown size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma despesa cadastrada.</p>
              <p className="text-xs">Use o Banco de Custos para adicionar itens rápido.</p>
            </div>
          )}
          {expenses.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Total Geral de Despesas</span>
              <span className="text-xl font-black text-red-600">{fmtBRL(totalExpenses)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Cost Templates ────────────────────────────────────────────── */}
      {tab === "templates" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setShowTplForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow transition-all">
              <Plus size={14} /> Novo Item no Banco
            </button>
          </div>
          {EXPENSE_CATEGORIES.map(cat => {
            const catTpls = templates.filter(t => t.category === cat);
            if (catTpls.length === 0) return null;
            return (
              <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <span className="text-slate-400">{CAT_ICONS[cat]}</span>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{cat}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {catTpls.map(tpl => (
                    <div key={tpl.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{tpl.name}</p>
                        <p className="text-[10px] text-slate-400">{tpl.subcategory} • {tpl.unit}{tpl.defaultSupplier ? ` • ${tpl.defaultSupplier}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{fmtBRL(tpl.defaultPrice)}/{tpl.unit}</span>
                        <button onClick={() => { applyTemplate(tpl); setTab("expenses"); setShowExpForm(true); }}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition-all">
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: Commercial Proposal ───────────────────────────────────────── */}
      {tab === "proposal" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={generateProposal} disabled={proposalLoading} className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all">
              <Zap size={14} className={proposalLoading ? "animate-spin" : ""} />
              {proposalLoading ? "Gerando com IA..." : "Regenerar Proposta"}
            </button>
            {proposal && (
              <button onClick={() => { const blob = new Blob([proposal], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `proposta-${selectedEvent.name}.txt`; a.click(); }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all">
                <Download size={14} /> Baixar
              </button>
            )}
          </div>
          {proposalLoading && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Zap size={32} className="mx-auto mb-3 text-amber-400 animate-pulse" />
              <p className="text-sm text-slate-600 font-semibold">Gerando proposta comercial com IA Gemini...</p>
              <p className="text-xs text-slate-400 mt-1">Isso pode levar alguns segundos.</p>
            </div>
          )}
          {!proposalLoading && proposal && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Proposta Comercial — {selectedEvent.name}</h3>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-mono">{proposal}</div>
            </div>
          )}
          {!proposalLoading && !proposal && (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <FileText size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">Clique em "Gerar Proposta IA" para criar automaticamente uma proposta comercial completa para este evento.</p>
              <p className="text-xs text-slate-400 mt-1">A proposta incluirá escopo, cronograma, financeiro, ROI e condições comerciais.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Revenue Form Modal ────────────────────────────────────────────── */}
      {showRevForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">{editRev ? "Editar Receita" : "Nova Receita"}</h3>
              <button onClick={() => setShowRevForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={saveRevenue} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Categoria *</label>
                <select required value={revForm.category} onChange={e => setRevForm({ ...revForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-emerald-400">
                  {REVENUE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Descrição</label>
                <input type="text" value={revForm.description} onChange={e => setRevForm({ ...revForm, description: e.target.value })}
                  placeholder="Ex: Patrocínio Banco Brasil" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-emerald-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Estimado (R$)", key: "estimatedValue" as const },
                  { label: "Contratado (R$)", key: "contractedValue" as const },
                  { label: "Recebido (R$)", key: "receivedValue" as const },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-slate-500 block mb-1">{f.label}</label>
                    <input type="number" min={0} step="0.01" value={revForm[f.key]}
                      onChange={e => setRevForm({ ...revForm, [f.key]: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-emerald-400" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
                  <select value={revForm.status} onChange={e => setRevForm({ ...revForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-emerald-400">
                    {["PREVISTO", "CONTRATADO", "PAGO", "CANCELADO"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Responsável</label>
                  <input type="text" value={revForm.responsible} onChange={e => setRevForm({ ...revForm, responsible: e.target.value })}
                    placeholder="Nome" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-emerald-400" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all">
                {editRev ? "Salvar Alterações" : "Adicionar Receita"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Expense Form Modal ─────────────────────────────────────────────── */}
      {showExpForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">{editExp ? "Editar Despesa" : "Nova Despesa"}</h3>
              <button onClick={() => setShowExpForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={saveExpense} className="p-5 space-y-3">
              {!editExp && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Usar do Banco de Custos</p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {templates.filter(t => t.category === expForm.category).map(tpl => (
                      <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                        className="text-[10px] bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg px-2 py-1 text-slate-600 transition-all">
                        {tpl.name} ({fmtBRL(tpl.defaultPrice)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Categoria *</label>
                  <select required value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-red-400">
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Subcategoria</label>
                  <input type="text" value={expForm.subcategory} onChange={e => setExpForm({ ...expForm, subcategory: e.target.value })}
                    placeholder="Ex: Palco" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-red-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Descrição *</label>
                <input type="text" required value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                  placeholder="Ex: Palco principal 12x8m" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-red-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Quantidade</label>
                  <input type="number" min={1} value={expForm.quantity} onChange={e => setExpForm({ ...expForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Valor Unit. (R$)</label>
                  <input type="number" min={0} step="0.01" value={expForm.unitPrice} onChange={e => setExpForm({ ...expForm, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Total</label>
                  <div className="w-full bg-red-50 border border-red-100 rounded-xl text-xs p-2.5 font-bold text-red-600">
                    {fmtBRL(expForm.quantity * expForm.unitPrice)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Fornecedor</label>
                  <input type="text" value={expForm.supplier} onChange={e => setExpForm({ ...expForm, supplier: e.target.value })}
                    placeholder="Nome do fornecedor" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
                  <select value={expForm.status} onChange={e => setExpForm({ ...expForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-red-400">
                    {["PREVISTO", "CONTRATADO", "PAGO", "CANCELADO"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xs font-bold transition-all">
                {editExp ? "Salvar Alterações" : "Adicionar Despesa"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Template Form Modal ───────────────────────────────────────────── */}
      {showTplForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">Novo Item — Banco de Custos</h3>
              <button onClick={() => setShowTplForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={saveTemplate} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nome *</label>
                <input required type="text" value={tplForm.name} onChange={e => setTplForm({ ...tplForm, name: e.target.value })}
                  placeholder="Ex: Chip de Cronometragem" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Categoria *</label>
                  <select required value={tplForm.category} onChange={e => setTplForm({ ...tplForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-slate-400">
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Subcategoria</label>
                  <input type="text" value={tplForm.subcategory} onChange={e => setTplForm({ ...tplForm, subcategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-slate-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Unidade</label>
                  <input type="text" value={tplForm.unit} onChange={e => setTplForm({ ...tplForm, unit: e.target.value })}
                    placeholder="unidade, diária, m²..." className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Preço Padrão (R$)</label>
                  <input type="number" min={0} step="0.01" value={tplForm.defaultPrice} onChange={e => setTplForm({ ...tplForm, defaultPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 outline-none focus:border-slate-400" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">
                Salvar no Banco de Custos
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
