/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import {
  Tenant,
  Event,
  Ticket,
  FinanceTransaction,
  CRMLead,
  MarketplaceSupplier,
  Booking,
  Sponsorship,
  PurchaseOrder,
  StaffMember,
  DocumentContract,
  MarketingCampaign,
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
  StaffTeam,
  StaffShift,
  TimeClock,
  FreelancerPayment,
  StaffMessage,
  LeadFlow,
  SalesFunnel,
  GatewayLog,
  EventPlanning
} from "./types.js";

const DB_PATH = path.resolve(process.cwd(), "db.json");

export interface DatabaseState {
  tenants: Tenant[];
  events: Event[];
  tickets: Ticket[];
  finance: FinanceTransaction[];
  leads: CRMLead[];
  suppliers: MarketplaceSupplier[];
  bookings: Booking[];
  sponsorships: Sponsorship[];
  purchaseOrders: PurchaseOrder[];
  staff: StaffMember[];
  contracts: DocumentContract[];
  campaigns: MarketingCampaign[];
  teams: StaffTeam[];
  shifts: StaffShift[];
  clocks: TimeClock[];
  payments: FreelancerPayment[];
  messages: StaffMessage[];
  flows: LeadFlow[];
  funnels: SalesFunnel[];
  gatewayLogs: GatewayLog[];
  plannings: EventPlanning[];
}

