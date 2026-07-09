import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, Ticket, DollarSign, Users, Briefcase, FileText,
  UserCheck, Megaphone, Sparkles, Sliders, ChevronRight, Play,
  ArrowRight, ShieldCheck, Zap, Globe, Cpu, Award, Lock, Menu,
  X, Search, MapPin, Clock, Tag, Star, ExternalLink, Phone,
  Mail, Building2, Target, Layers, CheckCircle, ChevronDown
} from "lucide-react";
const playEventosLogo = "/logo.jpg";

interface PublicEvent {
  id: string;
  name: string;
  slug: string;
  type: string;
  date: string;
  time?: string;
  location: string;
  city: string;
  state: string;
  capacity: number;
  ticketPrice: number;
  imageUrl?: string | null;
  organizer: string;
  status: string;
}

interface LandingPageProps {
  onEnter: () => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  RUNNING: "Corrida", CYCLING: "Ciclismo", TRIATHLON: "Triathlon",
  TRAIL: "Trail Run", SWIM: "Natação", SPORTS: "Esportivo",
  CONCERT: "Show", FESTIVAL: "Festival", CONGRESS: "Congresso",
  FAIR: "Feira", CORPORATE: "Corporativo", PARTY: "Festa",
  THEATER: "Teatro", WORKSHOP: "Workshop", ONLINE: "Online",
};

