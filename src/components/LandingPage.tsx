import React from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  Ticket, 
  DollarSign, 
  Users, 
  Briefcase, 
  FileText, 
  UserCheck, 
  Megaphone, 
  Sparkles, 
  Sliders, 
  ChevronRight, 
  Play, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Cpu, 
  Award,
  Lock
} from "lucide-react";
const playEventosLogo = "/src/assets/images/logo.jpg";

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div id="landing-root" className="min-h-screen bg-[#04060b] text-slate-100 font-sans overflow-x-hidden selection:bg-yellow-500/30 selection:text-yellow-200">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-yellow-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* HEADER */}
      <header id="landing-header" className="sticky top-0 z-50 backdrop-blur-md bg-[#04060b]/75 border-b border-white/5 px-6 lg:px-12 h-20 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <img 
            src={playEventosLogo} 
            alt="PLAY+EVENTOS Logo" 
            className="h-12 w-auto object-contain mix-blend-screen drop-shadow-[0_0_12px_rgba(255,226,17,0.5)]"
            referrerPolicy="no-referrer"
          />
          <span className="text-[9px] text-[#FFE211] font-mono tracking-widest uppercase font-bold hidden sm:block">
            Enterprise SaaS
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#about" className="hover:text-white transition-colors">Tecnologia</a>
          <a href="#stats" className="hover:text-white transition-colors">Métricas</a>
          <a href="#security" className="hover:text-white transition-colors">Segurança</a>
        </nav>

        {/* CTA Header Button */}
        <div>
          <button 
            id="btn-header-access"
            onClick={onEnter}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FFE211] to-yellow-500 hover:brightness-110 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-yellow-500/20 border border-yellow-400/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Acessar Cockpit</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="landing-hero" className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Hero Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8 relative flex items-center justify-center"
        >
          {/* Gold ambient glow behind logo */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
          {/* Logo image — mask fades edges to transparent, no collage */}
          <img
            src={playEventosLogo}
            alt="PLAY+EVENTOS"
            className="relative h-56 sm:h-80 w-auto object-contain z-10"
            style={{
              maskImage: "radial-gradient(ellipse 72% 68% at 50% 48%, black 38%, transparent 72%)",
              WebkitMaskImage: "radial-gradient(ellipse 72% 68% at 50% 48%, black 38%, transparent 72%)"
            }}
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-[#FFE211] rounded-full text-xs font-mono font-bold mb-6"
        >
          <Sparkles size={12} className="text-[#FFE211] animate-pulse" />
          <span>SaaS corporativo integrado de alta performance</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.1] font-sans"
        >
          A revolução definitiva na gestão de <span className="bg-gradient-to-r from-[#FFE211] via-amber-400 to-yellow-600 bg-clip-text text-transparent">grandes eventos</span> e festivais
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-slate-400 text-sm sm:text-lg max-w-3xl mt-6 leading-relaxed"
        >
          O <strong>PLAY+EVENTOS</strong> unifica toda a sua operação corporativa. Um poderoso ecossistema de alta fidelidade englobando ERP Financeiro integral, ticketing inteligente, CRM comercial, auditoria automática de contratos e assistente inteligente de IA.
        </motion.p>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto"
        >
          <button 
            id="btn-hero-enter"
            onClick={onEnter}
            className="px-8 py-4 bg-gradient-to-r from-[#FFE211] via-yellow-500 to-yellow-600 hover:brightness-110 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-yellow-500/20 border border-yellow-400/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Play size={16} className="fill-slate-950" />
            <span>Entrar na Plataforma</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <a 
            href="#features"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <span>Conhecer os Módulos</span>
            <Sliders size={15} className="text-[#FFE211]" />
          </a>
        </motion.div>

        {/* Visual Dashboard Mockup Showcase */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden border border-white/10 bg-[#070b13]/80 backdrop-blur-md p-3 shadow-2xl shadow-yellow-950/10 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#04060b] z-10"></div>
          
          {/* Header Mockup */}
          <div className="bg-[#090e1a] border-b border-white/5 rounded-t-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              <span className="text-[10px] text-slate-500 font-mono ml-3">play_eventos_cockpit_secure_v4.ts</span>
            </div>
            <div className="flex gap-2">
              <span className="w-20 h-4 bg-white/5 rounded-full"></span>
              <span className="w-12 h-4 bg-violet-500/20 border border-violet-500/30 rounded-full"></span>
            </div>
          </div>

          {/* Grid Layout Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-left select-none relative z-0 opacity-80 filter blur-[0.5px]">
            {/* Widget 1 */}
            <div className="bg-[#11192e] p-5 rounded-2xl border border-white/5">
              <div className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-1">MÓDULO ERP FINANCEIRO</div>
              <div className="text-xl font-black text-white">R$ 1.849.250,00</div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full w-[72%]"></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Saldo líquido operacional consolidado</p>
            </div>

            {/* Widget 2 */}
            <div className="bg-[#11192e] p-5 rounded-2xl border border-white/5">
              <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1">AUDITORIA DE STAFF GPS</div>
              <div className="text-xl font-black text-white">48 Operacionais</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-semibold">Câmeras e Checkpoints ativos</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Escalas validadas por satélite</p>
            </div>

            {/* Widget 3 */}
            <div className="bg-[#11192e] p-5 rounded-2xl border border-white/5">
              <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1">AUDITORIA DE IA GEMINI</div>
              <p className="text-[10px] text-slate-300 mt-1 leading-normal">
                "Ritmo de bilheteria 1.8x acima da média. Sugerido adiantar segundo lote em 48h."
              </p>
              <span className="text-[8px] bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 font-bold px-2 py-0.5 rounded mt-3 inline-block font-mono uppercase">
                Análise Preditiva Ativa
              </span>
            </div>
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button 
              id="btn-showcase-enter"
              onClick={onEnter} 
              className="px-6 py-3 bg-white text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
            >
              <span>Acessar Painel de Controle</span>
              <ArrowRight size={14} className="text-violet-600" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* STATS STRIP */}
      <section id="landing-stats" className="bg-[#0b101c] border-y border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <span className="text-3xl sm:text-5xl font-black text-white block">R$ 48M+</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 block">Processados</span>
          </div>
          <div>
            <span className="text-3xl sm:text-5xl font-black text-violet-500 block">1.5M+</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 block">Tickets Emitidos</span>
          </div>
          <div>
            <span className="text-3xl sm:text-5xl font-black text-white block">100%</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 block">SLA Cloud Run</span>
          </div>
          <div>
            <span className="text-3xl sm:text-5xl font-black text-amber-500 block">15+</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 block">Portais Especializados</span>
          </div>
        </div>
      </section>

      {/* CORE MODULES / FEATURES */}
      <section id="features" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs text-violet-400 font-black uppercase tracking-widest block font-mono">15 Perfis de Acesso</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-3">
            O primeiro ERP multi-role para eventos de grande escala
          </h2>
          <p className="text-slate-400 text-sm mt-4">
            Cada colaborador tem uma interface exclusiva e cirúrgica para suas obrigações diárias, de diretores ao staff de pista.
          </p>
        </div>

        {/* Grid Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="p-8 rounded-3xl bg-[#0c1220] border border-white/5 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-950/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Tenant & Governança</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Configure múltiplos promotores independentes (tenants) no mesmo servidor. Controle planos ativos, moedas locais, faturamento geral e métricas de desempenho corporativo.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono font-bold uppercase">
              Para Administradores & CEOs
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-3xl bg-[#0c1220] border border-white/5 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-950/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">ERP Contábil Integrado</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Controle integral de fluxo de caixa (entradas, saídas operacionais, contratação de fornecedores). Emita balancetes e audite notas fiscais e relatórios consolidados em segundos.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono font-bold uppercase">
              Para Diretores Financeiros
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-3xl bg-[#0c1220] border border-white/5 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-950/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Inteligência Artificial Gemini</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Monitor de IA que analisa o ritmo de vendas, detecta riscos orçamentários, propõe cortes logísticos e ajuda a desenhar planos de contingência utilizando o mais moderno LLM da Google.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono font-bold uppercase">
              Para Gestores do Evento
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-8 rounded-3xl bg-[#0c1220] border border-white/5 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-950/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Ticket size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ticketing & Check-In</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Ponto de vendas (POS) com emissão imediata de ingressos, mapas de assentos virtuais e credenciamento ágil com scanner de QR-code para validação instantânea na portaria.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono font-bold uppercase">
              Para Bilheteria & Portaria
            </div>
          </div>

          {/* Feature 5 */}
          <div className="p-8 rounded-3xl bg-[#0c1220] border border-white/5 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-950/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Staff GPS & Presença</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Gerencie escalas de guardas de trânsito, fiscais de pista e coordenadores. Ponto eletrônico integrado que exige validação geográfica (GPS) e reporta logs de transmissão urgentes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono font-bold uppercase">
              Para RH & Equipe de Campo
            </div>
          </div>

          {/* Feature 6 */}
          <div className="p-8 rounded-3xl bg-[#0c1220] border border-white/5 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-950/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Contratos e Assinatura Digital</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Envie minutas de contrato para patrocinadores corporativos ou artistas. Sistema integrado para rubrica digital imediata com log de validade criptográfica da plataforma.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono font-bold uppercase">
              Para Jurídico & Comercial
            </div>
          </div>

        </div>
      </section>

      {/* TECH & DETAIL SECTION */}
      <section id="about" className="py-20 bg-[#0b101c] border-y border-white/5 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs text-amber-500 font-black uppercase tracking-widest block font-mono">Infraestrutura Corporativa</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Construído para zero latência e escalabilidade horizontal automática
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-4 leading-relaxed">
              Diferente de sistemas legados de eventos que caem durante abertura de grandes vendas, o **PLAY+EVENTOS** opera sobre uma arquitetura robusta com monitoramento de requisições integradas de API Gateway.
            </p>
            
            <div className="space-y-4 mt-8">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/10">
                  <Cpu size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">API Gateway & Rate-Limiting Integrado</h4>
                  <p className="text-slate-400 text-xs">Proteção contra ataques de bots de cambistas e fila virtual de alta performance durante grandes picos de acesso.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/10">
                  <Sliders size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sincronização entre Local & Nuvem</h4>
                  <p className="text-slate-400 text-xs">Seus dados operacionais continuam funcionando em notebooks ou tablets de campo mesmo em percursos com conexão de rede instável.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0c1220] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-extrabold text-white mb-4">Auditoria e Logs de Infraestrutura</h3>
            <div className="bg-[#060910] rounded-2xl p-4 font-mono text-[10px] text-slate-400 space-y-2 border border-white/5">
              <div className="text-green-400">INFO [2026-07-05T17:07:26Z] - PLAY+EVENTOS API GATEWAY ONLINE</div>
              <div>POST /api/gateway/test-rest - Status 200 - Client: super-admin-session-1</div>
              <div>SQL Query - SELECT * FROM tenants WHERE plan = 'SaaS Premium'</div>
              <div className="text-amber-400">WARN [2026-07-05T17:08:11Z] - Spike detected on ticketing endpoint. Rate limit queue activated.</div>
              <div className="text-violet-400">AI INFERENCE [Gemini-3.5-Flash] - "Faturamento projetado para Maratona SP recalibrado com base em cupons ativos."</div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-violet-500/5 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* SECURITY / TRUST */}
      <section id="security" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Segurança de Nível Bancário</h2>
          <p className="text-slate-400 text-sm mt-3">
            Todas as transações do ERP e ingressos de bilheteria contam com assinatura digital e logs de auditoria não-modificáveis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="p-6 bg-[#0c1220] rounded-2xl border border-white/5">
            <h4 className="font-bold text-white mb-2">Criptografia RSA</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Emissão de ingressos assinada eletronicamente para impedir clonagem e repasse ilegal de vouchers de festivais.</p>
          </div>
          <div className="p-6 bg-[#0c1220] rounded-2xl border border-white/5">
            <h4 className="font-bold text-white mb-2">Conformidade LGPD</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Tratamento blindado de dados cadastrais de atletas, compradores de ingressos e contratos corporativos.</p>
          </div>
          <div className="p-6 bg-[#0c1220] rounded-2xl border border-white/5">
            <h4 className="font-bold text-white mb-2">Logs de Alteração (Audit Trail)</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Cada aprovação de orçamento ou aditivo de compras é registrado no log de auditoria do API Gateway corporativo.</p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION SECTION */}
      <section id="cta" className="relative py-24 px-6 lg:px-12 max-w-5xl mx-auto mb-16 rounded-3xl bg-gradient-to-r from-violet-900/60 via-indigo-950/80 to-slate-900/90 border border-violet-500/20 shadow-2xl overflow-hidden text-center">
        <div className="absolute inset-0 bg-radial-gradient from-violet-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white">Pronto para transformar a gestão dos seus eventos?</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-4 max-w-2xl mx-auto">
            Experimente o painel de governança do **PLAY+EVENTOS** agora mesmo. Descubra como a IA e a modularidade de papéis de staff podem blindar sua operação contra riscos logísticos.
          </p>
          
          <button 
            id="btn-cta-access"
            onClick={onEnter}
            className="mt-8 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition-all inline-flex items-center gap-2 group"
          >
            <span>Iniciar Operações</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#060910]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src={playEventosLogo} 
              alt="PLAY+EVENTOS Logo" 
              className="w-8 h-8 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="text-white font-extrabold text-sm tracking-wider">
              PLAY<span className="text-amber-500">+</span>EVENTOS
            </span>
          </div>

          <div className="text-xs text-slate-500 text-center md:text-right">
            <span>© 2026 PLAY+EVENTOS SaaS Enterprise. Todos os direitos reservados.</span>
            <span className="block mt-1 font-mono text-[10px]">Desenvolvido com React, Tailwind CSS e Inteligência Artificial Google Gemini.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
