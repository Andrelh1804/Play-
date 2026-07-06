import React, { useState } from "react";
import { MapPin, Plus, X, Truck, Bus, Hotel, Route, Users, Activity, CheckCircle, Clock } from "lucide-react";

interface EventSpace {
  id: string;
  name: string;
  type: string;
  capacity: number;
  area: number;
  floor: string;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
  currentEvent?: string;
  amenities: string[];
  occupancyPct: number;
}

interface Vehicle {
  id: string;
  type: string;
  plate: string;
  driver: string;
  capacity: number;
  status: "AVAILABLE" | "EN_ROUTE" | "AT_LOCATION" | "MAINTENANCE";
  currentRoute?: string;
  origin?: string;
  destination?: string;
  eta?: string;
}

const SPACE_TYPE_ICON: Record<string, string> = {
  "Auditório": "🎭", "Palco": "🎤", "Arena": "🏟", "Sala": "🚪", "Camarote": "🌟",
  "Estande": "🏪", "VIP": "💎", "Estacionamento": "🅿", "Food Park": "🍔", "Técnica": "🔧",
};
const VEH_ICON: Record<string, string> = {
  "Caminhão": "🚚", "Van": "🚐", "Ônibus": "🚌", "Carro": "🚗", "Moto": "🏍",
};

const SEED_SPACES: EventSpace[] = [
  { id: "sp-1", name: "Palco Principal", type: "Palco", capacity: 5000, area: 800, floor: "Térreo", status: "OCCUPIED", currentEvent: "Show de Abertura", amenities: ["Som Profissional", "LED 12x8m", "Iluminação Cênica"], occupancyPct: 87 },
  { id: "sp-2", name: "Auditório Central", type: "Auditório", capacity: 1200, area: 400, floor: "1º Andar", status: "RESERVED", currentEvent: "Congresso Técnico", amenities: ["Ar-condicionado", "Projetor 4K", "Microfones"], occupancyPct: 65 },
  { id: "sp-3", name: "Área VIP Premium", type: "VIP", capacity: 300, area: 150, floor: "Térreo", status: "OCCUPIED", currentEvent: "Camarote Empresarial", amenities: ["Open Bar", "Lounge", "Vista Privilegiada"], occupancyPct: 92 },
  { id: "sp-4", name: "Sala Reuniões A", type: "Sala", capacity: 50, area: 60, floor: "2º Andar", status: "AVAILABLE", amenities: ["TV 65\"", "Videoconferência", "Ar-condicionado"], occupancyPct: 0 },
  { id: "sp-5", name: "Food Park", type: "Food Park", capacity: 800, area: 600, floor: "Térreo", status: "OCCUPIED", currentEvent: "Praça de Alimentação", amenities: ["10 Food Trucks", "Mesas e Cadeiras", "Música Ambiente"], occupancyPct: 72 },
  { id: "sp-6", name: "Estacionamento A", type: "Estacionamento", capacity: 500, area: 2000, floor: "Externo", status: "OCCUPIED", currentEvent: "Estacionamento Geral", amenities: ["Segurança 24h", "Câmeras"], occupancyPct: 95 },
  { id: "sp-7", name: "Área Técnica", type: "Técnica", capacity: 20, area: 80, floor: "Subsolo", status: "RESERVED", amenities: ["Geradores", "Central Elétrica", "Ar-condicionado Industrial"], occupancyPct: 30 },
  { id: "sp-8", name: "Palco Secundário", type: "Palco", capacity: 1500, area: 300, floor: "Térreo", status: "MAINTENANCE", amenities: ["Som", "LED 8x4m"], occupancyPct: 0 },
];