function formatDateBR(d: string) {
  try {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [demoName, setDemoName] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoCompany, setDemoCompany] = useState("");
  const [demoSent, setDemoSent] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/public/events")
      .then(r => r.ok ? r.json() : [])
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  const allTypes = ["Todos", ...Array.from(new Set(events.map(e => EVENT_TYPE_LABELS[e.type] || e.type)))].filter(Boolean);

  const filteredEvents = events.filter(ev => {
    const label = EVENT_TYPE_LABELS[ev.type] || ev.type;
    const matchSearch = !search ||
      ev.name.toLowerCase().includes(search.toLowerCase()) ||
      (ev.city || "").toLowerCase().includes(search.toLowerCase()) ||
      label.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "Todos" || label === typeFilter;
    return matchSearch && matchType;
  });

  const navLinks = [
    { href: "#eventos", label: "Eventos" },
    { href: "#plataforma", label: "Plataforma" },
    { href: "#tecnologia", label: "Tecnologia" },
    { href: "#sobre", label: "Sobre" },
    { href: "#contato", label: "Contato" },
  ];

  return (
    <div id="landing-root" className="min-h-screen bg-[#04060b] text-slate-100 font-sans overflow-x-hidden selection:bg-yellow-500/30 selection:text-yellow-200">

      {/* Decorative Blur */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-yellow-600/8 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed top-1/3 right-1/4 w-[600px] h-[600px] bg-amber-500/4 rounded-full blur-[160px] pointer-events-none"></div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#04060b]/85 border-b border-white/5 px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={playEventosLogo} alt="PLAY+EVENTOS" className="h-12 sm:h-14 w-auto object-contain"
            style={{ maskImage: "radial-gradient(ellipse 80% 78% at 50% 45%, black 48%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 80% 78% at 50% 45%, black 48%, transparent 80%)" }}
            referrerPolicy="no-referrer" />
          <span className="text-[9px] text-[#FFE211] font-mono tracking-widest uppercase font-bold hidden sm:block">Enterprise SaaS</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-semibold text-slate-400">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} className="hover:text-white transition-colors hover:text-[#FFE211]">{l.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onEnter}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#FFE211] to-yellow-500 hover:brightness-110 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-yellow-500/20 border border-yellow-400/30 transition-all flex items-center gap-1.5 cursor-pointer">
            <span className="hidden sm:inline">Acessar</span>
            <span>Cockpit</span>
            <ArrowRight size={13} />
          </button>
          <button className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-300 transition-colors" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="fixed top-16 sm:top-20 left-0 right-0 z-40 bg-[#04060b]/97 backdrop-blur-xl border-b border-white/10 md:hidden">
            <nav className="flex flex-col px-6 py-4 gap-0">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                  className="py-3.5 text-sm font-semibold text-slate-300 hover:text-white border-b border-white/5 last:border-0 transition-colors flex items-center gap-2">
                  <ChevronRight size={14} className="text-[#FFE211]" />{l.label}
                </a>
              ))}
              <button onClick={() => { onEnter(); setMobileMenuOpen(false); }}
                className="mt-4 w-full py-3.5 bg-gradient-to-r from-[#FFE211] to-yellow-500 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                <Play size={14} className="fill-slate-950" />Entrar na Plataforma
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section id="hero" className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mb-8 relative flex items-center justify-center">
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
          <img src={playEventosLogo} alt="PLAY+EVENTOS" className="relative h-56 sm:h-80 w-auto object-contain z-10"
            style={{ maskImage: "radial-gradient(ellipse 72% 68% at 50% 48%, black 38%, transparent 72%)", WebkitMaskImage: "radial-gradient(ellipse 72% 68% at 50% 48%, black 38%, transparent 72%)" }}
            referrerPolicy="no-referrer" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-[#FFE211] rounded-full text-xs font-mono font-bold mb-6">
          <Sparkles size={12} className="animate-pulse" />Event Operating System · V8.4
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.1]">
          A plataforma definitiva para gestão de{" "}
          <span className="bg-gradient-to-r from-[#FFE211] via-amber-400 to-yellow-600 bg-clip-text text-transparent">grandes eventos</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="text-slate-400 text-sm sm:text-lg max-w-3xl mt-6 leading-relaxed">
          <strong className="text-white">PLAY+EVENTOS</strong> unifica ERP Financeiro, Ticketing Enterprise, CRM Comercial, Marketplace de Fornecedores e Assistente de IA em um único ecossistema corporativo de alta performance.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto">
          <button onClick={onEnter}
            className="px-8 py-4 bg-gradient-to-r from-[#FFE211] via-yellow-500 to-yellow-600 hover:brightness-110 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-yellow-500/20 border border-yellow-400/40 transition-all flex items-center justify-center gap-2 group cursor-pointer">
            <Play size={16} className="fill-slate-950" />
            <span>Entrar na Plataforma</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a href="#eventos"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-2">
            <span>Ver Eventos</span>
            <Ticket size={15} className="text-[#FFE211]" />
          </a>
        </motion.div>

        {/* Platform Preview Mockup */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden border border-white/10 bg-[#070b13]/80 backdrop-blur-md p-3 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#04060b] z-10"></div>
          <div className="bg-[#090e1a] border-b border-white/5 rounded-t-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              <span className="text-[10px] text-slate-500 font-mono ml-3">play_eventos_cockpit · EventOS Enterprise V8.4</span>
            </div>
            <div className="flex gap-2">
              <span className="w-20 h-4 bg-white/5 rounded-full"></span>
              <span className="w-12 h-4 bg-violet-500/20 border border-violet-500/30 rounded-full"></span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-left select-none relative z-0 opacity-80 blur-[0.3px]">
            <div className="bg-[#11192e] p-5 rounded-2xl border border-white/5">
              <div className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-1">ERP FINANCEIRO</div>
              <div className="text-xl font-black text-white">Controle Total</div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full w-[72%]"></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Receitas, despesas e DRE em tempo real</p>
            </div>
            <div className="bg-[#11192e] p-5 rounded-2xl border border-white/5">
              <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1">TICKETING ENTERPRISE</div>
              <div className="text-xl font-black text-white">Venda Integrada</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-semibold">Lotes, categorias e cupons ativos</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Check-in QR · Credenciamento · Reembolsos</p>
            </div>
            <div className="bg-[#11192e] p-5 rounded-2xl border border-white/5">
              <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1">IA GEMINI CORPORATIVA</div>
              <p className="text-[10px] text-slate-300 mt-1 leading-normal">"Projeção de bilheteria revisada. Recomendado abrir lote 2 em 48h para maximizar receita."</p>
              <span className="text-[8px] bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 font-bold px-2 py-0.5 rounded mt-3 inline-block font-mono uppercase">Análise Preditiva Ativa</span>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button onClick={onEnter}
              className="px-6 py-3 bg-white text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
              <span>Acessar Painel de Controle</span>
              <ArrowRight size={14} className="text-violet-600" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── VITRINE DE EVENTOS ── */}
      <section id="eventos" className="py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs text-[#FFE211] font-black uppercase tracking-widest block font-mono">Agenda de Eventos</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">Eventos em destaque</h2>
          <p className="text-slate-400 text-sm mt-3">Encontre os melhores eventos, compre seu ingresso e garanta sua vaga.</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, cidade..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FFE211]/40 focus:bg-white/8 transition-all" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {allTypes.slice(0, 6).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${typeFilter === t ? "bg-[#FFE211] text-slate-900 border-yellow-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards */}
        {eventsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0c1220] rounded-3xl border border-white/5 overflow-hidden animate-pulse">
                <div className="h-48 bg-white/5"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/5 rounded-full w-3/4"></div>
                  <div className="h-3 bg-white/5 rounded-full w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-400">
              {events.length === 0 ? "Nenhum evento publicado no momento" : "Nenhum resultado encontrado"}
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              {events.length === 0 ? "Em breve novos eventos serão divulgados aqui." : "Tente outros termos de busca ou filtros."}
            </p>
            {events.length === 0 && (
              <button onClick={onEnter} className="mt-6 px-6 py-3 bg-[#FFE211] text-slate-900 font-black text-sm rounded-xl hover:brightness-110 transition-all">
                Cadastrar meu evento
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev, i) => {
              const isFree = ev.ticketPrice === 0;
              const isLowStock = ev.capacity > 0 && ev.capacity < 100;
              const label = EVENT_TYPE_LABELS[ev.type] || ev.type;
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-[#0c1220] rounded-3xl border border-white/5 hover:border-[#FFE211]/20 hover:shadow-xl hover:shadow-yellow-950/10 transition-all overflow-hidden flex flex-col group">
                  {/* Banner */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                    {ev.imageUrl ? (
                      <img src={ev.imageUrl} alt={ev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar size={48} className="text-slate-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-transparent to-transparent"></div>
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-0.5 bg-[#0c1220]/90 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-slate-300 rounded-full">
                        {label}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      {isFree && <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full">Gratuito</span>}
                      {isLowStock && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full animate-pulse">Últimos!</span>}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-white text-base leading-tight line-clamp-2 group-hover:text-[#FFE211] transition-colors">{ev.name}</h3>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                      {ev.date && (
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-[#FFE211] shrink-0" />
                          <span>{formatDateBR(ev.date)}{ev.time ? ` · ${ev.time}` : ""}</span>
                        </div>
                      )}
                      {(ev.city || ev.location) && (
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-[#FFE211] shrink-0" />
                          <span className="truncate">{[ev.city, ev.state].filter(Boolean).join(", ") || ev.location}</span>
                        </div>
                      )}
                      {ev.organizer && (
                        <div className="flex items-center gap-2">
                          <Building2 size={12} className="text-[#FFE211] shrink-0" />
                          <span className="truncate">{ev.organizer}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        {isFree ? (
                          <span className="text-emerald-400 font-black text-sm">Gratuito</span>
                        ) : (
                          <div>
                            <span className="text-[10px] text-slate-500 block">A partir de</span>
                            <span className="text-white font-black text-sm">
                              {ev.ticketPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <a href={`/e/${ev.slug}`}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1">
                          Ver
                          <ExternalLink size={10} />
                        </a>
                        <a href={`/e/${ev.slug}`}
                          className="px-3 py-1.5 bg-[#FFE211] hover:brightness-110 text-slate-900 rounded-xl text-xs font-black transition-all">
                          Comprar
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── PLATAFORMA / MÓDULOS ── */}
      <section id="plataforma" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs text-violet-400 font-black uppercase tracking-widest block font-mono">15 Perfis de Acesso · 20+ Módulos</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-3">
            O primeiro EventOS de padrão internacional
          </h2>
          <p className="text-slate-400 text-sm mt-4">
            Cada colaborador tem uma interface exclusiva para suas responsabilidades — da diretoria ao staff de campo.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Calendar size={22} />, color: "violet", title: "Gestão de Eventos", sub: "Para Administradores", desc: "Ciclo completo do evento: criação, programação, infraestrutura, checklists e integração com ticketing e financeiro." },
            { icon: <DollarSign size={22} />, color: "amber", title: "ERP Financeiro", sub: "Para Diretores Financeiros", desc: "Controle integral de fluxo de caixa, DRE, pedidos de compra, centros de custo e auditoria contábil." },
            { icon: <Ticket size={22} />, color: "orange", title: "Ticketing Enterprise", sub: "Para Bilheteria & Portaria", desc: "Venda, lotes, categorias, cupons, credenciamento, controle de acesso, check-in QR e reembolsos." },
            { icon: <Sparkles size={22} />, color: "cyan", title: "Inteligência Artificial", sub: "Para Gestores", desc: "Gemini AI analisa vendas, detecta riscos, sugere preços, gera documentos e relatórios automaticamente." },
            { icon: <Users size={22} />, color: "indigo", title: "CRM Enterprise", sub: "Para Comercial & Marketing", desc: "Funil de vendas, gestão de leads, propostas, contratos, patrocinadores e pesquisas de satisfação." },
            { icon: <Briefcase size={22} />, color: "emerald", title: "Marketplace", sub: "Para Produção & Compras", desc: "Hub de fornecedores homologados: som, palco, segurança, brigadistas, catering e muito mais." },
            { icon: <UserCheck size={22} />, color: "blue", title: "RH & Staff", sub: "Para RH & Equipe de Campo", desc: "Escalas, ponto eletrônico com GPS, pagamentos, equipes e comunicação em tempo real." },
            { icon: <Megaphone size={22} />, color: "pink", title: "Marketing & Campanhas", sub: "Para Marketing", desc: "Fluxos de automação, funis de captação, campanhas e integração com CRM e redes sociais." },
            { icon: <FileText size={22} />, color: "teal", title: "Contratos & Auditoria", sub: "Para Jurídico", desc: "Gestão de contratos, assinatura digital, histórico de aprovações e conformidade LGPD." },
          ].map((feat, i) => {
            const colorMap: Record<string, string> = {
              violet: "bg-violet-600/10 border-violet-500/20 text-violet-400",
              amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
              orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
              cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
              indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
              emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
              pink: "bg-pink-500/10 border-pink-500/20 text-pink-400",
              teal: "bg-teal-500/10 border-teal-500/20 text-teal-400",
            };
            return (
              <div key={i} className="p-8 rounded-3xl bg-[#0c1220] border border-white/5 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-950/10 transition-all flex flex-col justify-between group">
                <div>
                  <div className={`w-12 h-12 rounded-2xl ${colorMap[feat.color]} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{feat.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono font-bold uppercase">{feat.sub}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TECNOLOGIA ── */}
      <section id="tecnologia" className="py-20 bg-[#0b101c] border-y border-white/5 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs text-amber-500 font-black uppercase tracking-widest block font-mono">Infraestrutura Corporativa</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Construído para escala, segurança e zero downtime
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-4 leading-relaxed">
              O PLAY+EVENTOS opera sobre arquitetura robusta com PostgreSQL, JWT, RBAC de 17 níveis e monitoramento integrado via API Gateway corporativo.
            </p>
            <div className="space-y-4 mt-8">
              {[
                { icon: <Cpu size={18} />, title: "API Gateway & Rate-Limiting", desc: "Proteção contra bots e fila virtual para picos de acesso durante abertura de vendas." },
                { icon: <Sliders size={18} />, title: "Sincronização em Tempo Real", desc: "Dashboard executivo, NOC e dados financeiros atualizados em tempo real via PostgreSQL." },
                { icon: <ShieldCheck size={18} />, title: "RBAC com 17 Perfis de Acesso", desc: "Do Super Admin ao Participante — cada perfil vê apenas o que precisa." },
                { icon: <Zap size={18} />, title: "IA Google Gemini Integrada", desc: "Análise preditiva, geração de documentos e relatórios automáticos em todos os módulos." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/10">{item.icon}</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0c1220] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-extrabold text-white mb-4">NOC Enterprise — Logs em Tempo Real</h3>
            <div className="bg-[#060910] rounded-2xl p-4 font-mono text-[10px] text-slate-400 space-y-2 border border-white/5">
              <div className="text-green-400">INFO [{new Date().toISOString().slice(0,10)}] — EventOS API GATEWAY ONLINE · Port 5000</div>
              <div>POST /api/tickets/buy → 200 · Lote 2 Corrida Play 10K</div>
              <div>GET /api/public/events → 200 · {events.length} eventos publicados</div>
              <div className="text-amber-400">WARN — Ocupação 87% · Evento: Maratona SP · Abrindo lista de espera</div>
              <div className="text-violet-400">AI [Gemini] — "Receita projetada revisada. Recomendado abrir lote 3 em 24h."</div>
              <div>PUT /api/events/:id/status → 200 · PUBLISHED</div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-violet-500/5 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* ── SEGURANÇA ── */}
      <section id="seguranca" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Segurança de Nível Corporativo</h2>
          <p className="text-slate-400 text-sm mt-3">Todas as transações e ingressos contam com criptografia, logs de auditoria e conformidade LGPD.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { title: "Criptografia RSA", desc: "Ingressos assinados digitalmente para impedir clonagem e repasse ilegal de vouchers." },
            { title: "Conformidade LGPD", desc: "Tratamento blindado de dados de atletas, compradores e contratos corporativos com retenção controlada." },
            { title: "Audit Trail Completo", desc: "Cada aprovação, alteração ou transação é registrada no log de auditoria imutável do API Gateway." },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-[#0c1220] rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all">
              <CheckCircle size={20} className="text-emerald-400 mb-3" />
              <h4 className="font-bold text-white mb-2">{item.title}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOBRE / INSTITUCIONAL ── */}
      <section id="sobre" className="py-24 bg-[#0b101c] border-t border-white/5 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs text-[#FFE211] font-black uppercase tracking-widest block font-mono">Nossa Empresa</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">Quem somos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: <Target size={22} />, title: "Nossa Missão", desc: "Democratizar a gestão profissional de eventos, oferecendo tecnologia de nível internacional para organizadores de todos os portes." },
              { icon: <Globe size={22} />, title: "Nossa Visão", desc: "Ser o sistema operacional de eventos mais completo do Brasil, integrando toda a cadeia do evento em uma única plataforma." },
              { icon: <Layers size={22} />, title: "Nossa Tecnologia", desc: "Stack moderno com React, TypeScript, PostgreSQL e IA Google Gemini, garantindo escalabilidade, segurança e performance." },
              { icon: <Award size={22} />, title: "Nossos Valores", desc: "Inovação contínua, transparência, confiabilidade e foco absoluto na experiência do organizador e do participante." },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-[#0c1220] rounded-2xl border border-white/5 hover:border-[#FFE211]/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-[#FFE211] flex items-center justify-center mb-4">{item.icon}</div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Benefícios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-extrabold text-white mb-6">Por que escolher o PLAY+EVENTOS?</h3>
              <div className="space-y-4">
                {[
                  "Plataforma all-in-one: do planejamento à pós-análise",
                  "IA integrada em todos os módulos operacionais",
                  "Ticketing com lotes, categorias, cupons e check-in QR",
                  "ERP financeiro com DRE, fluxo de caixa e pedidos de compra",
                  "CRM comercial com funil de vendas e gestão de patrocinadores",
                  "Marketplace de fornecedores homologados",
                  "RBAC com 17 perfis de acesso configuráveis",
                  "Conformidade LGPD e audit trail completo",
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#FFE211] shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* FAQ */}
            <div>
              <h3 className="text-2xl font-extrabold text-white mb-6">Perguntas frequentes</h3>
              <div className="space-y-3">
                {[
                  { q: "O PLAY+EVENTOS funciona para qualquer tipo de evento?", a: "Sim. A plataforma suporta corridas, shows, festivais, congressos, feiras, casamentos, eventos corporativos e muito mais." },
                  { q: "Preciso instalar algum software?", a: "Não. O PLAY+EVENTOS é 100% cloud. Acesse pelo navegador em qualquer dispositivo, a qualquer hora." },
                  { q: "Como funciona o módulo de ticketing?", a: "Você cria categorias, lotes e cupons. O participante compra online, recebe QR Code e faz check-in na portaria via scanner." },
                  { q: "Posso integrar com meu sistema financeiro?", a: "Sim. O ERP financeiro possui API aberta e integra com as principais ferramentas do mercado." },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0c1220] border border-white/5 rounded-xl overflow-hidden">
                    <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white hover:text-[#FFE211] transition-colors">
                      <span>{item.q}</span>
                      <ChevronDown size={16} className={`text-slate-500 transition-transform shrink-0 ml-3 ${faqOpen === i ? "rotate-180 text-[#FFE211]" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {faqOpen === i && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <p className="px-5 pb-4 text-slate-400 text-xs leading-relaxed">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTATO / DEMO ── */}
      <section id="contato" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs text-[#FFE211] font-black uppercase tracking-widest block font-mono">Fale Conosco</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">Solicite uma demonstração</h2>
            <p className="text-slate-400 text-sm mt-4 leading-relaxed">
              Conheça o PLAY+EVENTOS na prática. Nossa equipe irá apresentar todos os módulos e configurar a plataforma para o seu modelo de negócio.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: <Mail size={16} />, label: "E-mail", value: "contato@playeventos.com.br" },
                { icon: <Phone size={16} />, label: "Telefone", value: "(11) 9 9999-0000" },
                { icon: <MapPin size={16} />, label: "Localização", value: "São Paulo, Brasil" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFE211]/10 border border-[#FFE211]/20 text-[#FFE211] flex items-center justify-center shrink-0">{c.icon}</div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">{c.label}</span>
                    <span className="text-slate-300 text-sm">{c.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <button onClick={onEnter}
                className="px-8 py-4 bg-gradient-to-r from-[#FFE211] to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-yellow-500/20 transition-all inline-flex items-center gap-2">
                <Play size={15} className="fill-slate-950" />
                Acessar Demo Gratuitamente
              </button>
            </div>
          </div>

          {/* Demo Form */}
          <div className="bg-[#0c1220] p-8 rounded-3xl border border-white/5">
            {demoSent ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-[#FFE211] mx-auto mb-4" />
                <h3 className="text-xl font-black text-white">Solicitação enviada!</h3>
                <p className="text-slate-400 text-sm mt-2">Entraremos em contato em até 24 horas.</p>
                <button onClick={() => setDemoSent(false)} className="mt-6 text-xs text-slate-500 hover:text-slate-300 transition-colors">Enviar outra solicitação</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-extrabold text-white mb-6">Quero conhecer o PLAY+EVENTOS</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Seu nome *</label>
                    <input value={demoName} onChange={e => setDemoName(e.target.value)} placeholder="João Silva"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FFE211]/40 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">E-mail corporativo *</label>
                    <input type="email" value={demoEmail} onChange={e => setDemoEmail(e.target.value)} placeholder="joao@empresa.com.br"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FFE211]/40 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Empresa / Organização</label>
                    <input value={demoCompany} onChange={e => setDemoCompany(e.target.value)} placeholder="Nome da empresa"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#FFE211]/40 transition-all" />
                  </div>
                  <button
                    onClick={() => { if (demoName && demoEmail) setDemoSent(true); }}
                    disabled={!demoName || !demoEmail}
                    className="w-full py-4 bg-gradient-to-r from-[#FFE211] to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    Solicitar Demonstração
                  </button>
                  <p className="text-[10px] text-slate-600 text-center">Seus dados estão protegidos. Não fazemos spam.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#060910]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <img src={playEventosLogo} alt="PLAY+EVENTOS" className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                <span className="text-white font-extrabold text-sm tracking-wider">PLAY<span className="text-[#FFE211]">+</span>EVENTOS</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Event Operating System de padrão internacional. ERP, Ticketing, CRM, Marketplace e IA em um único ecossistema corporativo.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Plataforma</h4>
              <ul className="space-y-2">
                {["Gestão de Eventos", "Ticketing Enterprise", "ERP Financeiro", "CRM Comercial", "Marketplace"].map(item => (
                  <li key={item}><button onClick={onEnter} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Empresa</h4>
              <ul className="space-y-2">
                {[
                  { label: "Sobre nós", href: "#sobre" },
                  { label: "Contato", href: "#contato" },
                  { label: "Privacidade (LGPD)", href: "#" },
                  { label: "Termos de Uso", href: "#" },
                ].map(item => (
                  <li key={item.label}><a href={item.href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{item.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-600">© 2026 PLAY+EVENTOS SaaS Enterprise. Todos os direitos reservados.</span>
            <span className="text-xs text-slate-700 font-mono">React · TypeScript · PostgreSQL · Google Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
