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
  CORPORATE = "CORPORATE",
  CONGRESS = "CONGRESS",
  SHOW = "SHOW",
  FESTIVAL = "FESTIVAL",
  WORKSHOP = "WORKSHOP",
  ONLINE = "ONLINE"
}

export enum EventStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum TicketType {
  FREE = "FREE",
  PAID = "PAID",
  VIP = "VIP",
  SPORTS_REGISTRATION = "SPORTS_REGISTRATION"
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

export interface Event {
  id: string;
  tenantId: string;
  name: string;
  type: EventType;
  date: string;
  description: string;
  status: EventStatus;
  location: string;
  capacity: number;
  ticketPrice: number;
  imageUrl: string;
  budgetRatio: number; // e.g. 0.75 of total projected revenue
  checklist: ChecklistItem[];
  schedule: ScheduleItem[];
  infrastructure: InfrastructureItem[];
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  assigneeRole: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  activity: string;
  responsibility: string;
}

export interface InfrastructureItem {
  id: string;
  name: string;
  quantity: number;
  status: string;
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
  seat?: string;
  cpf?: string;
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
  status: string; // e.g. "PENDING", "APPROVED", "COMPLETED"
}

export interface Sponsorship {
  id: string;
  eventId: string;
  sponsorName: string;
  quotaName: string; // e.g. "Diamond", "Gold", "Silver"
  value: number;
  deliverables: string[];
  status: string; // "PROPOSAL", "ACTIVE", "COMPLETED"
  roiRatio: number; // ROI score (0-100)
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  title: string;
  amount: number;
  status: string; // "PENDING", "APPROVED", "RECEIVED", "PAID"
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
  type: string; // e.g., "Supplier Contract", "Sponsor Contract", "Staff Contract"
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
  conversionRate: number; // percentage
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

