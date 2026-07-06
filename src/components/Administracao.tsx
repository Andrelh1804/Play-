import React, { useState } from "react";
import {
  Building2, Users, CreditCard, Settings, ShieldCheck, ChevronDown, ChevronUp,
  Plus, X, Edit2, Trash2, Check, ToggleLeft, ToggleRight, Globe, Bell, Lock,
  Database, Upload, Palette, Eye, EyeOff, AlertTriangle, Activity
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | "CUSTOM";
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  usersCount: number;
  eventsCount: number;
  createdAt: string;
  logoColor: string;
  primaryColor: string;
  accentColor: string;
  customDomain?: string;
  whiteLabel: boolean;
}

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  lastLogin: string;
  mfa: boolean;
  companyId: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  ip: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
}

const PLANS: Record<string, { name: string; price: number; users: number; events: number; color: string }> = {
  STARTER: { name: "Starter", price: 297, users: 5, events: 10, color: "from-slate-500 to-slate-600" },
  PROFESSIONAL: { name: "Professional", price: 997, users: 25, events: 50, color: "from-blue-500 to-blue-600" },
  ENTERPRISE: { name: "Enterprise", price: 2997, users: 100, events: 200, color: "from-violet-500 to-violet-700" },
  CUSTOM: { name: "Custom", price: 0, users: 9999, events: 9999, color: "from-amber-500 to-amber-600" },
};

const SEED_COMPANIES: Company[] = [
  { id: "comp-1", name: "EventFlow Eventos S.A.", cnpj: "12.345.678/0001-90", email: "contato@eventflow.com.br", phone: "(11) 98765-4321", address: "Av. Paulista, 1000", city: "São Paulo", state: "SP", plan: "ENTERPRISE", status: "ACTIVE", usersCount: 18, eventsCount: 47, createdAt: "2024-01-15", logoColor: "#6D28D9", primaryColor: "#6D28D9", accentColor: "#F59E0B", customDomain: "app.eventflow.com.br", whiteLabel: true },
  { id: "comp-2", name: "Maratona Brasil Ltda.", cnpj: "98.765.432/0001-10", email: "admin@maratonabrasil.com.br", phone: "(11) 91234-5678", address: "Rua das Flores, 250", city: "São Paulo", state: "SP", plan: "PROFESSIONAL", status: "ACTIVE", usersCount: 8, eventsCount: 12, createdAt: "2024-06-01", logoColor: "#3B82F6", primaryColor: "#3B82F6", accentColor: "#10B981", customDomain: "", whiteLabel: false },
  { id: "comp-3", name: "Congresso Tech 2025", cnpj: "11.222.333/0001-44", email: "ti@congresotech.com.br", phone: "(21) 99000-1111", address: "Rua Irineu Marinho, 35", city: "Rio de Janeiro", state: "RJ", plan: "STARTER", status: "TRIAL", usersCount: 2, eventsCount: 1, createdAt: "2026-06-20", logoColor: "#10B981", primaryColor: "#10B981", accentColor: "#6366F1", customDomain: "", whiteLabel: false },
];

const SEED_USERS: PlatformUser[] = [
  { id: "u-1", name: "Henrique Silva", email: "andre.luishenrique@gmail.com", role: "Super Administrador da Plataforma", status: "ACTIVE", lastLogin: "2026-07-06T10:30:00Z", mfa: true, companyId: "comp-1" },
  { id: "u-2", name: "Ana Paula Lima", email: "ana.lima@eventflow.com.br", role: "Administrador da Empresa", status: "ACTIVE", lastLogin: "2026-07-06T09:15:00Z", mfa: true, companyId: "comp-1" },
  { id: "u-3", name: "Carlos Mendes", email: "carlos.mendes@maratonabrasil.com.br", role: "Gestor do Evento", status: "ACTIVE", lastLogin: "2026-07-05T18:22:00Z", mfa: false, companyId: "comp-2" },
  { id: "u-4", name: "Fernanda Costa", email: "fernanda@congresotech.com.br", role: "Produtor", status: "PENDING", lastLogin: "—", mfa: false, companyId: "comp-3" },
  { id: "u-5", name: "Roberto Santos", email: "roberto.santos@eventflow.com.br", role: "Financeiro", status: "INACTIVE", lastLogin: "2026-05-10T14:00:00Z", mfa: false, companyId: "comp-1" },
];

