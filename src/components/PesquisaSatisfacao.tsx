import React, { useState } from "react";
import { Star, Award, Plus, X, Download, CheckCircle, MessageSquare, TrendingUp, Users } from "lucide-react";

interface SurveyResponse {
  id: string;
  eventName: string;
  respondentType: string;
  nps: number;
  csat: number;
  ces: number;
  comment: string;
  date: string;
}

interface Certificate {
  id: string;
  type: string;
  recipientName: string;
  eventName: string;
  role: string;
  issuedAt: string;
  qrCode: string;
  hours?: number;
}

const CERT_TYPES = ["Participação","Palestrante","Staff","Voluntário","Atleta","Expositor","Patrocinador"];

const SEED_RESPONSES: SurveyResponse[] = [
  { id: "r-1", eventName: "Maratona SP 2026", respondentType: "Participante", nps: 9, csat: 5, ces: 4, comment: "Organização impecável! Melhor corrida do ano.", date: "2026-07-01" },
  { id: "r-2", eventName: "Maratona SP 2026", respondentType: "Participante", nps: 10, csat: 5, ces: 5, comment: "Fantástico! Staff muito atencioso, percurso bem sinalizado.", date: "2026-07-01" },
  { id: "r-3", eventName: "Maratona SP 2026", respondentType: "Patrocinador", nps: 8, csat: 4, ces: 4, comment: "Excelente visibilidade de marca. Retorno do investimento positivo.", date: "2026-07-02" },
  { id: "r-4", eventName: "Maratona SP 2026", respondentType: "Participante", nps: 7, csat: 4, ces: 3, comment: "Muito bom, mas fila no credenciamento foi longa.", date: "2026-07-01" },
  { id: "r-5", eventName: "Maratona SP 2026", respondentType: "Fornecedor", nps: 9, csat: 5, ces: 4, comment: "Plataforma de gestão excelente. Pagamento rápido.", date: "2026-07-02" },
  { id: "r-6", eventName: "Congresso Corporativo 2026", respondentType: "Participante", nps: 8, csat: 4, ces: 4, comment: "Palestras de alto nível. Networking excelente.", date: "2026-06-15" },
  { id: "r-7", eventName: "Congresso Corporativo 2026", respondentType: "Palestrante", nps: 10, csat: 5, ces: 5, comment: "Estrutura técnica perfeita, suporte da produção impecável.", date: "2026-06-15" },
  { id: "r-8", eventName: "Congresso Corporativo 2026", respondentType: "Participante", nps: 6, csat: 3, ces: 3, comment: "Bom evento, mas estacionamento poderia ser melhor.", date: "2026-06-16" },
];

const SEED_CERTS: Certificate[] = [
  { id: "cert-1", type: "Atleta", recipientName: "Carlos Henrique Oliveira", eventName: "Maratona SP 2026", role: "Finisher 21km", issuedAt: "2026-07-01T18:00:00Z", qrCode: "CERT-ATL-2026-001", hours: 0 },
  { id: "cert-2", type: "Palestrante", recipientName: "Dra. Ana Paula Ferreira", eventName: "Congresso Corporativo 2026", role: "Palestrante Principal", issuedAt: "2026-06-15T19:00:00Z", qrCode: "CERT-PLT-2026-002", hours: 2 },
  { id: "cert-3", type: "Staff", recipientName: "Marcelo da Silva", eventName: "Maratona SP 2026", role: "Coordenador de Percurso", issuedAt: "2026-07-01T20:00:00Z", qrCode: "CERT-STF-2026-003", hours: 12 },
  { id: "cert-4", type: "Voluntário", recipientName: "Beatriz Santos", eventName: "Maratona SP 2026", role: "Posto de Hidratação Km 10", issuedAt: "2026-07-01T20:00:00Z", qrCode: "CERT-VOL-2026-004", hours: 8 },
  { id: "cert-5", type: "Participação", recipientName: "Roberto Almeida", eventName: "Congresso Corporativo 2026", role: "Participante", issuedAt: "2026-06-15T19:00:00Z", qrCode: "CERT-PAR-2026-005", hours: 8 },
];

