import React, { useState } from "react";
import { Ticket, Plus, X, Clock, MapPin, MessageSquare, AlertTriangle, CheckCircle, User, Camera, ChevronRight } from "lucide-react";

interface SupportTicket {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "PENDING" | "RESOLVED" | "CLOSED";
  sla: number;
  assignedTo: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  messages: { sender: string; text: string; time: string }[];
  resolvedAt?: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-emerald-600 bg-emerald-50 border-emerald-200",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200",
  HIGH: "text-orange-600 bg-orange-50 border-orange-200",
  URGENT: "text-red-600 bg-red-50 border-red-200",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  PENDING: "bg-slate-100 text-slate-600",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-400",
};
const CATEGORY_ICON: Record<string, string> = {
  TI: "💻", Infraestrutura: "🏗", Limpeza: "🧹", Segurança: "🛡",
  Elétrica: "⚡", Hidráulica: "🚿", Produção: "🎬", Marketing: "📢",
  Financeiro: "💰", RH: "👥", Jurídico: "⚖", Logística: "🚚",
};

const SEED: SupportTicket[] = [
  {
    id: "tkt-s-1", category: "Elétrica", title: "Gerador da área VIP sem carga", description: "O gerador auxiliar da área VIP está sem carga desde as 14h. Necessário reabastecimento urgente.", priority: "URGENT", status: "IN_PROGRESS", sla: 30, assignedTo: "Equipe Elétrica", location: "Área VIP - Setor 2", createdAt: new Date(Date.now() - 1800000).toISOString(), updatedAt: new Date(Date.now() - 900000).toISOString(),
    messages: [{ sender: "João Técnico", text: "Estou verificando o painel elétrico agora.", time: new Date(Date.now() - 900000).toLocaleTimeString("pt-BR") }],
  },
  {
    id: "tkt-s-2", category: "Limpeza", title: "Banheiros do setor A precisam de limpeza", description: "Banheiros do Setor A com fila e lixeiras cheias. Necessário reabastecimento de papel e sabonete.", priority: "MEDIUM", status: "OPEN", sla: 60, assignedTo: "Não atribuído", location: "Setor A - Banheiro Central", createdAt: new Date(Date.now() - 600000).toISOString(), updatedAt: new Date(Date.now() - 600000).toISOString(),
    messages: [],
  },
  {
    id: "tkt-s-3", category: "TI", title: "Leitores de QR Code do portão 2 offline", description: "3 dos 5 leitores de QR Code do portão 2 pararam de funcionar. Credenciamento lento.", priority: "HIGH", status: "RESOLVED", sla: 45, assignedTo: "Suporte TI", location: "Portão 2 - Credenciamento", createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString(), resolvedAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      { sender: "Carlos TI", text: "Reiniciando os dispositivos remotamente.", time: "10:30" },
      { sender: "Carlos TI", text: "Leitores restaurados, todos funcionando.", time: "10:52" },
    ],
  },
  {
    id: "tkt-s-4", category: "Logística", title: "Caminhão de palco preso no trânsito", description: "Caminhão com o equipamento de LED atrasado 2h. Saiu de São Paulo às 06h mas ainda não chegou.", priority: "HIGH", status: "PENDING", sla: 120, assignedTo: "Coord. Logística", location: "Acesso Principal", createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 1800000).toISOString(),
    messages: [{ sender: "Motorista", text: "Estou na Dutra, saída 47. Previsão de chegada: 30 min.", time: "12:15" }],
  },
  {
    id: "tkt-s-5", category: "Segurança", title: "Confusão entre participantes no portão 1", description: "Pequena briga entre participantes aguardando entrada. Necessário reforço de segurança.", priority: "URGENT", status: "RESOLVED", sla: 15, assignedTo: "Coord. Segurança", location: "Portão 1", createdAt: new Date(Date.now() - 5400000).toISOString(), updatedAt: new Date(Date.now() - 4800000).toISOString(), resolvedAt: new Date(Date.now() - 4800000).toISOString(),
    messages: [
      { sender: "Segurança 03", text: "Equipe de 4 agentes deslocada ao portão.", time: "09:10" },
      { sender: "Coord. Segurança", text: "Situação controlada. Participantes separados e atendidos.", time: "09:18" },
    ],
  },
];

