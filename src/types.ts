/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum EventType {
  RUNNING = "RUNNING",
  MARATHON = "MARATHON",
  TRAIL_RUN = "TRAIL_RUN",
  TRIATHLON = "TRIATHLON",
  CYCLING = "CYCLING",
  MOUNTAIN_BIKE = "MOUNTAIN_BIKE",
  MOTOCROSS = "MOTOCROSS",
  CORPORATE = "CORPORATE",
  CONGRESS = "CONGRESS",
  CONFERENCE = "CONFERENCE",
  SHOW = "SHOW",
  FESTIVAL = "FESTIVAL",
  WORKSHOP = "WORKSHOP",
  SEMINAR = "SEMINAR",
  FAIR = "FAIR",
  EXHIBITION = "EXHIBITION",
  WEDDING = "WEDDING",
  GRADUATION = "GRADUATION",
  RELIGIOUS = "RELIGIOUS",
  GOVERNMENT = "GOVERNMENT",
  CHARITY = "CHARITY",
  ESPORTS = "ESPORTS",
  ONLINE = "ONLINE",
  HYBRID = "HYBRID",
  SPORTS = "SPORTS"
}

export enum EventModality {
  PRESENCIAL = "PRESENCIAL",
  ONLINE = "ONLINE",
  HIBRIDO = "HIBRIDO"
}

export enum EventStatus {
  PLANNING = "PLANNING",
  PRE_PRODUCTION = "PRE_PRODUCTION",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum ChecklistCategory {
  PLANEJAMENTO = "PLANEJAMENTO",
  INFRAESTRUTURA = "INFRAESTRUTURA",
  SEGURANCA = "SEGURANCA",
  MARKETING = "MARKETING",
  FINANCEIRO = "FINANCEIRO",
  POS_EVENTO = "POS_EVENTO"
}

export enum TicketType {
  FREE = "FREE",
  PAID = "PAID",
  VIP = "VIP",
  CAMAROTE = "CAMAROTE",
  LOUNGE = "LOUNGE",
  PREMIUM = "PREMIUM",
  FRONT_STAGE = "FRONT_STAGE",
  BACKSTAGE = "BACKSTAGE",
  PASSAPORTE = "PASSAPORTE",
  COMBO = "COMBO",
  DAY_PASS = "DAY_PASS",
  CONVITE = "CONVITE",
  CORTESIA = "CORTESIA",
  SPORTS_REGISTRATION = "SPORTS_REGISTRATION",
  CORPORATE = "CORPORATE",
  MEIA_ENTRADA = "MEIA_ENTRADA"
}

export enum PaymentMethod {
  PIX = "PIX",
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  BOLETO = "BOLETO",
  DIGITAL_WALLET = "DIGITAL_WALLET",
  INTERNAL_CREDIT = "INTERNAL_CREDIT",
  VOUCHER = "VOUCHER",
  GIFT_CARD = "GIFT_CARD"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  CHARGEBACK = "CHARGEBACK"
}

export enum CredentialType {
  PARTICIPANT = "PARTICIPANT",
  STAFF = "STAFF",
  SPONSOR = "SPONSOR",
  SUPPLIER = "SUPPLIER",
  PRESS = "PRESS",
  AUTHORITY = "AUTHORITY",
  EXHIBITOR = "EXHIBITOR",
  ARTIST = "ARTIST",
  ATHLETE = "ATHLETE",
  VOLUNTEER = "VOLUNTEER"
}

export enum AccessZoneType {
  GENERAL = "GENERAL",
  VIP = "VIP",
  BACKSTAGE = "BACKSTAGE",
  PRESS = "PRESS",
  STAFF_ONLY = "STAFF_ONLY",
  STAGE = "STAGE",
  PARKING = "PARKING",
  CATERING = "CATERING",
  PREMIUM = "PREMIUM"
}

export enum RefundStatus {
  NONE = "NONE",
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  PROCESSED = "PROCESSED",
  REJECTED = "REJECTED"
}

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE"
}

export enum TransactionStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE"
}

export enum LeadType {
  SPONSOR = "SPONSOR",
  EXHIBITOR = "EXHIBITOR",
  CLIENT = "CLIENT",
  ORGANIZER = "ORGANIZER"
}

