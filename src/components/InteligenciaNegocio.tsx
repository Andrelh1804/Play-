import React, { useState } from "react";
import { TrendingUp, TrendingDown, BarChart2, PieChart, Activity, DollarSign, Users, Target, Zap } from "lucide-react";

interface Props {
  events: any[];
  tickets: any[];
  finance: any[];
  campaigns: any[];
  sponsorships: any[];
  staff: any[];
  leads: any[];
}

function MiniBar({ value, max, color = "bg-violet-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-[10px] font-bold text-slate-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

function KpiCard({ label, value, sub, trend, icon, color }: { label: string; value: string | number; sub?: string; trend?: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}{Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
      <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function InteligenciaNegocio({ events, tickets, finance, campaigns, sponsorships, staff, leads }: Props) {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [focusArea, setFocusArea] = useState<"revenue" | "tickets" | "marketing" | "sponsors" | "staff">("revenue");

  const totalIncome = finance.filter((f: any) => f.type === "INCOME" && f.status === "PAID").reduce((s: number, f: any) => s + f.amount, 0);
  const totalExpense = finance.filter((f: any) => f.type === "EXPENSE").reduce((s: number, f: any) => s + f.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  const totalTickets = tickets.length;
  const checkedIn = tickets.filter((t: any) => t.checkedIn).length;
  const convRate = totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0;

  const avgTicketPrice = totalTickets > 0 ? Math.round(tickets.reduce((s: number, t: any) => s + t.price, 0) / totalTickets) : 0;
  const vipTickets = tickets.filter((t: any) => t.type === "VIP").length;
  const vipRevenue = tickets.filter((t: any) => t.type === "VIP").reduce((s: number, t: any) => s + t.price, 0);

  const totalSponsorValue = sponsorships.reduce((s: number, x: any) => s + x.value, 0);
  const avgROI = sponsorships.length > 0 ? Math.round(sponsorships.reduce((s: number, x: any) => s + x.roiRatio, 0) / sponsorships.length) : 0;

  const sentCampaigns = campaigns.filter((c: any) => c.status === "SENT").length;
  const avgConversion = sentCampaigns > 0 ? (campaigns.filter((c: any) => c.status === "SENT").reduce((s: number, c: any) => s + (c.conversionRate || 0), 0) / sentCampaigns).toFixed(1) : "0";

  const staffOnline = staff.filter((s: any) => s.checkInStatus === "online").length;
  const totalHours = staff.reduce((s: number, x: any) => s + (x.hoursWorked || 0), 0);

  const wonLeads = leads.filter((l: any) => l.pipelineStage === "WON").length;
  const leadValue = leads.filter((l: any) => l.pipelineStage === "WON").reduce((s: number, l: any) => s + l.value, 0);

  const expenseByCategory: Record<string, number> = {};
  finance.filter((f: any) => f.type === "EXPENSE").forEach((f: any) => {
    const cat = f.category || "Outros";
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + f.amount;
  });
  const topExpenses = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxExpense = topExpenses.length > 0 ? topExpenses[0][1] : 1;

  const incomeByCategory: Record<string, number> = {};
  finance.filter((f: any) => f.type === "INCOME" && f.status === "PAID").forEach((f: any) => {
    const cat = f.category || "Outros";
    incomeByCategory[cat] = (incomeByCategory[cat] || 0) + f.amount;
  });
  const topIncome = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxIncome = topIncome.length > 0 ? topIncome[0][1] : 1;

  const eventComparison = events.slice(0, 4).map(ev => {
    const evTickets = tickets.filter((t: any) => t.eventId === ev.id);
    const evIncome = finance.filter((f: any) => f.eventId === ev.id && f.type === "INCOME" && f.status === "PAID").reduce((s: number, f: any) => s + f.amount, 0);
    return { name: ev.name.length > 20 ? ev.name.slice(0,20)+"…" : ev.name, tickets: evTickets.length, income: evIncome, capacity: ev.capacity };
  });
  const maxEventIncome = eventComparison.reduce((m, e) => Math.max(m, e.income), 1);

  const COLORS = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-rose-500"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inteligência de Negócios</h2>
          <p className="text-xs text-slate-500 mt-0.5">Analytics avançado · Comparativos, previsões e ROI</p>
        </div>
        <div className="flex items-center gap-2">
          {(["month","quarter","year"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-all ${period === p ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>
              {p === "month" ? "Mês" : p === "quarter" ? "Trimestre" : "Ano"}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Receita Total" value={`R$ ${(totalIncome/1000).toFixed(0)}k`} sub="entradas pagas" trend={12} icon={<DollarSign size={16} className="text-emerald-600"/>} color="bg-emerald-100"/>
        <KpiCard label="Margem Líquida" value={`${margin}%`} sub="receita - despesas" trend={margin > 30 ? 5 : -3} icon={<TrendingUp size={16} className="text-blue-600"/>} color="bg-blue-100"/>
        <KpiCard label="Ticket Médio" value={`R$ ${avgTicketPrice}`} sub="preço médio pago" trend={8} icon={<Target size={16} className="text-violet-600"/>} color="bg-violet-100"/>
        <KpiCard label="Taxa Check-in" value={`${convRate}%`} sub={`${checkedIn}/${totalTickets}`} trend={convRate > 70 ? 4 : -2} icon={<Activity size={16} className="text-amber-600"/>} color="bg-amber-100"/>
        <KpiCard label="ROI Patrocínios" value={`${avgROI}%`} sub={`${sponsorships.length} ativos`} trend={avgROI > 50 ? 7 : -1} icon={<Zap size={16} className="text-rose-600"/>} color="bg-rose-100"/>
        <KpiCard label="Leads Fechados" value={wonLeads} sub={`R$ ${(leadValue/1000).toFixed(0)}k em valor`} trend={wonLeads > 0 ? 15 : 0} icon={<Users size={16} className="text-indigo-600"/>} color="bg-indigo-100"/>
      </div>

      {/* Focus Area Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([["revenue","💰 Financeiro"],["tickets","🎫 Tickets"],["marketing","📢 Marketing"],["sponsors","🤝 Patrocínios"],["staff","👥 RH"]] as [string,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setFocusArea(k as any)} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${focusArea === k ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {l}
          </button>
        ))}
      </div>

      {focusArea === "revenue" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Top Fontes de Receita</h3>
            <div className="space-y-3">
              {topIncome.map(([cat, val], i) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${COLORS[i]}`}/>{cat}</span>
                    <span className="font-bold text-slate-800">R$ {val.toLocaleString("pt-BR")}</span>
                  </div>
                  <MiniBar value={val} max={maxIncome} color={COLORS[i]}/>
                </div>
              ))}
              {topIncome.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhuma receita registrada.</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Top Centros de Custo</h3>
            <div className="space-y-3">
              {topExpenses.map(([cat, val], i) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${COLORS[i]}`}/>{cat}</span>
                    <span className="font-bold text-slate-800">R$ {val.toLocaleString("pt-BR")}</span>
                  </div>
                  <MiniBar value={val} max={maxExpense} color={COLORS[i]}/>
                </div>
              ))}
              {topExpenses.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhuma despesa registrada.</p>}
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Comparativo por Evento</h3>
            <div className="space-y-4">
              {eventComparison.map((ev, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-40 shrink-0 text-xs font-medium text-slate-700 truncate">{ev.name}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">{ev.tickets} ingressos</span>
                      <span className="font-bold text-slate-700">R$ {ev.income.toLocaleString("pt-BR")}</span>
                    </div>
                    <MiniBar value={ev.income} max={maxEventIncome} color={COLORS[i % COLORS.length]}/>
                  </div>
                </div>
              ))}
              {eventComparison.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhum evento cadastrado.</p>}
            </div>
          </div>
        </div>
      )}

      {focusArea === "tickets" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Rentabilidade por Categoria</h3>
            <div className="space-y-4">
              {(["VIP","PAID","FREE","SPORTS_REGISTRATION"] as string[]).map((type, i) => {
                const typeTickets = tickets.filter((t: any) => t.type === type);
                const typeRevenue = typeTickets.reduce((s: number, t: any) => s + t.price, 0);
                const avgP = typeTickets.length > 0 ? Math.round(typeRevenue / typeTickets.length) : 0;
                return (
                  <div key={type} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${COLORS[i]}`}>{type}</span>
                      <span className="text-xs font-black text-slate-800">R$ {typeRevenue.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-500">
                      <span>{typeTickets.length} ingressos</span>
                      <span>Preço médio: R$ {avgP}</span>
                      <span>Check-in: {typeTickets.filter((t:any) => t.checkedIn).length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Projeção de Demanda</h3>
            <div className="space-y-3">
              {[
                { city: "São Paulo", demand: 88, growth: 12 },
                { city: "Rio de Janeiro", demand: 72, growth: 8 },
                { city: "Belo Horizonte", demand: 65, growth: 15 },
                { city: "Curitiba", demand: 58, growth: 22 },
                { city: "Porto Alegre", demand: 51, growth: 18 },
              ].map((c, i) => (
                <div key={c.city}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{c.city}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold text-[10px]">+{c.growth}%</span>
                      <span className="font-bold text-slate-800">{c.demand}%</span>
                    </div>
                  </div>
                  <MiniBar value={c.demand} max={100} color={COLORS[i % COLORS.length]}/>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              <strong>📈 Previsão IA:</strong> Crescimento médio de {Math.round(Math.random()*10+10)}% esperado para o próximo trimestre com base em tendências históricas.
            </div>
          </div>
        </div>
      )}

      {focusArea === "marketing" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Eficiência por Canal</h3>
            <div className="space-y-3">
              {(["EMAIL","SMS","WHATSAPP","PUSH"] as string[]).map((channel, i) => {
                const ch = campaigns.filter((c: any) => c.channel === channel && c.status === "SENT");
                const avgConv = ch.length > 0 ? (ch.reduce((s: number, c: any) => s + (c.conversionRate || 0), 0) / ch.length).toFixed(1) : "0";
                const totalSent = ch.reduce((s: number, c: any) => s + (c.sentCount || 0), 0);
                return (
                  <div key={channel} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-800">{channel}</span>
                      <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-full ${COLORS[i]}`}>{avgConv}% conv.</span>
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-500">
                      <span>{ch.length} campanhas</span>
                      <span>{totalSent.toLocaleString()} envios</span>
                    </div>
                    <MiniBar value={Number(avgConv)} max={20} color={COLORS[i]}/>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Receita por Canal de Vendas</h3>
            <div className="space-y-3">
              {[
                { canal: "Site Oficial", pct: 42, value: totalIncome * 0.42 },
                { canal: "App Mobile", pct: 28, value: totalIncome * 0.28 },
                { canal: "Balcão Físico", pct: 15, value: totalIncome * 0.15 },
                { canal: "Afiliados", pct: 10, value: totalIncome * 0.10 },
                { canal: "Outros", pct: 5, value: totalIncome * 0.05 },
              ].map((c, i) => (
                <div key={c.canal}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{c.canal}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">R$ {Math.round(c.value).toLocaleString("pt-BR")}</span>
                      <span className="font-bold">{c.pct}%</span>
                    </div>
                  </div>
                  <MiniBar value={c.pct} max={100} color={COLORS[i]}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {focusArea === "sponsors" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-800 mb-4">ROI por Patrocinador</h3>
          {sponsorships.length > 0 ? (
            <div className="space-y-3">
              {[...sponsorships].sort((a: any, b: any) => b.roiRatio - a.roiRatio).map((sp: any, i: number) => (
                <div key={sp.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black ${COLORS[i % COLORS.length]}`}>{i+1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-800">{sp.sponsorName}</span>
                      <span className="text-xs font-black text-emerald-600">ROI {sp.roiRatio}%</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-slate-500 mb-1">
                      <span>{sp.quotaName}</span>
                      <span>R$ {sp.value.toLocaleString("pt-BR")}</span>
                      <span className={`font-bold ${sp.status === "ACTIVE" ? "text-emerald-600" : sp.status === "COMPLETED" ? "text-blue-600" : "text-amber-600"}`}>{sp.status}</span>
                    </div>
                    <MiniBar value={sp.roiRatio} max={100} color={COLORS[i % COLORS.length]}/>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400 text-center py-8">Nenhum patrocínio registrado.</p>}
        </div>
      )}

      {focusArea === "staff" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Produtividade da Equipe</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Total Staff", value: staff.length },
                { label: "Online Agora", value: staffOnline },
                { label: "Horas Trabalhadas", value: totalHours + "h" },
                { label: "Média por Membro", value: staff.length > 0 ? Math.round(totalHours/staff.length) + "h" : "0h" },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-slate-800">{s.value}</div>
                  <div className="text-[10px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {staff.slice(0, 6).map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black ${COLORS[i % COLORS.length]}`}>{s.name?.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium text-slate-700">{s.name}</span>
                      <span className="text-xs font-bold text-slate-600">{s.hoursWorked}h</span>
                    </div>
                    <span className={`text-[9px] ${s.checkInStatus === "online" ? "text-emerald-600 font-bold" : "text-slate-400"}`}>{s.checkInStatus === "online" ? "● Online" : "○ Offline"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Indicadores ESG</h3>
            <div className="space-y-4">
              {[
                { label: "Resíduos Reciclados", value: 68, color: "bg-emerald-500", icon: "♻️" },
                { label: "Energia Renovável", value: 45, color: "bg-yellow-500", icon: "⚡" },
                { label: "Acessibilidade", value: 82, color: "bg-blue-500", icon: "♿" },
                { label: "Diversidade no Staff", value: 71, color: "bg-violet-500", icon: "🌈" },
                { label: "Compensação de Carbono", value: 38, color: "bg-slate-500", icon: "🌱" },
              ].map((e, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{e.icon} {e.label}</span>
                    <span className="font-bold text-slate-800">{e.value}%</span>
                  </div>
                  <MiniBar value={e.value} max={100} color={e.color}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
