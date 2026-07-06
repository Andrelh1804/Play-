/**
 * DashboardExecutivo — Enterprise KPI Dashboard
 * Rebuilt per audit spec: KPIs, charts, ranking, funnel, AI insights.
 */

import React, { useMemo, useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Ticket, CheckSquare,
  Calendar, AlertTriangle, Sparkles, ChevronRight, BarChart2,
  ArrowUp, ArrowDown, Target, Activity, Award, ShoppingCart,
  PieChart, Layers, UserCheck, Briefcase, RefreshCw, Download
} from "lucide-react";
import {
  Event, FinanceTransaction, CRMLead, StaffMember, MarketingCampaign,
  DocumentContract, Ticket as TicketSchema, Sponsorship,
  Tenant, TransactionType, TransactionStatus, PipelineStage, EventStatus
} from "../types";

interface Props {
  events: Event[];
  filteredEvents: Event[];
  filteredFinance: FinanceTransaction[];
  filteredLeads: CRMLead[];
  filteredStaff: StaffMember[];
  filteredCampaigns: MarketingCampaign[];
  filteredContracts: DocumentContract[];
  tickets: TicketSchema[];
  sponsorships: Sponsorship[];
  selectedTenantId: string;
  activeTenant: Tenant | undefined;
  selectedRole: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  finance: FinanceTransaction[];
  setActiveTab: (tab: string) => void;
  handleSendAiMessage: (msg: string) => void;
  onRefresh: () => void;
}

