import React, { useState, useEffect } from "react";
import {
  Activity, AlertTriangle, Users, Ticket, DollarSign, Wifi,
  Zap, Camera, Wind, ThermometerSun, Shield, Ambulance,
  Radio, Plus, X, CheckCircle, Clock, MapPin, TrendingUp
} from "lucide-react";

interface COEIncident {
  id: string;
  type: string;
  description: string;
  location: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  reportedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

interface Props {
  events: any[];
  tickets: any[];
  finance: any[];
  staff: any[];
  selectedEventId: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  LOW: "text-emerald-600 bg-emerald-50 border-emerald-200",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200",
  HIGH: "text-orange-600 bg-orange-50 border-orange-200",
  CRITICAL: "text-red-600 bg-red-50 border-red-200",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-red-600 bg-red-50",
  IN_PROGRESS: "text-amber-600 bg-amber-50",
  RESOLVED: "text-emerald-600 bg-emerald-50",
};

const SEED_INCIDENTS: COEIncident[] = [
  { id: "inc-1", type: "Infraestrutura", description: "Gerador auxiliar da área B sem combustível", location: "Área B - Palco Secundário", severity: "HIGH", status: "IN_PROGRESS", reportedAt: new Date(Date.now() - 1200000).toISOString(), assignedTo: "Equipe Técnica" },
  { id: "inc-2", type: "Segurança", description: "Aglomeração excessiva no portão 3", location: "Portão 3 - Entrada Principal", severity: "MEDIUM", status: "OPEN", reportedAt: new Date(Date.now() - 600000).toISOString(), assignedTo: "Coord. Segurança" },
  { id: "inc-3", type: "Médico", description: "Atleta com mal-estar na área de chegada", location: "Área de Chegada - Km 21", severity: "HIGH", status: "RESOLVED", reportedAt: new Date(Date.now() - 3600000).toISOString(), resolvedAt: new Date(Date.now() - 2400000).toISOString(), assignedTo: "Equipe Médica" },
  { id: "inc-4", type: "TI", description: "Lentidão no sistema de check-in", location: "Credenciamento Geral", severity: "LOW", status: "RESOLVED", reportedAt: new Date(Date.now() - 7200000).toISOString(), resolvedAt: new Date(Date.now() - 6000000).toISOString(), assignedTo: "Suporte TI" },
];

export default function CentroOperacoes({ events, tickets, finance, staff, selectedEventId }: Props) {
  const [incidents, setIncidents] = useState<COEIncident[]>(SEED_INCIDENTS);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const [newInc, setNewInc] = useState({ type: "Segurança", description: "", location: "", severity: "MEDIUM" as COEIncident["severity"] });
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalIncome = finance.filter((f: any) => f.type === "INCOME" && f.status === "PAID").reduce((s: number, f: any) => s + f.amount, 0);
  const staffOnline = staff.filter((s: any) => s.checkInStatus === "online").length;
  const checkedIn = tickets.filter((t: any) => t.checkedIn).length;
  const totalTickets = tickets.length;
  const occupancyPct = selectedEvent ? Math.min(100, Math.round((checkedIn / selectedEvent.capacity) * 100)) : 0;
  const openIncidents = incidents.filter(i => i.status !== "RESOLVED").length;

  const handleAddIncident = () => {
    if (!newInc.description || !newInc.location) return;
    const inc: COEIncident = {
      id: `inc-${Date.now()}`,
      type: newInc.type,
      description: newInc.description,
      location: newInc.location,
      severity: newInc.severity,
      status: "OPEN",
      reportedAt: new Date().toISOString(),
    };
    setIncidents(prev => [inc, ...prev]);
    setNewInc({ type: "Segurança", description: "", location: "", severity: "MEDIUM" });
    setShowNewIncident(false);
  };

  const toggleStatus = (id: string) => {
    setIncidents(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next: Record<string, COEIncident["status"]> = { OPEN: "IN_PROGRESS", IN_PROGRESS: "RESOLVED", RESOLVED: "OPEN" };
      return { ...i, status: next[i.status], resolvedAt: next[i.status] === "RESOLVED" ? new Date().toISOString() : undefined };
    }));
  };

  const filtered = filterStatus === "ALL" ? incidents : incidents.filter(i => i.status === filterStatus);

  const systems = [
    { label: "Energia", icon: <Zap size={14}/>, status: "OK", color: "text-emerald-500" },
    { label: "Internet", icon: <Wifi size={14}/>, status: "OK", color: "text-emerald-500" },
    { label: "Câmeras", icon: <Camera size={14}/>, status: openIncidents > 1 ? "ATENÇÃO" : "OK", color: openIncidents > 1 ? "text-amber-500" : "text-emerald-500" },
    { label: "Som", icon: <Radio size={14}/>, status: "OK", color: "text-emerald-500" },
    { label: "Segurança", icon: <Shield size={14}/>, status: openIncidents > 0 ? "ATENÇÃO" : "OK", color: openIncidents > 0 ? "text-amber-500" : "text-emerald-500" },
    { label: "Ambulância", icon: <Ambulance size={14}/>, status: "STANDBY", color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Centro de Operações (COE)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Painel de controle em tempo real · {selectedEvent?.name || "Selecione um evento"}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {liveTime.toLocaleTimeString("pt-BR")}
          </div>
          <button onClick={() => setShowNewIncident(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
            <AlertTriangle size={13}/> Registrar Ocorrência
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Público Presente", value: checkedIn.toLocaleString("pt-BR"), sub: `de ${selectedEvent?.capacity?.toLocaleString("pt-BR") || 0}`, icon: <Users size={18}/>, color: "from-violet-500 to-violet-600" },
          { label: "Ocupação", value: `${occupancyPct}%`, sub: "capacidade total", icon: <TrendingUp size={18}/>, color: "from-blue-500 to-blue-600" },
          { label: "Ingressos Vendidos", value: totalTickets.toLocaleString("pt-BR"), sub: "total emitido", icon: <Ticket size={18}/>, color: "from-indigo-500 to-indigo-600" },
          { label: "Receita em Caixa", value: `R$ ${(totalIncome/1000).toFixed(0)}k`, sub: "entradas pagas", icon: <DollarSign size={18}/>, color: "from-emerald-500 to-emerald-600" },
          { label: "Staff Online", value: staffOnline, sub: `de ${staff.length} escalados`, icon: <Shield size={18}/>, color: "from-amber-500 to-amber-600" },
          { label: "Ocorrências Abertas", value: openIncidents, sub: incidents.length + " total hoje", icon: <AlertTriangle size={18}/>, color: openIncidents > 0 ? "from-red-500 to-red-600" : "from-slate-500 to-slate-600" },
        ].map((k, i) => (
          <div key={i} className={`bg-gradient-to-br ${k.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="flex justify-between items-start mb-3">
              <span className="opacity-80">{k.icon}</span>
              <span className="text-[9px] uppercase font-bold opacity-60 tracking-widest text-right">{k.label}</span>
            </div>
            <div className="text-2xl font-black">{k.value}</div>
            <div className="text-[10px] opacity-70 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Occupation Bar */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Status de Ocupação por Área</h3>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{selectedEvent?.name}</span>
          </div>
          <div className="space-y-3">
            {[
              { area: "Palco Principal", pct: Math.min(100, occupancyPct + 15), cap: 3000 },
              { area: "Palco Secundário", pct: Math.max(0, occupancyPct - 10), cap: 1200 },
              { area: "Área VIP", pct: Math.min(100, occupancyPct + 5), cap: 500 },
              { area: "Food Park", pct: Math.max(0, occupancyPct - 20), cap: 800 },
              { area: "Credenciamento", pct: 100, cap: 200 },
              { area: "Estacionamento", pct: Math.min(100, occupancyPct + 25), cap: 2000 },
            ].map((area, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium">{area.area}</span>
                  <span className={`font-bold ${area.pct >= 90 ? "text-red-500" : area.pct >= 70 ? "text-amber-500" : "text-emerald-500"}`}>
                    {area.pct}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${area.pct >= 90 ? "bg-red-500" : area.pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${area.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Weather */}
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ThermometerSun size={16} className="text-amber-500"/>
              <span className="text-sm font-bold text-slate-800">24°C</span>
              <span className="text-xs text-slate-500">Parcialmente nublado</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind size={14} className="text-blue-400"/>
              <span className="text-xs text-slate-500">12 km/h NE</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-violet-400"/>
              <span className="text-xs text-slate-500">Umidade: 65%</span>
            </div>
            <div className="ml-auto text-xs text-slate-400 italic">Previsão: sem chuva nas próximas 6h</div>
          </div>
        </div>

        {/* Systems Health */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-800 mb-4">Status dos Sistemas</h3>
          <div className="space-y-3">
            {systems.map((sys, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className={sys.color}>{sys.icon}</span>
                  <span className="text-xs font-medium text-slate-700">{sys.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sys.status === "OK" ? "bg-emerald-100 text-emerald-700" :
                  sys.status === "STANDBY" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{sys.status}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-900 rounded-xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Frequência de Rádio</div>
            <div className="flex flex-col gap-1">
              {["Coord. Geral — CH 1", "Segurança — CH 2", "Médico — CH 3", "Técnico — CH 4"].map((ch, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] text-slate-300 font-mono">{ch}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Incidents */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-800">Registro de Ocorrências</h3>
          <div className="flex items-center gap-2">
            {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${filterStatus === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {s === "ALL" ? "Todas" : s === "OPEN" ? "Abertas" : s === "IN_PROGRESS" ? "Em Andamento" : "Resolvidas"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(inc => (
            <div key={inc.id} className={`flex items-start justify-between p-4 rounded-xl border ${SEVERITY_COLOR[inc.severity]}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${SEVERITY_COLOR[inc.severity]}`}>{inc.severity}</span>
                  <span className="text-[10px] font-bold text-slate-500">{inc.type}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[inc.status]}`}>{inc.status.replace("_", " ")}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{inc.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500"><MapPin size={10}/>{inc.location}</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500"><Clock size={10}/>{new Date(inc.reportedAt).toLocaleTimeString("pt-BR")}</span>
                  {inc.assignedTo && <span className="text-[10px] text-slate-500">→ {inc.assignedTo}</span>}
                </div>
              </div>
              <button onClick={() => toggleStatus(inc.id)}
                className="ml-4 px-3 py-1 bg-white border border-current rounded-lg text-[10px] font-bold hover:opacity-80 transition-all shrink-0">
                {inc.status === "OPEN" ? "Iniciar" : inc.status === "IN_PROGRESS" ? "Resolver" : "Reabrir"}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">
              <CheckCircle size={32} className="mx-auto mb-2 text-emerald-300"/>
              Nenhuma ocorrência encontrada neste filtro.
            </div>
          )}
        </div>
      </div>

      {/* New Incident Modal */}
      {showNewIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><AlertTriangle size={14} className="text-red-500"/>Registrar Ocorrência</h3>
              <button onClick={() => setShowNewIncident(false)}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo</label>
                  <select value={newInc.type} onChange={e => setNewInc({...newInc, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-red-400">
                    {["Segurança","Médico","Infraestrutura","TI","Limpeza","Elétrica","Logística","RH","Outro"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Severidade</label>
                  <select value={newInc.severity} onChange={e => setNewInc({...newInc, severity: e.target.value as COEIncident["severity"]})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-red-400">
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Localização</label>
                <input value={newInc.location} onChange={e => setNewInc({...newInc, location: e.target.value})} placeholder="Ex: Portão 2 / Área VIP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-red-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrição</label>
                <textarea value={newInc.description} onChange={e => setNewInc({...newInc, description: e.target.value})} rows={3}
                  placeholder="Descreva a ocorrência em detalhes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-red-400 resize-none"/>
              </div>
              <button onClick={handleAddIncident} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all">
                Registrar Ocorrência Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
