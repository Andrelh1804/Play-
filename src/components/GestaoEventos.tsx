import React, { useState, useEffect, useRef } from "react";
import { authFetch } from "../authService";
import {
  Calendar, MapPin, Clock, CheckSquare, Layers, Truck, Plus, X, Trash2,
  Edit3, Save, ChevronRight, Users, Target, FileText, AlertTriangle,
  Globe, Building, Phone, Mail, Flag, Info, List, BarChart2, Navigation,
  Package, Utensils, Shield, Megaphone, DollarSign, ClipboardList,
  RefreshCw, Check, ChevronDown, ChevronUp, Zap, Activity, Sparkles,
  Bot, Wand2, CheckCheck, AlertCircle, ChevronLeft, Copy, AlertOctagon
} from "lucide-react";
import {
  Event, EventType, EventStatus, EventModality, ChecklistCategory,
  ChecklistItem, ScheduleItem, InfrastructureItem, LogisticsItem
} from "../types";

interface Props {
  events: Event[];
  tickets: any[];
  finance: any[];
  staff: any[];
  selectedEventId: string;
  selectedTenantId: string;
  onSelectEvent: (id: string) => void;
  onRefresh: () => void;
  onDeleteEvent: (id: string) => void;
}

type InternalTab = "visao-geral" | "cadastro" | "programacao" | "checklists" | "infraestrutura" | "logistica" | "localizacao" | "ia";

interface AiBrief {
  summary?: string;
  checklist?: Array<{ task: string; category: string; assigneeRole: string; responsible: string; priority: string; deadline_days_before: number }>;
  schedule?: Array<{ time: string; activity: string; responsibility: string; location: string; estimatedDuration: number; notes: string }>;
  infrastructure?: Array<{ name: string; quantity: number; status: string; category: string; location: string; notes: string }>;
  risks?: Array<{ description: string; impact: string; mitigation: string }>;
  logistics?: Array<{ type: string; description: string; responsible: string; origin: string; destination: string; vehicle: string; capacity: number; notes: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  PLANNING:       "bg-blue-100 text-blue-700",
  PRE_PRODUCTION: "bg-purple-100 text-purple-700",
  ACTIVE:         "bg-green-100 text-green-700",
  COMPLETED:      "bg-slate-100 text-slate-600",
  CANCELLED:      "bg-red-100 text-red-700",
};

const CHECKLIST_CATEGORIES = [
  { key: ChecklistCategory.PLANEJAMENTO,   label: "Planejamento",   icon: <Target size={14}/>,        color: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: ChecklistCategory.INFRAESTRUTURA, label: "Infraestrutura", icon: <Layers size={14}/>,        color: "text-amber-600 bg-amber-50 border-amber-200" },
  { key: ChecklistCategory.SEGURANCA,      label: "Segurança",      icon: <Shield size={14}/>,        color: "text-red-600 bg-red-50 border-red-200" },
  { key: ChecklistCategory.MARKETING,      label: "Marketing",      icon: <Megaphone size={14}/>,     color: "text-violet-600 bg-violet-50 border-violet-200" },
  { key: ChecklistCategory.FINANCEIRO,     label: "Financeiro",     icon: <DollarSign size={14}/>,    color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { key: ChecklistCategory.POS_EVENTO,     label: "Pós-Evento",     icon: <ClipboardList size={14}/>, color: "text-slate-600 bg-slate-50 border-slate-200" },
];

const PRIORITY_STYLES: Record<string, string> = {
  LOW:      "bg-slate-100 text-slate-500",
  MEDIUM:   "bg-yellow-100 text-yellow-700",
  HIGH:     "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const SCHEDULE_STATUS_STYLES: Record<string, string> = {
  PENDING:     "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  DELAYED:     "bg-red-100 text-red-700",
};

const LOGISTICS_STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const INFRA_CATEGORY_COLORS: Record<string, string> = {
  "Palco":         "bg-violet-100 text-violet-700",
  "Energia":       "bg-yellow-100 text-yellow-700",
  "Segurança":     "bg-red-100 text-red-700",
  "Sanitários":    "bg-blue-100 text-blue-700",
  "TI":            "bg-cyan-100 text-cyan-700",
  "Sinalização":   "bg-orange-100 text-orange-700",
  "Alimentação":   "bg-emerald-100 text-emerald-700",
  "Credenciamento":"bg-pink-100 text-pink-700",
};

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function emptyChecklist(): Partial<ChecklistItem> {
  return { task: "", assigneeRole: "", category: ChecklistCategory.PLANEJAMENTO, responsible: "", deadline: "", priority: "MEDIUM" };
}

function emptySchedule(): Partial<ScheduleItem> {
  return { time: "08:00", activity: "", responsibility: "", location: "", estimatedDuration: 60, itemStatus: "PENDING", notes: "" };
}

function emptyInfra(): Partial<InfrastructureItem> {
  return { name: "", quantity: 1, status: "Pendente", category: "Palco", location: "", supplier: "", notes: "" };
}

function emptyLogistics(): Partial<LogisticsItem> {
  return { type: "TRANSPORT", description: "", responsible: "", date: new Date().toISOString().split("T")[0], status: "PENDING", origin: "", destination: "", vehicle: "", capacity: 1, notes: "" };
}

const DEFAULT_CREATE: Partial<Event> = {
  name: "", type: EventType.RUNNING, modality: EventModality.PRESENCIAL,
  status: EventStatus.PLANNING, date: new Date().toISOString().split("T")[0],
  description: "", location: "", capacity: 2000, ticketPrice: 150,
  organizer: "", contractor: "", technicalResponsible: "", targetAudience: "",
  ageClassification: "", primaryLanguage: "pt-BR", code: "", objectives: "",
};

export default function GestaoEventos({ events, tickets, finance, staff, selectedEventId, selectedTenantId, onSelectEvent, onRefresh, onDeleteEvent }: Props) {
  const [tab, setTab] = useState<InternalTab>("visao-geral");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [checklistFilter, setChecklistFilter] = useState<ChecklistCategory | "ALL">("ALL");
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showAddInfra, setShowAddInfra] = useState(false);
  const [showAddLogistics, setShowAddLogistics] = useState(false);
  const [newChecklist, setNewChecklist] = useState<Partial<ChecklistItem>>(emptyChecklist());
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>(emptySchedule());
  const [newInfra, setNewInfra] = useState<Partial<InfrastructureItem>>(emptyInfra());
  const [newLogistics, setNewLogistics] = useState<Partial<LogisticsItem>>(emptyLogistics());

  // Create / Delete / Duplicate state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState<Partial<Event>>({ ...DEFAULT_CREATE });
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  // AI Brief state
  const [aiBrief, setAiBrief] = useState<AiBrief | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiApplied, setAiApplied] = useState<Set<string>>(new Set());
  const [aiActiveSection, setAiActiveSection] = useState<"checklist" | "schedule" | "infrastructure" | "risks" | "logistics">("checklist");

