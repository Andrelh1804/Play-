import React, { useState } from "react";
import { AlertTriangle, Plus, X, Shield, CheckCircle, Clock, FileText, Activity, ChevronDown, ChevronUp } from "lucide-react";

interface RiskItem {
  id: string;
  category: string;
  description: string;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  mitigation: string;
  contingency: string;
  status: "IDENTIFIED" | "MONITORED" | "MITIGATED" | "OCCURRED";
  owner: string;
  reviewDate: string;
}

interface Incident {
  id: string;
  riskId?: string;
  description: string;
  occurredAt: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  corrective: string;
  preventive: string;
  dueDate: string;
}

interface Compliance {
  id: string;
  requirement: string;
  category: string;
  status: "COMPLIANT" | "PENDING" | "NON_COMPLIANT";
  dueDate: string;
  responsible: string;
  evidence?: string;
}

const SEED_RISKS: RiskItem[] = [
  { id: "r-1", category: "Climático", description: "Chuva intensa durante o evento outdoor comprometendo infraestrutura", probability: 3, impact: 5, mitigation: "Tendas impermeáveis em todas as áreas expostas, plano de comunicação rápida", contingency: "Relocar atividades para área coberta, acionar seguro climático", status: "MONITORED", owner: "Coord. Infraestrutura", reviewDate: "2026-07-05" },
  { id: "r-2", category: "Segurança", description: "Sobrecarga elétrica causando apagão parcial", probability: 2, impact: 4, mitigation: "Dois geradores redundantes, inspeção elétrica prévia", contingency: "Gerador backup acionado automaticamente em 30 segundos", status: "MITIGATED", owner: "Equipe Técnica", reviewDate: "2026-07-04" },
  { id: "r-3", category: "Operacional", description: "Fornecedor principal de som não comparece no dia", probability: 2, impact: 5, mitigation: "Contrato com cláusula de multa, fornecedor substituto identificado", contingency: "Acionar fornecedor reserva com 48h de antecedência", status: "MONITORED", owner: "Coord. Produção", reviewDate: "2026-07-03" },
  { id: "r-4", category: "Saúde", description: "Intoxicação alimentar em massa por fornecedor de catering", probability: 1, impact: 5, mitigation: "Inspeção sanitária prévia de todos os fornecedores alimentícios", contingency: "Protocolo de evacuação médica, contato com ANVISA e hospitais", status: "IDENTIFIED", owner: "Coord. Operações", reviewDate: "2026-07-02" },
  { id: "r-5", category: "Tecnológico", description: "Sistema de check-in offline causando filas e atrasos", probability: 3, impact: 3, mitigation: "Modo offline nos tablets, lista impressa como backup", contingency: "Credenciamento manual com equipe adicional acionada", status: "MITIGATED", owner: "Equipe TI", reviewDate: "2026-07-01" },
  { id: "r-6", category: "Jurídico", description: "Cancelamento de alvará pela prefeitura", probability: 1, impact: 5, mitigation: "Documentação completa, relação com poder público", contingency: "Assessor jurídico em standby, plano de transferência de local", status: "MITIGATED", owner: "Dept. Jurídico", reviewDate: "2026-06-30" },
];

const SEED_INCIDENTS: Incident[] = [
  { id: "i-1", riskId: "r-1", description: "Chuva moderada na abertura do evento. Algumas barracas com acúmulo de água.", occurredAt: "2026-07-06T09:30:00Z", severity: "MEDIUM", status: "RESOLVED", corrective: "Equipe de limpeza acionada, escoamento manual realizado", preventive: "Instalar calhas adicionais nas coberturas de lona", dueDate: "2026-07-10" },
  { id: "i-2", description: "Participante desmaiou na área de chegada (esporte)", occurredAt: "2026-07-06T11:15:00Z", severity: "HIGH", status: "RESOLVED", corrective: "Equipe médica atendeu em 4 minutos, paciente estabilizado", preventive: "Ampliar postos médicos nos últimos 2km do percurso", dueDate: "2026-08-01" },
  { id: "i-3", description: "Tentativa de entrada com ingresso falso no portão 1", occurredAt: "2026-07-06T13:00:00Z", severity: "LOW", status: "OPEN", corrective: "Participante abordado pela segurança, caso documentado", preventive: "Atualizar sistema de validação QR com dupla autenticação", dueDate: "2026-07-15" },
];