const initialDbState: DatabaseState = {
  tenants: [
    {
      id: "tenant-1",
      name: "EventFlow Corp S.A.",
      plan: "Enterprise VIP",
      active: true,
      currency: "BRL",
      language: "pt-BR"
    },
    {
      id: "tenant-2",
      name: "Global Sports & Shows",
      plan: "Scale Premium",
      active: true,
      currency: "USD",
      language: "en-US"
    }
  ],
  events: [
    {
      id: "event-1",
      tenantId: "tenant-1",
      code: "EVT-2026-001",
      name: "Maratona Internacional de São Paulo 2026",
      type: EventType.MARATHON,
      modality: "PRESENCIAL" as any,
      date: "2026-10-12",
      description: "A maior maratona da América Latina, reunindo corredores de elite e entusiastas de todo o mundo pelas ruas de São Paulo.",
      status: EventStatus.ACTIVE,
      organizer: "EventFlow Corp S.A.",
      contractor: "Prefeitura de São Paulo - SPTrans",
      technicalResponsible: "Henrique Silva",
      objectives: "Consolidar São Paulo como capital mundial do esporte de rua, atraindo 15.000 atletas de 50 países e gerando R$ 5M em receita.",
      targetAudience: "Corredores amadores e profissionais, acima de 18 anos, de nível nacional e internacional.",
      ageClassification: "18+",
      primaryLanguage: "pt-BR",
      location: "Av. Paulista, São Paulo - SP",
      country: "Brasil",
      state: "São Paulo",
      city: "São Paulo",
      address: "Av. Paulista, 900 - Bela Vista",
      zipCode: "01310-100",
      coordinates: { lat: -23.5615, lng: -46.6562 },
      mapLink: "https://goo.gl/maps/paulista",
      emergencyRoutes: "Saída principal: Av. Paulista sentido Consolação. Rota secundária: Rua Augusta. Ponto de encontro de emergência: Parque Trianon.",
      capacity: 15000,
      expectedParticipants: 14800,
      ticketPrice: 180,
      imageUrl: "https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=600",
      budgetRatio: 0.70,
      phases: {
        planning: "2026-07-01",
        preProduction: "2026-08-01",
        assembly: "2026-10-10",
        rehearsals: "2026-10-11",
        opening: "2026-10-12",
        execution: "2026-10-12",
        closure: "2026-10-12",
        disassembly: "2026-10-13",
        postEvent: "2026-10-20"
      },
      checklist: [
        { id: "chk-1-1", task: "Obter alvará da prefeitura e CET", completed: true, assigneeRole: "PRODUCER", category: "PLANEJAMENTO" as any, responsible: "Henrique Silva", deadline: "2026-09-01", priority: "CRITICAL" },
        { id: "chk-1-2", task: "Contratar empresa de cronometragem eletrônica", completed: true, assigneeRole: "COORDINATOR", category: "INFRAESTRUTURA" as any, responsible: "Aline Santos", deadline: "2026-09-15", priority: "HIGH" },
        { id: "chk-1-3", task: "Definir postos de hidratação e ambulâncias", completed: false, assigneeRole: "COORDINATOR", category: "SEGURANCA" as any, responsible: "Dr. Carlos Mota", deadline: "2026-10-01", priority: "CRITICAL" },
        { id: "chk-1-4", task: "Instalar pórtico de largada e gradis", completed: false, assigneeRole: "STAFF", category: "INFRAESTRUTURA" as any, responsible: "Equipe Montagem", deadline: "2026-10-10", priority: "HIGH" },
        { id: "chk-1-5", task: "Disparar e-mail marketing para base de leads", completed: true, assigneeRole: "MARKETING", category: "MARKETING" as any, responsible: "Mariana Faria", deadline: "2026-08-15", priority: "MEDIUM" },
        { id: "chk-1-6", task: "Liquidar fornecedor de medalhas", completed: false, assigneeRole: "FINANCE", category: "FINANCEIRO" as any, responsible: "CFO", deadline: "2026-09-30", priority: "HIGH" },
        { id: "chk-1-7", task: "Relatório pós-evento e NPS dos atletas", completed: false, assigneeRole: "COORDINATOR", category: "POS_EVENTO" as any, responsible: "Aline Santos", deadline: "2026-10-25", priority: "MEDIUM" }
      ],
      schedule: [
        { id: "sch-1-1", time: "05:00", activity: "Check-in operacional da equipe de coordenação", responsibility: "COORDINATOR", location: "Base Operacional - Av. Paulista", estimatedDuration: 30, itemStatus: "COMPLETED" },
        { id: "sch-1-2", time: "05:30", activity: "Abertura dos currais de largada", responsibility: "COORDINATOR", location: "Curral A/B/C - Início Av. Paulista", estimatedDuration: 30, itemStatus: "COMPLETED" },
        { id: "sch-1-3", time: "06:00", activity: "Largada Elite Feminina", responsibility: "PRODUCER", location: "Pórtico de Largada Km 0", estimatedDuration: 5, itemStatus: "COMPLETED" },
        { id: "sch-1-4", time: "06:15", activity: "Largada Elite Masculina e Geral (ondas)", responsibility: "PRODUCER", location: "Pórtico de Largada Km 0", estimatedDuration: 45, itemStatus: "IN_PROGRESS" },
        { id: "sch-1-5", time: "11:00", activity: "Cerimônia de premiação e coletiva de imprensa", responsibility: "MARKETING", location: "Palco Principal - Área de Chegada", estimatedDuration: 60, itemStatus: "PENDING" }
      ],
      infrastructure: [
        { id: "inf-1-1", name: "Banheiros Químicos", quantity: 120, status: "Entregue", category: "Sanitários", location: "Pontos KM 5, 10, 15, 20, 25, 30, 35, 40, 42", supplier: "SanitaPro Eventos" },
        { id: "inf-1-2", name: "Ambulâncias UTI Móvel", quantity: 6, status: "Pendente", category: "Segurança", location: "Postos médicos ao longo do percurso", supplier: "ResgateMedical SP" },
        { id: "inf-1-3", name: "Pórtico Inflável (Largada/Chegada)", quantity: 2, status: "Confirmado", category: "Sinalização", location: "KM 0 e KM 42.195", supplier: "InfoPórticos Brasil" },
        { id: "inf-1-4", name: "Gradis de proteção (metros lineares)", quantity: 800, status: "Em trânsito", category: "Segurança", location: "Perímetro do percurso", supplier: "AlugaGrade Brasil" },
        { id: "inf-1-5", name: "Sistema de Chip de Cronometragem RFID", quantity: 15000, status: "Entregue", category: "TI", location: "Centro de credenciamento", supplier: "CronosEletrônica Esportiva" }
      ],
      logistics: [
        { id: "log-1-1", type: "TRANSPORT", description: "Transporte de atletas elite do aeroporto ao hotel oficial", responsible: "Coord. Logística", date: "2026-10-11", origin: "Aeroporto Internacional de Guarulhos", destination: "Hotel Grand Hyatt SP", vehicle: "Van Executiva Mercedes Sprinter", capacity: 8, status: "CONFIRMED" },
        { id: "log-1-2", type: "ACCOMMODATION", description: "Hospedagem oficiais e comissão técnica", responsible: "Coord. Logística", date: "2026-10-11", destination: "Hotel Grand Hyatt São Paulo", capacity: 50, status: "CONFIRMED" }
      ]
    },
    {
      id: "event-2",
      tenantId: "tenant-1",
      code: "EVT-2026-002",
      name: "EventFlow Tech Summit 2026",
      type: EventType.CONGRESS,
      modality: "HIBRIDO" as any,
      date: "2026-11-05",
      description: "O maior congresso nacional sobre tecnologia disruptiva de eventos, ticketing, inteligência artificial e CRM.",
      status: EventStatus.PLANNING,
      organizer: "EventFlow Corp S.A.",
      contractor: "Oracle Brasil / Microsoft",
      technicalResponsible: "Juliana Rocha",
      objectives: "Posicionar EventFlow como líder de tecnologia em eventos no Brasil, com 1.200 participantes presenciais e 5.000 online.",
      targetAudience: "Gestores de eventos, CTOs, diretores de marketing e startups do setor de entretenimento.",
      ageClassification: "18+",
      primaryLanguage: "pt-BR",
      location: "Centro de Convenções Rebouças, São Paulo - SP",
      country: "Brasil",
      state: "São Paulo",
      city: "São Paulo",
      address: "R. Cláudio Soares, 72 - Pinheiros",
      zipCode: "05422-030",
      coordinates: { lat: -23.5652, lng: -46.6713 },
      capacity: 1200,
      expectedParticipants: 1050,
      ticketPrice: 450,
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600",
      budgetRatio: 0.65,
      phases: {
        planning: "2026-08-01",
        preProduction: "2026-09-15",
        assembly: "2026-11-04",
        opening: "2026-11-05",
        execution: "2026-11-05",
        closure: "2026-11-05",
        disassembly: "2026-11-06",
        postEvent: "2026-11-15"
      },
      checklist: [
        { id: "chk-2-1", task: "Confirmar palestrantes internacionais", completed: true, assigneeRole: "PRODUCER", category: "PLANEJAMENTO" as any, responsible: "Juliana Rocha", deadline: "2026-09-01", priority: "CRITICAL" },
        { id: "chk-2-2", task: "Configurar credenciamento via QR Code", completed: false, assigneeRole: "STAFF", category: "INFRAESTRUTURA" as any, responsible: "TI Team", deadline: "2026-10-20", priority: "HIGH" },
        { id: "chk-2-3", task: "Aprovar cardápio do buffet VIP", completed: false, assigneeRole: "COORDINATOR", category: "INFRAESTRUTURA" as any, responsible: "Ana Paula", deadline: "2026-10-15", priority: "MEDIUM" },
        { id: "chk-2-4", task: "Contrato de patrocínio Oracle assinado", completed: true, assigneeRole: "LEGAL", category: "FINANCEIRO" as any, responsible: "Jurídico", deadline: "2026-09-10", priority: "CRITICAL" }
      ],
      schedule: [
        { id: "sch-2-1", time: "08:00", activity: "Credenciamento e Welcome Coffee", responsibility: "STAFF", location: "Foyer Principal", estimatedDuration: 60, itemStatus: "PENDING" },
        { id: "sch-2-2", time: "09:00", activity: "Keynote de abertura: IA no Live Marketing", responsibility: "PRODUCER", location: "Auditório Principal (Cap. 800)", estimatedDuration: 90, itemStatus: "PENDING" },
        { id: "sch-2-3", time: "12:00", activity: "Almoço e Networking no pavilhão", responsibility: "COORDINATOR", location: "Pavilhão Rebouças", estimatedDuration: 60, itemStatus: "PENDING" },
        { id: "sch-2-4", time: "14:00", activity: "Trilha IA & Ticketing — sessões paralelas", responsibility: "COORDINATOR", location: "Salas A, B e C", estimatedDuration: 120, itemStatus: "PENDING" }
      ],
      infrastructure: [
        { id: "inf-2-1", name: "Painel de LED 12x4m", quantity: 1, status: "Confirmado", category: "Palco", location: "Auditório Principal", supplier: "LED & Sound Solutions" },
        { id: "inf-2-2", name: "Microfones de Lapela sem fio", quantity: 8, status: "Entregue", category: "TI", location: "Palco principal e mesas redondas", supplier: "AudioPro Eventos" },
        { id: "inf-2-3", name: "Totens de Auto-Atendimento / Check-in", quantity: 10, status: "Em trânsito", category: "Credenciamento", location: "Entrada principal e foyer", supplier: "EventTech Brasil" }
      ]
    },
    {
      id: "event-3",
      tenantId: "tenant-2",
      code: "EVT-2026-003",
      name: "Miami Sunset Music Festival",
      type: EventType.FESTIVAL,
      modality: "PRESENCIAL" as any,
      date: "2026-08-20",
      description: "An incredible sunset electronic festival on the beaches of Miami featuring global headliners and immersive art installations.",
      status: EventStatus.ACTIVE,
      organizer: "Global Sports & Shows",
      technicalResponsible: "Marcus Williams",
      objectives: "Deliver a world-class music experience for 8,000 attendees with a 4.8/5 NPS and $2M in gross revenue.",
      targetAudience: "Electronic music fans aged 21+, international audience.",
      ageClassification: "18+",
      primaryLanguage: "en-US",
      location: "South Beach, Miami - FL",
      country: "USA",
      state: "Florida",
      city: "Miami Beach",
      address: "Ocean Drive, South Beach",
      coordinates: { lat: 25.7617, lng: -80.1918 },
      mapLink: "https://goo.gl/maps/southbeach",
      capacity: 8000,
      expectedParticipants: 7500,
      ticketPrice: 120,
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600",
      budgetRatio: 0.80,
      phases: {
        planning: "2026-06-01",
        assembly: "2026-08-18",
        rehearsals: "2026-08-19",
        opening: "2026-08-20",
        execution: "2026-08-20",
        closure: "2026-08-21",
        disassembly: "2026-08-22"
      },
      checklist: [
        { id: "chk-3-1", task: "Soundcheck with Headliners", completed: false, assigneeRole: "PRODUCER", category: "INFRAESTRUTURA" as any, responsible: "Marcus Williams", deadline: "2026-08-19", priority: "CRITICAL" },
        { id: "chk-3-2", task: "Bar stock delivery and POS validation", completed: true, assigneeRole: "COORDINATOR", category: "INFRAESTRUTURA" as any, responsible: "Ops Team", deadline: "2026-08-18", priority: "HIGH" },
        { id: "chk-3-3", task: "Security briefing and perimeter sweep", completed: false, assigneeRole: "SECURITY", category: "SEGURANCA" as any, responsible: "Chief of Security", deadline: "2026-08-20", priority: "CRITICAL" }
      ],
      schedule: [
        { id: "sch-3-1", time: "16:00", activity: "Gates Open & Warmup Sets", responsibility: "STAFF", location: "Main Gate & Stage B", estimatedDuration: 150, itemStatus: "PENDING" },
        { id: "sch-3-2", time: "18:30", activity: "Sunset Key Performance — Headliner 1", responsibility: "PRODUCER", location: "Main Stage", estimatedDuration: 90, itemStatus: "PENDING" },
        { id: "sch-3-3", time: "21:00", activity: "Midnight Headliner Set", responsibility: "PRODUCER", location: "Main Stage", estimatedDuration: 120, itemStatus: "PENDING" }
      ],
      infrastructure: [
        { id: "inf-3-1", name: "Main Stage Line Array Speakers", quantity: 4, status: "Entregue", category: "Palco", location: "Main Stage", supplier: "SoundStar USA" },
        { id: "inf-3-2", name: "Security Crowd Barriers (meters)", quantity: 500, status: "Confirmado", category: "Segurança", location: "Stage perimeter", supplier: "ProBarrier Inc." },
        { id: "inf-3-3", name: "LED Stage Backdrop 20x8m", quantity: 1, status: "Em trânsito", category: "Palco", location: "Main Stage rear", supplier: "LED Vision Miami" }
      ],
      logistics: [
        { id: "log-3-1", type: "TRANSPORT", description: "Artist transport from MIA Airport to hotel", responsible: "Artist Relations", date: "2026-08-19", origin: "Miami International Airport", destination: "1 Hotel South Beach", vehicle: "Luxury SUV Convoy", capacity: 12, status: "CONFIRMED" }
      ]
    }
  ],
  tickets: [
    {
      id: "tkt-1",
      eventId: "event-1",
      tenantId: "tenant-1",
      name: "Kit Atleta Geral",
      type: TicketType.SPORTS_REGISTRATION,
      price: 180,
      buyerName: "Felipe Almeida",
      buyerEmail: "felipe.almeida@gmail.com",
      qrCode: "FLOW-TKT-1-ALMEIDA-9823",
      checkedIn: true,
      checkedInAt: "2026-10-12T05:15:00Z",
      cpf: "123.456.789-00"
    },
    {
      id: "tkt-2",
      eventId: "event-1",
      tenantId: "tenant-1",
      name: "Kit Atleta VIP Premium",
      type: TicketType.SPORTS_REGISTRATION,
      price: 350,
      buyerName: "Mariana Costa",
      buyerEmail: "mari.costa@yahoo.com.br",
      qrCode: "FLOW-TKT-2-COSTA-1123",
      checkedIn: false,
      cpf: "987.654.321-11"
    },
    {
      id: "tkt-3",
      eventId: "event-2",
      tenantId: "tenant-1",
      name: "Passaporte Tech Full Access",
      type: TicketType.VIP,
      price: 450,
      buyerName: "Carlos Eduardo",
      buyerEmail: "carlos.edu@enterprise.com",
      qrCode: "FLOW-TKT-3-CARLOS-7742",
      checkedIn: false,
      seat: "Setor A - Fileira 3 - Cadeira 14"
    }
  ],
  finance: [
    {
      id: "fin-1",
      tenantId: "tenant-1",
      eventId: "event-1",
      type: TransactionType.INCOME,
      category: "Ticketing / Inscrições",
      amount: 2700000,
      description: "Faturamento acumulado de 15.000 inscrições esportivas gerais e VIPs",
      date: "2026-07-01",
      status: TransactionStatus.PAID
    },
    {
      id: "fin-2",
      tenantId: "tenant-1",
      eventId: "event-1",
      type: TransactionType.INCOME,
      category: "Patrocínio Máster",
      amount: 1200000,
      description: "Aporte master da Caixa Econômica / Naming Rights",
      date: "2026-07-02",
      status: TransactionStatus.PAID
    },
    {
      id: "fin-3",
      tenantId: "tenant-1",
      eventId: "event-1",
      type: TransactionType.EXPENSE,
      category: "Infraestrutura / Plantas",
      amount: 450000,
      description: "Locação de gradis, tendas, palcos e sinalização do percurso",
      date: "2026-07-03",
      status: TransactionStatus.PAID
    },
    {
      id: "fin-4",
      tenantId: "tenant-1",
      eventId: "event-1",
      type: TransactionType.EXPENSE,
      category: "RH / Staff",
      amount: 150000,
      description: "Diária de 500 staffs, coordenadores de percurso e seguranças",
      date: "2026-07-04",
      status: TransactionStatus.PENDING
    },
    {
      id: "fin-5",
      tenantId: "tenant-1",
      eventId: "event-2",
      type: TransactionType.INCOME,
      category: "Venda de Ingressos",
      amount: 540000,
      description: "Venda de 1.200 lotes antecipados do Summit de Tecnologia",
      date: "2026-07-05",
      status: TransactionStatus.PAID
    }
  ],
  leads: [
    {
      id: "lead-1",
      tenantId: "tenant-1",
      name: "Roberto Dinamite",
      company: "Ambev S.A.",
      type: LeadType.SPONSOR,
      email: "roberto.dinamite@ambev.com.br",
      phone: "(11) 98888-2234",
      pipelineStage: PipelineStage.NEGOTIATION,
      value: 350000,
      notes: "Cota de cerveja oficial e ativação no quilômetro final com túnel de névoa e DJ."
    },
    {
      id: "lead-2",
      tenantId: "tenant-1",
      name: "Patrícia Menezes",
      company: "Nike Brasil",
      type: LeadType.SPONSOR,
      email: "patricia.menezes@nike.com",
      phone: "(11) 97777-5431",
      pipelineStage: PipelineStage.WON,
      value: 600000,
      notes: "Cota de calçados oficial da maratona. Fornecimento das camisetas oficiais do evento."
    },
    {
      id: "lead-3",
      tenantId: "tenant-1",
      name: "Guilherme Siqueira",
      company: "Decathlon Brasil",
      type: LeadType.EXHIBITOR,
      email: "gui.siqueira@decathlon.com",
      phone: "(11) 91111-2222",
      pipelineStage: PipelineStage.PROPOSAL,
      value: 45000,
      notes: "Estande de 50m² na feira de entrega de kits para venda de gel de carboidrato e acessórios."
    }
  ],
  suppliers: [
    {
      id: "sup-1",
      name: "AlugaGrade Brasil",
      category: SupplierCategory.SECURITY,
      rating: 4.8,
      pricePerHour: 120,
      email: "contato@alugagrade.com.br",
      phone: "(11) 3321-0988",
      availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      portfolioUrl: "https://example.com/alugagrade"
    },
    {
      id: "sup-2",
      name: "CronosEletrônica Esportiva",
      category: SupplierCategory.CHRONOMETRY,
      rating: 4.9,
      pricePerHour: 350,
      email: "suporte@cronoseletronica.com.br",
      phone: "(21) 90221-1244",
      availability: ["Fri", "Sat", "Sun"],
      portfolioUrl: "https://example.com/cronos"
    },
    {
      id: "sup-3",
      name: "LED & Sound Solutions",
      category: SupplierCategory.STAGE,
      rating: 4.7,
      pricePerHour: 450,
      email: "atendimento@ledsound.com.br",
      phone: "(11) 5055-1212",
      availability: ["Mon", "Wed", "Thu", "Fri", "Sat", "Sun"]
    },
    {
      id: "sup-4",
      name: "NutriEvent Buffet S.A.",
      category: SupplierCategory.CATERING,
      rating: 4.6,
      pricePerHour: 280,
      email: "eventos@nutrievent.com.br",
      phone: "(11) 4004-9022",
      availability: ["Thu", "Fri", "Sat"]
    }
  ],
  bookings: [
    {
      id: "bkg-1",
      supplierId: "sup-2",
      eventId: "event-1",
      date: "2026-10-12",
      cost: 4200,
      status: "APPROVED"
    },
    {
      id: "bkg-2",
      supplierId: "sup-3",
      eventId: "event-2",
      date: "2026-11-05",
      cost: 9000,
      status: "PENDING"
    }
  ],
  sponsorships: [
    {
      id: "sps-1",
      eventId: "event-1",
      sponsorName: "Nike Brasil S.A.",
      quotaName: "Diamond / Master",
      value: 600000,
      deliverables: [
        "Selo oficial de patrocinador esportivo",
        "Estande de 100m² para entrega de kits",
        "Logotipo em destaque na camiseta oficial de 15 mil atletas",
        "Pórtico exclusivo Nike no km 21"
      ],
      status: "ACTIVE",
      roiRatio: 88
    },
    {
      id: "sps-2",
      eventId: "event-1",
      sponsorName: "Caixa Econômica",
      quotaName: "Naming Rights",
      value: 1200000,
      deliverables: [
        "Inclusão do nome oficial: Maratona Caixa de São Paulo 2026",
        "Logo na medalha oficial de finisher",
        "100 cortesias corporativas",
        "Discurso de representantes na premiação"
      ],
      status: "ACTIVE",
      roiRatio: 94
    },
    {
      id: "sps-3",
      eventId: "event-2",
      sponsorName: "Oracle Brasil",
      quotaName: "Gold Sponsor",
      value: 150000,
      deliverables: [
        "Palestra de 30 minutos na trilha de IA",
        "Logo no painel de LED principal",
        "Disparo de email marketing direcionado"
      ],
      status: "PROPOSAL",
      roiRatio: 72
    }
  ],
  purchaseOrders: [
    {
      id: "po-1",
      tenantId: "tenant-1",
      title: "Medalhas Fundidas e Fitilhos Personalizados",
      amount: 75000,
      status: "APPROVED",
      supplierName: "MetaisArtísticos S.A.",
      date: "2026-07-02"
    },
    {
      id: "po-2",
      tenantId: "tenant-1",
      title: "Uniformes para Staff (550 camisetas)",
      amount: 18000,
      status: "PENDING",
      supplierName: "TêxtilPromo Ltda",
      date: "2026-07-04"
    }
  ],
  staff: [
    {
      id: "stf-1",
      tenantId: "tenant-1",
      eventId: "event-1",
      name: "Aline Santos",
      role: StaffRole.COORDINATOR,
      email: "aline.santos@eventflow.com",
      phone: "(11) 98111-2233",
      checkInStatus: "online",
      gpsCoords: { lat: -23.5615, lng: -46.6562 },
      hoursWorked: 24,
      uniformSize: "M"
    },
    {
      id: "stf-2",
      tenantId: "tenant-1",
      eventId: "event-1",
      name: "Rodrigo Silva",
      role: StaffRole.STAFF,
      email: "rodrigo.stf@gmail.com",
      phone: "(11) 98333-4455",
      checkInStatus: "offline",
      hoursWorked: 8,
      uniformSize: "G"
    },
    {
      id: "stf-3",
      tenantId: "tenant-1",
      eventId: "event-2",
      name: "Juliana Rocha",
      role: StaffRole.PRODUCER,
      email: "ju.rocha@eventflow.com",
      phone: "(11) 99112-8822",
      checkInStatus: "online",
      gpsCoords: { lat: -23.5652, lng: -46.6713 },
      hoursWorked: 48,
      uniformSize: "P"
    }
  ],
  contracts: [
    {
      id: "ctr-1",
      tenantId: "tenant-1",
      eventId: "event-1",
      title: "Contrato de Prestação de Serviços de Cronometragem Eletrônica",
      type: "Supplier Contract",
      content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CRONOMETRAGEM ESPORTIVA

CONTRATANTE: EventFlow Corp S.A., sediada na Av. Paulista, São Paulo - SP.
CONTRATADO: CronosEletrônica Esportiva.

CLÁUSULA PRIMEIRA - DO OBJETO:
O CONTRATADO compromete-se a fornecer serviços de cronometragem de alta precisão baseada em chip RFID ativo descartável para 15.000 corredores na Maratona de São Paulo 2026.

CLÁUSULA SEGUNDA - DO VALOR:
A CONTRATANTE pagará o valor fixo de R$ 42.000,00 divididos em duas parcelas de igual valor mediante comprovação técnica de entrega dos chips.

CRONOGRAMA DE AUDITORIA DE ASSINATURAS:
- Gerado pelo EventFlow Enterprise. Trilha de auditoria digital inviolável registrada nos logs.`,
      status: ContractStatus.SIGNED,
      signedBy: ["Diretoria EventFlow", "CEO CronosEletrônica"],
      signedAt: "2026-07-03T18:40:00Z",
      auditTrail: [
        "Contrato rascunhado por Aline Santos (PRODUCER) em 2026-07-02T10:15:00Z",
        "Aprovado por Financeiro da EventFlow em 2026-07-02T16:22:00Z",
        "Assinado eletronicamente por CEO CronosEletrônica (IP: 187.55.22.1) em 2026-07-03T14:11:00Z",
        "Assinado eletronicamente por Diretoria EventFlow (MFA token OK) em 2026-07-03T18:40:00Z"
      ]
    },
    {
      id: "ctr-2",
      tenantId: "tenant-1",
      eventId: "event-1",
      title: "Contrato de Patrocínio Master e Naming Rights Caixa Econômica",
      type: "Sponsor Contract",
      content: `CONTRATO DE EXCLUSIVIDADE DE MARCA E NAMING RIGHTS

PATROCINADORA: Caixa Econômica Federal.
ORGANIZADORA: EventFlow Corp S.A.

CLÁUSULA PRIMEIRA - DOS NAMING RIGHTS:
O evento esportivo passará a ser denominado oficialmente 'Maratona Caixa de São Paulo 2026' em todas as comunicações, redes sociais, mídias tradicionais e sinalizações de rua.

CLÁUSULA SEGUNDA - DO INVESTIMENTO:
O patrocínio terá a quantia líquida de R$ 1.200.000,00 com split financeiro automático diretamente nas contas autorizadas da organizadora.`,
      status: ContractStatus.PENDING_SIGNATURES,
      signedBy: ["Diretoria EventFlow"],
      auditTrail: [
        "Minuta padrão de cota Diamond gerada automaticamente via IA EventFlow em 2026-07-04T09:00:00Z",
        "Assinado eletronicamente por Diretoria EventFlow em 2026-07-04T11:20:00Z"
      ]
    }
  ],
  campaigns: [
    {
      id: "cmp-1",
      tenantId: "tenant-1",
      eventId: "event-1",
      title: "Campanha 1º Lote - Desconto Corredores Veteranos",
      channel: "EMAIL",
      sentCount: 5000,
      conversionRate: 14.5,
      status: "SENT",
      subject: "Inscrições abertas com desconto especial de veterano!",
      content: "Olá corredor! Prepare seu tênis. O primeiro lote da Maratona de São Paulo 2026 está aberto com exclusividade para você...",
      targetSegment: "Atletas que participaram em 2025",
      opens: 3200,
      clicks: 1100,
      conversions: 725
    },
    {
      id: "cmp-2",
      tenantId: "tenant-1",
      eventId: "event-1",
      title: "Lembrete WhatsApp - Entrega de Kits Maratona",
      channel: "WHATSAPP",
      sentCount: 1500,
      conversionRate: 3.2,
      status: "DRAFT",
      content: "Olá! Não se esqueça de retirar seu kit atleta no Pavilhão do Rebouças até às 18h de sábado. Leve seu documento com foto!"
    }
  ],
  teams: [
    {
      id: "team-1",
      tenantId: "tenant-1",
      eventId: "event-1",
      name: "Staff Geral - Credenciamento",
      area: "Credenciamento",
      leaderName: "Aline Santos",
      membersCount: 15
    },
    {
      id: "team-2",
      tenantId: "tenant-1",
      eventId: "event-1",
      name: "Segurança de Percurso Km 0-10",
      area: "Percurso",
      leaderName: "Rodrigo Silva",
      membersCount: 8
    }
  ],
  shifts: [
    {
      id: "shf-1",
      staffId: "stf-1",
      staffName: "Aline Santos",
      eventId: "event-1",
      eventName: "Maratona Internacional de São Paulo 2026",
      date: "2026-10-12",
      startTime: "05:00",
      endTime: "13:00",
      hoursAllocated: 8,
      role: "COORDINATOR",
      status: "CONFIRMED"
    },
    {
      id: "shf-2",
      staffId: "stf-2",
      staffName: "Rodrigo Silva",
      eventId: "event-1",
      eventName: "Maratona Internacional de São Paulo 2026",
      date: "2026-10-12",
      startTime: "05:30",
      endTime: "11:30",
      hoursAllocated: 6,
      role: "STAFF",
      status: "PENDING"
    }
  ],
  clocks: [
    {
      id: "clk-1",
      staffId: "stf-1",
      staffName: "Aline Santos",
      eventId: "event-1",
      timestamp: "2026-10-12T05:01:22Z",
      type: "IN",
      method: "DIGITAL_GPS",
      gpsCoords: { lat: -23.5615, lng: -46.6562 },
      locationName: "Av. Paulista - Largada"
    }
  ],
  payments: [
    {
      id: "pay-1",
      staffId: "stf-2",
      staffName: "Rodrigo Silva",
      eventId: "event-1",
      role: "STAFF",
      amount: 150.0,
      hoursTotal: 6,
      status: "PENDING"
    },
    {
      id: "pay-2",
      staffId: "stf-3",
      staffName: "Juliana Rocha",
      eventId: "event-2",
      role: "PRODUCER",
      amount: 600.0,
      hoursTotal: 12,
      status: "PAID",
      paymentDate: "2026-07-04",
      paymentMethod: "PIX"
    }
  ],
  messages: [
    {
      id: "msg-1",
      tenantId: "tenant-1",
      eventId: "event-1",
      senderName: "Henrique Silva (Gestor)",
      senderRole: "PRODUCER",
      message: "Atenção equipe de percurso: o material de sinalização chegou no Km 5. Favor verificar.",
      timestamp: "2026-07-05T14:30:00Z",
      channel: "Percurso"
    },
    {
      id: "msg-2",
      tenantId: "tenant-1",
      eventId: "event-1",
      senderName: "Aline Santos",
      senderRole: "COORDINATOR",
      message: "Tudo pronto nos totens de credenciamento. Aguardando liberação da elite.",
      timestamp: "2026-07-05T14:45:00Z",
      channel: "Credenciamento"
    }
  ],
  flows: [
    {
      id: "flow-1",
      tenantId: "tenant-1",
      name: "Nutrição de Atletas Recém-Inscritos",
      description: "Disparos automatizados de dicas de treino e ofertas do marketplace após inscrição confirmada.",
      triggerEvent: "Ticket Purchased",
      active: true,
      steps: [
        {
          id: "step-1-1",
          delayDays: 1,
          channel: "EMAIL",
          subject: "Bem-vindo à Maratona! Comece sua preparação",
          content: "Olá {{name}}, parabéns pela inscrição! Aqui estão algumas dicas essenciais..."
        },
        {
          id: "step-1-2",
          delayDays: 3,
          channel: "WHATSAPP",
          content: "Oi {{name}}, temos descontos exclusivos em calçados esportivos dos nossos patrocinadores no Marketplace! Acesse agora."
        }
      ]
    }
  ],
  funnels: [
    {
      id: "fun-1",
      tenantId: "tenant-1",
      eventId: "event-1",
      name: "Funil Geral - Vendas de Inscrições",
      targetProduct: "Inscrições Maratona 2026",
      stages: [
        { name: "Visitantes da Landing Page", description: "Leads que visitaram a página", leadsCount: 12400, valueSum: 0 },
        { name: "Inscrição Iniciada", description: "Preencheram dados mas não pagaram", leadsCount: 4500, valueSum: 810000 },
        { name: "Pagamento Pendente", description: "Aguardando compensação do boleto/PIX", leadsCount: 890, valueSum: 160200 },
        { name: "Inscrição Confirmada (Conversão)", description: "Pago com sucesso", leadsCount: 1510, valueSum: 271800 }
      ]
    },
    {
      id: "fun-2",
      tenantId: "tenant-1",
      eventId: "event-2",
      name: "Funil de Patrocínios Corporativos",
      targetProduct: "Cotas Master Tech Summit",
      stages: [
        { name: "Prospects Identificados", description: "Empresas alvo do setor", leadsCount: 80, valueSum: 4000000 },
        { name: "Primeiro Contato", description: "Apresentação comercial enviada", leadsCount: 35, valueSum: 1750000 },
        { name: "Negociação da Cota", description: "Ajustando contrapartidas de marca", leadsCount: 12, valueSum: 600000 },
        { name: "Assinatura de Contrato", description: "Minuta jurídica enviada", leadsCount: 3, valueSum: 150000 }
      ]
    }
  ],
  gatewayLogs: [
    {
      id: "log-1",
      timestamp: "2026-07-05T15:58:20Z",
      method: "GET",
      path: "/api/v1/gateway/events-service/planning?eventId=event-1",
      clientIp: "192.168.1.100",
      statusCode: 200,
      durationMs: 42,
      headers: {
        "authorization": "Bearer flow_enterprise_token_secure_99",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      auditDetails: "Tráfego roteado com sucesso para microsserviço de Gestão de Eventos."
    }
  ],
  plannings: [
    {
      id: "plan-1",
      eventId: "event-1",
      strategicGoal: "Entregar a maratona mais segura e sustentável da américa latina com nota média de satisfação de atletas acima de 4.7.",
      phases: [
        { name: "Fase 1: Licenciamento e Contratos de Fornecedores de Longo Prazo", status: "COMPLETED", deadline: "2026-06-30" },
        { name: "Fase 2: Marketing, Ativação de Patrocinadores e Venda de Lotes", status: "IN_PROGRESS", deadline: "2026-08-31" },
        { name: "Fase 3: Montagem Física de Percursos e Logística de Campo", status: "PENDING", deadline: "2026-10-10" }
      ],
      risks: [
        { description: "Chuvas extremas no dia do percurso", impact: "HIGH", mitigation: "Tendas estendidas e plano alternativo de dispersão em vias pavimentadas." },
        { description: "Atraso na entrega de chips de cronometragem eletrônica", impact: "MEDIUM", mitigation: "Contrato prevê multa de 20% e entrega com 5 dias de margem segura." }
      ],
      milestones: [
        { name: "Milestone 1: 5.000 inscrições vendidas", date: "2026-06-15", status: "ACHIEVED" },
        { name: "Milestone 2: Alvarás oficiais de trânsito emitidos", date: "2026-08-01", status: "PENDING" },
        { name: "Milestone 3: Entrega física de kits e abertura oficial", date: "2026-10-10", status: "PENDING" }
      ]
    }
  ]
};

export function getDatabase(): DatabaseState {
  if (!fs.existsSync(DB_PATH)) {
    saveDatabase(initialDbState);
    return initialDbState;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Erro ao ler banco de dados JSON, recriando inicial...", error);
    saveDatabase(initialDbState);
    return initialDbState;
  }
}

export function saveDatabase(data: DatabaseState): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao persistir banco de dados JSON:", error);
  }
}