export enum PipelineStage {
  LEAD = "LEAD",
  CONTACTED = "CONTACTED",
  PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION",
  WON = "WON",
  LOST = "LOST"
}

export enum SupplierCategory {
  STAGE = "STAGE",
  SOUND = "SOUND",
  LIGHTING = "LIGHTING",
  SECURITY = "SECURITY",
  CATERING = "CATERING",
  CLEANING = "CLEANING",
  MEDICAL = "MEDICAL",
  PHOTOGRAPHY = "PHOTOGRAPHY",
  CHRONOMETRY = "CHRONOMETRY"
}

export enum StaffRole {
  COORDINATOR = "COORDINATOR",
  PRODUCER = "PRODUCER",
  STAFF = "STAFF",
  SECURITY = "SECURITY"
}

export enum ContractStatus {
  DRAFT = "DRAFT",
  PENDING_SIGNATURES = "PENDING_SIGNATURES",
  SIGNED = "SIGNED"
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  active: boolean;
  currency: string;
  language: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  assigneeRole: string;
  category?: ChecklistCategory;
  responsible?: string;
  deadline?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  comments?: string[];
  evidenceUrl?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  activity: string;
  responsibility: string;
  location?: string;
  resources?: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  dependencies?: string[];
  itemStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
  notes?: string;
}

export interface InfrastructureItem {
  id: string;
  name: string;
  quantity: number;
  status: string;
  category?: string;
  location?: string;
  supplier?: string;
  notes?: string;
}

