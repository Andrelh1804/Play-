/**
 * Central de Chamados — PostgreSQL-backed internal ticket system
 * Priority · SLA · Comments · AI suggestions · Approval workflow
 */
import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "../authService";
import {
  Ticket, Plus, X, Clock, MessageSquare, AlertTriangle, CheckCircle,
  User, Search, RefreshCw, Loader2, AlertCircle,
  Zap, Send, Lock, BarChart2, ArrowUp,
  Wrench, Monitor, Package, Shield, Sparkles,
  Check, Circle, PauseCircle, Archive
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  slaHours: number;
  assignedTo?: string;
  assignedName?: string;
  creatorName?: string;
  eventId?: string;
  resolution?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

interface Comment {
  id: string;
  ticketId: string;
  authorName: string;
  authorRole?: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

interface Stats {
  byStatus: { status: string; count: string }[];
  byPriority: { priority: string; count: string }[];
  slaViolations: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "ti",             label: "TI / Sistemas",   icon: Monitor,   color: "text-blue-400",    bg: "bg-blue-900/30" },
  { id: "infraestrutura", label: "Infraestrutura",  icon: Wrench,    color: "text-amber-400",   bg: "bg-amber-900/30" },
  { id: "seguranca",      label: "Segurança",       icon: Shield,    color: "text-red-400",     bg: "bg-red-900/30" },
  { id: "logistica",      label: "Logística",       icon: Package,   color: "text-emerald-400", bg: "bg-emerald-900/30" },
  { id: "financeiro",     label: "Financeiro",      icon: BarChart2, color: "text-violet-400",  bg: "bg-violet-900/30" },
  { id: "juridico",       label: "Jurídico",        icon: Lock,      color: "text-cyan-400",    bg: "bg-cyan-900/30" },
  { id: "producao",       label: "Produção",        icon: Zap,       color: "text-pink-400",    bg: "bg-pink-900/30" },
  { id: "outros",         label: "Outros",          icon: Ticket,    color: "text-slate-400",   bg: "bg-slate-800/50" },
];

const PRIORITIES = [
  { id: "critical", label: "Crítico", color: "text-red-400",    bg: "bg-red-900/30",    border: "border-red-500/40",    dot: "bg-red-500",    sla: "4h" },
  { id: "high",     label: "Alto",    color: "text-orange-400", bg: "bg-orange-900/30", border: "border-orange-500/40", dot: "bg-orange-500", sla: "8h" },
  { id: "medium",   label: "Médio",   color: "text-amber-400",  bg: "bg-amber-900/30",  border: "border-amber-500/40",  dot: "bg-amber-500",  sla: "24h" },
  { id: "low",      label: "Baixo",   color: "text-slate-400",  bg: "bg-slate-800/50",  border: "border-slate-600/40",  dot: "bg-slate-400",  sla: "72h" },
];

const STATUSES = [
  { id: "open",        label: "Aberto",       icon: Circle,      color: "text-blue-400",    bg: "bg-blue-900/30" },
  { id: "in_progress", label: "Em Andamento", icon: Loader2,     color: "text-amber-400",   bg: "bg-amber-900/30" },
  { id: "pending",     label: "Aguardando",   icon: PauseCircle, color: "text-violet-400",  bg: "bg-violet-900/30" },
  { id: "resolved",    label: "Resolvido",    icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-900/30" },
  { id: "closed",      label: "Fechado",      icon: Archive,     color: "text-slate-400",   bg: "bg-slate-800/50" },
];

function getPriority(id: string) { return PRIORITIES.find(p => p.id === id) || PRIORITIES[2]; }
function getStatus(id: string)   { return STATUSES.find(s => s.id === id) || STATUSES[0]; }
function getCategory(id: string) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]; }

