import React, { useState } from "react";
import { Calendar, Plus, X, ChevronLeft, ChevronRight, Clock, MapPin, Users, Tag, Filter } from "lucide-react";

interface AgendaEntry {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  responsible: string;
  eventId?: string;
  color: string;
  notes?: string;
}

interface Props {
  events: any[];
  selectedEventId: string;
}

const TYPE_COLORS: Record<string, string> = {
  "Montagem": "bg-amber-500",
  "Reunião": "bg-blue-500",
  "Inspeção": "bg-violet-500",
  "Treinamento": "bg-emerald-500",
  "Entrega": "bg-orange-500",
  "Financeiro": "bg-rose-500",
  "Contrato": "bg-indigo-500",
  "Desmontagem": "bg-slate-500",
  "Evento": "bg-red-500",
  "Pagamento": "bg-green-500",
};

function getColor(type: string): string {
  return TYPE_COLORS[type] || "bg-slate-400";
}

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function buildSeedEntries(events: any[]): AgendaEntry[] {
  const base: AgendaEntry[] = [
    { id: "ag-1", title: "Vistoria técnica do local", type: "Inspeção", date: "", startTime: "09:00", endTime: "11:00", location: "Local do Evento", responsible: "Coord. Técnico", color: "bg-violet-500" },
    { id: "ag-2", title: "Reunião com equipe de fornecedores", type: "Reunião", date: "", startTime: "14:00", endTime: "15:30", location: "Sala de Reuniões A", responsible: "Henrique Silva", color: "bg-blue-500" },
    { id: "ag-3", title: "Início da montagem do palco", type: "Montagem", date: "", startTime: "07:00", endTime: "18:00", location: "Palco Principal", responsible: "Equipe de Montagem", color: "bg-amber-500" },
    { id: "ag-4", title: "Treinamento de Staff operacional", type: "Treinamento", date: "", startTime: "08:00", endTime: "12:00", location: "Área de Credenciamento", responsible: "RH / Treinamento", color: "bg-emerald-500" },
    { id: "ag-5", title: "Entrega de kits e materiais", type: "Entrega", date: "", startTime: "10:00", endTime: "12:00", location: "Depósito Central", responsible: "Logística", color: "bg-orange-500" },
    { id: "ag-6", title: "Briefing geral pré-evento", type: "Reunião", date: "", startTime: "18:00", endTime: "19:00", location: "Auditório Interno", responsible: "Gestor do Evento", color: "bg-blue-500" },
    { id: "ag-7", title: "Vencimento do contrato de seguro", type: "Contrato", date: "", startTime: "00:00", endTime: "00:00", location: "Jurídico", responsible: "Dept. Jurídico", color: "bg-indigo-500" },
    { id: "ag-8", title: "Pagamento fornecedores", type: "Pagamento", date: "", startTime: "00:00", endTime: "00:00", location: "Financeiro", responsible: "Dept. Financeiro", color: "bg-green-500" },
  ];
  const now = new Date();
  return base.map((e, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i - 2);
    return { ...e, date: d.toISOString().split("T")[0] };
  });
}

type ViewMode = "calendar" | "agenda" | "kanban" | "gantt";