const SEED_COMPLIANCE: Compliance[] = [
  { id: "c-1", requirement: "AVCB (Auto de Vistoria do Corpo de Bombeiros)", category: "Legal", status: "COMPLIANT", dueDate: "2026-12-31", responsible: "Dept. Jurídico", evidence: "AVCB-2026-14823" },
  { id: "c-2", requirement: "Alvará Municipal de Eventos", category: "Legal", status: "COMPLIANT", dueDate: "2026-07-31", responsible: "Dept. Jurídico", evidence: "Protocolo 2026/4872" },
  { id: "c-3", requirement: "ART de Responsabilidade Técnica (Engenharia)", category: "Técnico", status: "COMPLIANT", dueDate: "2026-07-06", responsible: "Eng. Responsável", evidence: "ART-CREA-2026-007" },
  { id: "c-4", requirement: "Licença Ambiental (ruído/resíduos)", category: "Ambiental", status: "PENDING", dueDate: "2026-07-04", responsible: "Coord. Operações", evidence: "" },
  { id: "c-5", requirement: "Seguro de Responsabilidade Civil", category: "Financeiro", status: "COMPLIANT", dueDate: "2026-12-31", responsible: "Financeiro", evidence: "Apólice 2026-RC-99182" },
  { id: "c-6", requirement: "Brigada de Incêndio Certificada", category: "Segurança", status: "COMPLIANT", dueDate: "2026-07-06", responsible: "Coord. Segurança", evidence: "Contrato Brigada Segura Ltda." },
  { id: "c-7", requirement: "Plano de Acessibilidade NBR 9050", category: "Acessibilidade", status: "PENDING", dueDate: "2026-07-06", responsible: "Coord. Infraestrutura", evidence: "" },
  { id: "c-8", requirement: "LGPD - DPO Designado e Política de Privacidade", category: "LGPD", status: "NON_COMPLIANT", dueDate: "2026-06-01", responsible: "TI / Jurídico", evidence: "" },
];

const PROB_LABEL: Record<number, string> = { 1: "Muito Baixa", 2: "Baixa", 3: "Média", 4: "Alta", 5: "Muito Alta" };
const IMP_LABEL: Record<number, string> = { 1: "Insignificante", 2: "Baixo", 3: "Moderado", 4: "Alto", 5: "Catastrófico" };

function riskScore(r: RiskItem) { return r.probability * r.impact; }
function riskColor(score: number) {
  if (score >= 15) return "bg-red-500 text-white";
  if (score >= 9) return "bg-orange-500 text-white";
  if (score >= 4) return "bg-amber-400 text-white";
  return "bg-emerald-500 text-white";
}
function riskLabel(score: number) {
  if (score >= 15) return "CRÍTICO";
  if (score >= 9) return "ALTO";
  if (score >= 4) return "MÉDIO";
  return "BAIXO";
}

const STATUS_BADGE: Record<string, string> = {
  IDENTIFIED: "bg-slate-100 text-slate-600",
  MONITORED: "bg-amber-100 text-amber-700",
  MITIGATED: "bg-emerald-100 text-emerald-700",
  OCCURRED: "bg-red-100 text-red-700",
  COMPLIANT: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  NON_COMPLIANT: "bg-red-100 text-red-700",
};