export interface LogisticsItem {
  id: string;
  type: "TRANSPORT" | "ACCOMMODATION" | "FLIGHT" | "TRANSFER";
  description: string;
  responsible: string;
  date: string;
  origin?: string;
  destination?: string;
  vehicle?: string;
  capacity?: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface EventPhase {
  phase: string;
  date?: string;
  notes?: string;
}

export interface Event {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  type: EventType;
  category?: string;
  modality?: EventModality;
  date: string;
  description: string;
  status: EventStatus;
  organizer?: string;
  contractor?: string;
  technicalResponsible?: string;
  objectives?: string;
  targetAudience?: string;
  ageClassification?: string;
  primaryLanguage?: string;
  location: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  coordinates?: { lat: number; lng: number };
  mapLink?: string;
  floorPlan?: string;
  accessAreas?: string[];
  emergencyRoutes?: string;
  capacity: number;
  expectedParticipants?: number;
  ticketPrice: number;
  imageUrl: string;
  budgetRatio: number;
  phases?: {
    planning?: string;
    preProduction?: string;
    assembly?: string;
    rehearsals?: string;
    opening?: string;
    execution?: string;
    closure?: string;
    disassembly?: string;
    postEvent?: string;
  };
  checklist: ChecklistItem[];
  schedule: ScheduleItem[];
  infrastructure: InfrastructureItem[];
  logistics?: LogisticsItem[];
  auditTrail?: string[];
}

export interface Ticket {
  id: string;
  eventId: string;
  tenantId: string;
  name: string;
  type: TicketType;
  price: number;
  buyerName: string;
  buyerEmail: string;
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: string;
  checkOutAt?: string;
  reentryCount?: number;
  seat?: string;
  cpf?: string;
  // Batch & payment
  batchId?: string;
  batchName?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  couponCode?: string;
  discountAmount?: number;
  originalPrice?: number;
  // Sports fields
  category?: string;
  distance?: string;
  team?: string;
  club?: string;
  federation?: string;
  bibNumber?: string;
  chipNumber?: string;
  shirtSize?: string;
  hasTermSigned?: boolean;
  hasMedicalCert?: boolean;
  hasInsurance?: boolean;
  kitDelivered?: boolean;
  // Credential
  credentialType?: CredentialType;
  credentialPrinted?: boolean;
  accessZones?: string[];
  // Transfer / cancel
  transferredToName?: string;
  transferredToEmail?: string;
  transferredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  refundStatus?: RefundStatus;
}

export interface Credential {
  id: string;
  eventId: string;
  tenantId: string;
  holderName: string;
  holderEmail: string;
  holderOrg?: string;
  type: CredentialType;
  qrCode: string;
  accessZones: string[];
  issuedAt: string;
  printed: boolean;
  active: boolean;
  notes?: string;
}

export interface AccessZone {
  id: string;
  eventId: string;
  name: string;
  type: AccessZoneType;
  capacity: number;
  currentOccupancy: number;
  allowedCredentials: CredentialType[];
  color: string;
}

export interface TicketTransfer {
  id: string;
  ticketId: string;
  eventId: string;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  transferredAt: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  reason?: string;
}

export interface FinanceTransaction {
  id: string;
  tenantId: string;
  eventId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  status: TransactionStatus;
}

export interface CRMLead {
  id: string;
  tenantId: string;
  name: string;
  company: string;
  type: LeadType;
  email: string;
  phone: string;
  pipelineStage: PipelineStage;
  value: number;
  notes: string;
}

export interface MarketplaceSupplier {
  id: string;
  name: string;
  category: SupplierCategory;
  rating: number;
  pricePerHour: number;
  email: string;
  phone: string;
  availability: string[];
  portfolioUrl?: string;
}

export interface Booking {
  id: string;
  supplierId: string;
  eventId: string;
  date: string;
  cost: number;
  status: string;
}

export interface Sponsorship {
  id: string;
  eventId: string;
  sponsorName: string;
  quotaName: string;
  value: number;
  deliverables: string[];
  status: string;
  roiRatio: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  title: string;
  amount: number;
  status: string;
  supplierName: string;
  date: string;
}

export interface StaffMember {
  id: string;
  tenantId: string;
  eventId: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  checkInStatus: "online" | "offline";
  gpsCoords?: { lat: number; lng: number };
  hoursWorked: number;
  uniformSize: string;
}

export interface DocumentContract {
  id: string;
  tenantId: string;
  eventId?: string;
  title: string;
  type: string;
  content: string;
  status: ContractStatus;
  signedBy: string[];
  signedAt?: string;
  auditTrail: string[];
}

export interface MarketingCampaign {
  id: string;
  tenantId: string;
  eventId: string;
  title: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
  sentCount: number;
  conversionRate: number;
  status: "DRAFT" | "SENT";
  subject?: string;
  content?: string;
  scheduledAt?: string;
  targetSegment?: string;
  opens?: number;
  clicks?: number;
  conversions?: number;
}

export interface StaffTeam {
  id: string;
  tenantId: string;
  eventId: string;
  name: string;
  area: string;
  leaderName: string;
  membersCount: number;
}

export interface StaffShift {
  id: string;
  staffId: string;
  staffName: string;
  eventId: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  hoursAllocated: number;
  role: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED";
}

export interface TimeClock {
  id: string;
  staffId: string;
  staffName: string;
  eventId: string;
  timestamp: string;
  type: "IN" | "OUT";
  method: "PHYSICAL" | "DIGITAL_GPS";
  gpsCoords?: { lat: number; lng: number };
  locationName?: string;
}

export interface FreelancerPayment {
  id: string;
  staffId: string;
  staffName: string;
  eventId: string;
  role: string;
  amount: number;
  hoursTotal: number;
  status: "PENDING" | "PAID";
  paymentDate?: string;
  paymentMethod?: string;
}

export interface StaffMessage {
  id: string;
  tenantId: string;
  eventId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  channel: string;
}

export interface LeadFlowStep {
  id: string;
  delayDays: number;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  subject?: string;
  content: string;
}

export interface LeadFlow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  triggerEvent: string;
  steps: LeadFlowStep[];
  active: boolean;
}

export interface SalesFunnelStage {
  name: string;
  description: string;
  leadsCount: number;
  valueSum: number;
}

export interface SalesFunnel {
  id: string;
  tenantId: string;
  eventId: string;
  name: string;
  targetProduct: string;
  stages: SalesFunnelStage[];
}

export interface GatewayLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  clientIp: string;
  statusCode: number;
  durationMs: number;
  headers: Record<string, string>;
  validationErrors?: string[];
  auditDetails?: string;
}

export interface EventPlanning {
  id: string;
  eventId: string;
  strategicGoal: string;
  phases: { name: string; status: "PENDING" | "IN_PROGRESS" | "COMPLETED"; deadline: string }[];
  risks: { description: string; impact: "LOW" | "MEDIUM" | "HIGH"; mitigation: string }[];
  milestones: { name: string; date: string; status: "PENDING" | "ACHIEVED" }[];
}