const SEED_AUDIT: AuditLog[] = [
  { id: "al-1", user: "Henrique Silva", action: "Login realizado com sucesso (MFA)", module: "Autenticação", ip: "187.18.241.100", timestamp: new Date(Date.now() - 3600000).toISOString(), level: "INFO" },
  { id: "al-2", user: "Henrique Silva", action: "Contrato #CTR-007 aprovado", module: "Contratos", ip: "187.18.241.100", timestamp: new Date(Date.now() - 7200000).toISOString(), level: "INFO" },
  { id: "al-3", user: "Ana Paula Lima", action: "Ingresso #TKT-1482 reembolsado (R$ 280,00)", module: "Ticketing", ip: "200.100.50.30", timestamp: new Date(Date.now() - 10800000).toISOString(), level: "WARN" },
  { id: "al-4", user: "Sistema", action: "Tentativa de acesso não autorizado bloqueada", module: "Segurança", ip: "45.201.118.77", timestamp: new Date(Date.now() - 14400000).toISOString(), level: "ERROR" },
  { id: "al-5", user: "Carlos Mendes", action: "Exportação de relatório financeiro (PDF)", module: "ERP", ip: "177.92.33.10", timestamp: new Date(Date.now() - 18000000).toISOString(), level: "INFO" },
  { id: "al-6", user: "Henrique Silva", action: "Novo evento criado: Maratona SP 2026", module: "Eventos", ip: "187.18.241.100", timestamp: new Date(Date.now() - 21600000).toISOString(), level: "INFO" },
  { id: "al-7", user: "Ana Paula Lima", action: "Usuário Fernanda Costa convidado para a plataforma", module: "Administração", ip: "200.100.50.30", timestamp: new Date(Date.now() - 25200000).toISOString(), level: "INFO" },
  { id: "al-8", user: "Sistema", action: "Backup automático realizado com sucesso", module: "Infraestrutura", ip: "—", timestamp: new Date(Date.now() - 28800000).toISOString(), level: "INFO" },
];

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  SUSPENDED: "bg-red-100 text-red-700",
  TRIAL: "bg-amber-100 text-amber-700",
  PENDING: "bg-blue-100 text-blue-700",
};

const AUDIT_BADGE: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-700",
  WARN: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
};

const ROLES = [
  "Super Administrador da Plataforma",
  "Administrador da Empresa",
  "Gestor do Evento",
  "Produtor",
  "Coordenador",
  "Financeiro",
  "Comercial",
  "Marketing",
  "RH",
  "Staff",
];

