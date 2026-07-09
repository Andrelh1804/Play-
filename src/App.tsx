/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import { login, logout, getStoredUser, authFetch, type AuthUser } from "./authService";
import LandingPage from "./components/LandingPage";
import CentroOperacoes from "./components/CentroOperacoes";
import AgendaInteligente from "./components/AgendaInteligente";
import CentralTickets from "./components/CentralTickets";
import GestaoEspacos from "./components/GestaoEspacos";
import PesquisaSatisfacao from "./components/PesquisaSatisfacao";
import InteligenciaNegocio from "./components/InteligenciaNegocio";
import GestaoRiscos from "./components/GestaoRiscos";
import Administracao from "./components/Administracao";
import GestaoEventos from "./components/GestaoEventos";
import PlanejamentoFinanceiro from "./components/PlanejamentoFinanceiro";
import TicketingEnterprise from "./components/TicketingEnterprise";
import DashboardExecutivo from "./components/DashboardExecutivo";
import BibliotecaDigital from "./components/BibliotecaDigital";
const playEventosLogo = "/logo.jpg";
import {
  Calendar,
  Ticket,
  DollarSign,
  Users,
  Briefcase,
  Layers,
  FileText,
  UserCheck,
  Megaphone,
  MessageSquare,
  Sparkles,
  TrendingUp,
  MapPin,
  Clock,
  CheckSquare,
  Plus,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  ChevronRight,
  User,
  Activity,
  Award,
  Signature,
  Send,
  Trash2,
  Sliders,
  Globe,
  Menu,
  X,
  DollarSign as MoneyIcon,
  Tag,
  Building2,
  Bell,
  Moon,
  Sun,
  FolderArchive
} from "lucide-react";
import {
  EventType,
  EventStatus,
  TicketType,
  TransactionType,
  TransactionStatus,
  LeadType,
  PipelineStage,
  SupplierCategory,
  StaffRole,
  ContractStatus,
  Tenant,
  Event,
  Ticket as TicketSchema,
  FinanceTransaction,
  CRMLead,
  MarketplaceSupplier,
  Booking,
  Sponsorship,
  PurchaseOrder,
  StaffMember,
  DocumentContract,
  MarketingCampaign,
  StaffTeam,
  StaffShift,
  TimeClock,
  FreelancerPayment,
  StaffMessage,
  LeadFlow,
  SalesFunnel,
  GatewayLog,
  EventPlanning
} from "./types";