const SEED_VEHICLES: Vehicle[] = [
  { id: "v-1", type: "Caminhão", plate: "BRA-2E23", driver: "Carlos Motorista", capacity: 10000, status: "AT_LOCATION", currentRoute: "Equipamentos de Palco", origin: "São Paulo", destination: "Local do Evento" },
  { id: "v-2", type: "Van", plate: "SJP-4R18", driver: "Marcelo Silva", capacity: 12, status: "EN_ROUTE", currentRoute: "Transfer Artistas", origin: "Hotel Grand Hyatt", destination: "Backstage", eta: "14:30" },
  { id: "v-3", type: "Ônibus", plate: "ABC-7K51", driver: "Roberto Pereira", capacity: 48, status: "AVAILABLE", currentRoute: "Transfer Atletas" },
  { id: "v-4", type: "Carro", plate: "SPM-1A09", driver: "André Ferreira", capacity: 4, status: "EN_ROUTE", currentRoute: "Transfer VIP", origin: "Aeroporto Congonhas", destination: "Camarote VIP", eta: "15:00" },
  { id: "v-5", type: "Caminhão", plate: "RJO-5G77", driver: "Paulo Anjos", capacity: 15000, status: "AT_LOCATION", currentRoute: "Gerador Industrial" },
  { id: "v-6", type: "Moto", plate: "SPX-3D22", driver: "Diego Campos", capacity: 1, status: "EN_ROUTE", currentRoute: "Documentos / Credenciais", origin: "Gráfica Centro", destination: "Credenciamento", eta: "13:45" },
];

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  OCCUPIED: "bg-blue-100 text-blue-700",
  RESERVED: "bg-amber-100 text-amber-700",
  MAINTENANCE: "bg-red-100 text-red-700",
  EN_ROUTE: "bg-amber-100 text-amber-700",
  AT_LOCATION: "bg-emerald-100 text-emerald-700",
};