function formatAge(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function isSlaBreached(t: SupportTicket) {
  if (t.status === "resolved" || t.status === "closed") return false;
  return (Date.now() - new Date(t.createdAt).getTime()) / 3600000 > t.slaHours;
}

function slaProgress(t: SupportTicket) {
  const age = (Date.now() - new Date(t.createdAt).getTime()) / 3600000;
  return Math.min(100, Math.round((age / t.slaHours) * 100));
}

// ─── New Ticket Modal ─────────────────────────────────────────────────────────

function NewTicketModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "ti", priority: "medium" });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const analyzeWithAI = async () => {
    if (!form.title || !form.description) return setError("Preencha título e descrição para análise IA.");
    setAiLoading(true); setError("");
    try {
      const res = await authFetch("/api/ai/ticket-suggestion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description, category: form.category }),
      });
      if (res.ok) {
        const d = await res.json();
        setAiSuggestion(d);
        if (d.priority) set("priority", d.priority);
      }
    } catch { } finally { setAiLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) return setError("Título e descrição são obrigatórios.");
    setSaving(true); setError("");
    try {
      const res = await authFetch("/api/support/tickets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onSuccess(); onClose();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1623] border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Plus size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Novo Chamado</h3>
              <p className="text-[10px] text-slate-400">SLA automático por prioridade</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Título *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              placeholder="Ex: Gerador sem energia na área VIP" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Categoria</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/60">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Prioridade</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/60">
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label} — SLA {p.sla}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Descrição *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 resize-none"
              placeholder="Descreva o problema em detalhes..." />
          </div>

          <button onClick={analyzeWithAI} disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-500/25 transition-colors disabled:opacity-50">
            {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {aiLoading ? "Analisando com IA..." : "Analisar com IA — sugestão de prioridade e solução"}
          </button>

          {aiSuggestion && (
            <div className="p-3 bg-violet-900/20 border border-violet-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold">
                <Sparkles size={12} /> Análise da IA
              </div>
              <p className="text-xs text-slate-300">{aiSuggestion.solution}</p>
              <div className="flex gap-3 text-[10px] text-slate-400">
                <span>⏱ {aiSuggestion.estimatedTime}</span>
                {aiSuggestion.escalate && <span className="text-red-400">⬆ Escalar para: {aiSuggestion.escalateTo}</span>}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-sm text-red-300">
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Abrindo...</> : <><Ticket size={14} /> Abrir Chamado</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Detail Panel ──────────────────────────────────────────────────────

function TicketDetail({ ticket, onClose, onUpdate }: { ticket: SupportTicket; onClose: () => void; onUpdate: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState("");
  const [resolution, setResolution] = useState(ticket.resolution || "");
  const [savingResolution, setSavingResolution] = useState(false);

  const prio = getPriority(ticket.priority);
  const stat = getStatus(ticket.status);
  const cat = getCategory(ticket.category);
  const breached = isSlaBreached(ticket);
  const progress = slaProgress(ticket);
  const CatIcon = cat.icon;
  const StatIcon = stat.icon;

  useEffect(() => {
    authFetch(`/api/support/tickets/${ticket.id}/comments`)
      .then(r => r.ok ? r.json() : [])
      .then(setComments);
  }, [ticket.id]);

  const sendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const res = await authFetch(`/api/support/tickets/${ticket.id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, isInternal }),
      });
      if (res.ok) { const c = await res.json(); setComments(prev => [...prev, c]); setNewComment(""); }
    } finally { setSendingComment(false); }
  };

  const updateStatus = async (status: string) => {
    setUpdatingStatus(status);
    try {
      const res = await authFetch(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(status === "resolved" && resolution ? { resolution } : {}) }),
      });
      if (res.ok) onUpdate();
    } finally { setUpdatingStatus(""); }
  };

  const saveResolution = async () => {
    setSavingResolution(true);
    try {
      await authFetch(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
    } finally { setSavingResolution(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-[#0f1623] border border-slate-700/60 rounded-t-2xl md:rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-slate-700/50 flex-shrink-0">
          <div className={`w-9 h-9 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <CatIcon size={16} className={cat.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${prio.bg} ${prio.color} border ${prio.border}`}>{prio.label}</span>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${stat.bg} ${stat.color}`}>{stat.label}</span>
              {breached && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-500/40 animate-pulse">SLA Violado</span>}
            </div>
            <h3 className="text-sm font-bold text-white">{ticket.title}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">#{ticket.id.slice(0,8)} · {cat.label} · {formatAge(ticket.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* SLA bar */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>SLA: {ticket.slaHours}h</span>
              <span className={breached ? "text-red-400 font-bold" : progress > 80 ? "text-amber-400" : "text-slate-400"}>
                {breached ? "VIOLADO" : `${progress}% consumido`}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${breached ? "bg-red-500" : progress > 80 ? "bg-amber-500" : progress > 50 ? "bg-yellow-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>

          {/* Description */}
          <div className="px-5 py-3">
            <p className="text-xs text-slate-400 leading-relaxed">{ticket.description}</p>
            {ticket.assignedName && (
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                <User size={11} /> Atribuído a: <span className="text-slate-300">{ticket.assignedName}</span>
              </div>
            )}
            {ticket.resolution && (
              <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Resolução</p>
                <p className="text-xs text-emerald-200">{ticket.resolution}</p>
              </div>
            )}
          </div>

          {/* Resolution input */}
          {ticket.status !== "closed" && (
            <div className="px-5 pb-3">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Nota de Resolução</label>
              <div className="flex gap-2">
                <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={2}
                  className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 resize-none"
                  placeholder="Descreva a solução aplicada..." />
                <button onClick={saveResolution} disabled={savingResolution || !resolution.trim()}
                  className="px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
                  {savingResolution ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
              </div>
            </div>
          )}

          {/* Status actions */}
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {ticket.status === "open" && (
              <button onClick={() => updateStatus("in_progress")} disabled={!!updatingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors disabled:opacity-50">
                {updatingStatus === "in_progress" ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={12} />} Iniciar Atendimento
              </button>
            )}
            {(ticket.status === "open" || ticket.status === "in_progress") && (
              <button onClick={() => updateStatus("pending")} disabled={!!updatingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-500/30 transition-colors disabled:opacity-50">
                {updatingStatus === "pending" ? <Loader2 size={12} className="animate-spin" /> : <PauseCircle size={12} />} Aguardando
              </button>
            )}
            {ticket.status !== "resolved" && ticket.status !== "closed" && (
              <button onClick={() => updateStatus("resolved")} disabled={!!updatingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                {updatingStatus === "resolved" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Resolver
              </button>
            )}
            {ticket.status === "resolved" && (
              <button onClick={() => updateStatus("closed")} disabled={!!updatingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-400 text-xs font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50">
                {updatingStatus === "closed" ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />} Fechar Chamado
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="px-5 pb-4">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-3">Histórico ({comments.length})</p>
            {comments.length === 0 ? (
              <p className="text-xs text-slate-600 italic text-center py-4">Nenhum comentário ainda.</p>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className={`p-3 rounded-xl text-xs ${c.isInternal ? "bg-amber-900/15 border border-amber-500/20" : "bg-slate-800/50 border border-slate-700/40"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{c.authorName}
                        {c.isInternal && <span className="ml-2 text-[9px] text-amber-400 font-bold uppercase">Interno</span>}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatAge(c.createdAt)}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment input */}
        <div className="p-4 border-t border-slate-700/50 flex-shrink-0 space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer w-fit">
            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
            Nota interna (não visível externamente)
          </label>
          <div className="flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); }}}
              placeholder="Escreva um comentário..."
              className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60" />
            <button onClick={sendComment} disabled={sendingComment || !newComment.trim()}
              className="px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-400 transition-colors disabled:opacity-50">
              {sendingComment ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const prio = getPriority(ticket.priority);
  const stat = getStatus(ticket.status);
  const cat = getCategory(ticket.category);
  const breached = isSlaBreached(ticket);
  const progress = slaProgress(ticket);
  const CatIcon = cat.icon;
  const StatIcon = stat.icon;

  return (
    <button onClick={onClick} className="w-full text-left bg-[#0f1623] border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800/20 transition-all group">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <CatIcon size={14} className={cat.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${prio.bg} border ${prio.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
              <span className={`text-[9px] font-bold uppercase ${prio.color}`}>{prio.label}</span>
            </div>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${stat.bg}`}>
              <StatIcon size={9} className={stat.color} />
              <span className={`text-[9px] font-semibold ${stat.color}`}>{stat.label}</span>
            </div>
            {breached && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-500/30 animate-pulse">SLA!</span>
            )}
          </div>
          <p className="text-xs font-semibold text-white truncate group-hover:text-amber-300 transition-colors">{ticket.title}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{ticket.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[9px] text-slate-500">{formatAge(ticket.createdAt)}</span>
          {ticket.commentCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] text-slate-500">
              <MessageSquare size={9} />{ticket.commentCount}
            </span>
          )}
        </div>
      </div>
      {ticket.status !== "resolved" && ticket.status !== "closed" && (
        <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${breached ? "bg-red-500" : progress > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CentralTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterPriority !== "all") params.set("priority", filterPriority);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (search) params.set("q", search);
      const [tRes, sRes] = await Promise.all([
        authFetch(`/api/support/tickets?${params}`),
        authFetch("/api/support/stats"),
      ]);
      if (tRes.ok) setTickets(await tRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } finally { setLoading(false); }
  }, [filterStatus, filterPriority, filterCategory, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const statCount = (sid: string) => parseInt(stats?.byStatus.find(s => s.status === sid)?.count || "0");
  const openCount = statCount("open") + statCount("in_progress") + statCount("pending");

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <MessageSquare size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Central de Chamados</h2>
            <p className="text-[11px] text-slate-400">
              {openCount} aberto{openCount !== 1 ? "s" : ""}
              {stats && stats.slaViolations > 0 && (
                <span className="ml-2 text-red-400 font-bold animate-pulse">
                  ⚠ {stats.slaViolations} SLA violado{stats.slaViolations > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><RefreshCw size={15} /></button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
            <Plus size={14} /> Novo Chamado
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Abertos",       value: statCount("open"),        icon: Circle,        color: "text-blue-400",    bg: "bg-blue-500/10" },
            { label: "Em Andamento",  value: statCount("in_progress"), icon: Loader2,       color: "text-amber-400",   bg: "bg-amber-500/10" },
            { label: "Resolvidos",    value: statCount("resolved"),    icon: CheckCircle,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "SLA Violado",   value: stats.slaViolations,      icon: AlertTriangle, color: "text-red-400",     bg: "bg-red-500/10" },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1623] border border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-1 bg-slate-800/50 border border-slate-700/40 rounded-xl p-1">
            {[{ id: "all", label: "Todos" }, ...STATUSES].map(s => (
              <button key={s.id} onClick={() => setFilterStatus(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s.id ? "bg-amber-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
            <option value="all">Todas Prioridades</option>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none">
            <option value="all">Todas Categorias</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar chamados..."
            className="w-full bg-[#0f1623] border border-slate-700/50 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X size={14} /></button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={28} className="animate-spin mb-3" />
          <p className="text-sm">Carregando chamados...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <Ticket size={28} className="text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Nenhum chamado encontrado</h3>
          <p className="text-xs text-slate-500 mb-4">{search ? "Tente outros termos." : "Abra o primeiro chamado."}</p>
          {!search && (
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-colors">
              <Plus size={13} /> Abrir Chamado
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tickets.map(t => (
            <TicketCard key={t.id} ticket={t} onClick={() => setSelected(t)} />
          ))}
        </div>
      )}

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onSuccess={() => { showToast("success", "Chamado aberto com sucesso!"); loadData(); }}
        />
      )}
      {selected && (
        <TicketDetail
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { loadData(); setSelected(null); showToast("success", "Chamado atualizado!"); }}
        />
      )}
    </div>
  );
}