export default function Administracao() {
  const [section, setSection] = useState<"companies" | "users" | "plans" | "settings" | "audit">("companies");
  const [companies, setCompanies] = useState<Company[]>(SEED_COMPANIES);
  const [users, setUsers] = useState<PlatformUser[]>(SEED_USERS);
  const [auditLogs] = useState<AuditLog[]>(SEED_AUDIT);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<Company>>({});
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Gestor do Evento", companyId: "comp-1" });
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    emailSender: "noreply@eventflow.com.br",
    senderName: "PLAY+EVENTOS",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: "587",
    sessionTimeout: "480",
    maxLoginAttempts: "5",
    mfaRequired: false,
    autoBackup: true,
    backupFrequency: "DAILY",
    maintenanceMode: false,
  });
  const [auditFilter, setAuditFilter] = useState("ALL");

  const totalUsers = users.filter(u => u.status === "ACTIVE").length;
  const totalEvents = companies.reduce((s, c) => s + c.eventsCount, 0);
  const totalRevenue = companies.reduce((s, c) => s + PLANS[c.plan]?.price * 12, 0);
  const trialCount = companies.filter(c => c.status === "TRIAL").length;

  const handleSaveCompany = () => {
    if (!editingCompany.name || !editingCompany.cnpj) return;
    if (editingCompany.id) {
      setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { ...c, ...editingCompany } as Company : c));
    } else {
      const newC: Company = {
        id: `comp-${Date.now()}`,
        name: editingCompany.name!,
        cnpj: editingCompany.cnpj!,
        email: editingCompany.email || "",
        phone: editingCompany.phone || "",
        address: editingCompany.address || "",
        city: editingCompany.city || "",
        state: editingCompany.state || "",
        plan: (editingCompany.plan as Company["plan"]) || "STARTER",
        status: "TRIAL",
        usersCount: 0,
        eventsCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
        logoColor: "#6D28D9",
        primaryColor: "#6D28D9",
        accentColor: "#F59E0B",
        whiteLabel: false,
      };
      setCompanies(prev => [...prev, newC]);
    }
    setShowCompanyModal(false);
    setEditingCompany({});
  };

  const handleInviteUser = () => {
    if (!newUser.name || !newUser.email) return;
    const u: PlatformUser = {
      id: `u-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "PENDING",
      lastLogin: "—",
      mfa: false,
      companyId: newUser.companyId,
    };
    setUsers(prev => [...prev, u]);
    setShowUserModal(false);
    setNewUser({ name: "", email: "", role: "Gestor do Evento", companyId: "comp-1" });
  };

  const filteredAudit = auditFilter === "ALL" ? auditLogs : auditLogs.filter(a => a.level === auditFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Administração da Plataforma</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão multi-empresa, licenças, usuários, white label e configurações globais</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {([
            ["companies", Building2, "Empresas"],
            ["users", Users, "Usuários"],
            ["plans", CreditCard, "Planos"],
            ["settings", Settings, "Configurações"],
            ["audit", ShieldCheck, "Auditoria"],
          ] as [string, any, string][]).map(([k, Icon, l]) => (
            <button key={k} onClick={() => setSection(k as any)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${section === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              <Icon size={13}/>{l}
            </button>
          ))}
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Empresas Ativas", value: companies.filter(c => c.status === "ACTIVE").length, sub: `${trialCount} em trial`, color: "from-violet-500 to-violet-600", icon: "🏢" },
          { label: "Usuários Ativos", value: totalUsers, sub: `${users.length} total`, color: "from-blue-500 to-blue-600", icon: "👤" },
          { label: "Eventos Gerenciados", value: totalEvents, sub: "todas as empresas", color: "from-emerald-500 to-emerald-600", icon: "📅" },
          { label: "ARR (Anual)", value: `R$ ${(totalRevenue/1000).toFixed(0)}k`, sub: "receita recorrente", color: "from-amber-500 to-amber-600", icon: "💰" },
        ].map((k, i) => (
          <div key={i} className={`bg-gradient-to-br ${k.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-2xl font-black">{k.value}</div>
            <div className="text-[10px] opacity-70 font-medium">{k.label}</div>
            <div className="text-[9px] opacity-50">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* COMPANIES */}
      {section === "companies" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Empresas Cadastradas</h3>
            <button onClick={() => { setEditingCompany({ plan: "STARTER" }); setShowCompanyModal(true); }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <Plus size={13}/> Nova Empresa
            </button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {companies.map(c => (
              <div key={c.id} onClick={() => setSelectedCompany(selectedCompany?.id === c.id ? null : c)}
                className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${selectedCompany?.id === c.id ? "border-violet-400 shadow-md" : "border-slate-200"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: c.logoColor }}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.cnpj}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${PLANS[c.plan]?.color}`}>{PLANS[c.plan]?.name}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Usuários</p><p className="font-bold text-slate-800">{c.usersCount}</p></div>
                  <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Eventos</p><p className="font-bold text-slate-800">{c.eventsCount}</p></div>
                </div>
                {c.whiteLabel && (
                  <div className="mt-3 flex items-center gap-2">
                    <Globe size={10} className="text-violet-500"/>
                    <span className="text-[9px] text-violet-600 font-bold">White Label Ativo · {c.customDomain}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); setEditingCompany(c); setShowCompanyModal(true); }}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-violet-600 transition-all px-2 py-1 rounded-lg hover:bg-violet-50">
                    <Edit2 size={10}/> Editar
                  </button>
                  <button onClick={e => { e.stopPropagation(); setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, status: x.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" } : x)); }}
                    className={`flex items-center gap-1 text-[10px] font-bold transition-all px-2 py-1 rounded-lg ${c.status === "ACTIVE" ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50"}`}>
                    {c.status === "ACTIVE" ? <><ToggleRight size={10}/>Suspender</> : <><ToggleLeft size={10}/>Ativar</>}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Company Detail */}
          {selectedCompany && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-800">White Label & Personalização · {selectedCompany.name}</h3>
                <button onClick={() => setSelectedCompany(null)}><X size={14} className="text-slate-400"/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Identidade Visual</p>
                  <div className="space-y-3">
                    {[
                      { label: "Cor Principal", value: selectedCompany.primaryColor },
                      { label: "Cor de Destaque", value: selectedCompany.accentColor },
                      { label: "Cor do Logo", value: selectedCompany.logoColor },
                    ].map((col, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-slate-200" style={{ backgroundColor: col.value }}/>
                        <div>
                          <p className="text-[9px] text-slate-400">{col.label}</p>
                          <p className="text-xs font-mono text-slate-700">{col.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Domínio Personalizado</p>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-400 mb-1">Domínio Configurado</p>
                    <p className="text-xs font-mono font-bold text-slate-800">{selectedCompany.customDomain || "Não configurado"}</p>
                    <div className={`mt-2 flex items-center gap-1 text-[9px] font-bold ${selectedCompany.whiteLabel ? "text-emerald-600" : "text-slate-400"}`}>
                      {selectedCompany.whiteLabel ? <Check size={10}/> : <X size={10}/>}
                      White Label {selectedCompany.whiteLabel ? "Ativo" : "Inativo"}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Consumo do Plano {PLANS[selectedCompany.plan]?.name}</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-slate-500">Usuários</span>
                        <span className="font-bold text-slate-700">{selectedCompany.usersCount}/{PLANS[selectedCompany.plan]?.users}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100,(selectedCompany.usersCount/PLANS[selectedCompany.plan]?.users)*100)}%` }}/>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-slate-500">Eventos</span>
                        <span className="font-bold text-slate-700">{selectedCompany.eventsCount}/{PLANS[selectedCompany.plan]?.events}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100,(selectedCompany.eventsCount/PLANS[selectedCompany.plan]?.events)*100)}%` }}/>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3">Ativa desde: {selectedCompany.createdAt}</p>
                  <p className="text-[10px] text-slate-400">{selectedCompany.city}/{selectedCompany.state} · {selectedCompany.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {section === "users" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Gestão de Usuários</h3>
            <button onClick={() => setShowUserModal(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <Plus size={13}/> Convidar Usuário
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Usuário","Email","Perfil","Empresa","Status","Último Login","MFA","Ações"].map(h => (
                    <th key={h} className="text-[10px] font-bold text-slate-400 uppercase text-left py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const company = companies.find(c => c.id === u.companyId);
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-blue-500 flex items-center justify-center text-white text-[9px] font-black">{u.name.charAt(0)}</div>
                          <span className="text-xs font-medium text-slate-800 whitespace-nowrap">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[10px] text-slate-500">{u.email}</td>
                      <td className="py-3 px-3"><span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{u.role.split(" ").slice(0,2).join(" ")}</span></td>
                      <td className="py-3 px-3 text-[10px] text-slate-500 whitespace-nowrap">{company?.name?.split(" ").slice(0,2).join(" ")}</td>
                      <td className="py-3 px-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[u.status]}`}>{u.status}</span></td>
                      <td className="py-3 px-3 text-[10px] text-slate-500 whitespace-nowrap">{u.lastLogin !== "—" ? new Date(u.lastLogin).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="py-3 px-3">
                        <div className={`flex items-center gap-1 text-[9px] font-bold ${u.mfa ? "text-emerald-600" : "text-slate-300"}`}>
                          <Lock size={10}/>{u.mfa ? "Ativo" : "Off"}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: x.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : x))}
                            className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${u.status === "ACTIVE" ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50"}`}>
                            {u.status === "ACTIVE" ? "Desativar" : "Ativar"}
                          </button>
                          <button onClick={() => setUsers(prev => prev.filter(x => x.id !== u.id))}
                            className="text-[9px] font-bold text-slate-300 hover:text-red-400 px-1 transition-all">
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLANS */}
      {section === "plans" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Object.entries(PLANS).map(([key, plan]) => {
              const compCount = companies.filter(c => c.plan === key).length;
              return (
                <div key={key} className={`bg-gradient-to-br ${plan.color} rounded-2xl p-6 text-white shadow-md`}>
                  <p className="text-[10px] font-bold uppercase opacity-70 mb-3">{plan.name}</p>
                  <p className="text-3xl font-black">{plan.price > 0 ? `R$ ${plan.price}` : "Custom"}</p>
                  <p className="text-[10px] opacity-60">{plan.price > 0 ? "/mês" : "sob consulta"}</p>
                  <div className="mt-4 space-y-1 text-[10px] opacity-80">
                    <p>👤 {plan.users === 9999 ? "Ilimitado" : plan.users} usuários</p>
                    <p>📅 {plan.events === 9999 ? "Ilimitado" : plan.events} eventos</p>
                    {key === "ENTERPRISE" && <p>🌐 White Label</p>}
                    {key === "ENTERPRISE" && <p>🔒 MFA obrigatório</p>}
                    {key === "CUSTOM" && <p>🏗 SLA dedicado</p>}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-[10px] opacity-70">{compCount} empresa{compCount !== 1 ? "s" : ""} neste plano</p>
                    <p className="text-[10px] font-black">ARR: R$ {(compCount * plan.price * 12).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Usage Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Consumo de Licenças por Empresa</h3>
            <div className="space-y-4">
              {companies.map(c => {
                const plan = PLANS[c.plan];
                const userPct = plan.users < 9999 ? Math.round((c.usersCount / plan.users) * 100) : 0;
                const eventPct = plan.events < 9999 ? Math.round((c.eventsCount / plan.events) * 100) : 0;
                return (
                  <div key={c.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-black" style={{ backgroundColor: c.logoColor }}>{c.name.charAt(0)}</div>
                        <span className="text-xs font-bold text-slate-800">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${plan.color}`}>{plan.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[9px] mb-0.5"><span className="text-slate-400">Usuários</span><span className={`font-bold ${userPct >= 90 ? "text-red-500" : "text-slate-600"}`}>{c.usersCount}/{plan.users === 9999 ? "∞" : plan.users}</span></div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${userPct >= 90 ? "bg-red-500" : "bg-violet-500"}`} style={{ width: `${Math.min(100, userPct)}%` }}/></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] mb-0.5"><span className="text-slate-400">Eventos</span><span className={`font-bold ${eventPct >= 90 ? "text-red-500" : "text-slate-600"}`}>{c.eventsCount}/{plan.events === 9999 ? "∞" : plan.events}</span></div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${eventPct >= 90 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min(100, eventPct)}%` }}/></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {section === "settings" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* General */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><Globe size={14}/>Configurações Gerais</h3>
            <div className="space-y-3">
              {[
                { label: "Moeda", key: "currency", options: ["BRL","USD","EUR","GBP"] },
                { label: "Fuso Horário", key: "timezone", options: ["America/Sao_Paulo","America/Fortaleza","America/Manaus","UTC"] },
                { label: "Idioma", key: "language", options: ["pt-BR","en-US","es-ES"] },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{field.label}</label>
                  <select value={(settings as any)[field.key]} onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    {field.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><Bell size={14}/>E-mail & Notificações</h3>
            <div className="space-y-3">
              {[
                { label: "Remetente (E-mail)", key: "emailSender", type: "email" },
                { label: "Nome do Remetente", key: "senderName", type: "text" },
                { label: "Servidor SMTP", key: "smtpHost", type: "text" },
                { label: "Porta SMTP", key: "smtpPort", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{f.label}</label>
                  <input type={f.type} value={(settings as any)[f.key]} onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><Lock size={14}/>Segurança</h3>
            <div className="space-y-3">
              {[
                { label: "Timeout da Sessão (min)", key: "sessionTimeout", type: "number" },
                { label: "Tentativas Máximas de Login", key: "maxLoginAttempts", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{f.label}</label>
                  <input type={f.type} value={(settings as any)[f.key]} onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
              ))}
              {[
                { label: "MFA Obrigatório para todos", key: "mfaRequired" },
                { label: "Manutenção Programada", key: "maintenanceMode" },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-medium text-slate-700">{f.label}</span>
                  <button onClick={() => setSettings(prev => ({ ...prev, [f.key]: !(prev as any)[f.key] }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${(settings as any)[f.key] ? "bg-violet-600" : "bg-slate-200"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${(settings as any)[f.key] ? "left-5" : "left-0.5"}`}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Backup */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><Database size={14}/>Backup & Recuperação</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-medium text-slate-700">Backup Automático</span>
                <button onClick={() => setSettings(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${settings.autoBackup ? "bg-violet-600" : "bg-slate-200"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${settings.autoBackup ? "left-5" : "left-0.5"}`}/>
                </button>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Frequência</label>
                <select value={settings.backupFrequency} onChange={e => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                  <option value="HOURLY">A cada hora</option>
                  <option value="DAILY">Diário</option>
                  <option value="WEEKLY">Semanal</option>
                </select>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-700 mb-1">✅ Último Backup Bem-sucedido</p>
                <p className="text-[10px] text-emerald-600">{new Date(Date.now() - 3600000).toLocaleString("pt-BR")}</p>
                <p className="text-[9px] text-emerald-500 mt-0.5">Tamanho: 2.4 GB · Armazenado em S3</p>
              </div>
              <button className="w-full py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">
                Executar Backup Manual Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT */}
      {section === "audit" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Trilha de Auditoria do Sistema</h3>
            <div className="flex items-center gap-2">
              {["ALL","INFO","WARN","ERROR"].map(l => (
                <button key={l} onClick={() => setAuditFilter(l)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${auditFilter === l ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  {l === "ALL" ? "Todos" : l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredAudit.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${AUDIT_BADGE[log.level]}`}>{log.level}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{log.module}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>👤 {log.user}</span>
                    <span>🌐 {log.ip}</span>
                    <span>🕐 {new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Retenção de logs: 90 dias · Total: {auditLogs.length} registros exibidos</span>
            <button className="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-800 transition-all">
              <Upload size={10}/> Exportar CSV
            </button>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">{editingCompany.id ? "Editar Empresa" : "Nova Empresa"}</h3>
              <button onClick={() => { setShowCompanyModal(false); setEditingCompany({}); }}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Razão Social</label>
                  <input value={editingCompany.name || ""} onChange={e => setEditingCompany({...editingCompany, name: e.target.value})} placeholder="Nome da empresa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">CNPJ</label>
                  <input value={editingCompany.cnpj || ""} onChange={e => setEditingCompany({...editingCompany, cnpj: e.target.value})} placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Plano</label>
                  <select value={editingCompany.plan || "STARTER"} onChange={e => setEditingCompany({...editingCompany, plan: e.target.value as Company["plan"]})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail</label>
                  <input type="email" value={editingCompany.email || ""} onChange={e => setEditingCompany({...editingCompany, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Telefone</label>
                  <input value={editingCompany.phone || ""} onChange={e => setEditingCompany({...editingCompany, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Endereço</label>
                  <input value={editingCompany.address || ""} onChange={e => setEditingCompany({...editingCompany, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cidade</label>
                  <input value={editingCompany.city || ""} onChange={e => setEditingCompany({...editingCompany, city: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Estado</label>
                  <input value={editingCompany.state || ""} maxLength={2} onChange={e => setEditingCompany({...editingCompany, state: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Domínio Personalizado</label>
                  <input value={editingCompany.customDomain || ""} onChange={e => setEditingCompany({...editingCompany, customDomain: e.target.value})} placeholder="app.suaempresa.com.br"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-medium text-slate-700 flex-1">White Label</span>
                  <button onClick={() => setEditingCompany(prev => ({ ...prev, whiteLabel: !prev.whiteLabel }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${editingCompany.whiteLabel ? "bg-violet-600" : "bg-slate-200"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${editingCompany.whiteLabel ? "left-5" : "left-0.5"}`}/>
                  </button>
                </div>
              </div>
              <button onClick={handleSaveCompany} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all">
                {editingCompany.id ? "Salvar Alterações" : "Cadastrar Empresa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Invite Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">Convidar Usuário</h3>
              <button onClick={() => setShowUserModal(false)}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Completo</label>
                <input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Nome do usuário"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@empresa.com.br"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Perfil de Acesso</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Empresa</label>
                <select value={newUser.companyId} onChange={e => setNewUser({...newUser, companyId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-violet-400">
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                📧 O usuário receberá um e-mail de convite para definir sua senha e configurar o MFA.
              </div>
              <button onClick={handleInviteUser} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all">
                Enviar Convite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