export default function GestaoRiscos() {
  const [section, setSection] = useState<"matrix" | "incidents" | "compliance">("matrix");
  const [risks, setRisks] = useState<RiskItem[]>(SEED_RISKS);
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [compliance, setCompliance] = useState<Compliance[]>(SEED_COMPLIANCE);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newRisk, setNewRisk] = useState<Partial<RiskItem>>({ category: "Operacional", probability: 2, impact: 3, status: "IDENTIFIED" });

  const sorted = [...risks].sort((a, b) => riskScore(b) - riskScore(a));
  const critical = risks.filter(r => riskScore(r) >= 15).length;
  const high = risks.filter(r => riskScore(r) >= 9 && riskScore(r) < 15).length;
  const openInc = incidents.filter(i => i.status !== "RESOLVED").length;
  const compliant = compliance.filter(c => c.status === "COMPLIANT").length;

  const handleAddRisk = () => {
    if (!newRisk.description || !newRisk.mitigation) return;
    const r: RiskItem = {
      id: `r-${Date.now()}`,
      category: newRisk.category || "Operacional",
      description: newRisk.description!,
      probability: (newRisk.probability || 2) as RiskItem["probability"],
      impact: (newRisk.impact || 3) as RiskItem["impact"],
      mitigation: newRisk.mitigation!,
      contingency: newRisk.contingency || "",
      status: "IDENTIFIED",
      owner: newRisk.owner || "Não atribuído",
      reviewDate: newRisk.reviewDate || new Date().toISOString().split("T")[0],
    };
    setRisks(prev => [r, ...prev]);
    setShowModal(false);
    setNewRisk({ category: "Operacional", probability: 2, impact: 3, status: "IDENTIFIED" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestão de Riscos & Conformidade</h2>
          <p className="text-xs text-slate-500 mt-0.5">Matriz de riscos, incidentes, CAPA e controle de conformidade</p>
        </div>
        <div className="flex items-center gap-2">
          {([["matrix","⚠️ Matriz de Riscos"],["incidents","🔴 Incidentes & CAPA"],["compliance","✅ Conformidade"]] as [string,string][]).map(([k,l]) => (
            <button key={k} onClick={() => setSection(k as any)} className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${section === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {l}
            </button>
          ))}
          {section === "matrix" && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <Plus size={13}/> Novo Risco
            </button>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Riscos Críticos", value: critical, color: "from-red-500 to-red-600", icon: "🔴" },
          { label: "Riscos Altos", value: high, color: "from-orange-500 to-orange-600", icon: "🟠" },
          { label: "Incidentes Abertos", value: openInc, color: "from-amber-500 to-amber-600", icon: "⚡" },
          { label: "Conformidade", value: `${compliant}/${compliance.length}`, color: "from-emerald-500 to-emerald-600", icon: "✅" },
        ].map((k, i) => (
          <div key={i} className={`bg-gradient-to-br ${k.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-3xl font-black">{k.value}</div>
            <div className="text-[10px] opacity-70 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* RISK MATRIX */}
      {section === "matrix" && (
        <div className="space-y-4">
          {/* Visual Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Mapa de Calor — Probabilidade × Impacto</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[400px]">
                <div className="flex">
                  <div className="w-24 shrink-0"/>
                  {[1,2,3,4,5].map(i => <div key={i} className="flex-1 text-center text-[9px] font-bold text-slate-400 pb-1">{IMP_LABEL[i]}</div>)}
                </div>
                {([5,4,3,2,1] as const).map(prob => (
                  <div key={prob} className="flex items-center mb-1">
                    <div className="w-24 shrink-0 text-[9px] font-bold text-slate-400 pr-2 text-right">{PROB_LABEL[prob]}</div>
                    {([1,2,3,4,5] as const).map(imp => {
                      const score = prob * imp;
                      const cellRisks = risks.filter(r => r.probability === prob && r.impact === imp);
                      return (
                        <div key={imp} className={`flex-1 min-h-[44px] m-0.5 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                          score >= 15 ? "bg-red-100 text-red-600 border border-red-200" :
                          score >= 9 ? "bg-orange-100 text-orange-600 border border-orange-200" :
                          score >= 4 ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}>
                          {cellRisks.length > 0 ? (
                            <div className="text-center">
                              <div>{score}</div>
                              <div className="text-[8px] font-bold">{cellRisks.length} risco{cellRisks.length > 1 ? "s" : ""}</div>
                            </div>
                          ) : <span className="opacity-30 text-[10px]">{score}</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="flex mt-1 ml-24">
                  <div className="flex-1 text-center text-[9px] text-slate-400">← Impacto →</div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Registro de Riscos</h3>
            <div className="space-y-2">
              {sorted.map(r => {
                const score = riskScore(r);
                const isExp = expanded === r.id;
                return (
                  <div key={r.id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-all" onClick={() => setExpanded(isExp ? null : r.id)}>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${riskColor(score)}`}>{score} — {riskLabel(score)}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800">{r.description}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-slate-400">{r.category}</span>
                          <span className="text-[10px] text-slate-400">P:{r.probability} × I:{r.impact}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={r.status} onClick={e => e.stopPropagation()} onChange={e => setRisks(prev => prev.map(x => x.id === r.id ? { ...x, status: e.target.value as RiskItem["status"] } : x))}
                          className="text-[9px] font-bold bg-slate-100 border-0 rounded-lg px-2 py-1 outline-none cursor-pointer">
                          <option value="IDENTIFIED">IDENTIFIED</option>
                          <option value="MONITORED">MONITORED</option>
                          <option value="MITIGATED">MITIGATED</option>
                          <option value="OCCURRED">OCCURRED</option>
                        </select>
                        {isExp ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
                      </div>
                    </div>
                    {isExp && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50 space-y-3">
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Mitigação</p>
                            <p className="text-xs text-slate-700">{r.mitigation}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Contingência</p>
                            <p className="text-xs text-slate-700">{r.contingency || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500">
                          <span>👤 {r.owner}</span>
                          <span>📅 Revisão: {r.reviewDate}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* INCIDENTS & CAPA */}
      {section === "incidents" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-800 mb-4">Registro de Incidentes & Ações Corretivas (CAPA)</h3>
          <div className="space-y-4">
            {incidents.map(inc => (
              <div key={inc.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${inc.severity === "CRITICAL" ? "bg-red-100 text-red-700" : inc.severity === "HIGH" ? "bg-orange-100 text-orange-700" : inc.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{inc.severity}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[inc.status]}`}>{inc.status.replace("_"," ")}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{inc.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ocorreu em: {new Date(inc.occurredAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <button onClick={() => setIncidents(prev => prev.map(x => x.id === inc.id ? { ...x, status: x.status === "OPEN" ? "IN_PROGRESS" : x.status === "IN_PROGRESS" ? "RESOLVED" : "OPEN" } : x))}
                    className="ml-4 px-3 py-1 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-[9px] font-bold transition-all shrink-0">
                    {inc.status === "OPEN" ? "Iniciar" : inc.status === "IN_PROGRESS" ? "Fechar" : "Reabrir"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">🔧 Ação Corretiva (CA)</p>
                    <p className="text-xs text-slate-700">{inc.corrective}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">🛡 Ação Preventiva (PA)</p>
                    <p className="text-xs text-slate-700">{inc.preventive}</p>
                    <p className="text-[9px] text-slate-400 mt-1">Prazo: {inc.dueDate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPLIANCE */}
      {section === "compliance" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Controle de Requisitos Legais & Conformidade</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-600 font-bold">{compliant} Conformes</span>
              <span className="text-xs text-amber-600 font-bold">{compliance.filter(c => c.status === "PENDING").length} Pendentes</span>
              <span className="text-xs text-red-600 font-bold">{compliance.filter(c => c.status === "NON_COMPLIANT").length} Não Conformes</span>
            </div>
          </div>

          {/* Compliance Score Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700">Índice Geral de Conformidade</span><span className="font-black text-slate-800">{Math.round((compliant/compliance.length)*100)}%</span></div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(compliant/compliance.length)*100}%` }}/>
              <div className="bg-amber-400 h-full transition-all" style={{ width: `${(compliance.filter(c => c.status === "PENDING").length/compliance.length)*100}%` }}/>
              <div className="bg-red-500 h-full transition-all" style={{ width: `${(compliance.filter(c => c.status === "NON_COMPLIANT").length/compliance.length)*100}%` }}/>
            </div>
          </div>

          <div className="space-y-2">
            {compliance.map(c => (
              <div key={c.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${c.status === "COMPLIANT" ? "border-emerald-100 bg-emerald-50/30" : c.status === "NON_COMPLIANT" ? "border-red-100 bg-red-50/30" : "border-amber-100 bg-amber-50/30"}`}>
                <div className="shrink-0">
                  {c.status === "COMPLIANT" ? <CheckCircle size={18} className="text-emerald-500"/> : c.status === "NON_COMPLIANT" ? <AlertTriangle size={18} className="text-red-500"/> : <Clock size={18} className="text-amber-500"/>}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-800">{c.requirement}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">{c.category}</span>
                    <span className="text-[10px] text-slate-500">📅 {c.dueDate}</span>
                    <span className="text-[10px] text-slate-500">👤 {c.responsible}</span>
                    {c.evidence && <span className="text-[10px] text-emerald-600 font-medium">🗄 {c.evidence}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full ${STATUS_BADGE[c.status]}`}>{c.status.replace("_"," ")}</span>
                  <select value={c.status} onChange={e => setCompliance(prev => prev.map(x => x.id === c.id ? { ...x, status: e.target.value as Compliance["status"] } : x))}
                    className="text-[9px] bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer font-bold">
                    <option value="COMPLIANT">COMPLIANT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="NON_COMPLIANT">NON_COMPLIANT</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Risk Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><AlertTriangle size={14} className="text-orange-500"/>Cadastrar Novo Risco</h3>
              <button onClick={() => setShowModal(false)}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                  <select value={newRisk.category} onChange={e => setNewRisk({...newRisk, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-orange-400">
                    {["Climático","Segurança","Operacional","Saúde","Tecnológico","Jurídico","Financeiro","Outros"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Probabilidade (1-5)</label>
                  <input type="number" min={1} max={5} value={newRisk.probability} onChange={e => setNewRisk({...newRisk, probability: Number(e.target.value) as RiskItem["probability"]})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-orange-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Impacto (1-5)</label>
                  <input type="number" min={1} max={5} value={newRisk.impact} onChange={e => setNewRisk({...newRisk, impact: Number(e.target.value) as RiskItem["impact"]})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-orange-400"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrição do Risco</label>
                <textarea value={newRisk.description || ""} onChange={e => setNewRisk({...newRisk, description: e.target.value})} rows={2}
                  placeholder="Descreva o risco identificado..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-orange-400 resize-none"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Plano de Mitigação</label>
                <textarea value={newRisk.mitigation || ""} onChange={e => setNewRisk({...newRisk, mitigation: e.target.value})} rows={2}
                  placeholder="Ações para reduzir probabilidade ou impacto..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-orange-400 resize-none"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Plano de Contingência</label>
                <textarea value={newRisk.contingency || ""} onChange={e => setNewRisk({...newRisk, contingency: e.target.value})} rows={2}
                  placeholder="O que fazer se o risco se materializar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-orange-400 resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Responsável</label>
                  <input value={newRisk.owner || ""} onChange={e => setNewRisk({...newRisk, owner: e.target.value})} placeholder="Nome / equipe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-orange-400"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data de Revisão</label>
                  <input type="date" value={newRisk.reviewDate || ""} onChange={e => setNewRisk({...newRisk, reviewDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-orange-400"/>
                </div>
              </div>
              <button onClick={handleAddRisk} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all">
                Cadastrar Risco na Matriz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