  // AI Chat state
  const [aiView, setAiView] = useState<"briefing" | "chat">("briefing");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string; ts: number }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatEventId, setChatEventId] = useState<string | undefined>(undefined);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];
  const eventTickets = tickets.filter((t: any) => t.eventId === selectedEvent?.id);
  const eventFinance = finance.filter((f: any) => f.eventId === selectedEvent?.id);

  // Reset chat when switching events
  useEffect(() => {
    if (selectedEvent?.id && selectedEvent.id !== chatEventId) {
      setChatMessages([]);
      setChatInput("");
      setChatEventId(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChat = async () => {
    if (!selectedEvent || !chatInput.trim() || chatSending) return;
    const userText = chatInput.trim();
    setChatInput("");
    const userMsg = { role: "user" as const, text: userText, ts: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatSending(true);
    try {
      const history = chatMessages.map(m => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        text: m.text,
      }));
      const resp = await authFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id, message: userText, history }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro desconhecido");
      setChatMessages(prev => [...prev, { role: "assistant", text: data.reply, ts: Date.now() }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: "assistant", text: `⚠️ ${err.message}`, ts: Date.now() }]);
    } finally {
      setChatSending(false);
    }
  };

  const [editData, setEditData] = useState<Partial<Event>>({});

  const startEdit = () => {
    if (!selectedEvent) return;
    setEditData({ ...selectedEvent });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await authFetch(`/api/events/${selectedEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      onRefresh();
      setEditMode(false);
      setEditData({});
    } catch {
      alert("Erro ao salvar evento.");
    } finally {
      setSaving(false);
    }
  };

  // ── Create Event ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await authFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createData,
          tenantId: selectedTenantId,
          checklist: [
            { id: `chk-${Date.now()}-1`, task: "Aprovar plano operacional", completed: false, assigneeRole: "PRODUCER", category: "PLANEJAMENTO", priority: "HIGH" },
            { id: `chk-${Date.now()}-2`, task: "Confirmar local e estrutura", completed: false, assigneeRole: "COORDINATOR", category: "INFRAESTRUTURA", priority: "HIGH" },
            { id: `chk-${Date.now()}-3`, task: "Liberar bilheteria / lote promocional", completed: false, assigneeRole: "STAFF", category: "FINANCEIRO", priority: "MEDIUM" },
            { id: `chk-${Date.now()}-4`, task: "Definir estratégia de marketing", completed: false, assigneeRole: "MARKETING", category: "MARKETING", priority: "MEDIUM" },
          ],
          schedule: [
            { id: `sch-${Date.now()}-1`, time: "07:00", activity: "Montagem e credenciamento", responsibility: "STAFF", itemStatus: "PENDING" },
            { id: `sch-${Date.now()}-2`, time: "09:00", activity: "Abertura oficial", responsibility: "COORDINATOR", itemStatus: "PENDING" },
            { id: `sch-${Date.now()}-3`, time: "18:00", activity: "Encerramento e premiação", responsibility: "COORDINATOR", itemStatus: "PENDING" },
          ],
          infrastructure: [
            { id: `inf-${Date.now()}-1`, name: "Tendas de Credenciamento", quantity: 4, status: "Pendente", category: "Credenciamento" },
            { id: `inf-${Date.now()}-2`, name: "Palco Principal", quantity: 1, status: "Pendente", category: "Palco" },
            { id: `inf-${Date.now()}-3`, name: "Geradores de Energia", quantity: 2, status: "Pendente", category: "Energia" },
          ],
          logistics: [],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setShowCreateModal(false);
        setCreateData({ ...DEFAULT_CREATE });
        onRefresh();
        onSelectEvent(created.id);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar evento.");
      }
    } catch {
      alert("Erro ao criar evento.");
    } finally {
      setCreating(false);
    }
  };

  // ── Duplicate Event ──
  const handleDuplicate = async () => {
    if (!selectedEvent) return;
    setDuplicating(true);
    try {
      const copy = {
        ...selectedEvent,
        name: `${selectedEvent.name} (Cópia)`,
        status: EventStatus.PLANNING,
        date: new Date().toISOString().split("T")[0],
        tenantId: selectedTenantId,
        checklist: (selectedEvent.checklist || []).map((c, i) => ({ ...c, id: `chk-dup-${Date.now()}-${i}`, completed: false })),
        schedule:  (selectedEvent.schedule  || []).map((s, i) => ({ ...s, id: `sch-dup-${Date.now()}-${i}`, itemStatus: "PENDING" })),
        infrastructure: (selectedEvent.infrastructure || []).map((inf, i) => ({ ...inf, id: `inf-dup-${Date.now()}-${i}`, status: "Pendente" })),
        logistics: (selectedEvent.logistics || []).map((l, i) => ({ ...l, id: `log-dup-${Date.now()}-${i}`, status: "PENDING" })),
      };
      // Remove id so server generates a new one
      delete (copy as any).id;
      const res = await authFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copy),
      });
      if (res.ok) {
        const created = await res.json();
        onRefresh();
        onSelectEvent(created.id);
      }
    } catch {
      alert("Erro ao duplicar evento.");
    } finally {
      setDuplicating(false);
    }
  };

  // ── Quick Status Change ──
  const handleStatusChange = async (status: EventStatus) => {
    if (!selectedEvent) return;
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onRefresh();
  };

  const toggleChecklistItem = async (itemId: string) => {
    if (!selectedEvent) return;
    const updated = selectedEvent.checklist.map(c =>
      c.id === itemId ? { ...c, completed: !c.completed } : c
    );
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: updated }),
    });
    onRefresh();
  };

  const deleteChecklistItem = async (itemId: string) => {
    if (!selectedEvent) return;
    const updated = selectedEvent.checklist.filter(c => c.id !== itemId);
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: updated }),
    });
    onRefresh();
  };

  const addChecklistItem = async () => {
    if (!selectedEvent || !newChecklist.task) return;
    const item: ChecklistItem = {
      id: `chk-${Date.now()}`,
      task: newChecklist.task || "",
      completed: false,
      assigneeRole: newChecklist.assigneeRole || "",
      category: newChecklist.category || ChecklistCategory.PLANEJAMENTO,
      responsible: newChecklist.responsible || "",
      deadline: newChecklist.deadline || "",
      priority: newChecklist.priority as any || "MEDIUM",
      comments: [],
    };
    const updated = [...(selectedEvent.checklist || []), item];
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: updated }),
    });
    setNewChecklist(emptyChecklist());
    setShowAddChecklist(false);
    onRefresh();
  };

  const addScheduleItem = async () => {
    if (!selectedEvent || !newSchedule.activity) return;
    const item: ScheduleItem = {
      id: `sch-${Date.now()}`,
      time: newSchedule.time || "08:00",
      activity: newSchedule.activity || "",
      responsibility: newSchedule.responsibility || "",
      location: newSchedule.location || "",
      estimatedDuration: newSchedule.estimatedDuration || 60,
      itemStatus: newSchedule.itemStatus as any || "PENDING",
      notes: newSchedule.notes || "",
    };
    const updated = [...(selectedEvent.schedule || []), item].sort((a, b) => a.time.localeCompare(b.time));
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule: updated }),
    });
    setNewSchedule(emptySchedule());
    setShowAddSchedule(false);
    onRefresh();
  };

  const deleteScheduleItem = async (itemId: string) => {
    if (!selectedEvent) return;
    const updated = selectedEvent.schedule.filter(s => s.id !== itemId);
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule: updated }),
    });
    onRefresh();
  };

  const updateScheduleStatus = async (itemId: string, status: ScheduleItem["itemStatus"]) => {
    if (!selectedEvent) return;
    const updated = selectedEvent.schedule.map(s =>
      s.id === itemId ? { ...s, itemStatus: status } : s
    );
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule: updated }),
    });
    onRefresh();
  };

  const addInfraItem = async () => {
    if (!selectedEvent || !newInfra.name) return;
    const item: InfrastructureItem = {
      id: `inf-${Date.now()}`,
      name: newInfra.name || "",
      quantity: newInfra.quantity || 1,
      status: newInfra.status || "Pendente",
      category: newInfra.category || "Palco",
      location: newInfra.location || "",
      supplier: newInfra.supplier || "",
      notes: newInfra.notes || "",
    };
    const updated = [...(selectedEvent.infrastructure || []), item];
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infrastructure: updated }),
    });
    setNewInfra(emptyInfra());
    setShowAddInfra(false);
    onRefresh();
  };

  const updateInfraStatus = async (itemId: string, status: string) => {
    if (!selectedEvent) return;
    const updated = selectedEvent.infrastructure.map(i =>
      i.id === itemId ? { ...i, status } : i
    );
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infrastructure: updated }),
    });
    onRefresh();
  };

  const deleteInfraItem = async (itemId: string) => {
    if (!selectedEvent) return;
    const updated = selectedEvent.infrastructure.filter(i => i.id !== itemId);
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infrastructure: updated }),
    });
    onRefresh();
  };

  const addLogisticsItem = async () => {
    if (!selectedEvent || !newLogistics.description) return;
    const item: LogisticsItem = {
      id: `log-${Date.now()}`,
      type: newLogistics.type as any || "TRANSPORT",
      description: newLogistics.description || "",
      responsible: newLogistics.responsible || "",
      date: newLogistics.date || new Date().toISOString().split("T")[0],
      status: newLogistics.status as any || "PENDING",
      origin: newLogistics.origin || "",
      destination: newLogistics.destination || "",
      vehicle: newLogistics.vehicle || "",
      capacity: newLogistics.capacity || 1,
      notes: newLogistics.notes || "",
    };
    const updated = [...(selectedEvent.logistics || []), item];
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logistics: updated }),
    });
    setNewLogistics(emptyLogistics());
    setShowAddLogistics(false);
    onRefresh();
  };

  const deleteLogisticsItem = async (itemId: string) => {
    if (!selectedEvent) return;
    const updated = (selectedEvent.logistics || []).filter(l => l.id !== itemId);
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logistics: updated }),
    });
    onRefresh();
  };

  const updateLogisticsStatus = async (itemId: string, status: LogisticsItem["status"]) => {
    if (!selectedEvent) return;
    const updated = (selectedEvent.logistics || []).map(l =>
      l.id === itemId ? { ...l, status } : l
    );
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logistics: updated }),
    });
    onRefresh();
  };

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all";
  const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1";

  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (e.location || "").toLowerCase().includes(searchFilter.toLowerCase())
  );

  const generateBrief = async () => {
    if (!selectedEvent) return;
    setAiLoading(true);
    setAiError(null);
    setAiBrief(null);
    setAiApplied(new Set());
    try {
      const resp = await authFetch("/api/ai/event-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro desconhecido");
      setAiBrief(data);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiChecklist = async (items: AiBrief["checklist"]) => {
    if (!selectedEvent || !items?.length) return;
    const eventDate = new Date(selectedEvent.date + "T00:00:00");
    const newItems: ChecklistItem[] = items.map((item, i) => {
      const deadline = new Date(eventDate);
      deadline.setDate(deadline.getDate() - (item.deadline_days_before || 7));
      return {
        id: `chk-ai-${Date.now()}-${i}`,
        task: item.task,
        completed: false,
        assigneeRole: item.assigneeRole || "COORDINATOR",
        category: item.category as any || ChecklistCategory.PLANEJAMENTO,
        responsible: item.responsible || "",
        deadline: deadline.toISOString().split("T")[0],
        priority: (item.priority as any) || "MEDIUM",
        comments: [],
      };
    });
    const updated = [...(selectedEvent.checklist || []), ...newItems];
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: updated }),
    });
    setAiApplied(prev => new Set([...prev, "checklist"]));
    onRefresh();
  };

  const applyAiSchedule = async (items: AiBrief["schedule"]) => {
    if (!selectedEvent || !items?.length) return;
    const newItems: ScheduleItem[] = items.map((item, i) => ({
      id: `sch-ai-${Date.now()}-${i}`,
      time: item.time || "09:00",
      activity: item.activity,
      responsibility: item.responsibility || "COORDINATOR",
      location: item.location || "",
      estimatedDuration: item.estimatedDuration || 60,
      itemStatus: "PENDING" as any,
      notes: item.notes || "",
    }));
    const updated = [...(selectedEvent.schedule || []), ...newItems].sort((a, b) => a.time.localeCompare(b.time));
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule: updated }),
    });
    setAiApplied(prev => new Set([...prev, "schedule"]));
    onRefresh();
  };

  const applyAiInfrastructure = async (items: AiBrief["infrastructure"]) => {
    if (!selectedEvent || !items?.length) return;
    const newItems: InfrastructureItem[] = items.map((item, i) => ({
      id: `inf-ai-${Date.now()}-${i}`,
      name: item.name,
      quantity: item.quantity || 1,
      status: "Pendente",
      category: item.category || "Outros",
      location: item.location || "",
      notes: item.notes || "",
    }));
    const updated = [...(selectedEvent.infrastructure || []), ...newItems];
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infrastructure: updated }),
    });
    setAiApplied(prev => new Set([...prev, "infrastructure"]));
    onRefresh();
  };

  const applyAiLogistics = async (items: AiBrief["logistics"]) => {
    if (!selectedEvent || !items?.length) return;
    const newItems: LogisticsItem[] = items.map((item, i) => ({
      id: `log-ai-${Date.now()}-${i}`,
      type: (item.type || "TRANSPORT") as any,
      description: item.description,
      responsible: item.responsible || "",
      date: selectedEvent.date,
      origin: item.origin || "",
      destination: item.destination || "",
      vehicle: item.vehicle || "",
      capacity: item.capacity || 1,
      status: "PENDING" as any,
      notes: item.notes || "",
    }));
    const updated = [...(selectedEvent.logistics || []), ...newItems];
    await authFetch(`/api/events/${selectedEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logistics: updated }),
    });
    setAiApplied(prev => new Set([...prev, "logistics"]));
    onRefresh();
  };

  const IMPACT_STYLES: Record<string, string> = {
    LOW:      "bg-slate-100 text-slate-500",
    MEDIUM:   "bg-yellow-100 text-yellow-700",
    HIGH:     "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

  const tabs: { id: InternalTab; label: string; icon: React.ReactNode }[] = [
    { id: "visao-geral",    label: "Visão Geral",    icon: <BarChart2 size={13}/> },
    { id: "cadastro",       label: "Cadastro",        icon: <FileText size={13}/> },
    { id: "programacao",    label: "Programação",     icon: <Clock size={13}/> },
    { id: "checklists",     label: "Checklists",      icon: <CheckSquare size={13}/> },
    { id: "infraestrutura", label: "Infraestrutura",  icon: <Layers size={13}/> },
    { id: "logistica",      label: "Logística",       icon: <Truck size={13}/> },
    { id: "localizacao",    label: "Localização",     icon: <MapPin size={13}/> },
    { id: "ia",             label: "IA Assistente",   icon: <Sparkles size={13}/> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0">

      {/* LEFT: Event Selector */}
      <div className="lg:w-72 shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Eventos</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px] font-bold">{events.length}</span>
              <button
                onClick={() => { setCreateData({ ...DEFAULT_CREATE }); setShowCreateModal(true); }}
                className="flex items-center gap-1 px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                title="Criar novo evento"
              >
                <Plus size={11}/> Novo
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Buscar evento..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-violet-500 mb-3"
          />
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
            {filteredEvents.map(ev => {
              const isSel = selectedEventId === ev.id;
              const evTickets = tickets.filter((t: any) => t.eventId === ev.id).length;
              return (
                <div
                  key={ev.id}
                  onClick={() => { onSelectEvent(ev.id); setEditMode(false); }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group relative ${
                    isSel ? "border-violet-500 bg-violet-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase truncate max-w-[100px]">
                      {ev.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_STYLES[ev.status] || "bg-slate-100 text-slate-600"}`}>
                        {ev.status}
                      </span>
                      {/* Delete icon — shows on hover of the card */}
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(ev.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-all"
                        title="Excluir evento"
                      >
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                  <h4 className={`font-bold text-xs mt-1.5 line-clamp-2 ${isSel ? "text-violet-900" : "text-slate-900"}`}>{ev.name}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2">
                    <MapPin size={10}/>
                    <span className="truncate">{ev.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1"><Calendar size={10}/>{ev.date}</span>
                    <span className="text-violet-600 font-bold">{evTickets} ingressos</span>
                  </div>
                </div>
              );
            })}
            {filteredEvents.length === 0 && (
              <div className="text-center py-8">
                <Calendar size={24} className="mx-auto mb-2 text-slate-300"/>
                <p className="text-xs text-slate-400">Nenhum evento encontrado.</p>
                <button
                  onClick={() => { setCreateData({ ...DEFAULT_CREATE }); setShowCreateModal(true); }}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-bold mx-auto transition-all"
                >
                  <Plus size={11}/> Criar Primeiro Evento
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick KPIs for selected event */}
        {selectedEvent && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">KPIs do Evento</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-violet-50 rounded-xl p-2.5 text-center">
                <div className="text-lg font-black text-violet-700">{eventTickets.length}</div>
                <div className="text-[9px] text-violet-500 font-bold uppercase">Ingressos</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                <div className="text-lg font-black text-emerald-700">
                  {Math.round((eventTickets.length / (selectedEvent.capacity || 1)) * 100)}%
                </div>
                <div className="text-[9px] text-emerald-500 font-bold uppercase">Ocupação</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                <div className="text-lg font-black text-blue-700">
                  {selectedEvent.checklist?.filter(c => c.completed).length || 0}/{selectedEvent.checklist?.length || 0}
                </div>
                <div className="text-[9px] text-blue-500 font-bold uppercase">Checklist</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                <div className="text-lg font-black text-amber-700">
                  {selectedEvent.infrastructure?.filter(i => i.status === "Entregue").length || 0}/{selectedEvent.infrastructure?.length || 0}
                </div>
                <div className="text-[9px] text-amber-500 font-bold uppercase">Infra</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] text-slate-400 mb-1.5">Progresso do Checklist</div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-violet-500 h-full rounded-full transition-all"
                  style={{ width: `${selectedEvent.checklist?.length ? (selectedEvent.checklist.filter(c => c.completed).length / selectedEvent.checklist.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Main Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {selectedEvent ? (
          <>
            {/* Event Header */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[selectedEvent.status]}`}>
                      {selectedEvent.status}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                      {selectedEvent.type}
                    </span>
                    {selectedEvent.modality && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                        {selectedEvent.modality}
                      </span>
                    )}
                    {selectedEvent.code && (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded-full text-[10px] font-mono font-bold">
                        #{selectedEvent.code}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-1.5">{selectedEvent.name}</h2>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Calendar size={12}/>{formatDate(selectedEvent.date)}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12}/>{selectedEvent.location}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Users size={12}/>{selectedEvent.capacity.toLocaleString("pt-BR")} cap.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <button onClick={onRefresh} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 transition-all" title="Atualizar">
                    <RefreshCw size={14}/>
                  </button>

                  {/* Quick Status Change */}
                  {!editMode && (
                    <div className="relative group">
                      <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all">
                        <Activity size={13}/> Status <ChevronDown size={11}/>
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-20 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        {Object.values(EventStatus).map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl flex items-center gap-2 ${selectedEvent.status === s ? "text-violet-700 bg-violet-50" : "text-slate-700"}`}
                          >
                            <span className={`w-2 h-2 rounded-full inline-block ${s === "ACTIVE" ? "bg-green-500" : s === "PLANNING" ? "bg-blue-500" : s === "PRE_PRODUCTION" ? "bg-purple-500" : s === "COMPLETED" ? "bg-slate-400" : "bg-red-500"}`}/>
                            {s.replace(/_/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duplicate */}
                  {!editMode && (
                    <button
                      onClick={handleDuplicate}
                      disabled={duplicating}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all disabled:opacity-50"
                      title="Duplicar evento"
                    >
                      <Copy size={13}/><span>{duplicating ? "..." : "Duplicar"}</span>
                    </button>
                  )}

                  {/* Edit / Save / Cancel */}
                  {!editMode ? (
                    <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                      <Edit3 size={13}/><span>Editar</span>
                    </button>
                  ) : (
                    <>
                      <button onClick={cancelEdit} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
                      <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-60">
                        <Save size={13}/><span>{saving ? "Salvando..." : "Salvar"}</span>
                      </button>
                    </>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => setConfirmDeleteId(selectedEvent.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition-all"
                    title="Excluir evento"
                  >
                    <Trash2 size={13}/><span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Internal Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                      tab === t.id
                        ? "border-violet-600 text-violet-700 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-5">

                {/* ── VISÃO GERAL ── */}
                {tab === "visao-geral" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Capacidade", value: selectedEvent.capacity.toLocaleString("pt-BR"), color: "text-slate-800" },
                        { label: "Ingressos Emitidos", value: eventTickets.length.toString(), color: "text-violet-700" },
                        { label: "Preço Base", value: `R$ ${selectedEvent.ticketPrice.toLocaleString("pt-BR")}`, color: "text-emerald-700" },
                        { label: "Ocupação", value: `${Math.round((eventTickets.length / (selectedEvent.capacity || 1)) * 100)}%`, color: "text-blue-700" },
                      ].map(kpi => (
                        <div key={kpi.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{kpi.label}</div>
                          <div className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><Info size={13}/> Informações Gerais</h4>
                        {[
                          { label: "Organizador", value: selectedEvent.organizer || "—" },
                          { label: "Contratante", value: selectedEvent.contractor || "—" },
                          { label: "Responsável Técnico", value: selectedEvent.technicalResponsible || "—" },
                          { label: "Modalidade", value: selectedEvent.modality || "—" },
                          { label: "Público-alvo", value: selectedEvent.targetAudience || "—" },
                          { label: "Classificação Etária", value: selectedEvent.ageClassification || "Livre" },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{row.label}</span>
                            <span className="text-slate-800 font-semibold text-right max-w-[60%] truncate">{row.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={13}/> Fases do Evento</h4>
                        {[
                          { label: "Planejamento",   value: selectedEvent.phases?.planning },
                          { label: "Pré-produção",   value: selectedEvent.phases?.preProduction },
                          { label: "Montagem",       value: selectedEvent.phases?.assembly },
                          { label: "Ensaios",        value: selectedEvent.phases?.rehearsals },
                          { label: "Abertura",       value: selectedEvent.phases?.opening },
                          { label: "Execução",       value: selectedEvent.phases?.execution },
                          { label: "Encerramento",   value: selectedEvent.phases?.closure },
                          { label: "Desmontagem",    value: selectedEvent.phases?.disassembly },
                          { label: "Pós-evento",     value: selectedEvent.phases?.postEvent },
                        ].filter(p => p.value).map(phase => (
                          <div key={phase.label} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{phase.label}</span>
                            <span className="text-slate-800 font-semibold">{formatDate(phase.value)}</span>
                          </div>
                        ))}
                        {!Object.values(selectedEvent.phases || {}).some(Boolean) && (
                          <p className="text-xs text-slate-400 italic">Nenhuma fase cadastrada.</p>
                        )}
                      </div>
                    </div>

                    {selectedEvent.description && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText size={13}/> Descrição</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{selectedEvent.description}</p>
                      </div>
                    )}

                    {selectedEvent.objectives && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Target size={13}/> Objetivos</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{selectedEvent.objectives}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── CADASTRO COMPLETO ── */}
                {tab === "cadastro" && (
                  <div className="space-y-6">
                    {!editMode && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                        <AlertTriangle size={14}/>
                        <span>Clique em <strong>Editar Evento</strong> no cabeçalho para habilitar a edição dos campos.</span>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2"><Info size={13}/> Informações Gerais</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Nome do Evento *</label>
                          <input className={inputCls} value={editMode ? (editData.name || "") : selectedEvent.name} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, name: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Código Único</label>
                          <input className={inputCls} placeholder="Ex: EVT-2026-001" value={editMode ? (editData.code || "") : (selectedEvent.code || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, code: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Tipo do Evento *</label>
                          <select className={inputCls} value={editMode ? (editData.type || "") : selectedEvent.type} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, type: e.target.value as EventType}))}>
                            {Object.values(EventType).map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Modalidade</label>
                          <select className={inputCls} value={editMode ? (editData.modality || "") : (selectedEvent.modality || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, modality: e.target.value as EventModality}))}>
                            <option value="">Selecione...</option>
                            {Object.values(EventModality).map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Status</label>
                          <select className={inputCls} value={editMode ? (editData.status || "") : selectedEvent.status} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, status: e.target.value as EventStatus}))}>
                            {Object.values(EventStatus).map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Data Principal</label>
                          <input type="date" className={inputCls} value={editMode ? (editData.date || "") : selectedEvent.date} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, date: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Capacidade Máxima</label>
                          <input type="number" className={inputCls} value={editMode ? (editData.capacity ?? "") : selectedEvent.capacity} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, capacity: Number(e.target.value)}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Participantes Esperados</label>
                          <input type="number" className={inputCls} value={editMode ? (editData.expectedParticipants ?? "") : (selectedEvent.expectedParticipants || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, expectedParticipants: Number(e.target.value)}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Preço Base do Ingresso (R$)</label>
                          <input type="number" className={inputCls} value={editMode ? (editData.ticketPrice ?? "") : selectedEvent.ticketPrice} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, ticketPrice: Number(e.target.value)}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Classificação Etária</label>
                          <select className={inputCls} value={editMode ? (editData.ageClassification || "") : (selectedEvent.ageClassification || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, ageClassification: e.target.value}))}>
                            <option value="">Livre (L)</option>
                            <option value="10+">10 anos</option>
                            <option value="12+">12 anos</option>
                            <option value="14+">14 anos</option>
                            <option value="16+">16 anos</option>
                            <option value="18+">18 anos</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Idioma Principal</label>
                          <select className={inputCls} value={editMode ? (editData.primaryLanguage || "") : (selectedEvent.primaryLanguage || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, primaryLanguage: e.target.value}))}>
                            <option value="pt-BR">Português (Brasil)</option>
                            <option value="en-US">Inglês (EUA)</option>
                            <option value="es">Espanhol</option>
                            <option value="fr">Francês</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Organizador</label>
                          <input className={inputCls} placeholder="Nome ou empresa organizadora" value={editMode ? (editData.organizer || "") : (selectedEvent.organizer || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, organizer: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Contratante</label>
                          <input className={inputCls} placeholder="Nome ou empresa contratante" value={editMode ? (editData.contractor || "") : (selectedEvent.contractor || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, contractor: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Responsável Técnico</label>
                          <input className={inputCls} placeholder="Nome do responsável técnico" value={editMode ? (editData.technicalResponsible || "") : (selectedEvent.technicalResponsible || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, technicalResponsible: e.target.value}))}/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Público-alvo</label>
                          <input className={inputCls} placeholder="Ex: Corredores amadores e profissionais acima de 18 anos" value={editMode ? (editData.targetAudience || "") : (selectedEvent.targetAudience || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, targetAudience: e.target.value}))}/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Descrição Completa</label>
                          <textarea rows={3} className={inputCls + " resize-none"} value={editMode ? (editData.description || "") : selectedEvent.description} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, description: e.target.value}))}/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Objetivos</label>
                          <textarea rows={2} className={inputCls + " resize-none"} placeholder="Objetivos estratégicos do evento" value={editMode ? (editData.objectives || "") : (selectedEvent.objectives || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, objectives: e.target.value}))}/>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-slate-100">
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2"><Calendar size={13}/> Fases e Datas do Evento</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { field: "planning" as const,       label: "Planejamento" },
                          { field: "preProduction" as const,  label: "Pré-produção" },
                          { field: "assembly" as const,       label: "Montagem" },
                          { field: "rehearsals" as const,     label: "Ensaios" },
                          { field: "opening" as const,        label: "Abertura" },
                          { field: "execution" as const,      label: "Execução" },
                          { field: "closure" as const,        label: "Encerramento" },
                          { field: "disassembly" as const,    label: "Desmontagem" },
                          { field: "postEvent" as const,      label: "Pós-evento" },
                        ].map(p => (
                          <div key={p.field}>
                            <label className={labelCls}>{p.label}</label>
                            <input type="date" className={inputCls}
                              value={editMode ? (editData.phases?.[p.field] || "") : (selectedEvent.phases?.[p.field] || "")}
                              disabled={!editMode}
                              onChange={e => setEditData(prev => ({
                                ...prev,
                                phases: { ...(prev.phases || selectedEvent.phases || {}), [p.field]: e.target.value }
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PROGRAMAÇÃO ── */}
                {tab === "programacao" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Cronograma do Evento</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedEvent.schedule?.length || 0} atividades programadas</p>
                      </div>
                      <button
                        onClick={() => setShowAddSchedule(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <Plus size={13}/> Nova Atividade
                      </button>
                    </div>

                    {showAddSchedule && (
                      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-violet-800">Nova Atividade</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className={labelCls}>Horário *</label>
                            <input type="time" className={inputCls} value={newSchedule.time || ""} onChange={e => setNewSchedule(p => ({...p, time: e.target.value}))}/>
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Atividade *</label>
                            <input className={inputCls} placeholder="Nome da atividade" value={newSchedule.activity || ""} onChange={e => setNewSchedule(p => ({...p, activity: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Responsável</label>
                            <input className={inputCls} placeholder="Ex: COORDINATOR" value={newSchedule.responsibility || ""} onChange={e => setNewSchedule(p => ({...p, responsibility: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Local</label>
                            <input className={inputCls} placeholder="Ex: Palco Principal" value={newSchedule.location || ""} onChange={e => setNewSchedule(p => ({...p, location: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Duração (min)</label>
                            <input type="number" className={inputCls} value={newSchedule.estimatedDuration || 60} onChange={e => setNewSchedule(p => ({...p, estimatedDuration: Number(e.target.value)}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Status</label>
                            <select className={inputCls} value={newSchedule.itemStatus || "PENDING"} onChange={e => setNewSchedule(p => ({...p, itemStatus: e.target.value as any}))}>
                              <option value="PENDING">Pendente</option>
                              <option value="IN_PROGRESS">Em Andamento</option>
                              <option value="COMPLETED">Concluída</option>
                              <option value="DELAYED">Atrasada</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Observações</label>
                            <input className={inputCls} placeholder="Notas adicionais" value={newSchedule.notes || ""} onChange={e => setNewSchedule(p => ({...p, notes: e.target.value}))}/>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={addScheduleItem} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-500 transition-all">Adicionar</button>
                          <button onClick={() => setShowAddSchedule(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {(selectedEvent.schedule || []).map((sch, idx) => (
                        <div key={sch.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all">
                          <div className="flex items-center gap-3 p-3.5">
                            <div className="w-16 text-center shrink-0">
                              <div className="text-sm font-black text-violet-700 font-mono">{sch.time}</div>
                            </div>
                            <div className="w-px h-10 bg-slate-200 shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-slate-900">{sch.activity}</span>
                                {sch.itemStatus && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${SCHEDULE_STATUS_STYLES[sch.itemStatus] || "bg-slate-100 text-slate-500"}`}>
                                    {sch.itemStatus}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {sch.responsibility && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Users size={10}/>{sch.responsibility}</span>}
                                {sch.location && <span className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin size={10}/>{sch.location}</span>}
                                {sch.estimatedDuration && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10}/>{sch.estimatedDuration}min</span>}
                              </div>
                              {sch.notes && <p className="text-[10px] text-slate-400 mt-0.5 italic">{sch.notes}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                value={sch.itemStatus || "PENDING"}
                                onChange={e => updateScheduleStatus(sch.id, e.target.value as any)}
                                className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] py-1 px-1.5 outline-none focus:ring-1 focus:ring-violet-500"
                              >
                                <option value="PENDING">Pendente</option>
                                <option value="IN_PROGRESS">Em Andamento</option>
                                <option value="COMPLETED">Concluída</option>
                                <option value="DELAYED">Atrasada</option>
                              </select>
                              <button onClick={() => deleteScheduleItem(sch.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(selectedEvent.schedule || []).length === 0 && (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <Clock size={24} className="mx-auto mb-2 opacity-50"/>
                          <p className="text-xs">Nenhuma atividade programada.</p>
                          <button onClick={() => setShowAddSchedule(true)} className="mt-2 text-xs text-violet-600 font-bold hover:underline">+ Adicionar Atividade</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── CHECKLISTS ── */}
                {tab === "checklists" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Checklists Inteligentes</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {selectedEvent.checklist?.filter(c => c.completed).length || 0}/{selectedEvent.checklist?.length || 0} concluídos
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={checklistFilter}
                          onChange={e => setChecklistFilter(e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="ALL">Todas as Categorias</option>
                          {CHECKLIST_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                        <button
                          onClick={() => setShowAddChecklist(v => !v)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                        >
                          <Plus size={13}/> Nova Tarefa
                        </button>
                      </div>
                    </div>

                    {showAddChecklist && (
                      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-violet-800">Nova Tarefa de Checklist</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Tarefa *</label>
                            <input className={inputCls} placeholder="Descreva a tarefa" value={newChecklist.task || ""} onChange={e => setNewChecklist(p => ({...p, task: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Categoria</label>
                            <select className={inputCls} value={newChecklist.category || ChecklistCategory.PLANEJAMENTO} onChange={e => setNewChecklist(p => ({...p, category: e.target.value as ChecklistCategory}))}>
                              {CHECKLIST_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Prioridade</label>
                            <select className={inputCls} value={newChecklist.priority || "MEDIUM"} onChange={e => setNewChecklist(p => ({...p, priority: e.target.value as any}))}>
                              <option value="LOW">Baixa</option>
                              <option value="MEDIUM">Média</option>
                              <option value="HIGH">Alta</option>
                              <option value="CRITICAL">Crítica</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Responsável</label>
                            <input className={inputCls} placeholder="Nome do responsável" value={newChecklist.responsible || ""} onChange={e => setNewChecklist(p => ({...p, responsible: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Prazo</label>
                            <input type="date" className={inputCls} value={newChecklist.deadline || ""} onChange={e => setNewChecklist(p => ({...p, deadline: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Cargo / Função</label>
                            <input className={inputCls} placeholder="Ex: COORDINATOR" value={newChecklist.assigneeRole || ""} onChange={e => setNewChecklist(p => ({...p, assigneeRole: e.target.value}))}/>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={addChecklistItem} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-500 transition-all">Adicionar</button>
                          <button onClick={() => setShowAddChecklist(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
                        </div>
                      </div>
                    )}

                    {CHECKLIST_CATEGORIES.map(cat => {
                      const items = (selectedEvent.checklist || []).filter(c =>
                        (checklistFilter === "ALL" || c.category === checklistFilter) &&
                        (c.category === cat.key || (!c.category && cat.key === ChecklistCategory.PLANEJAMENTO))
                      );
                      if (items.length === 0 && checklistFilter !== "ALL" && checklistFilter !== cat.key) return null;
                      if (items.length === 0 && checklistFilter === "ALL") return null;

                      const completed = items.filter(i => i.completed).length;
                      return (
                        <div key={cat.key} className="border border-slate-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedChecklist(expandedChecklist === cat.key ? null : cat.key)}
                            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`p-1.5 rounded-lg border ${cat.color}`}>{cat.icon}</span>
                              <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                              <span className="text-[10px] text-slate-400">{completed}/{items.length} concluídos</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-violet-500 h-full" style={{ width: `${items.length ? (completed/items.length)*100 : 0}%` }}/>
                              </div>
                              {expandedChecklist === cat.key ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
                            </div>
                          </button>
                          {expandedChecklist === cat.key && (
                            <div className="divide-y divide-slate-100">
                              {items.map(item => (
                                <div key={item.id} className={`flex items-start gap-3 p-3.5 ${item.completed ? "bg-slate-50/50" : "bg-white"} hover:bg-slate-50 transition-all`}>
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => toggleChecklistItem(item.id)}
                                    className="mt-0.5 w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 shrink-0 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-xs ${item.completed ? "line-through text-slate-400" : "text-slate-800 font-medium"}`}>
                                      {item.task}
                                    </span>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      {item.responsible && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Users size={9}/>{item.responsible}</span>}
                                      {item.deadline && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={9}/>{formatDate(item.deadline)}</span>}
                                      {item.assigneeRole && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{item.assigneeRole}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {item.priority && (
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${PRIORITY_STYLES[item.priority]}`}>
                                        {item.priority}
                                      </span>
                                    )}
                                    <button onClick={() => deleteChecklistItem(item.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                      <Trash2 size={12}/>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(selectedEvent.checklist || []).length === 0 && (
                      <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <CheckSquare size={24} className="mx-auto mb-2 opacity-50"/>
                        <p className="text-xs">Nenhum item no checklist.</p>
                        <button onClick={() => setShowAddChecklist(true)} className="mt-2 text-xs text-violet-600 font-bold hover:underline">+ Adicionar Tarefa</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── INFRAESTRUTURA ── */}
                {tab === "infraestrutura" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Gestão de Infraestrutura</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedEvent.infrastructure?.length || 0} itens cadastrados</p>
                      </div>
                      <button
                        onClick={() => setShowAddInfra(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <Plus size={13}/> Novo Item
                      </button>
                    </div>

                    {showAddInfra && (
                      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-violet-800">Novo Item de Infraestrutura</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className={labelCls}>Item *</label>
                            <input className={inputCls} placeholder="Ex: Gerador de 500kVA" value={newInfra.name || ""} onChange={e => setNewInfra(p => ({...p, name: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Qtd</label>
                            <input type="number" min="1" className={inputCls} value={newInfra.quantity || 1} onChange={e => setNewInfra(p => ({...p, quantity: Number(e.target.value)}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Categoria</label>
                            <select className={inputCls} value={newInfra.category || "Palco"} onChange={e => setNewInfra(p => ({...p, category: e.target.value}))}>
                              {["Palco", "Energia", "Segurança", "Sanitários", "TI", "Sinalização", "Alimentação", "Credenciamento", "Outros"].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Status</label>
                            <select className={inputCls} value={newInfra.status || "Pendente"} onChange={e => setNewInfra(p => ({...p, status: e.target.value}))}>
                              <option value="Pendente">Pendente</option>
                              <option value="Confirmado">Confirmado</option>
                              <option value="Em trânsito">Em trânsito</option>
                              <option value="Entregue">Entregue</option>
                              <option value="Devolvido">Devolvido</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Local de Instalação</label>
                            <input className={inputCls} placeholder="Ex: Área VIP" value={newInfra.location || ""} onChange={e => setNewInfra(p => ({...p, location: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Fornecedor</label>
                            <input className={inputCls} placeholder="Nome do fornecedor" value={newInfra.supplier || ""} onChange={e => setNewInfra(p => ({...p, supplier: e.target.value}))}/>
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Observações</label>
                            <input className={inputCls} placeholder="Notas adicionais" value={newInfra.notes || ""} onChange={e => setNewInfra(p => ({...p, notes: e.target.value}))}/>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={addInfraItem} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-500 transition-all">Adicionar</button>
                          <button onClick={() => setShowAddInfra(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
                        </div>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-3">
                      {(selectedEvent.infrastructure || []).map(item => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                {item.category && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${INFRA_CATEGORY_COLORS[item.category] || "bg-slate-100 text-slate-600"}`}>
                                    {item.category}
                                  </span>
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  item.status === "Entregue" ? "bg-green-100 text-green-700" :
                                  item.status === "Confirmado" ? "bg-blue-100 text-blue-700" :
                                  item.status === "Em trânsito" ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-500"
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                              <span className="font-semibold text-xs text-slate-900 block">{item.name}</span>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[10px] text-slate-500">Qtd: <strong>{item.quantity}</strong></span>
                                {item.location && <span className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin size={9}/>{item.location}</span>}
                                {item.supplier && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Building size={9}/>{item.supplier}</span>}
                              </div>
                              {item.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{item.notes}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <select
                                value={item.status}
                                onChange={e => updateInfraStatus(item.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] py-1 px-1.5 outline-none focus:ring-1 focus:ring-violet-500"
                              >
                                <option>Pendente</option>
                                <option>Confirmado</option>
                                <option>Em trânsito</option>
                                <option>Entregue</option>
                                <option>Devolvido</option>
                              </select>
                              <button onClick={() => deleteInfraItem(item.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                <Trash2 size={12}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(selectedEvent.infrastructure || []).length === 0 && (
                      <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Layers size={24} className="mx-auto mb-2 opacity-50"/>
                        <p className="text-xs">Nenhum item de infraestrutura cadastrado.</p>
                        <button onClick={() => setShowAddInfra(true)} className="mt-2 text-xs text-violet-600 font-bold hover:underline">+ Adicionar Item</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── LOGÍSTICA ── */}
                {tab === "logistica" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Gestão Logística</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Transporte, hospedagem, voos e transferências</p>
                      </div>
                      <button
                        onClick={() => setShowAddLogistics(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <Plus size={13}/> Nova Entrada
                      </button>
                    </div>

                    {showAddLogistics && (
                      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-violet-800">Nova Entrada Logística</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className={labelCls}>Tipo *</label>
                            <select className={inputCls} value={newLogistics.type || "TRANSPORT"} onChange={e => setNewLogistics(p => ({...p, type: e.target.value as any}))}>
                              <option value="TRANSPORT">Transporte</option>
                              <option value="ACCOMMODATION">Hospedagem</option>
                              <option value="FLIGHT">Voo</option>
                              <option value="TRANSFER">Transfer</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Descrição *</label>
                            <input className={inputCls} placeholder="Ex: Van para transporte de atletas" value={newLogistics.description || ""} onChange={e => setNewLogistics(p => ({...p, description: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Responsável</label>
                            <input className={inputCls} placeholder="Ex: Coord. Logística" value={newLogistics.responsible || ""} onChange={e => setNewLogistics(p => ({...p, responsible: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Data</label>
                            <input type="date" className={inputCls} value={newLogistics.date || ""} onChange={e => setNewLogistics(p => ({...p, date: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Status</label>
                            <select className={inputCls} value={newLogistics.status || "PENDING"} onChange={e => setNewLogistics(p => ({...p, status: e.target.value as any}))}>
                              <option value="PENDING">Pendente</option>
                              <option value="CONFIRMED">Confirmado</option>
                              <option value="COMPLETED">Concluído</option>
                              <option value="CANCELLED">Cancelado</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Origem</label>
                            <input className={inputCls} placeholder="Ex: Aeroporto Guarulhos" value={newLogistics.origin || ""} onChange={e => setNewLogistics(p => ({...p, origin: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Destino</label>
                            <input className={inputCls} placeholder="Ex: Hotel Grand São Paulo" value={newLogistics.destination || ""} onChange={e => setNewLogistics(p => ({...p, destination: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Veículo / Empresa</label>
                            <input className={inputCls} placeholder="Ex: Ônibus Executivo / LATAM" value={newLogistics.vehicle || ""} onChange={e => setNewLogistics(p => ({...p, vehicle: e.target.value}))}/>
                          </div>
                          <div>
                            <label className={labelCls}>Capacidade / Vagas</label>
                            <input type="number" min="1" className={inputCls} value={newLogistics.capacity || 1} onChange={e => setNewLogistics(p => ({...p, capacity: Number(e.target.value)}))}/>
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Observações</label>
                            <input className={inputCls} placeholder="Notas adicionais" value={newLogistics.notes || ""} onChange={e => setNewLogistics(p => ({...p, notes: e.target.value}))}/>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={addLogisticsItem} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-500 transition-all">Adicionar</button>
                          <button onClick={() => setShowAddLogistics(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {(selectedEvent.logistics || []).map(log => {
                        const typeIcons: Record<string, React.ReactNode> = {
                          TRANSPORT:     <Truck size={14} className="text-blue-600"/>,
                          ACCOMMODATION: <Building size={14} className="text-emerald-600"/>,
                          FLIGHT:        <Navigation size={14} className="text-violet-600"/>,
                          TRANSFER:      <Activity size={14} className="text-amber-600"/>,
                        };
                        return (
                          <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-all">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                  {typeIcons[log.type] || <Truck size={14}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-xs text-slate-900">{log.description}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${LOGISTICS_STATUS_STYLES[log.status]}`}>
                                      {log.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={9}/>{formatDate(log.date)}</span>
                                    {log.responsible && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Users size={9}/>{log.responsible}</span>}
                                    {log.vehicle && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Truck size={9}/>{log.vehicle}</span>}
                                    {log.capacity && <span className="text-[10px] text-slate-500">{log.capacity} vagas</span>}
                                  </div>
                                  {(log.origin || log.destination) && (
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                                      {log.origin && <span className="flex items-center gap-1"><MapPin size={9} className="text-green-500"/>{log.origin}</span>}
                                      {log.origin && log.destination && <ChevronRight size={10} className="text-slate-300"/>}
                                      {log.destination && <span className="flex items-center gap-1"><MapPin size={9} className="text-red-500"/>{log.destination}</span>}
                                    </div>
                                  )}
                                  {log.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{log.notes}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <select
                                  value={log.status}
                                  onChange={e => updateLogisticsStatus(log.id, e.target.value as any)}
                                  className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] py-1 px-1.5 outline-none focus:ring-1 focus:ring-violet-500"
                                >
                                  <option value="PENDING">Pendente</option>
                                  <option value="CONFIRMED">Confirmado</option>
                                  <option value="COMPLETED">Concluído</option>
                                  <option value="CANCELLED">Cancelado</option>
                                </select>
                                <button onClick={() => deleteLogisticsItem(log.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(selectedEvent.logistics || []).length === 0 && (
                      <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Truck size={24} className="mx-auto mb-2 opacity-50"/>
                        <p className="text-xs">Nenhuma entrada logística cadastrada.</p>
                        <button onClick={() => setShowAddLogistics(true)} className="mt-2 text-xs text-violet-600 font-bold hover:underline">+ Adicionar Logística</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── LOCALIZAÇÃO ── */}
                {tab === "localizacao" && (
                  <div className="space-y-5">
                    {!editMode && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                        <AlertTriangle size={14}/>
                        <span>Clique em <strong>Editar Evento</strong> no cabeçalho para editar a localização.</span>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2"><Globe size={13}/> Endereço Completo</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Localização Principal</label>
                          <input className={inputCls} value={editMode ? (editData.location || "") : selectedEvent.location} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, location: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>País</label>
                          <input className={inputCls} placeholder="Ex: Brasil" value={editMode ? (editData.country || "") : (selectedEvent.country || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, country: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Estado / UF</label>
                          <input className={inputCls} placeholder="Ex: São Paulo" value={editMode ? (editData.state || "") : (selectedEvent.state || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, state: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Cidade</label>
                          <input className={inputCls} placeholder="Ex: São Paulo" value={editMode ? (editData.city || "") : (selectedEvent.city || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, city: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>CEP</label>
                          <input className={inputCls} placeholder="Ex: 01310-100" value={editMode ? (editData.zipCode || "") : (selectedEvent.zipCode || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, zipCode: e.target.value}))}/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Endereço Completo</label>
                          <input className={inputCls} placeholder="Rua, número, bairro" value={editMode ? (editData.address || "") : (selectedEvent.address || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, address: e.target.value}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Latitude</label>
                          <input type="number" step="0.00001" className={inputCls} placeholder="-23.5615"
                            value={editMode ? (editData.coordinates?.lat ?? "") : (selectedEvent.coordinates?.lat ?? "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, coordinates: { lat: Number(e.target.value), lng: p.coordinates?.lng || selectedEvent.coordinates?.lng || 0 }}))}/>
                        </div>
                        <div>
                          <label className={labelCls}>Longitude</label>
                          <input type="number" step="0.00001" className={inputCls} placeholder="-46.6562"
                            value={editMode ? (editData.coordinates?.lng ?? "") : (selectedEvent.coordinates?.lng ?? "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, coordinates: { lat: p.coordinates?.lat || selectedEvent.coordinates?.lat || 0, lng: Number(e.target.value) }}))}/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Link do Mapa (Google Maps / Waze)</label>
                          <input className={inputCls} placeholder="https://goo.gl/maps/..." value={editMode ? (editData.mapLink || "") : (selectedEvent.mapLink || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, mapLink: e.target.value}))}/>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Rotas de Emergência</label>
                          <textarea rows={2} className={inputCls + " resize-none"} placeholder="Descreva as rotas de emergência e saídas de segurança"
                            value={editMode ? (editData.emergencyRoutes || "") : (selectedEvent.emergencyRoutes || "")} disabled={!editMode}
                            onChange={e => setEditData(p => ({...p, emergencyRoutes: e.target.value}))}/>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.coordinates?.lat && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2"><MapPin size={13}/> Coordenadas Geográficas</h4>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>📍 Lat: <strong className="font-mono">{selectedEvent.coordinates.lat}</strong></span>
                          <span>📍 Lng: <strong className="font-mono">{selectedEvent.coordinates.lng}</strong></span>
                          {selectedEvent.mapLink && (
                            <a href={selectedEvent.mapLink} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-violet-600 hover:text-violet-500 font-bold">
                              <Globe size={12}/> Ver no Mapa
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden" style={{ height: 200 }}>
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <MapPin size={32} className="mx-auto mb-2 opacity-40"/>
                          <p className="text-xs font-medium">Mapa interativo</p>
                          <p className="text-[10px]">Integração com Google Maps disponível via API Key</p>
                          {selectedEvent.coordinates?.lat && (
                            <a
                              href={selectedEvent.mapLink || `https://www.google.com/maps?q=${selectedEvent.coordinates.lat},${selectedEvent.coordinates.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-3 px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-bold hover:bg-slate-50 transition-all"
                            >
                              Abrir no Google Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── IA ASSISTENTE ── */}
                {tab === "ia" && (
                  <div className="space-y-5">

                    {/* View Toggle */}
                    <div className="flex items-center gap-3">
                      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        <button
                          onClick={() => setAiView("briefing")}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            aiView === "briefing" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Wand2 size={13}/> Briefing
                        </button>
                        <button
                          onClick={() => setAiView("chat")}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            aiView === "chat" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Bot size={13}/> Chat
                          {chatMessages.length > 0 && (
                            <span className="w-4 h-4 bg-violet-600 text-white rounded-full text-[9px] flex items-center justify-center font-black">
                              {chatMessages.filter(m => m.role === "assistant").length}
                            </span>
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Sparkles size={10}/> Powered by Gemini 2.0 Flash
                      </span>
                    </div>

                    {/* ── CHAT VIEW ── */}
                    {aiView === "chat" && (
                      <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: 520 }}>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900 to-violet-950 border-b border-slate-700">
                          <div className="w-8 h-8 rounded-xl bg-violet-500/30 border border-violet-400/40 flex items-center justify-center shrink-0">
                            <Bot size={16} className="text-violet-300"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white">Consultor IA · {selectedEvent?.name}</p>
                            <p className="text-[10px] text-violet-300">Especialista em produção de eventos</p>
                          </div>
                          {chatMessages.length > 0 && (
                            <button
                              onClick={() => setChatMessages([])}
                              className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-all"
                              title="Limpar conversa"
                            >
                              <Trash2 size={10}/> Limpar
                            </button>
                          )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                          {chatMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-6">
                              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                                <Bot size={28} className="text-violet-500"/>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700">Olá! Sou seu consultor de eventos.</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                  Faço perguntas sobre o planejamento de <strong>{selectedEvent?.name}</strong>. Experimente:
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                                {[
                                  "O que está faltando no checklist?",
                                  "Sugira um layout de palco para " + (selectedEvent?.capacity || 500) + " pessoas",
                                  "Quais são os maiores riscos deste evento?",
                                  "Crie uma ordem de serviço resumida",
                                ].map(suggestion => (
                                  <button
                                    key={suggestion}
                                    onClick={() => { setChatInput(suggestion); }}
                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-xs text-slate-600 hover:text-violet-700 rounded-xl transition-all text-left shadow-sm"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                              {/* Avatar */}
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                msg.role === "user" ? "bg-violet-600" : "bg-slate-200"
                              }`}>
                                {msg.role === "user"
                                  ? <Users size={13} className="text-white"/>
                                  : <Bot size={13} className="text-slate-600"/>
                                }
                              </div>
                              {/* Bubble */}
                              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                msg.role === "user"
                                  ? "bg-violet-600 text-white rounded-tr-sm"
                                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                              }`}>
                                {msg.text.split("\n").map((line, li) => (
                                  <p key={li} className={li > 0 ? "mt-1.5" : ""}>{line}</p>
                                ))}
                                <p className={`text-[9px] mt-1.5 ${msg.role === "user" ? "text-violet-200" : "text-slate-300"}`}>
                                  {new Date(msg.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Typing indicator */}
                          {chatSending && (
                            <div className="flex gap-3">
                              <div className="w-7 h-7 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                                <Bot size={13} className="text-slate-600"/>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"/>
                                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}/>
                                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}/>
                              </div>
                            </div>
                          )}
                          <div ref={chatBottomRef}/>
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 bg-white border-t border-slate-200">
                          <div className="flex items-end gap-2">
                            <textarea
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  sendChat();
                                }
                              }}
                              disabled={chatSending}
                              placeholder={`Pergunte algo sobre ${selectedEvent?.name}…`}
                              rows={2}
                              className="flex-1 resize-none text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 disabled:opacity-60 transition-all"
                            />
                            <button
                              onClick={sendChat}
                              disabled={chatSending || !chatInput.trim()}
                              className="h-10 w-10 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-sm shrink-0"
                            >
                              {chatSending
                                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                : <ChevronRight size={18}/>
                              }
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1.5">Enter para enviar · Shift+Enter para nova linha</p>
                        </div>
                      </div>
                    )}

                    {/* ── BRIEFING VIEW ── */}
                    {aiView === "briefing" && (
                    <div className="space-y-5">

                    {/* Hero / Intro card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 rounded-2xl p-6 text-white">
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 60%)" }}
                      />
                      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-violet-500/30 border border-violet-400/40 flex items-center justify-center shrink-0">
                          <Sparkles size={28} className="text-violet-300"/>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-black text-white">Gerador de Briefing IA</h3>
                          <p className="text-xs text-violet-200 mt-1 leading-relaxed">
                            A IA analisa o tipo, capacidade, público-alvo e objetivos do evento e gera automaticamente
                            um conjunto completo de sugestões para <strong className="text-white">checklist</strong>,&nbsp;
                            <strong className="text-white">programação</strong>,&nbsp;
                            <strong className="text-white">infraestrutura</strong>,&nbsp;
                            <strong className="text-white">riscos</strong> e&nbsp;
                            <strong className="text-white">logística</strong>.
                          </p>
                          <div className="mt-2 text-[10px] text-violet-300 flex items-center gap-1.5">
                            <Bot size={11}/> Powered by Google Gemini 2.0 Flash
                          </div>
                        </div>
                        <button
                          onClick={generateBrief}
                          disabled={aiLoading}
                          className="shrink-0 flex items-center gap-2 px-5 py-3 bg-violet-500 hover:bg-violet-400 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-900/40 transition-all"
                        >
                          {aiLoading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Wand2 size={16}/>
                              {aiBrief ? "Gerar Novamente" : "Gerar Briefing"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Error state */}
                    {aiError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                        <div>
                          <p className="text-xs font-bold text-red-700">Erro ao gerar briefing</p>
                          <p className="text-xs text-red-600 mt-0.5">{aiError}</p>
                        </div>
                      </div>
                    )}

                    {/* Loading skeleton */}
                    {aiLoading && (
                      <div className="space-y-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="bg-slate-100 rounded-xl h-20 animate-pulse"/>
                        ))}
                        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2 py-2">
                          <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"/>
                          <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}/>
                          <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}/>
                          <span>Analisando o evento e gerando sugestões especializadas...</span>
                        </div>
                      </div>
                    )}

                    {/* Results */}
                    {aiBrief && !aiLoading && (
                      <div className="space-y-4">

                        {/* Summary */}
                        {aiBrief.summary && (
                          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
                            <Sparkles size={16} className="text-violet-600 shrink-0 mt-0.5"/>
                            <p className="text-xs text-violet-800 leading-relaxed font-medium">{aiBrief.summary}</p>
                          </div>
                        )}

                        {/* Section switcher */}
                        <div className="flex flex-wrap gap-2">
                          {(["checklist","schedule","infrastructure","risks","logistics"] as const).map(sec => {
                            const counts: Record<string, number> = {
                              checklist: aiBrief.checklist?.length || 0,
                              schedule: aiBrief.schedule?.length || 0,
                              infrastructure: aiBrief.infrastructure?.length || 0,
                              risks: aiBrief.risks?.length || 0,
                              logistics: aiBrief.logistics?.length || 0,
                            };
                            const labels: Record<string, string> = {
                              checklist: "Checklist", schedule: "Programação",
                              infrastructure: "Infraestrutura", risks: "Riscos", logistics: "Logística"
                            };
                            const icons: Record<string, React.ReactNode> = {
                              checklist: <CheckSquare size={12}/>, schedule: <Clock size={12}/>,
                              infrastructure: <Layers size={12}/>, risks: <AlertTriangle size={12}/>, logistics: <Truck size={12}/>
                            };
                            const isApplied = aiApplied.has(sec);
                            return (
                              <button
                                key={sec}
                                onClick={() => setAiActiveSection(sec)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                  aiActiveSection === sec
                                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {isApplied ? <CheckCheck size={12} className="text-emerald-400"/> : icons[sec]}
                                {labels[sec]}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  aiActiveSection === sec ? "bg-white/20" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {counts[sec]}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Checklist suggestions */}
                        {aiActiveSection === "checklist" && aiBrief.checklist && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{aiBrief.checklist.length} tarefas sugeridas</span>
                              {!aiApplied.has("checklist") ? (
                                <button onClick={() => applyAiChecklist(aiBrief.checklist)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all">
                                  <CheckCheck size={13}/> Aplicar Tudo ao Checklist
                                </button>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                  <CheckCheck size={14}/> Adicionado ao evento!
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {aiBrief.checklist.map((item, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 hover:border-slate-300 transition-all">
                                  <CheckSquare size={14} className="text-violet-500 mt-0.5 shrink-0"/>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800">{item.task}</p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{item.category?.replace(/_/g," ")}</span>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${PRIORITY_STYLES[item.priority] || "bg-slate-100 text-slate-500"}`}>{item.priority}</span>
                                      {item.responsible && <span className="text-[9px] text-slate-400">{item.responsible}</span>}
                                      {item.deadline_days_before > 0 && <span className="text-[9px] text-slate-400">{item.deadline_days_before} dias antes</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Schedule suggestions */}
                        {aiActiveSection === "schedule" && aiBrief.schedule && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{aiBrief.schedule.length} atividades sugeridas</span>
                              {!aiApplied.has("schedule") ? (
                                <button onClick={() => applyAiSchedule(aiBrief.schedule)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all">
                                  <CheckCheck size={13}/> Aplicar Tudo à Programação
                                </button>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                  <CheckCheck size={14}/> Adicionado ao evento!
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {aiBrief.schedule.map((item, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 hover:border-slate-300 transition-all">
                                  <div className="text-sm font-black text-violet-700 font-mono w-14 shrink-0 mt-0.5">{item.time}</div>
                                  <div className="w-px h-8 bg-slate-200 shrink-0"/>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800">{item.activity}</p>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap text-[10px] text-slate-400">
                                      {item.location && <span className="flex items-center gap-1"><MapPin size={9}/>{item.location}</span>}
                                      {item.responsibility && <span className="flex items-center gap-1"><Users size={9}/>{item.responsibility}</span>}
                                      {item.estimatedDuration && <span className="flex items-center gap-1"><Clock size={9}/>{item.estimatedDuration}min</span>}
                                    </div>
                                    {item.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{item.notes}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Infrastructure suggestions */}
                        {aiActiveSection === "infrastructure" && aiBrief.infrastructure && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{aiBrief.infrastructure.length} itens sugeridos</span>
                              {!aiApplied.has("infrastructure") ? (
                                <button onClick={() => applyAiInfrastructure(aiBrief.infrastructure)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all">
                                  <CheckCheck size={13}/> Aplicar Tudo à Infraestrutura
                                </button>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                  <CheckCheck size={14}/> Adicionado ao evento!
                                </span>
                              )}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {aiBrief.infrastructure.map((item, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-all">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        {item.category && (
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${INFRA_CATEGORY_COLORS[item.category] || "bg-slate-100 text-slate-500"}`}>
                                            {item.category}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 flex-wrap">
                                        <span>Qtd: <strong>{item.quantity}</strong></span>
                                        {item.location && <span className="flex items-center gap-1"><MapPin size={9}/>{item.location}</span>}
                                      </div>
                                      {item.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{item.notes}</p>}
                                    </div>
                                    <Layers size={14} className="text-slate-300 shrink-0 mt-0.5"/>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risk suggestions */}
                        {aiActiveSection === "risks" && aiBrief.risks && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{aiBrief.risks.length} riscos identificados</span>
                              <span className="text-[10px] text-slate-400 italic">Adicione ao módulo de Gestão de Riscos manualmente</span>
                            </div>
                            <div className="space-y-2">
                              {aiBrief.risks.map((item, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-all">
                                  <div className="flex items-start gap-3">
                                    <div className={`px-2 py-1 rounded-lg text-[9px] font-black shrink-0 mt-0.5 ${IMPACT_STYLES[item.impact] || "bg-slate-100 text-slate-500"}`}>
                                      {item.impact}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-slate-800">{item.description}</p>
                                      <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Mitigação</span>
                                        <p className="text-[10px] text-slate-600 leading-relaxed">{item.mitigation}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Logistics suggestions */}
                        {aiActiveSection === "logistics" && aiBrief.logistics && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{aiBrief.logistics.length} entradas logísticas sugeridas</span>
                              {!aiApplied.has("logistics") ? (
                                <button onClick={() => applyAiLogistics(aiBrief.logistics)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all">
                                  <CheckCheck size={13}/> Aplicar Tudo à Logística
                                </button>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                  <CheckCheck size={14}/> Adicionado ao evento!
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {aiBrief.logistics.map((item, i) => {
                                const typeColors: Record<string, string> = {
                                  TRANSPORT: "bg-blue-100 text-blue-700",
                                  ACCOMMODATION: "bg-emerald-100 text-emerald-700",
                                  FLIGHT: "bg-violet-100 text-violet-700",
                                  TRANSFER: "bg-amber-100 text-amber-700",
                                };
                                return (
                                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-all">
                                    <div className="flex items-start gap-3">
                                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black shrink-0 ${typeColors[item.type] || "bg-slate-100 text-slate-500"}`}>
                                        {item.type}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-800">{item.description}</p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap text-[10px] text-slate-400">
                                          {item.vehicle && <span className="flex items-center gap-1"><Truck size={9}/>{item.vehicle}</span>}
                                          {item.capacity && <span>{item.capacity} vagas</span>}
                                          {item.responsible && <span className="flex items-center gap-1"><Users size={9}/>{item.responsible}</span>}
                                        </div>
                                        {(item.origin || item.destination) && (
                                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                            {item.origin && <span className="flex items-center gap-1"><MapPin size={9} className="text-green-500"/>{item.origin}</span>}
                                            {item.origin && item.destination && <ChevronRight size={10} className="text-slate-300"/>}
                                            {item.destination && <span className="flex items-center gap-1"><MapPin size={9} className="text-red-500"/>{item.destination}</span>}
                                          </div>
                                        )}
                                        {item.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{item.notes}</p>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                    {/* Empty state (no brief generated yet) */}
                    {!aiBrief && !aiLoading && !aiError && (
                      <div className="text-center py-14 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                          <Wand2 size={28} className="text-violet-500"/>
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">Nenhum briefing gerado ainda</h4>
                        <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                          Clique em <strong>Gerar Briefing</strong> acima para que a IA analise este evento e sugira
                          tarefas, programação, infraestrutura, riscos e logística específicos para o seu contexto.
                        </p>
                        <button onClick={generateBrief}
                          className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl mx-auto shadow-md shadow-violet-200 transition-all">
                          <Sparkles size={14}/> Gerar Briefing com IA
                        </button>
                      </div>
                    )}

                    </div>
                    )} {/* end aiView === "briefing" */}

                  </div>
                )}

              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 shadow-sm">
            <Calendar size={40} className="mx-auto mb-4 opacity-30"/>
            <p className="text-sm font-medium">Selecione um evento na lista ao lado</p>
            <button
              onClick={() => { setCreateData({ ...DEFAULT_CREATE }); setShowCreateModal(true); }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <Plus size={13}/> Criar Novo Evento
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL: Criar Evento ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl z-10">
              <div>
                <h3 className="font-black text-sm text-slate-900">Criar Novo Evento</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Preencha as informações para criar e ativar o evento na plataforma.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
                <X size={16}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">

              {/* Informações Principais */}
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5"><Info size={11}/> Informações Principais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nome do Evento *</label>
                    <input
                      required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      placeholder="Ex: Maratona do Sol Natal 2027"
                      value={createData.name || ""}
                      onChange={e => setCreateData(p => ({...p, name: e.target.value}))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo do Evento *</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.type || ""}
                      onChange={e => setCreateData(p => ({...p, type: e.target.value as EventType}))}
                    >
                      {Object.values(EventType).map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Modalidade</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.modality || ""}
                      onChange={e => setCreateData(p => ({...p, modality: e.target.value as EventModality}))}
                    >
                      {Object.values(EventModality).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Inicial</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.status || ""}
                      onChange={e => setCreateData(p => ({...p, status: e.target.value as EventStatus}))}
                    >
                      {Object.values(EventStatus).map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Código Único</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      placeholder="Ex: EVT-2027-001"
                      value={createData.code || ""}
                      onChange={e => setCreateData(p => ({...p, code: e.target.value}))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data Principal *</label>
                    <input
                      required type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.date || ""}
                      onChange={e => setCreateData(p => ({...p, date: e.target.value}))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Localização *</label>
                    <input
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      placeholder="Ex: Parque das Dunas, Natal – RN"
                      value={createData.location || ""}
                      onChange={e => setCreateData(p => ({...p, location: e.target.value}))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
                    <textarea
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white resize-none"
                      placeholder="Descreva o propósito do evento..."
                      value={createData.description || ""}
                      onChange={e => setCreateData(p => ({...p, description: e.target.value}))}
                    />
                  </div>
                </div>
              </div>

              {/* Capacidade & Finanças */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5"><DollarSign size={11}/> Capacidade & Finanças</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Capacidade Máx. *</label>
                    <input
                      required type="number" min={1}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.capacity ?? ""}
                      onChange={e => setCreateData(p => ({...p, capacity: Number(e.target.value)}))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Participantes Esperados</label>
                    <input
                      type="number" min={0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.expectedParticipants ?? ""}
                      onChange={e => setCreateData(p => ({...p, expectedParticipants: Number(e.target.value)}))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preço Base Ingresso (R$)</label>
                    <input
                      type="number" min={0} step={0.01}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.ticketPrice ?? ""}
                      onChange={e => setCreateData(p => ({...p, ticketPrice: Number(e.target.value)}))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class. Etária</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.ageClassification || ""}
                      onChange={e => setCreateData(p => ({...p, ageClassification: e.target.value}))}
                    >
                      <option value="">Livre (L)</option>
                      <option value="10+">10 anos</option>
                      <option value="12+">12 anos</option>
                      <option value="14+">14 anos</option>
                      <option value="16+">16 anos</option>
                      <option value="18+">18 anos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Idioma Principal</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      value={createData.primaryLanguage || "pt-BR"}
                      onChange={e => setCreateData(p => ({...p, primaryLanguage: e.target.value}))}
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">Inglês (EUA)</option>
                      <option value="es">Espanhol</option>
                      <option value="fr">Francês</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Responsáveis */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5"><Users size={11}/> Responsáveis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Organizador</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      placeholder="Ex: PLAY+ Produções"
                      value={createData.organizer || ""}
                      onChange={e => setCreateData(p => ({...p, organizer: e.target.value}))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contratante</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      placeholder="Ex: Prefeitura de Natal"
                      value={createData.contractor || ""}
                      onChange={e => setCreateData(p => ({...p, contractor: e.target.value}))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Responsável Técnico</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      placeholder="Nome do responsável"
                      value={createData.technicalResponsible || ""}
                      onChange={e => setCreateData(p => ({...p, technicalResponsible: e.target.value}))}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Público-alvo</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                      placeholder="Ex: Atletas amadores e profissionais a partir de 16 anos"
                      value={createData.targetAudience || ""}
                      onChange={e => setCreateData(p => ({...p, targetAudience: e.target.value}))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-200 disabled:opacity-60">
                  {creating ? <RefreshCw size={13} className="animate-spin"/> : <Plus size={13}/>}
                  {creating ? "Criando..." : "Criar Evento & Gerar Checklist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmar Exclusão ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertOctagon size={24} className="text-red-600"/>
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Excluir Evento</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Esta ação é <strong className="text-slate-700">irreversível</strong>. O evento, todos os ingressos, transações financeiras e dados operacionais associados serão permanentemente excluídos.
                </p>
                {confirmDeleteId && (() => {
                  const ev = events.find(e => e.id === confirmDeleteId);
                  return ev ? (
                    <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs font-bold text-red-700">{ev.name}</p>
                      <p className="text-[10px] text-red-500">{ev.date} · {ev.location}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onDeleteEvent(confirmDeleteId); setConfirmDeleteId(null); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-200"
              >
                Sim, Excluir Evento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