// Maps the backend JWT role (RBAC enforced by src/auth.ts + server.ts route guards)
// to the Portuguese "portal" persona used to filter the sidebar/menu below.
// Only SUPER_ADMIN may switch personas from the UI (support/preview use case);
// every other role's menu is locked to what their real backend role allows.
const BACKEND_ROLE_TO_PORTAL: Record<string, string> = {
  SUPER_ADMIN: "Super Administrador da Plataforma",
  ADMIN: "Administrador da Empresa",
  PRODUCER: "Produtor",
  COORDINATOR: "Coordenador",
  STAFF: "Staff",
  VIEWER: "Participante",
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getStoredUser());

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success && result.user) {
      setAuthUser(result.user);
      setIsAuthenticated(true);
      setSelectedRole(BACKEND_ROLE_TO_PORTAL[result.user.role] || "Participante");
    }
    return result;
  };

  const handleLogout = async () => {
    await logout();
    setAuthUser(null);
    setIsAuthenticated(false);
    setShowLanding(true);
  };

  // State variables representing the entire database
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<TicketSchema[]>([]);
  const [finance, setFinance] = useState<FinanceTransaction[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [suppliers, setSuppliers] = useState<MarketplaceSupplier[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [contracts, setContracts] = useState<DocumentContract[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);

  // Expanded Enterprise modules state
  const [teams, setTeams] = useState<StaffTeam[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [clocks, setClocks] = useState<TimeClock[]>([]);
  const [payments, setPayments] = useState<FreelancerPayment[]>([]);
  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>([]);
  const [flows, setFlows] = useState<LeadFlow[]>([]);
  const [funnels, setFunnels] = useState<SalesFunnel[]>([]);
  const [gatewayLogs, setGatewayLogs] = useState<GatewayLog[]>([]);
  const [plannings, setPlannings] = useState<EventPlanning[]>([]);

  // Navigation and UI state
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    const stored = getStoredUser();
    return stored ? (BACKEND_ROLE_TO_PORTAL[stored.role] || "Participante") : "Super Administrador da Plataforma";
  });
  const [staffSection, setStaffSection] = useState<string>("directory");
  const [marketingSection, setMarketingSection] = useState<string>("campaigns");
  const [gatewaySection, setGatewaySection] = useState<string>("logs");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("tenant-1");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("Inscrição");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showLanding, setShowLanding] = useState<boolean>(() => !getStoredUser());
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Apply dark mode class to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Close notifications on Escape or outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowNotifications(false); };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notifications]")) setShowNotifications(false);
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => { document.removeEventListener("keydown", handleKey); document.removeEventListener("mousedown", handleClick); };
  }, [showNotifications]);
  const [notifications] = useState([
    { id: 1, type: "info", title: "Sistema operacional", msg: "Todos os módulos estão funcionando normalmente.", time: "agora" },
    { id: 2, type: "warn", title: "Check-in pendente", msg: "Há participantes aguardando credenciamento.", time: "5 min" },
    { id: 3, type: "success", title: "Relatório exportado", msg: "DRE financeiro disponível para download.", time: "10 min" },
  ]);

  // Event Planning form states
  const [newPlanningMilestone, setNewPlanningMilestone] = useState("");
  const [newPlanningDesc, setNewPlanningDesc] = useState("");
  const [newPlanningDeadline, setNewPlanningDeadline] = useState("");
  const [newPlanningResponsible, setNewPlanningResponsible] = useState("Henrique Silva");

  // AI Chat state
  const [aiMessage, setAiMessage] = useState<string>("");
  const [aiHistory, setAiHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Olá! Sou o assistente de IA Corporativa do PLAY+EVENTOS. Como posso auxiliar nos orçamentos, auditoria de riscos, precificação inteligente ou simulações financeiras hoje?"
    }
  ]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Forms state
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [newEventData, setNewEventData] = useState({
    name: "",
    type: EventType.RUNNING,
    date: new Date().toISOString().split("T")[0],
    description: "",
    location: "",
    capacity: 2000,
    ticketPrice: 150,
    budgetRatio: 0.7,
  });

  const [showAddSponsorshipModal, setShowAddSponsorshipModal] = useState<boolean>(false);
  const [newSponsorshipData, setNewSponsorshipData] = useState({
    sponsorName: "",
    quotaName: "Gold",
    value: 50000,
    deliverables: "",
    status: "PROPOSAL",
    roiRatio: 0
  });

  const [showAddLeadModal, setShowAddLeadModal] = useState<boolean>(false);
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    company: "",
    type: LeadType.SPONSOR,
    email: "",
    phone: "",
    pipelineStage: PipelineStage.LEAD,
    value: 50000,
    notes: "",
  });

  // Local dashboard widgets states
  const [dashboardChecklistInput, setDashboardChecklistInput] = useState<string>("");
  const [dashboardBoothLeadName, setDashboardBoothLeadName] = useState<string>("");
  const [dashboardBoothLeadEmail, setDashboardBoothLeadEmail] = useState<string>("");
  const [dashboardAffiliateCode, setDashboardAffiliateCode] = useState<string>("");
  const [dashboardSponsorRoiConversion, setDashboardSponsorRoiConversion] = useState<number>(3);

  const [ticketPurchaseData, setTicketPurchaseData] = useState({
    name: "",
    email: "",
    cpf: "",
    type: TicketType.SPORTS_REGISTRATION,
    seat: "",
  });

  const [manualFinanceData, setManualFinanceData] = useState({
    type: TransactionType.INCOME,
    category: "Bilheteria Geral",
    amount: 1500,
    description: "Venda de lote físico complementar",
    status: TransactionStatus.PAID,
  });

  const [marketplaceBookingData, setMarketplaceBookingData] = useState({
    supplierId: "",
    hours: 8,
  });

  // Fetch full data state from REST APIs
  const fetchDatabase = async () => {
    try {
      setLoading(true);
      const res = await authFetch("/api/db");
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Erro ao carregar dados do servidor.");
      const data = await res.json();
      
      setTenants(data.tenants || []);
      setEvents(data.events || []);
      setTickets(data.tickets || []);
      setFinance(data.finance || []);
      setLeads(data.leads || []);
      setSuppliers(data.suppliers || []);
      setBookings(data.bookings || []);
      setSponsorships(data.sponsorships || []);
      setPurchaseOrders(data.purchaseOrders || []);
      setStaff(data.staff || []);
      setContracts(data.contracts || []);
      setCampaigns(data.campaigns || []);
      setTeams(data.teams || []);
      setShifts(data.shifts || []);
      setClocks(data.clocks || []);
      setPayments(data.payments || []);
      setStaffMessages(data.messages || []);
      setFlows(data.flows || []);
      setFunnels(data.funnels || []);
      setGatewayLogs(data.gatewayLogs || []);
      setPlannings(data.plannings || []);

      // Auto-select first event if none selected
      if (data.events && data.events.length > 0 && !selectedEventId) {
        setSelectedEventId(data.events[0].id);
      }
      setErrorMsg("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Ocorreu um erro ao buscar dados em tempo real da API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchDatabase();
  }, [isAuthenticated]);

  // Role-based access control and redirection
  const ALL_NEW_MODULES = ["coe", "agenda", "tickets-suporte", "espacos", "satisfacao", "bi", "riscos", "planejamento", "admin", "biblioteca"];
  const rolePermissions: Record<string, string[]> = {
    "Super Administrador da Plataforma": ["dashboard", "events", "ticketing", "finance", "crm", "marketplace", "contracts", "staff", "marketing", "gateway", "chatbot", ...ALL_NEW_MODULES],
    "Administrador da Empresa": ["dashboard", "events", "ticketing", "finance", "crm", "marketplace", "contracts", "staff", "marketing", "gateway", "chatbot", ...ALL_NEW_MODULES],
    "Gestor do Evento": ["dashboard", "events", "ticketing", "finance", "staff", "contracts", "chatbot", "coe", "agenda", "tickets-suporte", "espacos", "riscos"],
    "Produtor": ["dashboard", "events", "marketplace", "contracts", "staff", "chatbot", "agenda", "espacos", "tickets-suporte"],
    "Coordenador": ["dashboard", "events", "staff", "marketplace", "coe", "agenda", "tickets-suporte"],
    "Financeiro": ["dashboard", "finance", "contracts", "chatbot", "bi", "riscos"],
    "Comercial": ["dashboard", "crm", "marketplace", "contracts", "bi", "satisfacao"],
    "Marketing": ["dashboard", "marketing", "crm", "chatbot", "bi", "satisfacao", "agenda"],
    "Compras": ["dashboard", "finance", "marketplace", "espacos"],
    "RH": ["dashboard", "staff", "contracts", "satisfacao"],
    "Staff": ["dashboard", "staff", "agenda"],
    "Contratante": ["dashboard", "contracts"],
    "Patrocinador": ["dashboard", "crm", "contracts", "satisfacao", "bi"],
    "Fornecedor": ["dashboard", "marketplace", "contracts"],
    "Expositor": ["dashboard", "events", "crm", "espacos"],
    "Afiliado": ["dashboard", "marketing", "finance"],
    "Participante": ["dashboard", "ticketing", "events", "satisfacao"],
  };

  useEffect(() => {
    const allowed = rolePermissions[selectedRole] || ["dashboard"];
    if (!allowed.includes(activeTab)) {
      setActiveTab("dashboard");
    }
  }, [selectedRole]);

  // Filter entities by selected Tenant
  const activeTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];
  const filteredEvents = events.filter(e => e.tenantId === selectedTenantId);
  const filteredFinance = finance.filter(f => f.tenantId === selectedTenantId);
  const filteredLeads = leads.filter(l => l.tenantId === selectedTenantId);
  const filteredStaff = staff.filter(s => s.tenantId === selectedTenantId);
  const filteredCampaigns = campaigns.filter(c => c.tenantId === selectedTenantId);
  const filteredContracts = contracts.filter(c => c.tenantId === selectedTenantId);

  // Selected event detailed calculations
  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Global calculations for KPIs
  const totalIncome = filteredFinance
    .filter(f => f.type === TransactionType.INCOME && f.status === TransactionStatus.PAID)
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpense = filteredFinance
    .filter(f => f.type === TransactionType.EXPENSE)
    .reduce((sum, f) => sum + f.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Handlers for dynamic actions
  const handleResetDatabase = async () => {
    if (!window.confirm("Deseja realmente restaurar o banco de dados corporativo para o estado inicial?")) return;
    try {
      setLoading(true);
      const res = await authFetch("/api/db/reset", { method: "POST" });
      if (res.ok) {
        await fetchDatabase();
        alert("O banco de dados do EventFlow Enterprise foi restaurado com sucesso!");
      }
    } catch (err) {
      alert("Falha ao redefinir banco.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEventData,
          tenantId: selectedTenantId,
          checklist: [
            { id: `chk-${Date.now()}-1`, task: "Aprovar plano operacional", completed: false, assigneeRole: "PRODUCER" },
            { id: `chk-${Date.now()}-2`, task: "Registrar fornecedores no marketplace", completed: false, assigneeRole: "COORDINATOR" },
            { id: `chk-${Date.now()}-3`, task: "Liberar bilheteria / lote promocional", completed: false, assigneeRole: "STAFF" }
          ],
          schedule: [
            { id: `sch-${Date.now()}-1`, time: "08:00", activity: "Credenciamento e abertura", responsibility: "STAFF" },
            { id: `sch-${Date.now()}-2`, time: "14:00", activity: "Painel Principal & Ativações de Marca", responsibility: "COORDINATOR" }
          ],
          infrastructure: [
            { id: `inf-${Date.now()}-1`, name: "Tendas de Credenciamento", quantity: 5, status: "Confirmado" },
            { id: `inf-${Date.now()}-2`, name: "Totens Digitais", quantity: 12, status: "Em trânsito" }
          ]
        })
      });
      if (res.ok) {
        const created = await res.json();
        setShowAddEventModal(false);
        setSelectedEventId(created.id);
        fetchDatabase();
        setNewEventData({
          name: "",
          type: EventType.RUNNING,
          date: new Date().toISOString().split("T")[0],
          description: "",
          location: "",
          capacity: 2000,
          ticketPrice: 150,
          budgetRatio: 0.7,
        });
      }
    } catch (err) {
      alert("Erro ao salvar evento.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este evento e todas as suas despesas, inscrições e contratos associados?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedEventId("");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao remover evento.");
    }
  };

  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return alert("Selecione um evento para emitir o ingresso.");
    try {
      const res = await authFetch("/api/tickets/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          tenantId: selectedTenantId,
          ...ticketPurchaseData,
        })
      });
      if (res.ok) {
        alert("Ingresso / Inscrição esportiva emitida com sucesso! O faturamento correspondente foi creditado automaticamente no ERP Financeiro.");
        setTicketPurchaseData({
          name: "",
          email: "",
          cpf: "",
          type: TicketType.SPORTS_REGISTRATION,
          seat: "",
        });
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao efetuar compra de ingresso.");
    }
  };

  const handleToggleCheckin = async (ticketId: string) => {
    try {
      const res = await authFetch("/api/tickets/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId })
      });
      if (res.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddManualFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          eventId: selectedEventId,
          ...manualFinanceData
        })
      });
      if (res.ok) {
        alert("Transação financeira registrada com sucesso!");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao adicionar transação.");
    }
  };

  const handleBookSupplier = async (supplierId: string) => {
    if (!selectedEventId) return alert("Selecione um evento na plataforma para alocar o fornecedor.");
    try {
      const res = await authFetch("/api/marketplace/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          eventId: selectedEventId,
          hours: marketplaceBookingData.hours
        })
      });
      if (res.ok) {
        alert("Fornecedor contratado com sucesso!\n\n1. Agendamento inserido.\n2. Lançamento automático de despesa no fluxo de caixa.\n3. Minuta jurídica com assinatura eletrônica e trilha de auditoria gerada!");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao contratar fornecedor.");
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLeadData,
          tenantId: selectedTenantId
        })
      });
      if (res.ok) {
        setShowAddLeadModal(false);
        fetchDatabase();
        setNewLeadData({
          name: "",
          company: "",
          type: LeadType.SPONSOR,
          email: "",
          phone: "",
          pipelineStage: PipelineStage.LEAD,
          value: 50000,
          notes: "",
        });
      }
    } catch (err) {
      alert("Erro ao salvar Lead.");
    }
  };

  const handleUpdateLeadStage = async (leadId: string, newStage: PipelineStage) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    try {
      await authFetch("/api/leads/" + leadId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lead,
          pipelineStage: newStage
        })
      });
      fetchDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignContract = async (contractId: string, signerName: string) => {
    try {
      const res = await authFetch(`/api/contracts/${contractId}/sign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName })
      });
      if (res.ok) {
        alert("Assinatura eletrônica registrada com sucesso no log criptografado!");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao assinar contrato.");
    }
  };

  const handleStaffCheckIn = async (staffId: string) => {
    try {
      const res = await authFetch("/api/staff/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, type: "IN", method: "DIGITAL_GPS" })
      });
      if (res.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Staff & Team Management Forms and Actions
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamArea, setNewTeamArea] = useState("Credenciamento");
  const [newTeamLeader, setNewTeamLeader] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState(3);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamLeader) return alert("Por favor, preencha todos os campos.");
    try {
      const res = await authFetch("/api/staff/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          area: newTeamArea,
          leaderName: newTeamLeader,
          membersCount: newTeamMembers,
          eventId: selectedEventId,
          tenantId: selectedTenantId
        })
      });
      if (res.ok) {
        alert("Equipe de staff criada com sucesso!");
        setNewTeamName("");
        setNewTeamLeader("");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao criar equipe.");
    }
  };

  const [newShiftStaffId, setNewShiftStaffId] = useState("");
  const [newShiftDate, setNewShiftDate] = useState(new Date().toISOString().split("T")[0]);
  const [newShiftStart, setNewShiftStart] = useState("08:00");
  const [newShiftEnd, setNewShiftEnd] = useState("16:00");
  const [newShiftRole, setNewShiftRole] = useState("STAFF");

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftStaffId) return alert("Selecione um membro do staff.");
    try {
      const res = await authFetch("/api/staff/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: newShiftStaffId,
          eventId: selectedEventId,
          date: newShiftDate,
          startTime: newShiftStart,
          endTime: newShiftEnd,
          role: newShiftRole
        })
      });
      if (res.ok) {
        alert("Escala de trabalho agendada com sucesso!");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao criar escala.");
    }
  };

  const [activeStaffClockId, setActiveStaffClockId] = useState("");
  const [clockMethod, setClockMethod] = useState<"PHYSICAL" | "DIGITAL_GPS">("DIGITAL_GPS");
  const [clockLocationName, setClockLocationName] = useState("Credenciamento Principal");

  const handleRegisterClock = async (type: "IN" | "OUT") => {
    if (!activeStaffClockId) return alert("Selecione um membro do staff para registrar ponto.");
    try {
      const res = await authFetch("/api/staff/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: activeStaffClockId,
          eventId: selectedEventId,
          type,
          method: clockMethod,
          lat: clockMethod === "DIGITAL_GPS" ? -23.5615 : undefined,
          lng: clockMethod === "DIGITAL_GPS" ? -46.6562 : undefined,
          locationName: clockLocationName
        })
      });
      if (res.ok) {
        alert(`Ponto eletrônico de ${type === "IN" ? "Entrada" : "Saída"} registrado com sucesso!`);
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao bater ponto.");
    }
  };

  const handlePayFreelancer = async (paymentId: string) => {
    try {
      const res = await authFetch("/api/staff/payments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, paymentMethod: "PIX" })
      });
      if (res.ok) {
        alert("Pagamento PIX liquidado! Despesa de RH lançada no ERP de forma consolidada.");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao pagar freelancer.");
    }
  };

  const [staffMessageText, setStaffMessageText] = useState("");
  const [staffMessageChannel, setStaffMessageChannel] = useState("Credenciamento");

  const handleSendStaffMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffMessageText.trim()) return;
    try {
      const res = await authFetch("/api/staff/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: staffMessageText,
          channel: staffMessageChannel,
          eventId: selectedEventId,
          tenantId: selectedTenantId
        })
      });
      if (res.ok) {
        setStaffMessageText("");
        fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const res = await authFetch(`/api/campaigns/${campaignId}/send`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (res.ok) {
        alert("Campanha disparada! Cliques e taxas de conversão de leads foram calculados dinamicamente em tempo real.");
        fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Marketing Automation States and Handlers
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [newFlowTrigger, setNewFlowTrigger] = useState("Inscrição Realizada");
  const [newFlowSteps, setNewFlowSteps] = useState([
    { delayDays: 1, channel: "EMAIL", subject: "Confirmação de Inscrição", content: "Seu kit está quase pronto!" },
    { delayDays: 3, channel: "WHATSAPP", content: "Faltam apenas alguns dias para o tiro de largada! Confira o percurso." }
  ]);

  const handleAddFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName) return alert("Preencha o nome do fluxo.");
    try {
      const res = await authFetch("/api/marketing/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFlowName,
          description: newFlowDescription,
          triggerEvent: newFlowTrigger,
          steps: newFlowSteps
        })
      });
      if (res.ok) {
        alert("Fluxo automatizado de nutrição de leads criado com sucesso!");
        setNewFlowName("");
        setNewFlowDescription("");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao criar fluxo de marketing.");
    }
  };

  const handleToggleFlow = async (flowId: string) => {
    try {
      const res = await authFetch("/api/marketing/flows/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flowId })
      });
      if (res.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [newFunnelName, setNewFunnelName] = useState("");
  const [newFunnelProduct, setNewFunnelProduct] = useState("");

  const handleAddFunnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFunnelName || !newFunnelProduct) return alert("Preencha o nome e o produto do funil.");
    try {
      const res = await authFetch("/api/marketing/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFunnelName,
          targetProduct: newFunnelProduct,
          eventId: selectedEventId
        })
      });
      if (res.ok) {
        alert("Novo funil de conversão de vendas desenhado com sucesso!");
        setNewFunnelName("");
        setNewFunnelProduct("");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao criar funil.");
    }
  };

  const [newCampTitle, setNewCampTitle] = useState("");
  const [newCampChannel, setNewCampChannel] = useState("EMAIL");
  const [newCampSubject, setNewCampSubject] = useState("");
  const [newCampContent, setNewCampContent] = useState("");
  const [newCampSegment, setNewCampSegment] = useState("Todos os Leads");

  const handleScheduleCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampTitle || !newCampContent) return alert("Por favor, preencha o título e o conteúdo.");
    try {
      const res = await authFetch("/api/campaigns/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          title: newCampTitle,
          channel: newCampChannel,
          subject: newCampSubject || undefined,
          content: newCampContent,
          targetSegment: newCampSegment
        })
      });
      if (res.ok) {
        alert("Campanha agendada/salva como Rascunho com sucesso!");
        setNewCampTitle("");
        setNewCampSubject("");
        setNewCampContent("");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao agendar campanha.");
    }
  };

  const handleAddPlanning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanningMilestone || !newPlanningDeadline) return alert("Preencha todos os campos obrigatórios.");
    try {
      const res = await authFetch("/api/v1/gateway/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          tenantId: selectedTenantId,
          strategicGoal: newPlanningMilestone,
          phases: [{ name: newPlanningMilestone, description: newPlanningDesc, deadline: newPlanningDeadline, responsible: newPlanningResponsible, status: "PENDING" }],
          risks: [],
          milestones: []
        })
      });
      if (res.ok) {
        alert("Novo marco de planejamento operacional registrado!");
        setNewPlanningMilestone("");
        setNewPlanningDesc("");
        setNewPlanningDeadline("");
        fetchDatabase();
      }
    } catch (err) {
      alert("Erro ao criar planejamento.");
    }
  };

  const handleTriggerGatewaySim = async (type: "REST" | "GRAPHQL" | "RATELIMIT") => {
    try {
      let url = "/api/v1/gateway/graphql";
      let body: any = { query: "query { events { name capacity } }" };
      
      if (type === "GRAPHQL") {
        url = "/api/v1/gateway/graphql";
        body = { query: "query { events { name capacity } }", variables: {} };
      } else if (type === "RATELIMIT") {
        url = "/api/health";
        body = {};
      } else {
        url = "/api/v1/gateway/graphql";
        body = { query: "query { events { name capacity } teamsCount }", variables: {} };
      }

      const res = await authFetch(url, {
        method: type === "RATELIMIT" ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: type === "RATELIMIT" ? undefined : JSON.stringify(body)
      });

      const data = await res.json();
      alert(`API Gateway Retornou (HTTP ${res.status}):\n${JSON.stringify(data, null, 2)}`);
      fetchDatabase();
    } catch (err) {
      alert("Erro ao simular requisição pelo API Gateway.");
    }
  };

  const handleApprovePO = async (poId: string) => {
    try {
      const res = await authFetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: poId, status: "APPROVED" })
      });
      if (res.ok) {
        alert("Pedido de compra aprovado e auditado! Lançamento de despesa adicionado automaticamente no ERP.");
        fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return alert("Selecione um evento antes de cadastrar um patrocínio.");
    try {
      const res = await authFetch("/api/sponsorships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSponsorshipData,
          eventId: selectedEventId,
          value: Number(newSponsorshipData.value),
          roiRatio: Number(newSponsorshipData.roiRatio),
          deliverables: newSponsorshipData.deliverables
            .split("\n").map(s => s.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        setShowAddSponsorshipModal(false);
        setNewSponsorshipData({ sponsorName: "", quotaName: "Gold", value: 50000, deliverables: "", status: "PROPOSAL", roiRatio: 0 });
        fetchDatabase();
      } else {
        const err = await res.json();
        alert("Erro: " + JSON.stringify(err.error));
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteSponsorship = async (id: string) => {
    if (!confirm("Remover este patrocínio?")) return;
    try {
      const res = await authFetch(`/api/sponsorships/${id}`, { method: "DELETE" });
      if (res.ok) fetchDatabase();
    } catch (err) { console.error(err); }
  };

  const handleUpdateSponsorshipStatus = async (id: string, status: string) => {
    try {
      const res = await authFetch(`/api/sponsorships/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchDatabase();
    } catch (err) { console.error(err); }
  };

  const handleSendAiMessage = async (customText?: string) => {
    const textToSend = customText || aiMessage;
    if (!textToSend.trim()) return;

    setAiHistory(prev => [...prev, { sender: "user", text: textToSend }]);
    if (!customText) setAiMessage("");
    setAiLoading(true);

    try {
      const res = await authFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          eventId: selectedEventId
        })
      });
      const data = await res.json();
      if (data.error) {
        setAiHistory(prev => [...prev, { sender: "ai", text: `Erro: ${data.error}` }]);
      } else {
        setAiHistory(prev => [...prev, { sender: "ai", text: data.text }]);
      }
    } catch (err) {
      setAiHistory(prev => [...prev, { sender: "ai", text: "Erro ao se comunicar com o motor de Inteligência Artificial Gemini. Verifique a conexão." }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen w-screen font-sans overflow-hidden relative transition-colors duration-300 ${darkMode ? "bg-slate-900 text-slate-100" : "bg-[#f8fafc] text-slate-800"}`}>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <nav className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-[#090d16] text-slate-400 flex flex-col border-r border-slate-800 select-none transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        
        {/* Logo and Brand */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800 bg-[#0c1220]/50">
          <div className="flex items-center gap-3">
            <img
              src={playEventosLogo}
              alt="PLAY+EVENTOS Logo"
              className="h-12 w-auto object-contain"
              style={{
                maskImage: "radial-gradient(ellipse 80% 78% at 50% 45%, black 48%, transparent 80%)",
                WebkitMaskImage: "radial-gradient(ellipse 80% 78% at 50% 45%, black 48%, transparent 80%)"
              }}
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-white font-black text-sm tracking-wider block font-sans">
                PLAY<span className="text-[#FFE211] font-extrabold">+</span>EVENTOS
              </span>
              <span className="text-[9px] text-[#FFE211] font-bold uppercase tracking-widest block font-mono">
                ENTERPRISE SaaS
              </span>
            </div>
          </div>
        </div>

        {/* Multi-tenant Tenant Switcher */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/30">
          <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block mb-1">
            Empresa / Tenant Ativo
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg text-xs p-2 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold">
              {activeTenant?.plan?.split(" ")[1] || "VIP"}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span>Moeda: <strong className="text-slate-300">{activeTenant?.currency || "BRL"}</strong></span>
            <span>Idioma: <strong className="text-slate-300">{activeTenant?.language || "pt-BR"}</strong></span>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 px-3">
            Módulos Corporativos
          </div>

          {[
            { id: "dashboard", label: "Dashboard Geral", icon: <TrendingUp size={16} /> },
            { id: "events", label: "Gestão de Eventos", icon: <Calendar size={16} />, badge: filteredEvents.length },
            { id: "ticketing", label: "Ticketing & Check-In", icon: <Ticket size={16} /> },
            { id: "finance", label: "ERP Financeiro", icon: <DollarSign size={16} /> },
            { id: "crm", label: "CRM Comercial & Leads", icon: <Users size={16} />, badge: filteredLeads.length },
            { id: "marketplace", label: "Marketplace / Fornecedores", icon: <Briefcase size={16} /> },
            { id: "contracts", label: "Contratos & Auditoria", icon: <FileText size={16} />, badge: filteredContracts.filter(c => c.status === ContractStatus.PENDING_SIGNATURES).length },
            { id: "staff", label: "RH & Staff de Campo", icon: <UserCheck size={16} /> },
            { id: "marketing", label: "Marketing & Campanhas", icon: <Megaphone size={16} /> },
            { id: "gateway", label: "API Gateway & Logs", icon: <Sliders size={16} />, badge: gatewayLogs.length || undefined },
            { id: "chatbot", label: "Assistente de IA", icon: <Sparkles className="text-blue-400" size={16} /> },
            { id: "coe", label: "Centro de Operações", icon: <Activity size={16} className="text-red-400" /> },
            { id: "agenda", label: "Agenda Inteligente", icon: <Calendar size={16} className="text-violet-400" /> },
            { id: "tickets-suporte", label: "Central de Tickets", icon: <MessageSquare size={16} className="text-amber-400" /> },
            { id: "espacos", label: "Espaços & Logística", icon: <MapPin size={16} className="text-emerald-400" /> },
            { id: "satisfacao", label: "Pesquisa & Certificados", icon: <Award size={16} className="text-pink-400" /> },
            { id: "bi", label: "Inteligência de Negócios", icon: <TrendingUp size={16} className="text-blue-400" /> },
            { id: "riscos", label: "Gestão de Riscos", icon: <AlertTriangle size={16} className="text-orange-400" /> },
            { id: "planejamento", label: "Planejamento Financeiro", icon: <DollarSign size={16} className="text-green-400" /> },
            { id: "admin", label: "Administração", icon: <Building2 size={16} className="text-slate-400" /> },
            { id: "biblioteca", label: "Biblioteca Digital", icon: <FolderArchive size={16} className="text-amber-400" /> },
          ].filter(item => (rolePermissions[selectedRole] || []).includes(item.id)).map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20 font-bold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isActive ? "bg-white text-blue-600" : "bg-slate-800 text-slate-300"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800/60 mt-4 space-y-1">
            <button
              onClick={() => setShowLanding(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-xs font-medium text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
            >
              <Globe size={14} className="text-amber-500" />
              <span>Ver Landing Page</span>
            </button>
            <button
              onClick={handleResetDatabase}
              className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <RefreshCw size={14} />
              <span>Restaurar Banco de Dados</span>
            </button>
          </div>
        </div>

        {/* Footer Profile */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center gap-3 p-1.5 bg-slate-900/50 rounded-lg border border-slate-800/40">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-700 to-blue-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
              {(authUser?.name || "U").slice(0,2).toUpperCase()}
            </div>
            <div className="text-xs overflow-hidden flex-1">
              <div className="text-white font-semibold truncate">{authUser?.name || "Usuário"}</div>
              <div className="text-slate-500 text-[10px] font-mono truncate">{authUser?.role || "VIEWER"}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Global Control Header */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>

            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 capitalize tracking-tight truncate">
              {({
                dashboard: "Painel Executivo",
                events: "Gestão de Eventos",
                ticketing: "Ticketing Enterprise",
                finance: "ERP Financeiro",
                crm: "CRM Comercial & Leads",
                marketplace: "Marketplace / Fornecedores",
                contracts: "Contratos & Auditoria",
                staff: "RH & Staff de Campo",
                marketing: "Marketing & Campanhas",
                gateway: "API Gateway & Logs",
                chatbot: "Assistente de IA — Gemini",
                coe: "Centro de Operações",
                agenda: "Agenda Inteligente",
                "tickets-suporte": "Central de Tickets",
                espacos: "Espaços & Logística",
                satisfacao: "Pesquisa & Certificados",
                bi: "Inteligência de Negócios",
                riscos: "Gestão de Riscos",
                planejamento: "Planejamento Financeiro",
                admin: "Administração",
                biblioteca: "Biblioteca Digital",
              } as Record<string, string>)[activeTab] || activeTab.replace(/-/g, " ")}
            </h1>

            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold shrink-0">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              <span className="text-slate-600 hidden lg:inline">PostgreSQL · JWT · Live</span>
              <span className="text-slate-600 lg:hidden">PG</span>
            </div>

            {/* Portal Switcher — hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="text-violet-700 font-bold">Portal:</span>
              {authUser?.role === "SUPER_ADMIN" ? (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  title="Como Super Administrador, você pode pré-visualizar o portal de qualquer perfil."
                  className="bg-transparent border-none text-violet-800 font-bold outline-none cursor-pointer text-xs"
                >
                  <option value="Super Administrador da Plataforma">Super Administrador da Plataforma</option>
                  <option value="Administrador da Empresa">Administrador da Empresa</option>
                  <option value="Gestor do Evento">Gestor do Evento</option>
                  <option value="Produtor">Produtor</option>
                  <option value="Coordenador">Coordenador</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Compras">Compras</option>
                  <option value="RH">RH</option>
                  <option value="Staff">Staff</option>
                  <option value="Contratante">Contratante</option>
                  <option value="Patrocinador">Patrocinador</option>
                  <option value="Fornecedor">Fornecedor</option>
                  <option value="Expositor">Expositor</option>
                  <option value="Afiliado">Afiliado</option>
                  <option value="Participante">Participante</option>
                </select>
              ) : (
                <span
                  className="text-violet-800 font-bold text-xs"
                  title="Seu perfil de acesso é definido pelo administrador da conta."
                >
                  {selectedRole}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search — hidden on mobile */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Filtrar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 lg:w-56 pl-8 pr-3 py-1.5 bg-slate-100 border border-transparent rounded-full text-xs focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-slate-300 outline-none transition-all"
              />
              <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(v => !v)}
              aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications */}
            <div className="relative" data-notifications>
              <button
                onClick={() => setShowNotifications(v => !v)}
                aria-label="Abrir notificações"
                aria-expanded={showNotifications}
                aria-haspopup="true"
                className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" aria-hidden="true" />
              </button>
              {showNotifications && (
                <div
                  role="dialog"
                  aria-label="Painel de notificações"
                  className="absolute right-0 top-10 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notificações</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      aria-label="Fechar notificações"
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[11px] font-bold text-slate-800">{n.title}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{n.msg}</div>
                          </div>
                          <span className="text-[9px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 text-center">
                    <button className="text-[10px] text-violet-600 font-bold hover:text-violet-700">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Event */}
            <button
              onClick={() => setShowAddEventModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Novo Evento</span>
            </button>
          </div>
        </header>

        {/* Dynamic Warning Alert */}
        {errorMsg && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertTriangle className="shrink-0 text-red-500" />
            <div className="text-xs">{errorMsg}</div>
          </div>
        )}

        {/* WORKSPACE AREA CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. DASHBOARD TAB OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Dynamic Role Banner/Welcome Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-950">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] uppercase font-mono tracking-widest rounded-full font-bold">
                      {selectedRole}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-300 font-medium">MFA Autenticado</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight mt-2 text-white">
                    {selectedRole === "Super Administrador da Plataforma" && "Governança SaaS & Multi-Tenant Hub"}
                    {selectedRole === "Administrador da Empresa" && `Cockpit Executivo - ${activeTenant?.name || "Tenant"}`}
                    {selectedRole === "Gestor do Evento" && `Diretório Operacional do Gestor - ${selectedEvent?.name || "Selecione um Evento"}`}
                    {selectedRole === "Produtor" && "Produção de Campo & Checklists Técnicos"}
                    {selectedRole === "Coordenador" && "Controle de Infraestrutura & Logística de Evento"}
                    {selectedRole === "Financeiro" && "ERP Tesouraria, Conciliações & Balancetes"}
                    {selectedRole === "Comercial" && "Leads Qualificados & CRM de Patrocínio"}
                    {selectedRole === "Marketing" && "Automação de Growth, Cupons & Campanhas"}
                    {selectedRole === "Compras" && "Aprovação de Suprimentos & Orçamentos (PO)"}
                    {selectedRole === "RH" && "Escalas de Campo, Freelancers & Folha Staff"}
                    {selectedRole === "Staff" && "Ponto Eletrônico Integrado & GPS Ativo"}
                    {selectedRole === "Contratante" && "Portal do Parceiro & Assinatura Digital"}
                    {selectedRole === "Patrocinador" && "Ativação de Marca & Métricas de Impacto (ROI)"}
                    {selectedRole === "Fornecedor" && "Agenda de Prestação de Serviços Técnicos"}
                    {selectedRole === "Expositor" && "Pavilhão de Exposições & Coleta de Leads"}
                    {selectedRole === "Afiliado" && "Painel do Afiliado & Programa de Indicação"}
                    {selectedRole === "Participante" && "Área do Maratonista & Credencial Eletrônica"}
                  </h2>
                  <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
                    {selectedRole === "Super Administrador da Plataforma" && "Monitoramento global da infraestrutura Cloud do EventFlow SaaS, controle de assinaturas recorrentes, faturamento de todos os tenants e logs consolidados de API Gateway."}
                    {selectedRole === "Administrador da Empresa" && "Visão geral estratégica da sua organização. Ajuste parâmetros cadastrais corporativos, acompanhe receita unificada e controle despesas consolidadas."}
                    {selectedRole === "Gestor do Evento" && "Gerencie a operação total do seu evento ativo. Monitore venda de ingressos, equipe escalada e status geral do evento."}
                    {selectedRole === "Produtor" && "Acompanhe e finalize as pendências operacionais do evento utilizando a lista de tarefas técnicas de produção."}
                    {selectedRole === "Coordenador" && "Organize a montagem do evento, valide a entrega física de itens de infraestrutura no local e certifique a conformidade de logística."}
                    {selectedRole === "Financeiro" && "Supervisione lançamentos financeiros de entradas e saídas. Exporte o relatório oficial consolidado e emita balancetes assinados eletronicamente."}
                    {selectedRole === "Comercial" && "Acompanhe novas oportunidades de parcerias, negocie cotas corporativas de patrocínio e adicione novos leads qualificados."}
                    {selectedRole === "Marketing" && "Dispare campanhas segmentadas via e-mail e mensageria instantânea. Cadastre cupons de incentivo para impulsionar o marketplace."}
                    {selectedRole === "Compras" && "Aprove requisições de compra de suprimentos (Purchase Orders) autorizadas pelos diretores operacionais com lançamento contábil imediato."}
                    {selectedRole === "RH" && "Administre freelancer diários, valide presença de equipes de campo e realize a liberação de pagamentos automáticos."}
                    {selectedRole === "Staff" && "Visualize suas escalas ativas de campo para o evento selecionado e realize o registro de ponto eletrônico com certificação por GPS."}
                    {selectedRole === "Contratante" && "Consulte minutas contratuais de patrocínio ou contratação de serviços e realize a assinatura digital com validade jurídica imediata."}
                    {selectedRole === "Patrocinador" && "Acompanhe as ativações de marca contratadas em sua cota corporativa e analise estimativas reais de retorno sobre investimento (ROI)."}
                    {selectedRole === "Fornecedor" && "Monitore ordens de serviços técnicos agendadas para montagem técnica e configure suas tarifas horárias integradas."}
                    {selectedRole === "Expositor" && "Gerencie a montagem e ativação do seu estande de exposição e utilize o scanner de campo para capturar leads qualificados."}
                    {selectedRole === "Afiliado" && "Copie seu link personalizado de vendas de inscrições do marketplace, gere cupons de afiliados e acompanhe suas comissões ativas de 10%."}
                    {selectedRole === "Participante" && "Consulte seus kits atletas adquiridos, valide seu QR Code de credenciamento oficial e emita o certificado oficial de presença pós-evento."}
                  </p>
                </div>
                
                <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/15 backdrop-blur-md flex items-center gap-3 self-stretch md:self-auto justify-center">
                  <div className="text-right">
                    <div className="text-[10px] text-indigo-300 font-bold uppercase">Conexão</div>
                    <div className="text-sm font-black font-mono">100% SECURE</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                    <Sliders size={16} />
                  </div>
                </div>
              </div>

              {/* Conditional dashboards render based on role */}
              {(selectedRole === "Super Administrador da Plataforma" || selectedRole === "Administrador da Empresa") ? (
                <DashboardExecutivo
                  events={events}
                  filteredEvents={filteredEvents}
                  filteredFinance={filteredFinance}
                  filteredLeads={filteredLeads}
                  filteredStaff={filteredStaff}
                  filteredCampaigns={filteredCampaigns}
                  filteredContracts={filteredContracts}
                  tickets={tickets}
                  sponsorships={sponsorships}
                  selectedTenantId={selectedTenantId}
                  activeTenant={activeTenant}
                  selectedRole={selectedRole}
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  netBalance={netBalance}
                  finance={finance}
                  setActiveTab={setActiveTab}
                  handleSendAiMessage={handleSendAiMessage}
                  onRefresh={fetchDatabase}
                />
              ) : (
                /* 15 SPECIALIZED PORTALS */
                <div className="space-y-6">
                  
                  {/* GESTOR DO EVENTO */}
                  {selectedRole === "Gestor do Evento" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                            Configurações & Status do Evento Ativo
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status Operacional do Evento</label>
                              <select 
                                value={selectedEvent?.status || ""} 
                                onChange={async (e) => {
                                  if (!selectedEventId) return;
                                  try {
                                    const res = await fetch(`/api/events/${selectedEventId}/status`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ status: e.target.value })
                                    });
                                    if (res.ok) fetchDatabase();
                                  } catch (err) { console.error(err); }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                <option value="PLANNING">PLANNING (Planejamento)</option>
                                <option value="ACTIVE">ACTIVE (Em Andamento)</option>
                                <option value="COMPLETED">COMPLETED (Finalizado)</option>
                                <option value="CANCELLED">CANCELLED (Cancelado)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Carga de Ingressos Permitidos</label>
                              <div className="text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600 border border-slate-200/60 font-mono font-bold flex items-center justify-between">
                                <span>Capacidade: {selectedEvent?.capacity || 0}</span>
                                <span className="text-blue-600">Restantes: {Math.max(0, (selectedEvent?.capacity || 0) - tickets.filter(t => t.eventId === selectedEventId).length)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Mensagens Urgentes do Staff de Campo</h4>
                          <div className="space-y-3">
                            {staffMessages.filter(m => m.eventId === selectedEventId).length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Nenhuma transmissão urgente registrada para este evento.</p>
                            ) : (
                              staffMessages.filter(m => m.eventId === selectedEventId).map(msg => (
                                <div key={msg.id} className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs flex justify-between items-start">
                                  <div>
                                    <strong className="block text-[10px] uppercase text-red-600">{msg.senderName} ({msg.role})</strong>
                                    <p className="mt-0.5 font-medium">{msg.text}</p>
                                  </div>
                                  <span className="text-[9px] font-mono text-red-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Ingressos Vendidos</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            {tickets.filter(t => t.eventId === selectedEventId).length} / {selectedEvent?.capacity || 0}
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Receita Bruta Acumulada</span>
                          <span className="text-2xl font-black text-emerald-600 block mt-1">
                            R$ {finance.filter(f => f.eventId === selectedEventId && f.type === TransactionType.INCOME).reduce((acc, x) => acc + x.amount, 0).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRODUTOR */}
                  {selectedRole === "Produtor" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                            Checklist Dinâmico de Operações do Produtor
                          </h3>
                          <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                            {selectedEvent?.checklist?.filter(c => c.completed).length || 0} / {selectedEvent?.checklist?.length || 0} Concluídos
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {selectedEvent?.checklist?.map(item => (
                            <div 
                              key={item.id} 
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/events/${selectedEventId}/checklist/${item.id}/toggle`, { method: "PUT" });
                                  if (res.ok) fetchDatabase();
                                } catch (e) { console.error(e); }
                              }}
                              className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/50 cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox" 
                                  checked={item.completed}
                                  onChange={() => {}} 
                                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <span className={`text-xs font-semibold ${item.completed ? "line-through text-slate-400 font-normal" : "text-slate-800"}`}>
                                  {item.task}
                                </span>
                              </div>
                              <span className="text-[10px] bg-white border px-2 py-0.5 rounded text-slate-500 font-mono font-bold">
                                {item.category}
                              </span>
                            </div>
                          ))}
                        </div>

                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!dashboardChecklistInput.trim()) return;
                            const updatedChecklist = [...(selectedEvent?.checklist || []), {
                              id: `chk-${Date.now()}`,
                              task: dashboardChecklistInput,
                              completed: false,
                              category: "Produção Geral"
                            }];
                            try {
                              const res = await fetch(`/api/events/${selectedEventId}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ checklist: updatedChecklist })
                              });
                              if (res.ok) {
                                fetchDatabase();
                                setDashboardChecklistInput("");
                              }
                            } catch (err) { console.error(err); }
                          }}
                          className="flex gap-2 pt-4 border-t"
                        >
                          <input 
                            type="text" 
                            placeholder="Inserir nova tarefa de produção ao checklist..." 
                            value={dashboardChecklistInput}
                            onChange={(e) => setDashboardChecklistInput(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                          />
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all">
                            Adicionar
                          </button>
                        </form>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Fiscais de Percurso Online</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            {filteredStaff.filter(s => s.checkInStatus === "online").length} Staffs
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Categoria do Evento</span>
                          <span className="text-md font-bold text-slate-700 block mt-1">
                            {selectedEvent?.type || "Maratona"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COORDENADOR */}
                  {selectedRole === "Coordenador" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse"></span>
                          Controle de Entrega de Infraestrutura & Suprimentos no Local
                        </h3>
                        <div className="space-y-2.5">
                          {selectedEvent?.infrastructure?.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200/50">
                              <div>
                                <span className="text-xs font-bold text-slate-800">{item.item}</span>
                                <span className="block text-[10px] text-slate-400">Quantidade: {item.quantity}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  item.status === "Entregue" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {item.status}
                                </span>
                                {item.status !== "Entregue" && (
                                  <button 
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/events/${selectedEventId}/infrastructure/${item.id}/status`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ status: "Entregue" })
                                        });
                                        if (res.ok) fetchDatabase();
                                      } catch (e) { console.error(e); }
                                    }}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                                  >
                                    Confirmar Entrega
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Itens Confirmados</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            {selectedEvent?.infrastructure?.filter(i => i.status === "Entregue").length || 0} / {selectedEvent?.infrastructure?.length || 0}
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Localização Geral</span>
                          <span className="text-xs font-semibold text-slate-700 block mt-1 truncate">
                            {selectedEvent?.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FINANCEIRO */}
                  {selectedRole === "Financeiro" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                            DRE Corporativo & Conciliação ERP
                          </h3>
                          <button 
                            onClick={() => {
                              const headers = "ID,Tipo,Categoria,Valor,Descricao,Data,Status\n";
                              const rows = filteredFinance.map(f => `${f.id},${f.type},"${f.category}",${f.amount},"${f.description}",${f.date},${f.status}`).join("\n");
                              const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
                              const link = document.createElement("a");
                              link.setAttribute("href", csvContent);
                              link.setAttribute("download", `DRE-Financas-${selectedTenantId}.csv`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Exportar DRE (CSV)
                          </button>
                        </div>

                        <div className="space-y-2 overflow-y-auto max-h-[300px] scrollbar-thin">
                          {filteredFinance.map(trans => (
                            <div key={trans.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <div>
                                <span className="text-xs font-bold text-slate-800">{trans.description}</span>
                                <span className="block text-[10px] text-slate-400">{trans.date} - {trans.category}</span>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-bold ${trans.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"}`}>
                                  {trans.type === TransactionType.INCOME ? "+" : "-"} R$ {trans.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[9px] text-slate-400 uppercase font-bold">{trans.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Balanço Líquido do Caixa</span>
                          <span className="text-2xl font-black text-emerald-600 block mt-1">
                            R$ {netBalance.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Receita Pendente</span>
                          <span className="text-2xl font-black text-yellow-600 block mt-1">
                            R$ {finance.filter(f => f.type === TransactionType.INCOME && f.status === TransactionStatus.PENDING).reduce((acc, x) => acc + x.amount, 0).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMERCIAL */}
                  {selectedRole === "Comercial" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                          Novo Lead de Vendas / Patrocínio (CRM)
                        </h3>

                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newLeadData.name || !newLeadData.company) return;
                            try {
                              const res = await fetch("/api/crm/lead", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...newLeadData, tenantId: selectedTenantId })
                              });
                              if (res.ok) {
                                fetchDatabase();
                                setNewLeadData({
                                  name: "",
                                  company: "",
                                  type: LeadType.SPONSOR,
                                  email: "",
                                  phone: "",
                                  pipelineStage: PipelineStage.LEAD,
                                  value: 50000,
                                  notes: "",
                                });
                              }
                            } catch (err) { console.error(err); }
                          }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          <input 
                            type="text" 
                            placeholder="Nome do Contato..." 
                            value={newLeadData.name}
                            onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                          <input 
                            type="text" 
                            placeholder="Empresa..." 
                            value={newLeadData.company}
                            onChange={(e) => setNewLeadData({ ...newLeadData, company: e.target.value })}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                          <input 
                            type="email" 
                            placeholder="E-mail corporativo..." 
                            value={newLeadData.email}
                            onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <input 
                            type="number" 
                            placeholder="Valor Estimado (BRL)..." 
                            value={newLeadData.value}
                            onChange={(e) => setNewLeadData({ ...newLeadData, value: Number(e.target.value) })}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <div className="sm:col-span-2">
                            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all">
                              Adicionar ao Funil de Vendas
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Clientes / Leads no Pipeline</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            {filteredLeads.length} leads
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Valor Estimado em Negociação</span>
                          <span className="text-2xl font-black text-indigo-600 block mt-1">
                            R$ {filteredLeads.reduce((acc, l) => acc + l.value, 0).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MARKETING */}
                  {selectedRole === "Marketing" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                          Ativar Cupom de Incentivo (Marketplace)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código do Cupom</label>
                            <input 
                              type="text" 
                              placeholder="Ex: CUPOMMARATONA, FLOW10" 
                              value={dashboardAffiliateCode}
                              onChange={(e) => setDashboardAffiliateCode(e.target.value.toUpperCase())}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="flex items-end">
                            <button 
                              onClick={() => {
                                if (!dashboardAffiliateCode.trim()) return;
                                alert(`Cupom '${dashboardAffiliateCode}' ativado no banco de dados corporativo com desconto de 15% para compras e inscrições!`);
                                setDashboardAffiliateCode("");
                              }}
                              className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500"
                            >
                              Registrar Cupom
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Campanhas Executadas</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            {filteredCampaigns.length}
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Cliques em Mensagens SMS/Whats</span>
                          <span className="text-md font-bold text-indigo-600 block mt-1">
                            ~14.8% CTR Médio
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMPRAS */}
                  {selectedRole === "Compras" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider mb-2">
                          Requisições de Compra e Homologações de Suprimentos (PO)
                        </h3>
                        <div className="space-y-3">
                          {purchaseOrders.map(po => (
                            <div key={po.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="text-xs font-bold text-slate-800">{po.title}</span>
                                <span className="block text-[10px] text-slate-400">Solicitado por: {po.requestedBy}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${po.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                  {po.status}
                                </span>
                                {po.status === "PENDING" && (
                                  <button 
                                    onClick={async () => {
                                      try {
                                        const res = await fetch("/api/purchase-orders/approve", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ id: po.id })
                                        });
                                        if (res.ok) fetchDatabase();
                                      } catch (err) { console.error(err); }
                                    }}
                                    className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded text-[10px] hover:bg-blue-500"
                                  >
                                    Aprovar PO
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total de Pedidos Emitidos</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            {purchaseOrders.length} POs
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Pendente de Liberação Financeira</span>
                          <span className="text-2xl font-black text-red-600 block mt-1">
                            R$ {purchaseOrders.filter(p => p.status === "PENDING").reduce((acc, p) => acc + p.amount, 0).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RH */}
                  {selectedRole === "RH" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                            Diárias Acertadas & Fechamento de Folha de Staff
                          </h3>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/staff/pay-all", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ tenantId: selectedTenantId })
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  alert(data.message);
                                  fetchDatabase();
                                }
                              } catch (err) { console.error(err); }
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                          >
                            Pagar Todo o Staff (PIX Direto)
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                          {payments.map(p => (
                            <div key={p.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="text-xs font-bold text-slate-800">{p.staffName}</span>
                                <span className="block text-[10px] text-slate-400">Cargo: {p.role}</span>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <span className="text-xs font-mono font-bold">R$ {p.amount.toLocaleString("pt-BR")}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                  {p.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Membros de Campo</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            {filteredStaff.length} freelancers
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Pendente de Pagamento</span>
                          <span className="text-2xl font-black text-red-600 block mt-1">
                            R$ {payments.filter(p => p.status === "PENDING").reduce((acc, p) => acc + p.amount, 0).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STAFF */}
                  {selectedRole === "Staff" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                          Registro de Ponto via GPS (Digital de Campo)
                        </h3>

                        <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Meu Status Operacional</span>
                            <span className="text-md font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                filteredStaff.find(s => s.name === "Henrique Silva")?.checkInStatus === "online" ? "bg-green-500" : "bg-red-500"
                              }`}></span>
                              {filteredStaff.find(s => s.name === "Henrique Silva")?.checkInStatus === "online" ? "Serviço Iniciado (ONLINE)" : "Fora de Serviço (OFFLINE)"}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/staff/clocks", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      staffId: "staff-1",
                                      staffName: "Henrique Silva",
                                      eventId: selectedEventId || "event-1",
                                      type: "IN",
                                      method: "DIGITAL_GPS",
                                      gpsCoords: { lat: -23.5615, lng: -46.6562 },
                                      locationName: "Av. Paulista - Setor de Credenciamento"
                                    })
                                  });
                                  if (res.ok) {
                                    alert("Sucesso! Registro de ENTRADA efetuado via GPS.");
                                    fetchDatabase();
                                  }
                                } catch (e) { console.error(e); }
                              }}
                              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500"
                            >
                              Registrar ENTRADA
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/staff/clocks", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      staffId: "staff-1",
                                      staffName: "Henrique Silva",
                                      eventId: selectedEventId || "event-1",
                                      type: "OUT",
                                      method: "DIGITAL_GPS",
                                      gpsCoords: { lat: -23.5615, lng: -46.6562 },
                                      locationName: "Av. Paulista - Setor de Credenciamento"
                                    })
                                  });
                                  if (res.ok) {
                                    alert("Sucesso! Registro de SAÍDA efetuado via GPS.");
                                    fetchDatabase();
                                  }
                                } catch (e) { console.error(e); }
                              }}
                              className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-500"
                            >
                              Registrar SAÍDA
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Minhas Horas de Trabalho</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            {filteredStaff.find(s => s.name === "Henrique Silva")?.hoursWorked || 0} horas
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Tarifa de Diária</span>
                          <span className="text-md font-bold text-slate-700 block mt-1">
                            R$ 220,00 por dia
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTRATANTE */}
                  {selectedRole === "Contratante" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                          Contratos Jurídicos Pendentes de Assinatura Eletrônica
                        </h3>

                        <div className="space-y-3">
                          {filteredContracts.map(ctr => {
                            const hasSigned = ctr.signedBy.includes("Contratante");
                            return (
                              <div key={ctr.id} className="p-4 bg-slate-50 border rounded-xl flex justify-between items-center">
                                <div>
                                  <span className="text-xs font-bold text-slate-800 block">{ctr.title}</span>
                                  <span className="text-[10px] text-slate-400 block">Assinado eletronicamente por: {ctr.signedBy.join(", ")}</span>
                                </div>
                                <div>
                                  {hasSigned ? (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">✓ Assinado</span>
                                  ) : (
                                    <button 
                                      onClick={async () => {
                                        try {
                                          const res = await fetch("/api/contracts/sign", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ id: ctr.id, signerName: "Contratante" })
                                          });
                                          if (res.ok) fetchDatabase();
                                        } catch (e) { console.error(e); }
                                      }}
                                      className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500"
                                    >
                                      Assinar Eletronicamente
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Status de Homologação</span>
                          <span className="text-md font-bold text-emerald-600 block mt-1">
                            Homologação Legal Ativa
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PATROCINADOR */}
                  {selectedRole === "Patrocinador" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                          Ativações de Marca e Entregas Contratadas
                        </h3>
                        <div className="space-y-3">
                          <div className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">Logo no Portal de Inscrição Oficial</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold">ENTREGUE</span>
                          </div>
                          <div className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">Placas de Publicidade no Pórtico de Largada</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold">INSTALADO</span>
                          </div>
                          <div className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">Cota VIP de Ingressos Cortesia (20 un)</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">EMITIDO</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Cota Contratada</span>
                          <span className="text-xl font-black text-slate-900 block mt-1">
                            Cota Diamond Master
                          </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Audiência Estimada</span>
                          <span className="text-lg font-bold text-indigo-600 block mt-1">
                            +45.000 pessoas
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORNECEDOR */}
                  {selectedRole === "Fornecedor" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                          Cronograma de Execução de Serviços de Campo
                        </h3>
                        <div className="p-4 bg-slate-50 border rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between border-b pb-1">
                            <strong>Serviço Agendado:</strong>
                            <span>Montagem de Estrutura de Checkpoint</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <strong>Data de Execução:</strong>
                            <span>{selectedEvent?.date || "05/07/2026"}</span>
                          </div>
                          <div className="flex justify-between">
                            <strong>Tarifa de Serviço:</strong>
                            <span className="text-emerald-600 font-bold">R$ 180,00 por hora técnica</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Avaliação Técnica</span>
                          <span className="text-2xl font-black text-slate-900 block mt-1">
                            4.9 ★★★★★
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EXPOSITOR */}
                  {selectedRole === "Expositor" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                          Scanner de Visitação & Captação de Leads
                        </h3>

                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!dashboardBoothLeadName || !dashboardBoothLeadEmail) return;
                            try {
                              const res = await fetch("/api/crm/lead", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  name: dashboardBoothLeadName,
                                  company: "Visitante Estande Expositor",
                                  type: LeadType.SPONSOR,
                                  email: dashboardBoothLeadEmail,
                                  phone: "",
                                  pipelineStage: PipelineStage.LEAD,
                                  value: 0,
                                  notes: "booth-scan-expositor",
                                  tenantId: selectedTenantId
                                })
                              });
                              if (res.ok) {
                                alert(`Lead '${dashboardBoothLeadName}' capturado com sucesso!`);
                                fetchDatabase();
                                setDashboardBoothLeadName("");
                                setDashboardBoothLeadEmail("");
                              }
                            } catch (err) { console.error(err); }
                          }}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              placeholder="Nome do Visitante..." 
                              value={dashboardBoothLeadName}
                              onChange={(e) => setDashboardBoothLeadName(e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              required
                            />
                            <input 
                              type="email" 
                              placeholder="E-mail do Visitante..." 
                              value={dashboardBoothLeadEmail}
                              onChange={(e) => setDashboardBoothLeadEmail(e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              required
                            />
                          </div>
                          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all">
                            Registrar Contato Capturado
                          </button>
                        </form>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Estande Alocado</span>
                          <span className="text-md font-bold text-slate-700 block mt-1">
                            Estande Central #14 (Montagem Concluída)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AFILIADO */}
                  {selectedRole === "Afiliado" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                          Link Exclusivo de Afiliado & Programa de Indicação
                        </h3>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-mono font-bold text-blue-700 flex justify-between items-center">
                          <span>https://eventflow.com/ref/hs-affiliate</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("https://eventflow.com/ref/hs-affiliate");
                              alert("Link copiado para a área de transferência!");
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded font-sans font-bold text-[10px]"
                          >
                            Copiar Link
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Comissão Acumulada</span>
                          <span className="text-2xl font-black text-emerald-600 block mt-1">
                            R$ 198,00
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PARTICIPANTE */}
                  {selectedRole === "Participante" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                          Minha Credencial Digital & Ingresso Emitido
                        </h3>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="text-center sm:text-left">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Portador da Credencial</span>
                            <span className="text-sm font-bold text-slate-800 block mt-1">Henrique Silva</span>
                            <span className="text-xs text-slate-500 font-mono">Inscrição ID: QR-HS-789-2026</span>
                          </div>

                          <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
                            <div className="w-full h-full bg-slate-900 rounded flex flex-wrap p-1">
                              {[...Array(64)].map((_, i) => (
                                <div key={i} className={`w-[12.5%] h-[12.5%] ${Math.sin(i * 3.7) > 0 ? "bg-white" : "bg-black"}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              window.print();
                            }}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
                          >
                            Imprimir Credencial Oficial (PDF)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Status da Inscrição</span>
                          <span className="text-md font-bold text-emerald-600 block mt-1">
                            ✓ CONFIRMADO
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* 2. EVENTS MANAGEMENT TAB */}
          {activeTab === "events" && (
            <GestaoEventos
              events={filteredEvents}
              tickets={tickets}
              finance={filteredFinance}
              staff={filteredStaff}
              selectedEventId={selectedEventId}
              selectedTenantId={selectedTenantId}
              onSelectEvent={setSelectedEventId}
              onRefresh={fetchDatabase}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {/* 3. TICKETING ENTERPRISE TAB */}
          {activeTab === "ticketing" && (
            <TicketingEnterprise
              events={filteredEvents}
              tickets={tickets}
              finance={filteredFinance}
              selectedEventId={selectedEventId}
              selectedTenantId={selectedTenantId}
              onSelectEvent={setSelectedEventId}
              onRefresh={fetchDatabase}
            />
          )}

          {/* 4. FINANCIAL ERP TAB */}
          {activeTab === "finance" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Manual Transaction Input Form */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                    Registrar Lançamento ERP Manual
                  </h3>

                  <form onSubmit={handleAddManualFinance} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Tipo de Lançamento</label>
                      <select
                        value={manualFinanceData.type}
                        onChange={(e) => setManualFinanceData({ ...manualFinanceData, type: e.target.value as TransactionType })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                      >
                        <option value={TransactionType.INCOME}>Entrada (Recebimento)</option>
                        <option value={TransactionType.EXPENSE}>Saída (Despesa / Pagamento)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Valor (BRL)</label>
                      <input
                        type="number"
                        required
                        value={manualFinanceData.amount}
                        onChange={(e) => setManualFinanceData({ ...manualFinanceData, amount: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Categoria</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Infraestrutura, Patrocínio, Bilheteria"
                        value={manualFinanceData.category}
                        onChange={(e) => setManualFinanceData({ ...manualFinanceData, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Descrição Detalhada</label>
                      <textarea
                        required
                        placeholder="Ex: Compra de pórticos de ferro adicionais"
                        value={manualFinanceData.description}
                        onChange={(e) => setManualFinanceData({ ...manualFinanceData, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500 h-20 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Status</label>
                      <select
                        value={manualFinanceData.status}
                        onChange={(e) => setManualFinanceData({ ...manualFinanceData, status: e.target.value as TransactionStatus })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                      >
                        <option value={TransactionStatus.PAID}>Liquidado (Pago)</option>
                        <option value={TransactionStatus.PENDING}>Pendente</option>
                        <option value={TransactionStatus.OVERDUE}>Vencido</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                    >
                      Lançar no ERP Financeiro
                    </button>
                  </form>
                </div>

                {/* Purchase orders needing authorization block */}
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-3">
                    Pedidos de Compra Pendentes de Aprovação
                  </h4>
                  <div className="space-y-3">
                    {purchaseOrders
                      .filter(po => po.tenantId === selectedTenantId)
                      .map(po => (
                        <div key={po.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-xs text-slate-800 block line-clamp-1">{po.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              po.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {po.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Valor: <strong>R$ {po.amount.toLocaleString("pt-BR")}</strong></span>
                            <span>Fornecedor: <strong>{po.supplierName}</strong></span>
                          </div>
                          {po.status === "PENDING" && (
                            <button
                              onClick={() => handleApprovePO(po.id)}
                              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg transition-all"
                            >
                              Autorizar Compra & Lançar Despesa
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

              </div>

              {/* Transactions Ledger */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Financial KPI stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Receitas</span>
                    <span className="text-xl font-bold text-slate-800 block mt-1">R$ {totalIncome.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Despesas Totais</span>
                    <span className="text-xl font-bold text-slate-800 block mt-1">R$ {totalExpense.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lucratividade Estimada</span>
                    <span className="text-xl font-bold text-slate-800 block mt-1">
                      R$ {netBalance.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>

                {/* Ledger lists */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                      Razão Auxiliar de Lançamentos do ERP (Filtro por Tenant)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                          <th className="px-4 py-2">Data</th>
                          <th className="px-4 py-2">Tipo</th>
                          <th className="px-4 py-2">Categoria</th>
                          <th className="px-4 py-2">Descrição</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredFinance.map(tr => (
                          <tr key={tr.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{tr.date}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                tr.type === TransactionType.INCOME
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {tr.type === TransactionType.INCOME ? "Recebimento" : "Pagamento"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-semibold">{tr.category}</td>
                            <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{tr.description}</td>
                            <td className="px-4 py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                tr.status === TransactionStatus.PAID
                                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                  : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                              }`}>
                                {tr.status}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-bold ${
                              tr.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-500"
                            }`}>
                              R$ {tr.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 5. CRM COMERCIAL & LEADS TAB (KANBAN PIPELINE BOARD) */}
          {activeTab === "crm" && (
            <div className="space-y-6">
              
              {/* Header section with add button and KPI info */}
              <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/80">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Pipeline de Negociações Comerciais</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Arraste ou gerencie negociações de cotas de patrocínio e expositores com cálculo de receita ponderada.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Valor Total Pipeline</span>
                    <span className="text-lg font-bold text-slate-800">
                      R$ {filteredLeads.reduce((acc, l) => acc + l.value, 0).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Adicionar Lead</span>
                  </button>
                </div>
              </div>

              {/* Kanban Columns */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {[
                  { stage: PipelineStage.LEAD, title: "Prospecção", color: "bg-slate-100 border-slate-200 text-slate-700" },
                  { stage: PipelineStage.CONTACTED, title: "Contatado", color: "bg-blue-50 border-blue-100 text-blue-700" },
                  { stage: PipelineStage.PROPOSAL, title: "Proposta", color: "bg-yellow-50 border-yellow-100 text-yellow-700" },
                  { stage: PipelineStage.NEGOTIATION, title: "Negociação", color: "bg-purple-50 border-purple-100 text-purple-700" },
                  { stage: PipelineStage.WON, title: "Ganhos / Fechados", color: "bg-green-50 border-green-100 text-green-700" },
                  { stage: PipelineStage.LOST, title: "Perdidos", color: "bg-red-50 border-red-100 text-red-700" }
                ].map(col => {
                  const stageLeads = filteredLeads.filter(l => l.pipelineStage === col.stage);
                  const stageTotalValue = stageLeads.reduce((acc, l) => acc + l.value, 0);

                  return (
                    <div key={col.stage} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col h-[520px]">
                      
                      {/* Column Header */}
                      <div className={`p-2 rounded-lg border text-center mb-3 ${col.color}`}>
                        <div className="font-bold text-xs tracking-tight">{col.title}</div>
                        <div className="text-[10px] font-bold mt-1">R$ {stageTotalValue.toLocaleString("pt-BR")}</div>
                      </div>

                      {/* Leads Cards Container */}
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                        {stageLeads.map(lead => (
                          <div
                            key={lead.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-blue-300 hover:shadow-sm transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <span className="px-1.5 py-0.5 bg-white text-[9px] font-bold text-slate-500 rounded border border-slate-200 uppercase">
                                {lead.type}
                              </span>
                              <span className="font-bold text-xs font-mono text-slate-900">
                                R$ {lead.value.toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <div>
                              <strong className="text-xs text-slate-800 block leading-tight">{lead.name}</strong>
                              <span className="text-[10px] text-slate-400 block">{lead.company}</span>
                            </div>

                            <p className="text-[10px] text-slate-500 line-clamp-2 italic bg-white p-1.5 rounded border border-slate-100">
                              {lead.notes}
                            </p>

                            {/* Cycle stage trigger */}
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-1">
                              <span className="text-[9px] text-slate-400">Próxima Etapa:</span>
                              <select
                                value={lead.pipelineStage}
                                onChange={(e) => handleUpdateLeadStage(lead.id, e.target.value as PipelineStage)}
                                className="bg-white border border-slate-200 text-[10px] p-1 rounded font-semibold focus:outline-none focus:border-blue-500"
                              >
                                <option value={PipelineStage.LEAD}>LEAD</option>
                                <option value={PipelineStage.CONTACTED}>CONTACTED</option>
                                <option value={PipelineStage.PROPOSAL}>PROPOSAL</option>
                                <option value={PipelineStage.NEGOTIATION}>NEGOTIATION</option>
                                <option value={PipelineStage.WON}>WON</option>
                                <option value={PipelineStage.LOST}>LOST</option>
                              </select>
                            </div>

                          </div>
                        ))}

                        {stageLeads.length === 0 && (
                          <div className="text-center py-12 text-[10px] text-slate-300 font-mono italic">
                            Sem negociações
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* 6. MARKETPLACE TAB */}
          {activeTab === "marketplace" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Suppliers Directory Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Diretório de Fornecedores Homologados</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Contrate prestadores de serviços de cronometragem, montagem, segurança e buffet com faturamento automático.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Horas padrão:</span>
                    <input
                      type="number"
                      value={marketplaceBookingData.hours}
                      onChange={(e) => setMarketplaceBookingData({ ...marketplaceBookingData, hours: Number(e.target.value) })}
                      className="w-16 bg-slate-100 border border-transparent rounded-lg text-xs p-2 text-center font-bold focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suppliers.map(sup => {
                    const priceEst = sup.pricePerHour * marketplaceBookingData.hours;
                    return (
                      <div key={sup.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded">
                              {sup.category}
                            </span>
                            <div className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                              <span>★</span>
                              <span>{sup.rating}</span>
                            </div>
                          </div>

                          <h4 className="font-bold text-sm text-slate-900 mt-3">{sup.name}</h4>
                          <div className="text-xs text-slate-400 mt-1">Disponibilidade: {sup.availability.join(", ")}</div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                            <div>
                              <span className="text-slate-400 block text-[9px]">Preço / Hora</span>
                              <strong className="text-slate-800">R$ {sup.pricePerHour}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block text-[9px]">Preço Estimado ({marketplaceBookingData.hours}h)</span>
                              <strong className="text-blue-600">R$ {priceEst.toLocaleString("pt-BR")}</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookSupplier(sup.id)}
                          className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all text-center"
                        >
                          Alocar & Gerar Contrato
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Booking Ledger and sponsor quotas */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Active Sponsorship Quotas tracker — full CRUD */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                      Patrocínios & Cotas ({sponsorships.length})
                    </h3>
                    <button
                      onClick={() => setShowAddSponsorshipModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-[10px] font-bold transition-all"
                    >
                      <Plus size={11} /> Novo
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sponsorships.length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-4">Nenhum patrocínio cadastrado.</p>
                    )}
                    {sponsorships.map(sps => (
                      <div key={sps.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <strong className="text-xs text-slate-800 block leading-tight truncate">{sps.sponsorName}</strong>
                            <span className="text-[10px] text-slate-400 block">{sps.quotaName}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs font-bold text-emerald-600 font-mono">
                              R$ {sps.value.toLocaleString("pt-BR")}
                            </span>
                            <button
                              onClick={() => handleDeleteSponsorship(sps.id)}
                              className="ml-1 p-1 text-slate-300 hover:text-red-500 transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {sps.deliverables.length > 0 && (
                          <div className="text-[10px] text-slate-400 bg-white p-2 rounded border border-slate-100">
                            <strong className="text-slate-500 uppercase text-[8px] block mb-1">Entregas contratadas:</strong>
                            <ul className="list-disc pl-3 space-y-0.5">
                              {sps.deliverables.map((del, i) => <li key={i}>{del}</li>)}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 text-[9px] text-slate-400 border-t border-slate-100">
                          <select
                            value={sps.status}
                            onChange={(e) => handleUpdateSponsorshipStatus(sps.id, e.target.value)}
                            className="bg-blue-50 border border-blue-200 text-blue-700 rounded text-[9px] px-1 py-0.5 font-bold cursor-pointer"
                          >
                            <option value="PROPOSAL">PROPOSTA</option>
                            <option value="ACTIVE">ATIVO</option>
                            <option value="COMPLETED">CONCLUÍDO</option>
                          </select>
                          <span>ROI: <strong className="text-purple-600">{sps.roiRatio}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hired history logger */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-3">
                    Histórico Recente de Contratações (Alocações)
                  </h3>
                  <div className="space-y-2">
                    {bookings.map(bkg => {
                      const sup = suppliers.find(s => s.id === bkg.supplierId);
                      return (
                        <div key={bkg.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                          <div>
                            <strong className="text-slate-800">{sup?.name || "Fornecedor"}</strong>
                            <span className="text-[10px] text-slate-400 block">{bkg.date}</span>
                          </div>
                          <span className="font-bold text-slate-700">R$ {bkg.cost.toLocaleString("pt-BR")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 7. CONTRATOS & DOCUMENTOS AUDITORIA TAB */}
          {activeTab === "contracts" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Contracts list */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  Módulo de Contratos Legais Gerados (MFA & Audit trail)
                </h3>

                <div className="space-y-3">
                  {filteredContracts.map(ctr => (
                    <div
                      key={ctr.id}
                      onClick={() => {
                        // We use a state or select mechanism
                        setSelectedEventId(ctr.eventId || "");
                      }}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3 hover:border-blue-300 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-bold uppercase rounded">
                          {ctr.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          ctr.status === ContractStatus.SIGNED ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {ctr.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-800 line-clamp-2">{ctr.title}</h4>

                      <div className="text-[10px] text-slate-500">
                        Assinantes: <strong className="text-slate-700">{ctr.signedBy.join(", ") || "Ninguém"}</strong>
                      </div>

                      {ctr.status === ContractStatus.PENDING_SIGNATURES && (
                        <div className="pt-2 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const name = prompt("Digite seu nome completo corporativo para assinar eletronicamente via MFA token:");
                              if (name) handleSignContract(ctr.id, name);
                            }}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-all text-center"
                          >
                            Assinar Digitalmente (MFA)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Columns: Contract visual editor / viewer + complete trail logs */}
              <div className="lg:col-span-2 space-y-6">
                
                {filteredContracts.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Visualizador da Minuta Ativa</h3>
                      <div className="p-5 bg-slate-50 border border-slate-150 rounded-xl font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto scrollbar-thin">
                        {filteredContracts[0].content}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <Signature size={14} className="text-blue-500" />
                        <span>Trilha de Auditoria Digital Inviolável (Log Completo)</span>
                      </h3>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                        {filteredContracts[0].auditTrail.map((trail, idx) => (
                          <div key={idx} className="p-2 bg-slate-900 text-slate-300 font-mono text-[9px] rounded-lg flex items-start gap-2">
                            <span className="text-green-400">🛡</span>
                            <span className="break-all">{trail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                    Contrate fornecedores no Marketplace para gerar contratos dinâmicos aqui automaticamente.
                  </div>
                )}

              </div>

            </div>
          )}

          {/* 8. RH & STAFF DE CAMPO TAB */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              
              {/* Staff Tab Header with Inner Navigation Menu */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 uppercase tracking-tight">Módulo Corporativo de Equipes & Staff</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Control operacional de equipes de campo, escalas, ponto eletrônico georreferenciado, comunicação e folha de pagamento de freelancers.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs text-slate-600 font-medium">
                      Staff Ativos: <strong className="text-slate-900 font-bold font-mono">{filteredStaff.length}</strong>
                    </div>
                    <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-xs text-blue-700 font-medium">
                      Em Serviço: <strong className="text-blue-900 font-bold font-mono">{filteredStaff.filter(s => s.checkInStatus === "online").length}</strong>
                    </div>
                  </div>
                </div>

                {/* Sub Navigation Bar */}
                <div className="flex flex-wrap border-b border-slate-200/80 pb-1 gap-1">
                  {[
                    { id: "directory", label: "Equipes & Coordenadores" },
                    { id: "teams", label: "Áreas & Times" },
                    { id: "shifts", label: "Escala & Agendamento" },
                    { id: "clocks", label: "Ponto Digital (GPS/Físico)" },
                    { id: "payments", label: "Pagamentos de Freelancers" },
                    { id: "messages", label: "Canal de Comunicação Staff" }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setStaffSection(sec.id)}
                      className={`px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-lg -mb-[5px] ${
                        staffSection === sec.id
                          ? "border-blue-600 text-blue-600 bg-blue-50/20"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-section Content Router */}
              
              {/* A. DIRECTORY & MAP */}
              {staffSection === "directory" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredStaff.map(st => (
                        <div key={st.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                                <span className="text-[10px] text-slate-400 font-medium block">Papel: <strong className="text-slate-600">{st.role}</strong></span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                st.checkInStatus === "online" ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500"
                              }`}>
                                {st.checkInStatus === "online" ? "🟢 EM SERVIÇO" : "🔴 OFF-LINE"}
                              </span>
                            </div>

                            <div className="text-xs space-y-1.5 text-slate-500 border-t border-slate-100 pt-3 mt-3 font-medium">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Telefone:</span>
                                <strong className="text-slate-800">{st.phone}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Horas Acumuladas:</span>
                                <strong className="text-slate-800 font-mono">{st.hoursWorked} Horas</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Uniforme:</span>
                                <strong className="text-slate-800">{st.uniformSize}</strong>
                              </div>
                              {st.gpsCoords && (
                                <div className="font-mono text-[10px] text-blue-600 bg-blue-50/50 p-2 rounded mt-2 border border-blue-100/30 flex items-center justify-between">
                                  <span>📍 Coord. Georreferenciadas:</span>
                                  <span className="font-bold">{st.gpsCoords.lat.toFixed(4)}, {st.gpsCoords.lng.toFixed(4)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleStaffCheckIn(st.id)}
                            className={`w-full py-2.5 mt-4 rounded-xl text-xs font-bold transition-all ${
                              st.checkInStatus === "online"
                                ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/10"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10"
                            }`}
                          >
                            {st.checkInStatus === "online" ? "Finalizar Turno" : "Iniciar Turno (Simular GPS)"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
                    <div>
                      <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
                        <MapPin size={14} className="text-blue-500" />
                        <span>Espacialização do Grid de Campo</span>
                      </h3>

                      <div className="aspect-square bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-800 flex items-center justify-center p-4">
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20 pointer-events-none">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div key={i} className="border-t border-l border-white/40"></div>
                          ))}
                        </div>

                        <div className="text-center z-10 pointer-events-none">
                          <span className="text-[10px] text-slate-500 font-mono block mb-1">PROGRESÃO COORDENADAS</span>
                          <span className="text-xs text-white font-bold block uppercase tracking-widest font-mono">SÃO PAULO MAP GRID</span>
                        </div>

                        {filteredStaff.map((st, i) => {
                          if (st.checkInStatus !== "online") return null;
                          const leftPercent = 15 + ((i % 3) * 30);
                          const topPercent = 20 + (Math.floor(i / 3) * 30);
                          return (
                            <div
                              key={st.id}
                              className="absolute w-7 h-7 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-lg"
                              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                              title={`${st.name} (${st.role})`}
                            >
                              <span className="text-[10px] text-white font-extrabold">{st.name[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      O monitoramento espacial em tempo real do EventFlow SaaS calcula dinamicamente o cumprimento das escalas por georreferenciamento de GPS e emite alertas automatizados em caso de desvios.
                    </p>
                  </div>
                </div>
              )}

              {/* B. TEAMS CREATION */}
              {staffSection === "teams" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Create Team Form */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Nova Equipe por Área
                    </h3>

                    <form onSubmit={handleAddTeam} className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Nome da Equipe</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Equipe de Apoio Sul"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Área de Atuação</label>
                        <select
                          value={newTeamArea}
                          onChange={(e) => setNewTeamArea(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        >
                          <option value="Credenciamento">Credenciamento & Recepção</option>
                          <option value="Percurso">Pista & Percurso Esportivo</option>
                          <option value="Segurança">Segurança & Controle de Fluxo</option>
                          <option value="Posto Médico">Posto Médico & Resgate</option>
                          <option value="Alimentação">Alimentação & Hidratação</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Líder / Coordenador Geral</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Henrique Silva"
                          value={newTeamLeader}
                          onChange={(e) => setNewTeamLeader(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Membros Alocados (Qtd)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={newTeamMembers}
                          onChange={(e) => setNewTeamMembers(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        Salvar e Criar Equipe
                      </button>
                    </form>
                  </div>

                  {/* Teams List directory */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Estrutura de Times Ativos
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teams.map(t => (
                        <div key={t.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm text-slate-800">{t.name}</h4>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase">
                              {t.area}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200/60 font-medium">
                            <div>Coordenador: <strong className="text-slate-800">{t.leaderName}</strong></div>
                            <div>Integrantes Alocados: <strong className="text-slate-800 font-mono">{t.membersCount} colaboradores</strong></div>
                          </div>
                        </div>
                      ))}
                      {teams.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                          Nenhuma equipe cadastrada ainda. Use o formulário lateral.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* C. SHIFTS */}
              {staffSection === "shifts" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Schedule form */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Novo Agendamento de Turno
                    </h3>

                    <form onSubmit={handleAddShift} className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Membro do Staff</label>
                        <select
                          required
                          value={newShiftStaffId}
                          onChange={(e) => setNewShiftStaffId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        >
                          <option value="">Selecione...</option>
                          {filteredStaff.map(st => (
                            <option key={st.id} value={st.id}>{st.name} ({st.role})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Data</label>
                        <input
                          type="date"
                          required
                          value={newShiftDate}
                          onChange={(e) => setNewShiftDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1">Hora Entrada</label>
                          <input
                            type="text"
                            required
                            placeholder="08:00"
                            value={newShiftStart}
                            onChange={(e) => setNewShiftStart(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 text-center outline-none focus:bg-white focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1">Hora Saída</label>
                          <input
                            type="text"
                            required
                            placeholder="16:00"
                            value={newShiftEnd}
                            onChange={(e) => setNewShiftEnd(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 text-center outline-none focus:bg-white focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Função / Função na Escala</label>
                        <select
                          value={newShiftRole}
                          onChange={(e) => setNewShiftRole(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        >
                          <option value="STAFF">Staff Geral</option>
                          <option value="COORDINATOR">Coordenador de Área</option>
                          <option value="SUPERVISOR">Supervisor Fiscal</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        Publicar na Escala
                      </button>
                    </form>
                  </div>

                  {/* Scheduled shifts list */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Escalas e Turnos Agendados
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                            <th className="px-4 py-2.5">Staff</th>
                            <th className="px-4 py-2.5">Data</th>
                            <th className="px-4 py-2.5">Horário</th>
                            <th className="px-4 py-2.5">Função</th>
                            <th className="px-4 py-2.5">Horas</th>
                            <th className="px-4 py-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {shifts.map(sh => (
                            <tr key={sh.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-800">{sh.staffName}</td>
                              <td className="px-4 py-3 text-slate-600 font-mono">{sh.date}</td>
                              <td className="px-4 py-3 text-slate-600 font-mono">{sh.startTime} - {sh.endTime}</td>
                              <td className="px-4 py-3"><span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">{sh.role}</span></td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-800">{sh.hoursAllocated}h</td>
                              <td className="px-4 py-3 text-right">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">Confirmado</span>
                              </td>
                            </tr>
                          ))}
                          {shifts.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-12 text-slate-400 text-xs italic">
                                Nenhuma escala registrada.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* D. TIME CLOCKS */}
              {staffSection === "clocks" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Punch Simulator */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                      Simular Registro de Ponto (Totem/GPS)
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Membro de Staff</label>
                        <select
                          value={activeStaffClockId}
                          onChange={(e) => setActiveStaffClockId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 focus:bg-white outline-none focus:border-blue-500"
                        >
                          <option value="">Selecione o Staff...</option>
                          {filteredStaff.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Método de Identificação</label>
                        <select
                          value={clockMethod}
                          onChange={(e) => setClockMethod(e.target.value as "PHYSICAL" | "DIGITAL_GPS")}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 focus:bg-white outline-none focus:border-blue-500"
                        >
                          <option value="DIGITAL_GPS">Simulação GPS (Smartphone)</option>
                          <option value="PHYSICAL">Totem Físico de Reconhecimento</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Localização do Registro</label>
                        <input
                          type="text"
                          value={clockLocationName}
                          onChange={(e) => setClockLocationName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 focus:bg-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleRegisterClock("IN")}
                          className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10"
                        >
                          Entrada (Clock IN)
                        </button>
                        <button
                          onClick={() => handleRegisterClock("OUT")}
                          className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/10"
                        >
                          Saída (Clock OUT)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Registered punches logs */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Logs de Auditoria de Ponto (Real-time)
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                            <th className="px-4 py-2.5">Staff</th>
                            <th className="px-4 py-2.5">Horário Batida</th>
                            <th className="px-4 py-2.5">Ação</th>
                            <th className="px-4 py-2.5">Localização</th>
                            <th className="px-4 py-2.5">Método</th>
                            <th className="px-4 py-2.5 text-right">Coordenadas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {clocks.map(clk => (
                            <tr key={clk.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-800">{clk.staffName}</td>
                              <td className="px-4 py-3 font-mono text-slate-500">{new Date(clk.timestamp).toLocaleTimeString("pt-BR")}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  clk.type === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                  {clk.type === "IN" ? "Entrada" : "Saída"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">{clk.locationName}</td>
                              <td className="px-4 py-3 text-slate-500">{clk.method === "PHYSICAL" ? "Totem Físico" : "Smartphone GPS"}</td>
                              <td className="px-4 py-3 text-right font-mono text-[10px] text-blue-600">
                                {clk.gpsCoords ? `${clk.gpsCoords.lat.toFixed(4)}, ${clk.gpsCoords.lng.toFixed(4)}` : "Dispositivo Físico"}
                              </td>
                            </tr>
                          ))}
                          {clocks.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-12 text-slate-400 text-xs italic">
                                Nenhum ponto batido hoje. Use o simulador ao lado para testar.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* E. FREELANCER PAYMENTS */}
              {staffSection === "payments" && (
                <div className="space-y-6">
                  
                  {/* RH Financial KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total de Diárias RH</span>
                      <span className="text-xl font-bold text-slate-800 block mt-1 font-mono">
                        R$ {payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Valores Liquidados</span>
                      <span className="text-xl font-bold text-emerald-600 block mt-1 font-mono">
                        R$ {payments.filter(p => p.status === "PAID").reduce((acc, p) => acc + p.amount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Valores Pendentes</span>
                      <span className="text-xl font-bold text-amber-600 block mt-1 font-mono">
                        R$ {payments.filter(p => p.status === "PENDING").reduce((acc, p) => acc + p.amount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Custo Médio / Hora</span>
                      <span className="text-xl font-bold text-slate-800 block mt-1 font-mono">
                        R$ {payments.length > 0 ? (payments.reduce((acc, p) => acc + p.amount, 0) / payments.reduce((acc, p) => acc + p.hoursTotal, 0)).toFixed(2) : "0,00"}
                      </span>
                    </div>
                  </div>

                  {/* Payments table with action */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Folha de Pagamentos de Prestadores (Freelance)
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                            <th className="px-4 py-2.5">Colaborador</th>
                            <th className="px-4 py-2.5">Função</th>
                            <th className="px-4 py-2.5 text-center">Horas Logadas</th>
                            <th className="px-4 py-2.5">Data de Pagamento</th>
                            <th className="px-4 py-2.5">Método de Envio</th>
                            <th className="px-4 py-2.5">Valor Bruto</th>
                            <th className="px-4 py-2.5 text-right">Ação Financeira</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {payments.map(py => (
                            <tr key={py.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3">
                                <strong className="text-slate-800 block">{py.staffName}</strong>
                                <span className="text-[10px] text-slate-400">ID Ref: {py.id}</span>
                              </td>
                              <td className="px-4 py-3"><span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded">{py.role}</span></td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800 font-mono">{py.hoursTotal} Horas</td>
                              <td className="px-4 py-3 text-slate-600 font-mono">{py.paymentDate || "Aguardando aprovação"}</td>
                              <td className="px-4 py-3 text-slate-600">{py.paymentMethod || "PIX Bancário"}</td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-900">R$ {py.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3 text-right">
                                {py.status === "PENDING" ? (
                                  <button
                                    onClick={() => handlePayFreelancer(py.id)}
                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                                  >
                                    Autorizar PIX Instantâneo
                                  </button>
                                ) : (
                                  <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 font-bold text-[10px] border border-green-200">
                                    ✓ Pago e Integrado ao ERP
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-slate-400 text-xs italic">
                                Nenhum pagamento gerado. (Diárias são geradas automaticamente ao dar Clock-Out / Finalizar Turno no Ponto).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* F. INTERNAL CHAT FEED */}
              {staffSection === "messages" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Channel selectors list */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                    <h3 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-4">
                      Canais Operacionais
                    </h3>
                    {[
                      { channel: "Credenciamento", desc: "Acessos e recepção" },
                      { channel: "Percurso", desc: "Pista e hidratação" },
                      { channel: "Segurança", desc: "Controles de portões" },
                      { channel: "Alimentação", desc: "Área VIP e catering" }
                    ].map(ch => (
                      <button
                        key={ch.channel}
                        onClick={() => setStaffMessageChannel(ch.channel)}
                        className={`w-full p-3 rounded-xl text-left transition-all border flex flex-col ${
                          staffMessageChannel === ch.channel
                            ? "bg-slate-900 border-slate-950 text-white shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/60 text-slate-700"
                        }`}
                      >
                        <strong className="text-xs font-bold"># {ch.channel}</strong>
                        <span className={`text-[9px] mt-0.5 ${staffMessageChannel === ch.channel ? "text-slate-400" : "text-slate-500"}`}>{ch.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Channel Message List and input send */}
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col h-[500px]">
                    
                    {/* Feed Header */}
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
                        <h4 className="font-bold text-sm text-slate-800">Canal Ativo: #{staffMessageChannel}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Conexão Staff Encriptada</span>
                    </div>

                    {/* Messages Board */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin">
                      {staffMessages
                        .filter(msg => msg.channel === staffMessageChannel)
                        .map(msg => (
                          <div key={msg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-700">{msg.senderName} <span className="font-normal text-slate-400">({msg.senderRole})</span></span>
                              <span className="text-slate-400 font-mono">{new Date(msg.timestamp).toLocaleTimeString("pt-BR")}</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-medium">{msg.message}</p>
                          </div>
                        ))}
                      {staffMessages.filter(msg => msg.channel === staffMessageChannel).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic py-12">
                          Nenhuma transmissão enviada neste canal operacional. Use a barra inferior para se comunicar.
                        </div>
                      )}
                    </div>

                    {/* Chat input footer */}
                    <form onSubmit={handleSendStaffMessage} className="pt-4 border-t border-slate-100 flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder={`Transmitir mensagem para todos alocados em #${staffMessageChannel}...`}
                        value={staffMessageText}
                        onChange={(e) => setStaffMessageText(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs p-3.5 focus:bg-white outline-none focus:border-blue-500 font-medium"
                      />
                      <button
                        type="submit"
                        className="px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        Enviar
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. MARKETING & CAMPANHAS TAB */}
          {activeTab === "marketing" && (
            <div className="space-y-6">
              
              {/* Marketing Header with Sub-tabs navigation */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 uppercase tracking-tight">Módulo de Marketing & Nutrição de Leads</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Desenvolva fluxos de nutrição automatizados, monitore funis de vendas personalizados e agende campanhas multicanais (E-mail, WhatsApp, SMS).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs text-slate-600 font-medium">
                      Contatos Qualificados: <strong className="text-slate-900 font-bold font-mono">{leads.length}</strong>
                    </div>
                    <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-xs text-blue-700 font-medium">
                      Meta Pixel: <strong className="text-blue-900 font-mono">GA4 / Facebook Ativo</strong>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs Selection Menu */}
                <div className="flex flex-wrap border-b border-slate-200/80 pb-1 gap-1">
                  {[
                    { id: "campaigns", label: "Campanhas Multicanais" },
                    { id: "flows", label: "Fluxos de Nutrição (Lead Flows)" },
                    { id: "funnels", label: "Funis de Venda (Custom Funnels)" }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setMarketingSection(sec.id)}
                      className={`px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-lg -mb-[5px] ${
                        marketingSection === sec.id
                          ? "border-blue-600 text-blue-600 bg-blue-50/20"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-sections Content Router */}

              {/* A. CAMPAIGNS */}
              {marketingSection === "campaigns" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Schedule Campaign Form */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Agendar Nova Campanha
                    </h3>

                    <form onSubmit={handleScheduleCampaign} className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Título Interno</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Último Lote - Lançamento"
                          value={newCampTitle}
                          onChange={(e) => setNewCampTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1">Canal</label>
                          <select
                            value={newCampChannel}
                            onChange={(e) => setNewCampChannel(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                          >
                            <option value="EMAIL">E-mail</option>
                            <option value="WHATSAPP">WhatsApp</option>
                            <option value="SMS">SMS Corporativo</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1">Segmentação</label>
                          <select
                            value={newCampSegment}
                            onChange={(e) => setNewCampSegment(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                          >
                            <option value="Todos os Leads">Todos os Leads</option>
                            <option value="Clientes VIP">Clientes VIP</option>
                            <option value="Inscritos Recentes">Inscritos Recentes</option>
                            <option value="Sponsors Potenciais">Sponsors Potenciais</option>
                          </select>
                        </div>
                      </div>

                      {newCampChannel === "EMAIL" && (
                        <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1">Assunto do E-mail</label>
                          <input
                            type="text"
                            placeholder="Seja rápido! Cupons limitados..."
                            value={newCampSubject}
                            onChange={(e) => setNewCampSubject(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Conteúdo da Mensagem</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Digite a mensagem..."
                          value={newCampContent}
                          onChange={(e) => setNewCampContent(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500 leading-relaxed"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        Salvar como Rascunho
                      </button>
                    </form>
                  </div>

                  {/* Active Campaigns List */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                      Campanhas Ativas & Monitoramento Conversão
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCampaigns.map(cp => (
                        <div key={cp.id} className="p-5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded-lg border border-blue-200">
                                {cp.channel}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                cp.status === "SENT" ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-600"
                              }`}>
                                {cp.status === "SENT" ? "✓ DISPARADO" : "RASCUNHO"}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-slate-800 mt-2">{cp.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{cp.content}</p>

                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200/60 pt-3 mt-3">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Público Estimado</span>
                                <strong className="text-slate-700 font-mono">{cp.sentCount} usuários</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block">Conversão</span>
                                <strong className="text-blue-600 font-mono">{cp.conversionRate}%</strong>
                              </div>
                            </div>
                          </div>

                          {cp.status === "DRAFT" && (
                            <button
                              onClick={() => handleSendCampaign(cp.id)}
                              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/10"
                            >
                              Disparar Campanha Agora
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* B. NURTURING FLOWS */}
              {marketingSection === "flows" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Create Lead Flow Form */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Novo Fluxo Automatizado (Nutrição)
                    </h3>

                    <form onSubmit={handleAddFlow} className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Nome do Fluxo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Boas-vindas Corrida"
                          value={newFlowName}
                          onChange={(e) => setNewFlowName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Descrição</label>
                        <input
                          type="text"
                          placeholder="Sequência para reengajamento de leads"
                          value={newFlowDescription}
                          onChange={(e) => setNewFlowDescription(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Gatilho de Ativação (Trigger)</label>
                        <select
                          value={newFlowTrigger}
                          onChange={(e) => setNewFlowTrigger(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        >
                          <option value="Inscrição Confirmada">Inscrição Confirmada</option>
                          <option value="Lead Capturado CRM">Lead Capturado CRM</option>
                          <option value="Carrinho Abandonado">Carrinho Abandonado</option>
                          <option value="Check-In Realizado">Check-In Realizado</option>
                        </select>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Passos do Fluxo (Sequencial)</span>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 bg-white p-2 rounded border border-slate-100">
                            <span>Dia 1: Confirmação</span>
                            <span className="text-blue-600 font-mono">E-mail</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 bg-white p-2 rounded border border-slate-100">
                            <span>Dia 3: Guia do Evento</span>
                            <span className="text-green-600 font-mono">WhatsApp</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        Ativar Automação de Nutrição
                      </button>
                    </form>
                  </div>

                  {/* Flows List */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Fluxos de Automação de Leads Concorrentes
                    </h3>

                    <div className="space-y-4">
                      {flows.map(fl => (
                        <div key={fl.id} className="p-5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-sm text-slate-800">{fl.name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{fl.description}</p>
                            </div>
                            <button
                              onClick={() => handleToggleFlow(fl.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                fl.active
                                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                  : "bg-slate-300 hover:bg-slate-400 text-slate-700"
                              }`}
                            >
                              {fl.active ? "🟢 ATIVO (Rodando)" : "⏸ PAUSADO"}
                            </button>
                          </div>

                          <div className="border-t border-slate-200/60 pt-3 flex flex-wrap gap-3 items-center text-xs">
                            <span className="text-slate-400">Gatilho: <strong className="text-slate-700">{fl.triggerEvent}</strong></span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-400">Passos de Envio: <strong className="text-slate-700">{fl.steps.length} mensagens configuradas</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* C. SALES FUNNELS */}
              {marketingSection === "funnels" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Create Funnel Form */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Criar Funil de Conversão
                    </h3>

                    <form onSubmit={handleAddFunnel} className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Nome do Funil</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Funil Maratonistas 2026"
                          value={newFunnelName}
                          onChange={(e) => setNewFunnelName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Produto Alvo (Marketplace/Ticket)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Ingresso Geral Lote 1"
                          value={newFunnelProduct}
                          onChange={(e) => setNewFunnelProduct(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        Modelar Pipeline de Vendas
                      </button>
                    </form>
                  </div>

                  {/* Funnels Visualization charts */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                      Taxa de Conversão nos Funis de Venda
                    </h3>

                    <div className="space-y-6">
                      {funnels.map(fn => (
                        <div key={fn.id} className="p-5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                            <div>
                              <h4 className="font-bold text-sm text-slate-800">{fn.name}</h4>
                              <span className="text-[10px] text-slate-400 font-medium">Produto Alvo: <strong className="text-slate-600">{fn.targetProduct}</strong></span>
                            </div>
                            <span className="text-xs font-bold text-blue-600 font-mono">Conversão Global: {(fn.purchased / fn.visitors * 100).toFixed(1)}%</span>
                          </div>

                          {/* Conversion bars representation */}
                          <div className="space-y-2.5">
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                                <span>1. Visitantes do Marketplace</span>
                                <span className="font-mono">{fn.visitors} visualizações</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-slate-400 h-full rounded-full transition-all" style={{ width: "100%" }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                                <span>2. Leads Capturados (Preencheram e-mail)</span>
                                <span className="font-mono">{fn.leads} leads ({((fn.leads / fn.visitors) * 100).toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-slate-600 h-full rounded-full transition-all" style={{ width: `${(fn.leads / fn.visitors) * 100}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                                <span>3. Carrinhos Iniciados (Oportunidades)</span>
                                <span className="font-mono">{fn.initiated} checkouts ({((fn.initiated / fn.leads) * 100).toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${(fn.initiated / fn.visitors) * 100}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                                <span>4. Vendas Liquidadas (Inscritos)</span>
                                <span className="font-mono text-emerald-600">{fn.purchased} conversões ({((fn.purchased / fn.initiated) * 100).toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(fn.purchased / fn.visitors) * 100}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 11. API GATEWAY & LOGS TAB */}
          {activeTab === "gateway" && (
            <div className="space-y-6">
              
              {/* Gateway Master Header */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 uppercase tracking-tight">API Gateway & Event Management Microservice</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Painel corporativo de tráfego, segurança, rate limiting, queries GraphQL unificadas e microserviços de planejamento de eventos.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-ping"></span>
                    <span className="text-xs font-semibold text-slate-700">Serviço Gateway: OPERACIONAL</span>
                  </div>
                </div>

                {/* Sub Navigation Bar */}
                <div className="flex flex-wrap border-b border-slate-200/80 pb-1 gap-1">
                  {[
                    { id: "logs", label: "Gateway Logs (Tráfego REST/GraphQL)" },
                    { id: "planning", label: "Marcos de Planejamento (Microservice)" }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setGatewaySection(sec.id)}
                      className={`px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-lg -mb-[5px] ${
                        gatewaySection === sec.id
                          ? "border-blue-600 text-blue-600 bg-blue-50/20"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-section router */}

              {/* A. GATEWAY LOGS AND TRAFFIC SIMULATOR */}
              {gatewaySection === "logs" && (
                <div className="space-y-6">
                  
                  {/* Performance Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tempo de Resposta Médio</span>
                      <span className="text-2xl font-extrabold text-slate-800 block mt-1 font-mono">12 ms</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Taxa de Sucesso (HTTP 2xx)</span>
                      <span className="text-2xl font-extrabold text-emerald-600 block mt-1 font-mono">99.98%</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Limite Rate-Limit</span>
                      <span className="text-2xl font-extrabold text-slate-800 block mt-1 font-mono">100 req/min</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Endereço GraphQL Host</span>
                      <span className="text-sm font-extrabold text-blue-600 block mt-1.5 font-mono">/api/gateway/graphql</span>
                    </div>
                  </div>

                  {/* Sandbox triggers */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                      Sandbox de Integração: Simular Chamadas ao API Gateway
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dispare requisições de auditoria, queries GraphQL ou estoure as cotas para observar o rate-limiter agindo instantaneamente e guardando logs de auditoria.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleTriggerGatewaySim("REST")}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/10"
                      >
                        Simular Chamada REST (/api/gateway/test-rest)
                      </button>
                      <button
                        onClick={() => handleTriggerGatewaySim("GRAPHQL")}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        Simular Query GraphQL (/api/gateway/graphql)
                      </button>
                      <button
                        onClick={() => handleTriggerGatewaySim("RATELIMIT")}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10"
                      >
                        Forçar Rate Limit Exceeded (Trigger HTTP 429)
                      </button>
                    </div>
                  </div>

                  {/* Logs Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                        Logs de Tráfego do Gateway (Proxy Real-time)
                      </h3>
                      <span className="text-[10px] bg-slate-50 text-slate-500 font-mono px-2 py-1 rounded border">
                        Visualizando últimos {gatewayLogs.length} logs de barramento
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                            <th className="px-4 py-2.5">Horário</th>
                            <th className="px-4 py-2.5">Método / Path</th>
                            <th className="px-4 py-2.5">Microserviço Destino</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5">Latência</th>
                            <th className="px-4 py-2.5">IP Origem</th>
                            <th className="px-4 py-2.5 text-right">Informações / Auditoria</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                          {gatewayLogs.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-slate-400 font-mono">
                                {new Date(l.timestamp).toLocaleTimeString("pt-BR")}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-slate-900 font-mono mr-1.5">{l.method}</span>
                                <span className="text-blue-600 font-mono text-[11px]">{l.path}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                                  {l.targetService}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  l.statusCode === 200 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                  {l.statusCode} {l.statusCode === 429 ? "Rate Limit" : "OK"}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-800">{l.latencyMs}ms</td>
                              <td className="px-4 py-3 font-mono text-slate-500">{l.ip}</td>
                              <td className="px-4 py-3 text-right text-slate-500 max-w-xs truncate font-mono text-[10px]" title={l.details}>
                                {l.details}
                              </td>
                            </tr>
                          ))}
                          {gatewayLogs.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-slate-400 text-xs italic">
                                Nenhum tráfego logado. Dispare chamadas através do sandbox superior.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* B. EVENT PLANNING MICROSERVICE */}
              {gatewaySection === "planning" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Create Planning Milestone Form */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">
                      Definir Novo Marco Operacional
                    </h3>

                    <form onSubmit={handleAddPlanning} className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Nome do Marco (Milestone)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Contratação de Grades de Contenção"
                          value={newPlanningMilestone}
                          onChange={(e) => setNewPlanningMilestone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Descrição Detalhada</label>
                        <textarea
                          rows={3}
                          placeholder="Ex: Fechamento com fornecedor homologado no marketplace."
                          value={newPlanningDesc}
                          onChange={(e) => setNewPlanningDesc(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1">Prazo Limite</label>
                          <input
                            type="date"
                            required
                            value={newPlanningDeadline}
                            onChange={(e) => setNewPlanningDeadline(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-bold block mb-1">Responsável</label>
                          <select
                            value={newPlanningResponsible}
                            onChange={(e) => setNewPlanningResponsible(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                          >
                            <option value="Henrique Silva">Henrique Silva</option>
                            <option value="Mariana Costa">Mariana Costa</option>
                            <option value="Carlos Eduardo">Carlos Eduardo</option>
                            <option value="Juliana Mendes">Juliana Mendes</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
                      >
                        Publicar Marco de Planejamento
                      </button>
                    </form>
                  </div>

                  {/* Planning milestones checklist */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                      Fluxograma de Marcos Operacionais do Evento Selecionado
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                            <th className="px-4 py-2.5">Marco / Descrição</th>
                            <th className="px-4 py-2.5">Responsável</th>
                            <th className="px-4 py-2.5">Prazo Limite</th>
                            <th className="px-4 py-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {plannings
                            .filter(p => p.eventId === selectedEventId)
                            .map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3">
                                  <strong className="text-slate-800 block">{p.milestone}</strong>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">{p.description}</span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-600">{p.responsibleName}</td>
                                <td className="px-4 py-3 font-mono text-slate-500">{p.deadline}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    p.completed ? "bg-green-100 text-green-700 border border-green-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                                  }`}>
                                    {p.completed ? "✓ FINALIZADO" : "⚙ EM ANDAMENTO"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          {plannings.filter(p => p.eventId === selectedEventId).length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-12 text-slate-400 text-xs italic">
                                Nenhum marco definido para este evento. Use o formulário ao lado.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 10. AI CHATBOT TAB */}
          {activeTab === "coe" && (
            <CentroOperacoes
              events={filteredEvents}
              tickets={tickets.filter((t: any) => filteredEvents.some((e: any) => e.id === t.eventId))}
              finance={filteredFinance}
              staff={filteredStaff}
              selectedEventId={selectedEventId}
            />
          )}

          {activeTab === "agenda" && (
            <AgendaInteligente
              events={filteredEvents}
              selectedEventId={selectedEventId}
            />
          )}

          {activeTab === "tickets-suporte" && (
            <CentralTickets />
          )}

          {activeTab === "espacos" && (
            <GestaoEspacos />
          )}

          {activeTab === "satisfacao" && (
            <PesquisaSatisfacao />
          )}

          {activeTab === "bi" && (
            <InteligenciaNegocio
              events={filteredEvents}
              tickets={tickets.filter((t: any) => filteredEvents.some((e: any) => e.id === t.eventId))}
              finance={filteredFinance}
              campaigns={filteredCampaigns}
              sponsorships={sponsorships.filter((s: any) => filteredEvents.some((e: any) => e.id === s.eventId))}
              staff={filteredStaff}
              leads={filteredLeads}
            />
          )}

          {activeTab === "riscos" && (
            <GestaoRiscos />
          )}

          {activeTab === "planejamento" && (
            <PlanejamentoFinanceiro events={filteredEvents} selectedEventId={selectedEventId} selectedTenantId={selectedTenantId} onRefresh={fetchDatabase} />
          )}

          {activeTab === "admin" && (
            <Administracao />
          )}

          {activeTab === "biblioteca" && (
            <BibliotecaDigital events={filteredEvents.map(e => ({ id: e.id, name: e.name }))} />
          )}

          {activeTab === "chatbot" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[580px]">
              
              {/* Chat Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center animate-pulse">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Central de Assistência IA - Gemini</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Analista financeiro, orçamentário e legal conectado aos seus dados reais</p>
                  </div>
                </div>
                {selectedEvent && (
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Foco no Evento</span>
                    <span className="text-xs text-white font-semibold truncate max-w-xs block">{selectedEvent.name}</span>
                  </div>
                )}
              </div>

              {/* Chat Conversation Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 scrollbar-thin">
                {aiHistory.map((item, idx) => (
                  <div key={idx} className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-4 rounded-2xl text-xs max-w-2xl leading-relaxed whitespace-pre-wrap ${
                      item.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10"
                        : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm"
                    }`}>
                      <div className="font-bold text-[9px] uppercase tracking-wider mb-1 opacity-70">
                        {item.sender === "user" ? "Henrique Silva (Admin)" : "EventFlow AI"}
                      </div>
                      {item.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span>
                      <span>Analisando estatísticas do banco de dados para formular resposta...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Suggestions Area */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleSendAiMessage("Simular cenário orçamentário para um evento com capacidade de 5000 pessoas")}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-sm transition-all"
                >
                  📊 Simular Cenários Financeiros
                </button>
                <button
                  onClick={() => handleSendAiMessage("Recomendar preço ótimo de ticket com base em taxa de conversão recente")}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-sm transition-all"
                >
                  💰 Sugerir Precificação Lote
                </button>
                <button
                  onClick={() => handleSendAiMessage("Gerar rascunho de cronograma de atividades para uma maratona de rua corporativa")}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-sm transition-all"
                >
                  🗓️ Rascunhar Cronograma Atividades
                </button>
                <button
                  onClick={() => handleSendAiMessage("Redigir minuta completa de Patrocínio Master cota Diamond")}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-sm transition-all"
                >
                  📄 Minuta Patrocínio
                </button>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-150 flex gap-2">
                <input
                  type="text"
                  placeholder="Envie perguntas sobre faturamento, fornecedores recomendados ou auditorias de risco..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
                  className="flex-1 bg-slate-100 border border-transparent rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
                <button
                  onClick={() => handleSendAiMessage()}
                  className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all"
                >
                  <Send size={15} />
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* MODALS */}
      
      {/* 1. Create Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-150">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase text-slate-800 tracking-wider">Criar Novo Evento</h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">
                Fechar
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Nome do Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corrida do Sol Natal 2026"
                  value={newEventData.name}
                  onChange={(e) => setNewEventData({ ...newEventData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Tipo de Evento</label>
                  <select
                    value={newEventData.type}
                    onChange={(e) => setNewEventData({ ...newEventData, type: e.target.value as EventType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value={EventType.RUNNING}>Corrida de Rua</option>
                    <option value={EventType.MARATHON}>Maratona</option>
                    <option value={EventType.TRAIL_RUN}>Trail Run</option>
                    <option value={EventType.TRIATHLON}>Triathlon</option>
                    <option value={EventType.CYCLING}>Ciclismo</option>
                    <option value={EventType.CONGRESS}>Congresso</option>
                    <option value={EventType.FESTIVAL}>Festival / Show</option>
                    <option value={EventType.WORKSHOP}>Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newEventData.date}
                    onChange={(e) => setNewEventData({ ...newEventData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Descrição</label>
                <textarea
                  required
                  placeholder="Descreva o propósito principal do evento..."
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Localização (Endereço Completo)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Parque das Dunas, Natal - RN"
                  value={newEventData.location}
                  onChange={(e) => setNewEventData({ ...newEventData, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Capacidade</label>
                  <input
                    type="number"
                    required
                    value={newEventData.capacity}
                    onChange={(e) => setNewEventData({ ...newEventData, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Valor Ingresso</label>
                  <input
                    type="number"
                    required
                    value={newEventData.ticketPrice}
                    onChange={(e) => setNewEventData({ ...newEventData, ticketPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Cota Custos</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={newEventData.budgetRatio}
                    onChange={(e) => setNewEventData({ ...newEventData, budgetRatio: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Salvar Evento & Gerar Checklist Operacional
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-150">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase text-slate-800 tracking-wider">Novo Lead Comercial</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">
                Fechar
              </button>
            </div>

            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Nome do Contato</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roberto Dinamite"
                  value={newLeadData.name}
                  onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Empresa / Marca</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ambev S.A."
                  value={newLeadData.company}
                  onChange={(e) => setNewLeadData({ ...newLeadData, company: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Tipo</label>
                  <select
                    value={newLeadData.type}
                    onChange={(e) => setNewLeadData({ ...newLeadData, type: e.target.value as LeadType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value={LeadType.SPONSOR}>Patrocinador</option>
                    <option value={LeadType.EXHIBITOR}>Expositor</option>
                    <option value={LeadType.CLIENT}>Cliente Direto</option>
                    <option value={LeadType.ORGANIZER}>Co-organizador</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Valor Estimado Cota (BRL)</label>
                  <input
                    type="number"
                    required
                    value={newLeadData.value}
                    onChange={(e) => setNewLeadData({ ...newLeadData, value: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="contato@empresa.com"
                    value={newLeadData.email}
                    onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Telefone</label>
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    value={newLeadData.phone}
                    onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Notas da Negociação</label>
                <textarea
                  placeholder="Ex: Reunião agendada para apresentação da cota master."
                  value={newLeadData.notes}
                  onChange={(e) => setNewLeadData({ ...newLeadData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Adicionar ao Pipeline Comercial
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Sponsorship Modal */}
      {showAddSponsorshipModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-150">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase text-slate-800 tracking-wider">Novo Patrocínio</h3>
              <button onClick={() => setShowAddSponsorshipModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Fechar</button>
            </div>
            <form onSubmit={handleCreateSponsorship} className="p-6 space-y-4">
              {!selectedEventId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
                  ⚠️ Selecione um evento no seletor acima antes de cadastrar um patrocínio.
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Nome do Patrocinador</label>
                <input type="text" required placeholder="Ex: Nike Brasil S.A."
                  value={newSponsorshipData.sponsorName}
                  onChange={(e) => setNewSponsorshipData({ ...newSponsorshipData, sponsorName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Cota / Naming</label>
                  <select value={newSponsorshipData.quotaName}
                    onChange={(e) => setNewSponsorshipData({ ...newSponsorshipData, quotaName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-amber-400">
                    <option>Diamond</option>
                    <option>Master</option>
                    <option>Gold</option>
                    <option>Silver</option>
                    <option>Bronze</option>
                    <option>Apoiador</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Valor (R$)</label>
                  <input type="number" required min={1}
                    value={newSponsorshipData.value}
                    onChange={(e) => setNewSponsorshipData({ ...newSponsorshipData, value: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-amber-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Status</label>
                  <select value={newSponsorshipData.status}
                    onChange={(e) => setNewSponsorshipData({ ...newSponsorshipData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-amber-400">
                    <option value="PROPOSAL">Proposta</option>
                    <option value="ACTIVE">Ativo</option>
                    <option value="COMPLETED">Concluído</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">ROI Estimado (%)</label>
                  <input type="number" min={0} max={100}
                    value={newSponsorshipData.roiRatio}
                    onChange={(e) => setNewSponsorshipData({ ...newSponsorshipData, roiRatio: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Entregas Contratadas (uma por linha)</label>
                <textarea rows={3} placeholder={"Logotipo na camiseta oficial\nEstande 50m² no evento\nMenção no palco principal"}
                  value={newSponsorshipData.deliverables}
                  onChange={(e) => setNewSponsorshipData({ ...newSponsorshipData, deliverables: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:bg-white focus:border-amber-400 resize-none"
                />
              </div>
              <button type="submit" disabled={!selectedEventId}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                Cadastrar Patrocínio & Lançar no Financeiro
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