function NpsBar({ score }: { score: number }) {
  const color = score >= 9 ? "bg-emerald-500" : score >= 7 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score * 10}%` }}/>
      </div>
      <span className={`text-xs font-black ${score >= 9 ? "text-emerald-600" : score >= 7 ? "text-amber-600" : "text-red-600"}`}>{score}</span>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= value ? "text-amber-400 fill-amber-400" : "text-slate-200"}/>)}
    </div>
  );
}

export default function PesquisaSatisfacao() {
  const [section, setSection] = useState<"surveys" | "certificates">("surveys");
  const [responses, setResponses] = useState<SurveyResponse[]>(SEED_RESPONSES);
  const [certificates, setCertificates] = useState<Certificate[]>(SEED_CERTS);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [certFilter, setCertFilter] = useState("ALL");
  const [newCert, setNewCert] = useState({ type: "Participação", recipientName: "", eventName: "", role: "", hours: "8" });

  const avgNps = Math.round(responses.reduce((s, r) => s + r.nps, 0) / responses.length);
  const avgCsat = (responses.reduce((s, r) => s + r.csat, 0) / responses.length).toFixed(1);
  const promoters = responses.filter(r => r.nps >= 9).length;
  const detractors = responses.filter(r => r.nps <= 6).length;
  const npsScore = Math.round(((promoters - detractors) / responses.length) * 100);

  const filteredRes = filterType === "ALL" ? responses : responses.filter(r => r.respondentType === filterType);
  const filteredCerts = certFilter === "ALL" ? certificates : certificates.filter(c => c.type === certFilter);

  const handleIssueCert = () => {
    if (!newCert.recipientName || !newCert.eventName) return;
    const cert: Certificate = {
      id: `cert-${Date.now()}`,
      type: newCert.type,
      recipientName: newCert.recipientName,
      eventName: newCert.eventName,
      role: newCert.role,
      issuedAt: new Date().toISOString(),
      qrCode: `CERT-${newCert.type.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      hours: newCert.hours ? Number(newCert.hours) : undefined,
    };
    setCertificates(prev => [cert, ...prev]);
    setShowModal(false);
    setNewCert({ type: "Participação", recipientName: "", eventName: "", role: "", hours: "8" });
  };

  const RESPONDENT_TYPES = [...new Set(responses.map(r => r.respondentType))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pesquisa de Satisfação & Certificados</h2>
          <p className="text-xs text-slate-500 mt-0.5">NPS, CSAT, CES e emissão de certificados com QR Code</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSection("surveys")} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${section === "surveys" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            📊 Pesquisas
          </button>
          <button onClick={() => setSection("certificates")} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${section === "certificates" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            🏆 Certificados
          </button>
          {section === "certificates" && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <Plus size={13}/> Emitir Certificado
            </button>
          )}
        </div>
      </div>

      {/* SURVEYS */}
      {section === "surveys" && (
        <>
          {/* NPS Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-md">
              <div className="text-[10px] font-bold uppercase opacity-70 mb-1">Score NPS</div>
              <div className="text-4xl font-black">{npsScore}</div>
              <div className="text-[10px] opacity-60 mt-1">{npsScore >= 50 ? "🟢 Excelente" : npsScore >= 0 ? "🟡 Bom" : "🔴 Crítico"}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-md">
              <div className="text-[10px] font-bold uppercase opacity-70 mb-1">CSAT Médio</div>
              <div className="text-4xl font-black">{avgCsat}</div>
              <div className="text-[10px] opacity-60 mt-1">de 5.0 possível</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-md">
              <div className="text-[10px] font-bold uppercase opacity-70 mb-1">Promotores</div>
              <div className="text-4xl font-black">{promoters}</div>
              <div className="text-[10px] opacity-60 mt-1">NPS ≥ 9</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-md">
              <div className="text-[10px] font-bold uppercase opacity-70 mb-1">Detratores</div>
              <div className="text-4xl font-black">{detractors}</div>
              <div className="text-[10px] opacity-60 mt-1">NPS ≤ 6</div>
            </div>
          </div>

          {/* NPS Breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-800">Respostas Recebidas</h3>
                <div className="flex items-center gap-2">
                  {["ALL", ...RESPONDENT_TYPES].map(t => (
                    <button key={t} onClick={() => setFilterType(t)} className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${filterType === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {t === "ALL" ? "Todos" : t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {filteredRes.map(r => (
                  <div key={r.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-violet-600">{r.respondentType}</span>
                        <span className="text-[10px] text-slate-400 ml-2">· {r.eventName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{r.date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div><p className="text-[9px] text-slate-400 mb-1">NPS</p><NpsBar score={r.nps}/></div>
                      <div><p className="text-[9px] text-slate-400 mb-1">CSAT</p><Stars value={r.csat}/></div>
                      <div><p className="text-[9px] text-slate-400 mb-1">CES</p><Stars value={r.ces}/></div>
                    </div>
                    {r.comment && <p className="text-xs text-slate-600 italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4">Distribuição NPS</h3>
              <div className="space-y-3">
                {[10,9,8,7,6,5].map(score => {
                  const count = responses.filter(r => r.nps === score).length;
                  const pct = Math.round((count / responses.length) * 100);
                  const color = score >= 9 ? "bg-emerald-500" : score >= 7 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <div key={score} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 w-4">{score}</span>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }}/>
                      </div>
                      <span className="text-[10px] text-slate-500 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Por Tipo de Respondente</p>
                {RESPONDENT_TYPES.map(type => {
                  const typeRes = responses.filter(r => r.respondentType === type);
                  const avg = Math.round(typeRes.reduce((s, r) => s + r.nps, 0) / typeRes.length);
                  return (
                    <div key={type} className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-600">{type}</span>
                      <div className="flex items-center gap-1">
                        <NpsBar score={avg}/>
                        <span className="text-[9px] text-slate-400">({typeRes.length})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* CERTIFICATES */}
      {section === "certificates" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CERT_TYPES.slice(0,4).map(type => {
              const count = certificates.filter(c => c.type === type).length;
              return (
                <div key={type} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xl font-black text-slate-800">{count}</div>
                  <div className="text-[10px] text-slate-500">{type}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800">Certificados Emitidos</h3>
              <div className="flex items-center gap-2">
                {["ALL", ...CERT_TYPES].map(t => (
                  <button key={t} onClick={() => setCertFilter(t)} className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${certFilter === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {t === "ALL" ? "Todos" : t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCerts.map(cert => (
                <div key={cert.id} className="border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition-all hover:shadow-md bg-gradient-to-br from-white to-amber-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><Award size={16}/></div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{cert.type}</span>
                  </div>
                  <p className="text-sm font-black text-slate-800">{cert.recipientName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{cert.role}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{cert.eventName}</p>
                  {cert.hours && <p className="text-[10px] text-slate-400">Carga horária: {cert.hours}h</p>}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400">QR de Validação</p>
                      <p className="text-[9px] font-mono text-slate-600">{cert.qrCode}</p>
                    </div>
                    <button className="flex items-center gap-1 text-[9px] font-bold text-violet-600 hover:text-violet-800 transition-all">
                      <Download size={10}/> PDF
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-300 mt-1">Emitido: {new Date(cert.issuedAt).toLocaleDateString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Issue Cert Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Award size={14} className="text-amber-500"/>Emitir Certificado</h3>
              <button onClick={() => setShowModal(false)}><X size={16} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo</label>
                  <select value={newCert.type} onChange={e => setNewCert({...newCert, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400">
                    {CERT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Carga Horária</label>
                  <input type="number" value={newCert.hours} onChange={e => setNewCert({...newCert, hours: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome do Destinatário</label>
                <input value={newCert.recipientName} onChange={e => setNewCert({...newCert, recipientName: e.target.value})} placeholder="Nome completo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Evento</label>
                <input value={newCert.eventName} onChange={e => setNewCert({...newCert, eventName: e.target.value})} placeholder="Nome do evento"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Função / Papel</label>
                <input value={newCert.role} onChange={e => setNewCert({...newCert, role: e.target.value})} placeholder="Ex: Palestrante Principal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-amber-400"/>
              </div>
              <button onClick={handleIssueCert} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold transition-all">
                Emitir Certificado com QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