export default function AgendaInteligente({ events, selectedEventId }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [entries, setEntries] = useState<AgendaEntry[]>(() => buildSeedEntries(events));
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [newEntry, setNewEntry] = useState<Partial<AgendaEntry>>({
    type: "Reunião", date: today.toISOString().split("T")[0], startTime: "09:00", endTime: "10:00", location: "", responsible: "", title: ""
  });

  const filteredEntries = filterType === "ALL" ? entries : entries.filter(e => e.type === filterType);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const entriesByDate: Record<string, AgendaEntry[]> = {};
  filteredEntries.forEach(e => {
    if (!entriesByDate[e.date]) entriesByDate[e.date] = [];
    entriesByDate[e.date].push(e);
  });

  const handleSave = () => {
    if (!newEntry.title || !newEntry.date) return;
    const entry: AgendaEntry = {
      id: `ag-${Date.now()}`,
      title: newEntry.title!,
      type: newEntry.type || "Reunião",
      date: newEntry.date!,
      startTime: newEntry.startTime || "09:00",
      endTime: newEntry.endTime || "10:00",
      location: newEntry.location || "",
      responsible: newEntry.responsible || "",
      color: getColor(newEntry.type || "Reunião"),
      notes: newEntry.notes,
    };
    setEntries(prev => [...prev, entry]);
    setShowModal(false);
    setNewEntry({ type: "Reunião", date: today.toISOString().split("T")[0], startTime: "09:00", endTime: "10:00", location: "", responsible: "", title: "" });
  };

  const sortedEntries = [...filteredEntries].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const types = Object.keys(TYPE_COLORS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Agenda Inteligente</h2>
          <p className="text-xs text-slate-500 mt-0.5">Calendário corporativo integrado · {entries.length} entradas registradas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["calendar","agenda","kanban","gantt"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-all ${viewMode === v ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              {v === "calendar" ? "📅 Calendário" : v === "agenda" ? "📋 Agenda" : v === "kanban" ? "🗂 Kanban" : "📊 Gantt"}
            </button>
          ))}
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
            <Plus size={13}/> Novo Compromisso
          </button>
        </div>
      </div>

      {/* Filter by type */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium"><Filter size={12}/>Filtrar:</span>
        {["ALL", ...types].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${filterType === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {t === "ALL" ? "Todos" : t}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-base text-slate-800">{MONTHS[currentMonth]} {currentYear}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(currentYear, currentMonth - 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft size={16}/></button>
              <button onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}
                className="text-[10px] font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">Hoje</button>
              <button onClick={() => { const d = new Date(currentYear, currentMonth + 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight size={16}/></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => <div key={d} className="text-[10px] font-bold text-slate-400 text-center py-1 uppercase">{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEntries = entriesByDate[dateStr] || [];
              const isToday = dateStr === today.toISOString().split("T")[0];
              return (
                <div key={day} className={`min-h-[70px] p-1.5 rounded-xl border transition-all ${isToday ? "border-violet-300 bg-violet-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}>
                  <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-violet-600 text-white" : "text-slate-600"}`}>{day}</div>
                  {dayEntries.slice(0, 2).map(e => (
                    <div key={e.id} title={`${e.startTime} – ${e.title}`}
                      className={`text-[9px] font-bold text-white rounded px-1 py-0.5 mb-0.5 truncate ${e.color}`}>
                      {e.startTime !== "00:00" ? `${e.startTime} ` : ""}{e.title}
                    </div>
                  ))}
                  {dayEntries.length > 2 && <div className="text-[9px] text-slate-400 font-medium">+{dayEntries.length - 2} mais</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {viewMode === "agenda" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-800 mb-4">Próximos Compromissos</h3>
          <div className="space-y-3">
            {sortedEntries.map(e => (
              <div key={e.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
                <div className={`w-1 h-full min-h-[40px] ${e.color} rounded-full shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">{e.title}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white ${e.color}`}>{e.type}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500"><Calendar size={10}/>{e.date}</span>
                    {e.startTime !== "00:00" && <span className="flex items-center gap-1 text-[10px] text-slate-500"><Clock size={10}/>{e.startTime} – {e.endTime}</span>}
                    {e.location && <span className="flex items-center gap-1 text-[10px] text-slate-500"><MapPin size={10}/>{e.location}</span>}
                    {e.responsible && <span className="flex items-center gap-1 text-[10px] text-slate-500"><Users size={10}/>{e.responsible}</span>}
                  </div>
                </div>
                <button onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))}
                  className="text-slate-300 hover:text-red-400 transition-all"><X size={14}/></button>
              </div>
            ))}
            {sortedEntries.length === 0 && <div className="text-center py-8 text-sm text-slate-400">Nenhum compromisso registrado.</div>}
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {types.slice(0, 5).map(type => {
            const typeEntries = filteredEntries.filter(e => e.type === type);
            const color = TYPE_COLORS[type];
            return (
              <div key={type} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${color}`}/>
                  <span className="text-xs font-bold text-slate-700">{type}</span>
                  <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">{typeEntries.length}</span>
                </div>
                <div className="space-y-2">
                  {typeEntries.map(e => (
                    <div key={e.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-800 leading-tight">{e.title}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{e.date}</p>
                    </div>
                  ))}
                  {typeEntries.length === 0 && <p className="text-[10px] text-slate-300 text-center py-2">Vazio</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gantt View */}
      {viewMode === "gantt" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
          <h3 className="font-bold text-sm text-slate-800 mb-4">Linha do Tempo — {MONTHS[currentMonth]}</h3>
          <div className="min-w-[700px]">
            <div className="flex border-b border-slate-100 pb-2 mb-2">
              <div className="w-40 shrink-0 text-[10px] font-bold text-slate-400">Compromisso</div>
              <div className="flex-1 grid grid-cols-15 gap-0">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="text-[9px] text-slate-300 font-bold text-center">{i * 2 + 1}</div>
                ))}
              </div>
            </div>
            {sortedEntries.slice(0, 10).map(e => {
              const dayNum = new Date(e.date).getDate();
              const leftPct = Math.min(100, ((dayNum - 1) / daysInMonth) * 100);
              return (
                <div key={e.id} className="flex items-center mb-2">
                  <div className="w-40 shrink-0 text-[10px] font-medium text-slate-700 pr-2 truncate">{e.title}</div>
                  <div className="flex-1 relative h-6">
                    <div className="absolute top-0 h-full w-full bg-slate-50 rounded"/>
                    <div
                      className={`absolute top-0.5 h-5 rounded-full text-[9px] text-white flex items-center px-2 font-bold ${e.color}`}
                      style={{ left: `${leftPct}%`, width: `${Math.max(8, (1 / daysInMonth) * 100)}%` }}
                    >
                      {e.type}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Calendar size={14} className="text-violet-500"/>Novo Compromisso</h3>
              <button onClick={() => setShowModal(false)}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título</label>
                <input value={newEntry.title || ""} onChange={e => setNewEntry({...newEntry, title: e.target.value})} placeholder="Ex: Reunião com equipe técnica"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo</label>
                  <select value={newEntry.type} onChange={e => setNewEntry({...newEntry, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    {types.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data</label>
                  <input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Início</label>
                  <input type="time" value={newEntry.startTime} onChange={e => setNewEntry({...newEntry, startTime: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fim</label>
                  <input type="time" value={newEntry.endTime} onChange={e => setNewEntry({...newEntry, endTime: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Local</label>
                <input value={newEntry.location || ""} onChange={e => setNewEntry({...newEntry, location: e.target.value})} placeholder="Ex: Sala de Reuniões B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Responsável</label>
                <input value={newEntry.responsible || ""} onChange={e => setNewEntry({...newEntry, responsible: e.target.value})} placeholder="Ex: Henrique Silva"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <button onClick={handleSave} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all">
                Salvar Compromisso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