const CATEGORIES = Object.keys(CATEGORY_ICON);

export default function CentralTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>(SEED);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCat, setFilterCat] = useState("ALL");
  const [chatMsg, setChatMsg] = useState("");
  const [newT, setNewT] = useState({ category: "TI", title: "", description: "", priority: "MEDIUM" as SupportTicket["priority"], location: "", assignedTo: "" });

  const filtered = tickets.filter(t =>
    (filterStatus === "ALL" || t.status === filterStatus) &&
    (filterCat === "ALL" || t.category === filterCat)
  );

  const stats = {
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    pending: tickets.filter(t => t.status === "PENDING").length,
    resolved: tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length,
  };

  const slaPct = (t: SupportTicket) => {
    const elapsed = (Date.now() - new Date(t.createdAt).getTime()) / 60000;
    return Math.min(100, Math.round((elapsed / t.sla) * 100));
  };

  const handleCreate = () => {
    if (!newT.title || !newT.description) return;
    const t: SupportTicket = {
      id: `tkt-s-${Date.now()}`,
      category: newT.category,
      title: newT.title,
      description: newT.description,
      priority: newT.priority,
      status: "OPEN",
      sla: newT.priority === "URGENT" ? 15 : newT.priority === "HIGH" ? 30 : newT.priority === "MEDIUM" ? 60 : 120,
      assignedTo: newT.assignedTo || "Não atribuído",
      location: newT.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setTickets(prev => [t, ...prev]);
    setShowModal(false);
    setNewT({ category: "TI", title: "", description: "", priority: "MEDIUM", location: "", assignedTo: "" });
  };

  const sendMsg = () => {
    if (!chatMsg.trim() || !selected) return;
    const msg = { sender: "Henrique Silva (Admin)", text: chatMsg, time: new Date().toLocaleTimeString("pt-BR") };
    const updated = { ...selected, messages: [...selected.messages, msg], updatedAt: new Date().toISOString() };
    setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
    setSelected(updated);
    setChatMsg("");
  };

  const advanceStatus = (id: string) => {
    const next: Record<string, SupportTicket["status"]> = { OPEN: "IN_PROGRESS", IN_PROGRESS: "RESOLVED", PENDING: "IN_PROGRESS", RESOLVED: "CLOSED", CLOSED: "OPEN" };
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: next[t.status], updatedAt: new Date().toISOString(), resolvedAt: next[t.status] === "RESOLVED" ? new Date().toISOString() : t.resolvedAt } : t));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: next[prev.status] } : null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Central de Tickets (Suporte)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de chamados operacionais com SLA e rastreabilidade</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
          <Plus size={13}/> Abrir Chamado
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Em Aberto", value: stats.open, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
          { label: "Em Andamento", value: stats.inProgress, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Pendente", value: stats.pending, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" },
          { label: "Resolvidos", value: stats.resolved, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {["ALL","OPEN","IN_PROGRESS","PENDING","RESOLVED"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${filterStatus === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {s === "ALL" ? "Todos" : s === "OPEN" ? "Aberto" : s === "IN_PROGRESS" ? "Em And." : s === "PENDING" ? "Pendente" : "Resolvido"}
              </button>
            ))}
            <div className="ml-auto">
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none">
                <option value="ALL">Todas Categorias</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {filtered.map(t => {
              const pct = slaPct(t);
              const isSelected = selected?.id === t.id;
              return (
                <div key={t.id} onClick={() => setSelected(t)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-violet-300 ${isSelected ? "border-violet-400 bg-violet-50" : "border-slate-100 hover:bg-slate-50"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm">{CATEGORY_ICON[t.category] || "📋"}</span>
                        <span className="text-xs font-bold text-slate-800">{t.title}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status]}`}>{t.status.replace("_"," ")}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] text-slate-500">{t.category}</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500"><MapPin size={9}/>{t.location}</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500"><User size={9}/>{t.assignedTo}</span>
                      </div>
                      {t.status !== "RESOLVED" && t.status !== "CLOSED" && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                            <span>SLA: {t.sla} min</span>
                            <span className={pct >= 100 ? "text-red-500 font-bold" : pct >= 75 ? "text-amber-500 font-bold" : ""}>{pct}%</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct)}%` }}/>
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-slate-300 mt-1 shrink-0"/>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center py-8 text-sm text-slate-400"><CheckCircle size={28} className="mx-auto mb-2 text-emerald-300"/>Nenhum chamado neste filtro.</div>}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          {selected ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${PRIORITY_COLOR[selected.priority]}`}>{selected.priority}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[selected.status]}`}>{selected.status.replace("_"," ")}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">{selected.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{CATEGORY_ICON[selected.category]} {selected.category} · {selected.location}</p>
                </div>
                <button onClick={() => setSelected(null)}><X size={14} className="text-slate-300"/></button>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed mb-4">{selected.description}</p>
              <div className="text-[10px] text-slate-400 mb-4">
                <span className="flex items-center gap-1 mb-1"><User size={10}/> Atribuído: <b className="text-slate-600">{selected.assignedTo}</b></span>
                <span className="flex items-center gap-1"><Clock size={10}/> Aberto em: {new Date(selected.createdAt).toLocaleString("pt-BR")}</span>
                {selected.resolvedAt && <span className="flex items-center gap-1 mt-1"><CheckCircle size={10}/> Resolvido: {new Date(selected.resolvedAt).toLocaleString("pt-BR")}</span>}
              </div>

              <div className="flex-1 overflow-y-auto border-t border-slate-100 pt-3 space-y-2 max-h-48 mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><MessageSquare size={10}/>Histórico</p>
                {selected.messages.map((m, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[9px] font-bold text-slate-500">{m.sender} · {m.time}</p>
                    <p className="text-xs text-slate-700 mt-0.5">{m.text}</p>
                  </div>
                ))}
                {selected.messages.length === 0 && <p className="text-[10px] text-slate-300 italic">Sem mensagens ainda.</p>}
              </div>

              <div className="flex gap-2">
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()}
                  placeholder="Escrever mensagem..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs p-2 outline-none focus:border-violet-400"/>
                <button onClick={sendMsg} className="bg-violet-600 hover:bg-violet-500 text-white px-3 rounded-xl text-xs font-bold">Enviar</button>
              </div>
              <button onClick={() => advanceStatus(selected.id)} className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">
                {selected.status === "OPEN" ? "▶ Iniciar Atendimento" : selected.status === "IN_PROGRESS" ? "✓ Marcar como Resolvido" : selected.status === "PENDING" ? "▶ Retomar" : "⟳ Reabrir"}
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Ticket size={32} className="text-slate-200 mb-2"/>
              <p className="text-sm text-slate-400 font-medium">Selecione um chamado</p>
              <p className="text-xs text-slate-300">para ver detalhes e histórico</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">Abrir Novo Chamado</h3>
              <button onClick={() => setShowModal(false)}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                  <select value={newT.category} onChange={e => setNewT({...newT, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Prioridade</label>
                  <select value={newT.priority} onChange={e => setNewT({...newT, priority: e.target.value as SupportTicket["priority"]})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título do Chamado</label>
                <input value={newT.title} onChange={e => setNewT({...newT, title: e.target.value})} placeholder="Ex: Gerador do Setor B com falha"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrição</label>
                <textarea value={newT.description} onChange={e => setNewT({...newT, description: e.target.value})} rows={3}
                  placeholder="Descreva o problema detalhadamente..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400 resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Localização</label>
                  <input value={newT.location} onChange={e => setNewT({...newT, location: e.target.value})} placeholder="Portão 1, Setor B..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Atribuir para</label>
                  <input value={newT.assignedTo} onChange={e => setNewT({...newT, assignedTo: e.target.value})} placeholder="Equipe ou pessoa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              </div>
              <button onClick={handleCreate} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all">
                Abrir Chamado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