// Simple bar chart (CSS)
function BarChart({ data, colorClass = "bg-violet-500" }: {
  data: { label: string; value: number; color?: string }[];
  colorClass?: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-[10px] font-semibold mb-0.5">
            <span className="text-slate-600 truncate max-w-[120px]">{d.label}</span>
            <span className="text-slate-800 font-bold">
              {typeof d.value === "number" && d.value > 999
                ? `R$ ${(d.value / 1000).toFixed(1)}k`
                : d.value}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${d.color || colorClass}`}
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// SVG Sparkline
function Sparkline({ values, color = "#6366f1" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 120, h = 36;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(" L ")}`;
  const areaD = `M ${pts[0]} L ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sg-${color.replace("#", "")})`} />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// SVG Mini Donut
function DonutChart({ segments, size = 56 }: {
  segments: { value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = 20, cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="overflow-visible" style={{ width: size, height: size }}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = circumference * pct;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// KPI Card
function KpiCard({
  label, value, sub, trend, trendUp, icon, accent = "violet", sparkValues
}: {
  label: string; value: string; sub?: string; trend?: string;
  trendUp?: boolean; icon: React.ReactNode; accent?: string; sparkValues?: number[];
}) {
  const accentMap: Record<string, { bg: string; text: string; border: string; spark: string }> = {
    violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", spark: "#7c3aed" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", spark: "#059669" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", spark: "#2563eb" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", spark: "#d97706" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", spark: "#dc2626" },
    slate: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100", spark: "#475569" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", spark: "#4338ca" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", spark: "#e11d48" },
  };
  const a = accentMap[accent] || accentMap.violet;
  return (
    <div className={`bg-white rounded-2xl border ${a.border} p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`w-8 h-8 rounded-xl ${a.bg} flex items-center justify-center ${a.text} shrink-0`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          }`}>
            {trendUp ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
        <div className="text-xl font-black text-slate-900 mt-0.5 leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
      {sparkValues && sparkValues.length >= 2 && (
        <div className="-mx-1 mt-1">
          <Sparkline values={sparkValues} color={a.spark} />
        </div>
      )}
    </div>
  );
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function DashboardExecutivo({
  events, filteredEvents, filteredFinance, filteredLeads, filteredStaff,
  filteredCampaigns, filteredContracts, tickets, sponsorships,
  selectedTenantId, activeTenant, selectedRole,
  totalIncome, totalExpense, netBalance,
  finance, setActiveTab, handleSendAiMessage, onRefresh
}: Props) {

  const [kpiPage, setKpiPage] = useState(0);

  const kpis = useMemo(() => {
    const tenantTickets = tickets.filter(t => t.tenantId === selectedTenantId);
    const checkedIn = tenantTickets.filter(t => t.checkedIn).length;
    const totalTicketsSold = tenantTickets.length;
    const ticketMedio = totalTicketsSold > 0 ? totalIncome / totalTicketsSold : 0;
    const taxaConversao = totalTicketsSold > 0 ? (checkedIn / totalTicketsSold) * 100 : 0;
    const taxaOcupacao = filteredEvents.reduce((s, e) => s + e.capacity, 0) > 0
      ? (totalTicketsSold / filteredEvents.reduce((s, e) => s + e.capacity, 0)) * 100
      : 0;

    const activeEvts = filteredEvents.filter(e => e.status === EventStatus.ACTIVE).length;
    const completedEvts = filteredEvents.filter(e => e.status === EventStatus.COMPLETED).length;
    const cancelledEvts = filteredEvents.filter(e => e.status === EventStatus.CANCELLED).length;

    const leadsGerados = filteredLeads.length;
    const leadsConvertidos = filteredLeads.filter(l => l.pipelineStage === PipelineStage.WON).length;
    const taxaConversaoLeads = leadsGerados > 0 ? (leadsConvertidos / leadsGerados) * 100 : 0;

    const contasReceber = filteredFinance
      .filter(f => f.type === TransactionType.INCOME && f.status === TransactionStatus.PENDING)
      .reduce((s, f) => s + f.amount, 0);
    const contasPagar = filteredFinance
      .filter(f => f.type === TransactionType.EXPENSE && f.status === TransactionStatus.PENDING)
      .reduce((s, f) => s + f.amount, 0);

    const roi = totalExpense > 0 ? ((netBalance) / totalExpense) * 100 : 0;
    const ltv = ticketMedio * 2.8;
    const cac = leadsConvertidos > 0
      ? filteredCampaigns.reduce((s, c) => s + (c.sentCount * 0.05), 0) / leadsConvertidos
      : 0;

    const sponsorReceita = sponsorships
      .filter(s => filteredEvents.some(e => e.id === s.eventId))
      .reduce((s, sp) => s + sp.value, 0);

    const totalCapacity = filteredEvents.reduce((s, e) => s + e.capacity, 0);

    // Month trend (last 6 months)
    const now = new Date();
    const monthlyIncome = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const total = filteredFinance
        .filter(f => {
          const fd = new Date(f.date);
          return f.type === TransactionType.INCOME
            && fd.getMonth() === d.getMonth()
            && fd.getFullYear() === d.getFullYear();
        })
        .reduce((s, f) => s + f.amount, 0);
      return { label: MONTHS[d.getMonth()], value: total };
    });

    return {
      totalIncome, totalExpense, netBalance, roi, ticketMedio, taxaConversao,
      taxaOcupacao, totalTicketsSold, checkedIn, checkedInPending: totalTicketsSold - checkedIn,
      activeEvts, completedEvts, cancelledEvts,
      leadsGerados, leadsConvertidos, taxaConversaoLeads,
      contasReceber, contasPagar, ltv, cac, sponsorReceita,
      totalCapacity, staffOnline: filteredStaff.filter(s => s.checkInStatus === "online").length,
      monthlyIncome,
      campaignsSent: filteredCampaigns.filter(c => c.status === "SENT").length,
      avgCampaignConversion: filteredCampaigns.length > 0
        ? filteredCampaigns.reduce((s, c) => s + c.conversionRate, 0) / filteredCampaigns.length
        : 0,
    };
  }, [filteredEvents, filteredFinance, filteredLeads, filteredStaff, filteredCampaigns,
      tickets, sponsorships, selectedTenantId, totalIncome, totalExpense, netBalance]);

  // Revenue by category (top 5)
  const revenueByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredFinance.filter(f => f.type === TransactionType.INCOME).forEach(f => {
      map[f.category] = (map[f.category] || 0) + f.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  }, [filteredFinance]);

  // Revenue by event (top 5)
  const revenueByEvent = useMemo(() => {
    return filteredEvents
      .map(ev => ({
        label: ev.name.length > 22 ? ev.name.slice(0, 22) + "…" : ev.name,
        value: filteredFinance
          .filter(f => f.eventId === ev.id && f.type === TransactionType.INCOME)
          .reduce((s, f) => s + f.amount, 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredEvents, filteredFinance]);

  // Ticket type distribution
  const ticketDist = useMemo(() => {
    const tenantTickets = tickets.filter(t => t.tenantId === selectedTenantId);
    const map: Record<string, number> = {};
    tenantTickets.forEach(t => { map[t.type] = (map[t.type] || 0) + 1; });
    const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];
    return Object.entries(map).map(([label, value], i) => ({
      label, value, color: colors[i % colors.length]
    }));
  }, [tickets, selectedTenantId]);

  // CRM funnel stages
  const crmFunnel = useMemo(() => {
    const stages = [
      { key: PipelineStage.LEAD, label: "Lead", color: "bg-slate-400" },
      { key: PipelineStage.CONTACTED, label: "Contatado", color: "bg-blue-400" },
      { key: PipelineStage.PROPOSAL, label: "Proposta", color: "bg-violet-400" },
      { key: PipelineStage.NEGOTIATION, label: "Negociação", color: "bg-amber-400" },
      { key: PipelineStage.WON, label: "Ganho", color: "bg-emerald-500" },
    ];
    const total = filteredLeads.length || 1;
    return stages.map(s => ({
      ...s,
      count: filteredLeads.filter(l => l.pipelineStage === s.key).length,
      value: filteredLeads.filter(l => l.pipelineStage === s.key).reduce((s, l) => s + l.value, 0),
      pct: (filteredLeads.filter(l => l.pipelineStage === s.key).length / total) * 100,
    }));
  }, [filteredLeads]);

  const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmtShort = (n: number) => n >= 1_000_000 ? `R$ ${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `R$ ${(n / 1000).toFixed(1)}k` : `R$ ${n.toFixed(0)}`;
  const pct = (n: number) => `${n.toFixed(1)}%`;

  const sparkMonths = kpis.monthlyIncome.map(m => m.value);

  return (
    <div className="space-y-6">

      {/* ── WELCOME BANNER ── */}
      <div className="bg-gradient-to-r from-[#0c1220] via-indigo-950 to-[#0c1220] p-5 rounded-2xl text-white border border-indigo-900/60 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] uppercase font-mono tracking-widest rounded-full font-bold">{selectedRole}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400">MFA Autenticado</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">Painel Executivo — {activeTenant?.name || "Enterprise"}</h2>
            <p className="text-xs text-indigo-300 mt-0.5">Indicadores em tempo real · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-all"
            >
              <RefreshCw size={13} /> Atualizar
            </button>
            <button
              onClick={() => {
                const csv = [
                  "KPI,Valor",
                  `Receita Total,${kpis.totalIncome}`,
                  `Despesas,${kpis.totalExpense}`,
                  `Saldo Líquido,${kpis.netBalance}`,
                  `ROI,${kpis.roi.toFixed(1)}%`,
                  `Ingressos Vendidos,${kpis.totalTicketsSold}`,
                  `Check-ins,${kpis.checkedIn}`,
                  `Taxa de Conversão,${kpis.taxaConversao.toFixed(1)}%`,
                  `Ticket Médio,${kpis.ticketMedio.toFixed(2)}`,
                  `Leads Gerados,${kpis.leadsGerados}`,
                  `Leads Convertidos,${kpis.leadsConvertidos}`,
                  `CAC,${kpis.cac.toFixed(2)}`,
                  `LTV,${kpis.ltv.toFixed(2)}`,
                  `Contas a Receber,${kpis.contasReceber}`,
                  `Contas a Pagar,${kpis.contasPagar}`,
                ].join("\n");
                const url = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
                const a = document.createElement("a"); a.href = url;
                a.download = "kpis-executivos.csv"; a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-bold transition-all"
            >
              <Download size={13} /> Exportar KPIs
            </button>
          </div>
        </div>
      </div>

      {/* ── PRIMARY KPI GRID (8 cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3">
        <KpiCard
          label="Receita Total" value={fmtShort(kpis.totalIncome)}
          sub={`${filteredFinance.filter(f => f.type === TransactionType.INCOME && f.status === TransactionStatus.PAID).length} transações`}
          trend="+12%" trendUp icon={<DollarSign size={16} />} accent="emerald"
          sparkValues={sparkMonths}
        />
        <KpiCard
          label="Saldo Líquido (ERP)" value={fmtShort(kpis.netBalance)}
          sub={`Despesas: ${fmtShort(kpis.totalExpense)}`}
          trend={kpis.netBalance >= 0 ? "+saudável" : "negativo"} trendUp={kpis.netBalance >= 0}
          icon={<TrendingUp size={16} />} accent={kpis.netBalance >= 0 ? "violet" : "red"}
        />
        <KpiCard
          label="ROI do Período" value={pct(kpis.roi)}
          sub="Retorno sobre despesas" trend={kpis.roi >= 10 ? "+bom" : "baixo"} trendUp={kpis.roi >= 10}
          icon={<Target size={16} />} accent="indigo"
        />
        <KpiCard
          label="Ticket Médio" value={fmtShort(kpis.ticketMedio)}
          sub={`${kpis.totalTicketsSold} ingressos vendidos`}
          icon={<Ticket size={16} />} accent="amber"
        />
        <KpiCard
          label="Taxa de Conversão" value={pct(kpis.taxaConversao)}
          sub={`${kpis.checkedIn} check-ins realizados`}
          trend={kpis.taxaConversao >= 60 ? "+ótima" : "abaixo"} trendUp={kpis.taxaConversao >= 60}
          icon={<CheckSquare size={16} />} accent="blue"
        />
        <KpiCard
          label="LTV Estimado" value={fmtShort(kpis.ltv)}
          sub="Lifetime Value / cliente" icon={<Award size={16} />} accent="violet"
        />
        <KpiCard
          label="Contas a Receber" value={fmtShort(kpis.contasReceber)}
          sub="Receita pendente" icon={<ShoppingCart size={16} />} accent="emerald"
        />
        <KpiCard
          label="Contas a Pagar" value={fmtShort(kpis.contasPagar)}
          sub="Despesas pendentes" icon={<AlertTriangle size={16} />} accent="amber"
        />
      </div>

      {/* ── SECONDARY KPI GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Eventos Ativos", value: kpis.activeEvts, icon: <Activity size={14} />, accent: "emerald" },
          { label: "Eventos Concluídos", value: kpis.completedEvts, icon: <CheckSquare size={14} />, accent: "blue" },
          { label: "Eventos Cancelados", value: kpis.cancelledEvts, icon: <AlertTriangle size={14} />, accent: "red" },
          { label: "Leads Gerados", value: kpis.leadsGerados, icon: <Users size={14} />, accent: "violet" },
          { label: "Leads Convertidos", value: kpis.leadsConvertidos, icon: <TrendingUp size={14} />, accent: "emerald" },
          { label: "Staff em Campo", value: kpis.staffOnline, icon: <UserCheck size={14} />, accent: "indigo" },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{k.label}</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Tendência de Receita (6 meses)</h3>
              <p className="text-[10px] text-slate-400">Receita bruta por mês — Tenant ativo</p>
            </div>
            <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">
              {fmtShort(kpis.totalIncome)} total
            </span>
          </div>

          {/* Month bar chart */}
          <div className="flex items-end gap-2 h-28 mt-2">
            {kpis.monthlyIncome.map((m, i) => {
              const maxV = Math.max(...kpis.monthlyIncome.map(x => x.value), 1);
              const h = Math.max(4, (m.value / maxV) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all duration-500 hover:from-violet-500 hover:to-violet-300 cursor-default"
                    style={{ height: `${h}%` }}
                    title={`${m.label}: ${fmt(m.value)}`}
                  />
                  <span className="text-[9px] text-slate-400 font-semibold">{m.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Receita</div>
              <div className="text-sm font-black text-emerald-600">{fmtShort(kpis.totalIncome)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Despesas</div>
              <div className="text-sm font-black text-red-600">{fmtShort(kpis.totalExpense)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Margem</div>
              <div className={`text-sm font-black ${kpis.netBalance >= 0 ? "text-violet-600" : "text-red-600"}`}>
                {kpis.totalIncome > 0 ? pct((kpis.netBalance / kpis.totalIncome) * 100) : "–"}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Distribution + Check-in */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-slate-800 mb-1">Distribuição de Ingressos</h3>
          <p className="text-[10px] text-slate-400 mb-4">{kpis.totalTicketsSold} ingressos emitidos</p>

          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <DonutChart
                segments={
                  ticketDist.length > 0
                    ? ticketDist.map(d => ({ value: d.value, color: d.color }))
                    : [{ value: 1, color: "#e2e8f0" }]
                }
                size={80}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-slate-700">{kpis.totalTicketsSold}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 flex-1">
            {ticketDist.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600 font-medium">{d.label}</span>
                </div>
                <span className="font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Check-in</div>
              <div className="text-base font-black text-emerald-600">{kpis.checkedIn}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Pendentes</div>
              <div className="text-base font-black text-amber-600">{kpis.checkedInPending}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Taxa</div>
              <div className="text-base font-black text-violet-600">{pct(kpis.taxaConversao)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RANKING + FUNNEL + AI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue by Event Ranking */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Ranking de Eventos</h3>
            <button
              onClick={() => setActiveTab("events")}
              className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5"
            >
              Ver todos <ChevronRight size={11} />
            </button>
          </div>
          {revenueByEvent.length > 0 ? (
            <BarChart data={revenueByEvent} colorClass="bg-violet-500" />
          ) : (
            <p className="text-xs text-slate-400 italic">Nenhuma receita por evento disponível.</p>
          )}
        </div>

        {/* CRM Sales Funnel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Funil Comercial</h3>
            <button
              onClick={() => setActiveTab("crm")}
              className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5"
            >
              CRM <ChevronRight size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {crmFunnel.map((stage, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] font-semibold mb-0.5">
                  <span className="text-slate-600">{stage.label}</span>
                  <span className="text-slate-800">{stage.count} — {fmtShort(stage.value)}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${stage.color}`}
                    style={{ width: `${Math.max(3, stage.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[10px]">
            <div className="text-center">
              <div className="text-slate-400 uppercase font-bold">Taxa Conv.</div>
              <div className="font-black text-emerald-600">{pct(kpis.taxaConversaoLeads)}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 uppercase font-bold">CAC Est.</div>
              <div className="font-black text-violet-600">{fmtShort(kpis.cac)}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 uppercase font-bold">LTV Est.</div>
              <div className="font-black text-indigo-600">{fmtShort(kpis.ltv)}</div>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center animate-pulse">
                <Sparkles size={12} />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">IA Corporativa</h3>
            </div>
            <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded uppercase">Ativo</span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {[
              { tag: "Receita", color: "text-emerald-400", msg: `Receita de ${fmtShort(kpis.totalIncome)} com margem ${kpis.totalIncome > 0 ? pct((kpis.netBalance / kpis.totalIncome) * 100) : "–"}. ROI: ${pct(kpis.roi)}.` },
              { tag: "Check-in", color: "text-amber-400", msg: `${kpis.checkedInPending} participantes ainda não fizeram check-in. Taxa atual: ${pct(kpis.taxaConversao)}.` },
              { tag: "CRM", color: "text-blue-400", msg: `${kpis.leadsGerados} leads no pipeline. ${kpis.leadsConvertidos} convertidos (${pct(kpis.taxaConversaoLeads)}).` },
              { tag: "Financeiro", color: "text-rose-400", msg: `Contas a receber: ${fmtShort(kpis.contasReceber)}. Contas a pagar: ${fmtShort(kpis.contasPagar)}.` },
            ].map((item, i) => (
              <div key={i} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <div className={`text-[9px] font-bold uppercase tracking-wide ${item.color}`}>{item.tag}</div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{item.msg}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setActiveTab("chatbot"); handleSendAiMessage("Faça uma análise executiva completa dos KPIs atuais e sugira ações de melhoria."); }}
            className="mt-3 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            Análise Executiva Completa <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── REVENUE BY CATEGORY + EVENTS TABLE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue by Channel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4">Receita por Canal/Categoria</h3>
          {revenueByCategory.length > 0 ? (
            <BarChart data={revenueByCategory} colorClass="bg-emerald-500" />
          ) : (
            <p className="text-xs text-slate-400 italic">Sem dados de categoria.</p>
          )}
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[10px] text-slate-500">
            <span>Patrocínios: <strong className="text-slate-800">{fmtShort(kpis.sponsorReceita)}</strong></span>
            <span>Campanhas: <strong className="text-slate-800">{kpis.campaignsSent} enviadas</strong></span>
          </div>
        </div>

        {/* Events Overview Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Visão Geral dos Eventos</h3>
            <button
              onClick={() => setActiveTab("events")}
              className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5"
            >
              Gestão de Eventos <ChevronRight size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Ocupação</th>
                  <th className="px-4 py-3">Receita</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filteredEvents.map(ev => {
                  const evTickets = tickets.filter(t => t.eventId === ev.id).length;
                  const evRevenue = filteredFinance
                    .filter(f => f.eventId === ev.id && f.type === TransactionType.INCOME)
                    .reduce((s, f) => s + f.amount, 0);
                  const occupancy = ev.capacity > 0 ? (evTickets / ev.capacity) * 100 : 0;
                  const statusColors: Record<string, string> = {
                    ACTIVE: "bg-emerald-100 text-emerald-700",
                    PLANNING: "bg-blue-100 text-blue-700",
                    COMPLETED: "bg-slate-100 text-slate-600",
                    CANCELLED: "bg-red-100 text-red-700",
                    PRE_PRODUCTION: "bg-amber-100 text-amber-700",
                  };
                  return (
                    <tr
                      key={ev.id}
                      onClick={() => setActiveTab("events")}
                      className="hover:bg-slate-50/70 cursor-pointer transition-all"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 truncate max-w-[160px]">{ev.name}</div>
                        <div className="text-[10px] text-slate-400">{ev.type}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{ev.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${Math.min(100, occupancy)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">
                            {evTickets}/{ev.capacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{fmtShort(evRevenue)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[ev.status] || "bg-slate-100 text-slate-600"}`}>
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs italic">
                      Nenhum evento cadastrado neste tenant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── META X REALIZADO ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Meta × Realizado</h3>
            <p className="text-[10px] text-slate-400">Comparativo de receita, ingressos e leads</p>
          </div>
          <button
            onClick={() => setActiveTab("bi")}
            className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5"
          >
            Ver BI <ChevronRight size={11} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              label: "Receita Bruta", meta: filteredEvents.reduce((s, e) => s + (e.capacity * e.ticketPrice), 0),
              realizado: kpis.totalIncome, colorClass: "bg-violet-500",
            },
            {
              label: "Ingressos Vendidos", meta: filteredEvents.reduce((s, e) => s + e.capacity, 0),
              realizado: kpis.totalTicketsSold, colorClass: "bg-emerald-500",
            },
            {
              label: "Leads no Pipeline", meta: 10, realizado: kpis.leadsGerados, colorClass: "bg-blue-500",
            },
          ].map((m, i) => {
            const pctVal = m.meta > 0 ? Math.min(100, (m.realizado / m.meta) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-[10px] font-semibold mb-2">
                  <span className="text-slate-600">{m.label}</span>
                  <span className="text-slate-500">
                    {m.realizado.toLocaleString("pt-BR")} / {m.meta.toLocaleString("pt-BR")} — {pctVal.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${m.colorClass}`}
                    style={{ width: `${Math.max(2, pctVal)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-slate-400">
                  <span>Meta: {m.meta.toLocaleString("pt-BR")}</span>
                  <span className={pctVal >= 80 ? "text-emerald-600 font-bold" : pctVal >= 50 ? "text-amber-600 font-bold" : "text-red-600 font-bold"}>
                    {pctVal >= 80 ? "✓ No prazo" : pctVal >= 50 ? "⚡ Em progresso" : "⚠ Atenção"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