export default function GestaoEspacos() {
  const [spaces, setSpaces] = useState<EventSpace[]>(SEED_SPACES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(SEED_VEHICLES);
  const [section, setSection] = useState<"spaces" | "logistics">("spaces");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<EventSpace | null>(null);

  const totalCap = spaces.reduce((s, x) => s + x.capacity, 0);
  const avgOcc = Math.round(spaces.reduce((s, x) => s + x.occupancyPct, 0) / spaces.length);
  const occupied = spaces.filter(s => s.status === "OCCUPIED").length;
  const inMotion = vehicles.filter(v => v.status === "EN_ROUTE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestão de Espaços & Logística</h2>
          <p className="text-xs text-slate-500 mt-0.5">Controle de áreas, salas, palcos, frota e transporte</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSection("spaces")} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${section === "spaces" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            🏟 Espaços
          </button>
          <button onClick={() => setSection("logistics")} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${section === "logistics" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            🚚 Logística
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Capacidade Total", value: totalCap.toLocaleString("pt-BR"), sub: "pessoas", icon: "👥", color: "from-violet-500 to-violet-600" },
          { label: "Ocupação Média", value: `${avgOcc}%`, sub: "dos espaços", icon: "📊", color: "from-blue-500 to-blue-600" },
          { label: "Espaços Ocupados", value: occupied, sub: `de ${spaces.length} cadastrados`, icon: "🏟", color: "from-emerald-500 to-emerald-600" },
          { label: "Veículos em Rota", value: inMotion, sub: `de ${vehicles.length} na frota`, icon: "🚚", color: "from-amber-500 to-amber-600" },
        ].map((k, i) => (
          <div key={i} className={`bg-gradient-to-br ${k.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-2xl font-black">{k.value}</div>
            <div className="text-[10px] opacity-70 font-medium">{k.label}</div>
            <div className="text-[9px] opacity-50">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* SPACES SECTION */}
      {section === "spaces" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800">Mapa de Espaços</h3>
              <div className="flex items-center gap-2">
                {[["AVAILABLE","Livre"],["OCCUPIED","Ocupado"],["RESERVED","Reservado"],["MAINTENANCE","Manutenção"]].map(([s, l]) => (
                  <span key={s} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[s]}`}>{l}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {spaces.map(sp => (
                <div key={sp.id} onClick={() => setSelected(selected?.id === sp.id ? null : sp)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-violet-300 ${selected?.id === sp.id ? "border-violet-400 bg-violet-50" : "border-slate-100"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{SPACE_TYPE_ICON[sp.type] || "🏢"}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[sp.status]}`}>{sp.status}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{sp.name}</p>
                  <p className="text-[10px] text-slate-400 mb-2">{sp.type} · {sp.area}m² · {sp.floor}</p>
                  {sp.occupancyPct > 0 && (
                    <div>
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="text-slate-400">Ocupação</span>
                        <span className={`font-bold ${sp.occupancyPct >= 90 ? "text-red-500" : sp.occupancyPct >= 70 ? "text-amber-500" : "text-emerald-500"}`}>{sp.occupancyPct}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${sp.occupancyPct >= 90 ? "bg-red-500" : sp.occupancyPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${sp.occupancyPct}%` }}/>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Space Detail */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-800">{SPACE_TYPE_ICON[selected.type]} {selected.name}</h3>
                  <button onClick={() => setSelected(null)}><X size={14} className="text-slate-300"/></button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_BADGE[selected.status]}`}>{selected.status}</span>
                    {selected.currentEvent && <p className="text-xs font-medium text-slate-700 mt-2">{selected.currentEvent}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Capacidade</p><p className="font-bold text-slate-800">{selected.capacity.toLocaleString()} pessoas</p></div>
                    <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Área</p><p className="font-bold text-slate-800">{selected.area} m²</p></div>
                    <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Andar</p><p className="font-bold text-slate-800">{selected.floor}</p></div>
                    <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">Ocupação</p><p className="font-bold text-slate-800">{selected.occupancyPct}%</p></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Comodidades</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.amenities.map((a, i) => <span key={i} className="text-[9px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{a}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {(["AVAILABLE","OCCUPIED","RESERVED","MAINTENANCE"] as EventSpace["status"][]).map(s => (
                      <button key={s} onClick={() => { setSpaces(prev => prev.map(x => x.id === selected.id ? { ...x, status: s } : x)); setSelected(prev => prev ? { ...prev, status: s } : null); }}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selected.status === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
                        {s === "AVAILABLE" ? "Livre" : s === "OCCUPIED" ? "Ocupado" : s === "RESERVED" ? "Reservado" : "Manutenção"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MapPin size={32} className="text-slate-200 mb-2"/>
                <p className="text-sm text-slate-400 font-medium">Selecione um espaço</p>
                <p className="text-xs text-slate-300">para ver detalhes e alterar status</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGISTICS SECTION */}
      {section === "logistics" && (
        <div className="space-y-6">
          {/* Hotels */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">🏨 Hospedagem & Transfers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { hotel: "Grand Hyatt São Paulo", rooms: 12, guests: "Palestrantes e Patrocinadores VIP", checkin: "2026-07-05", checkout: "2026-07-08", status: "CONFIRMED" },
                { hotel: "Ibis Styles Paulista", rooms: 30, guests: "Staff e Coordenação", checkin: "2026-07-05", checkout: "2026-07-07", status: "CONFIRMED" },
                { hotel: "Comfort Inn Expo", rooms: 8, guests: "Equipe Técnica / Montagem", checkin: "2026-07-04", checkout: "2026-07-07", status: "PENDING" },
              ].map((h, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-800">🏨</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${h.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{h.status}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{h.hotel}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{h.guests}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span>{h.rooms} quartos</span>
                    <span>Check-in: {h.checkin}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-4">🚛 Frota & Rotas</h3>
            <div className="space-y-3">
              {vehicles.map(v => (
                <div key={v.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-2xl shrink-0">{VEH_ICON[v.type] || "🚗"}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800">{v.type} · {v.plate}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[v.status]}`}>{v.status.replace("_"," ")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                      <span>👤 {v.driver}</span>
                      {v.currentRoute && <span>📍 {v.currentRoute}</span>}
                      {v.origin && v.destination && <span>🗺 {v.origin} → {v.destination}</span>}
                      {v.eta && <span className="text-amber-600 font-bold">⏱ ETA: {v.eta}</span>}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0">{v.capacity} {v.type === "Carro" || v.type === "Moto" ? "pass." : v.type === "Van" || v.type === "Ônibus" ? "pass." : "kg"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
