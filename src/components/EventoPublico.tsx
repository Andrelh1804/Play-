/**
 * EventoPublico — Página Pública do Evento
 * PLAY+EVENTOS Enterprise V2.0 — Master Prompt V8.2 FASE 1
 *
 * Rota: /e/:slug ou /evento/:slug
 * Sem autenticação. Dados via /api/public/events/:slug
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar, MapPin, Clock, Users, Ticket, Share2, ChevronDown, ChevronUp,
  Star, Image as ImageIcon, Play, Instagram, Twitter, Facebook, Link2,
  Award, Shield, FileText, Gift, Info, CheckCircle, ArrowRight, ArrowLeft,
  X, Plus, Minus, Tag, CreditCard, Smartphone, Banknote, QrCode,
  Download, Copy, Check, AlertTriangle, Globe, Phone, Mail, ChevronRight,
  Zap, TrendingUp, Heart, ExternalLink
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PublicCategory {
  id: string; name: string; description?: string; type: string;
  color: string; totalCapacity: number; soldCount: number; available: number;
}

interface PublicBatch {
  id: string; categoryId?: string; name: string; description?: string;
  price: number; originalPrice?: number; promotionalPrice?: number;
  quantity: number; soldCount: number; available: number;
  startDate?: string; endDate?: string; status: string;
  discountPct: number; feesPct: number; maxPerPurchase: number;
  maxPerCpf: number; promoCode?: string; autoNext: boolean;
}

interface PublicEvent {
  id: string; name: string; slug: string; type: string; modality: string;
  date: string; description?: string; status: string; organizer?: string;
  location?: string; city?: string; state?: string; address?: string;
  mapLink?: string; capacity: number; ticketPrice: number;
  imageUrl?: string; heroImage?: string;
  regulations?: string; faq: any[]; sponsors: any[]; gallery: any[];
  cancellationPolicy?: string; refundPolicy?: string;
  routeMap?: string; kitInfo?: string; awards?: string; prizeInfo?: string;
  schedule: any[]; categories: PublicCategory[]; batches: PublicBatch[];
}

interface BuyerForm {
  name: string; email: string; cpf: string; phone: string;
  distance: string; team: string; shirtSize: string; dob: string;
}

type CheckoutStep = "select" | "buyer" | "participants" | "coupon" | "payment" | "confirmation";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SHIRT_SIZES = ["PP", "P", "M", "G", "GG", "XGG"];
const PAYMENT_METHODS = [
  { id: "PIX", label: "PIX", icon: <Smartphone size={18} />, desc: "Aprovação imediata" },
  { id: "CARTAO_CREDITO", label: "Cartão de Crédito", icon: <CreditCard size={18} />, desc: "Em até 12x" },
  { id: "BOLETO", label: "Boleto", icon: <Banknote size={18} />, desc: "Vence em 3 dias" },
];

const SPONSOR_TIERS: Record<string, { label: string; color: string; size: string }> = {
  "Master": { label: "Patrocinador Master", color: "from-yellow-400 to-amber-500", size: "text-lg font-bold" },
  "Ouro": { label: "Patrocínio Ouro", color: "from-yellow-300 to-yellow-400", size: "text-base font-semibold" },
  "Prata": { label: "Patrocínio Prata", color: "from-slate-300 to-slate-400", size: "text-sm font-medium" },
  "Bronze": { label: "Patrocínio Bronze", color: "from-orange-300 to-orange-400", size: "text-sm" },
  "Apoiador": { label: "Apoiadores", color: "from-slate-100 to-slate-200", size: "text-xs" },
};

// ─── Countdown Timer ─────────────────────────────────────────────────────────

function useCountdown(dateStr: string) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(dateStr).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s, expired: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]);
  return timeLeft;
}

// ─── QR Code SVG (simulated) ─────────────────────────────────────────────────

function QRCodeDisplay({ value }: { value: string }) {
  // Simple visual QR representation using the value hash
  const cells = 17;
  const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if ((r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)) return true;
      if ((r === 0 || r === 6 || r === cells - 1 || r === cells - 7) && (c < 7 || c >= cells - 7)) return true;
      if ((c === 0 || c === 6 || c === cells - 1 || c === cells - 7) && (r < 7 || r >= cells - 7)) return true;
      return ((seed * (r + 1) * (c + 1) * 7919) % 97) < 48;
    })
  );
  const cs = 6;
  return (
    <svg width={cells * cs} height={cells * cs} xmlns="http://www.w3.org/2000/svg" className="rounded">
      <rect width={cells * cs} height={cells * cs} fill="white" />
      {grid.flatMap((row, r) =>
        row.map((on, c) => on ? <rect key={`${r}-${c}`} x={c * cs} y={r * cs} width={cs} height={cs} fill="#090d16" /> : null)
      )}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EventoPublico({ slug }: { slug: string }) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string>("ingresso");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("select");
  const [selectedCategory, setSelectedCategory] = useState<PublicCategory | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<PublicBatch | null>(null);
  const [qty, setQty] = useState(1);
  const [buyerForm, setBuyerForm] = useState<BuyerForm>({ name: "", email: "", cpf: "", phone: "", distance: "", team: "", shirtSize: "M", dob: "" });
  const [participants, setParticipants] = useState<BuyerForm[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<any>(null);
  const [purchaseError, setPurchaseError] = useState("");

  const sectionRef = useRef<HTMLDivElement>(null);
  const countdown = useCountdown(event?.date || "");

  useEffect(() => {
    fetch(`/api/public/events/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setEvent(data);
      })
      .catch(() => setError("Erro ao carregar o evento."))
      .finally(() => setLoading(false));
  }, [slug]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: event?.name, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openCheckout = () => {
    setStep("select");
    setSelectedCategory(null);
    setSelectedBatch(null);
    setQty(1);
    setBuyerForm({ name: "", email: "", cpf: "", phone: "", distance: "", team: "", shirtSize: "M", dob: "" });
    setParticipants([]);
    setCouponCode(""); setCouponResult(null); setCouponError("");
    setPaymentMethod("PIX");
    setPurchaseResult(null); setPurchaseError("");
    setShowCheckout(true);
  };

  const handleCategorySelect = (cat: PublicCategory) => {
    setSelectedCategory(cat);
    setSelectedBatch(null);
    const firstBatch = activeBatchesForCategory(cat.id)[0];
    if (firstBatch) setSelectedBatch(firstBatch);
  };

  const activeBatchesForCategory = (catId?: string) => {
    if (!event) return [];
    return event.batches.filter(b =>
      (catId ? b.categoryId === catId : !b.categoryId) &&
      b.status === "ACTIVE" && b.available > 0
    );
  };

  const allActiveBatches = () => {
    if (!event) return [];
    return event.batches.filter(b => b.status === "ACTIVE" && b.available > 0);
  };

  const effectivePrice = () => {
    if (!selectedBatch) return event?.ticketPrice || 0;
    return selectedBatch.promotionalPrice || selectedBatch.price;
  };

  const discountedPrice = () => {
    const base = effectivePrice();
    if (!couponResult?.valid) return base;
    return couponResult.finalPrice;
  };

  const totalPrice = () => discountedPrice() * qty;

  const validateCoupon = async () => {
    if (!couponCode.trim() || !event) return;
    setCouponLoading(true); setCouponError("");
    try {
      const r = await fetch("/api/public/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), eventId: event.id, price: effectivePrice() })
      });
      const data = await r.json();
      if (data.valid) setCouponResult(data);
      else { setCouponError(data.error || "Cupom inválido."); setCouponResult(null); }
    } catch { setCouponError("Erro ao validar cupom."); }
    finally { setCouponLoading(false); }
  };

  const initParticipants = () => {
    const list: BuyerForm[] = Array.from({ length: qty }, (_, i) =>
      i === 0 ? { ...buyerForm } : { name: "", email: "", cpf: "", phone: "", distance: "", team: "", shirtSize: "M", dob: "" }
    );
    setParticipants(list);
  };

  const updateParticipant = (idx: number, field: keyof BuyerForm, value: string) => {
    setParticipants(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handlePurchase = async () => {
    if (!event || !selectedBatch) return;
    setPurchasing(true); setPurchaseError("");
    try {
      const buyers = participants.map(p => ({
        ...p,
        type: selectedCategory?.type || "STANDARD",
        paymentMethod,
        couponCode: couponResult?.valid ? couponCode.trim() : undefined
      }));
      const r = await fetch("/api/public/tickets/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, batchId: selectedBatch.id, categoryId: selectedCategory?.id, buyers })
      });
      const data = await r.json();
      if (data.success) { setPurchaseResult(data); setStep("confirmation"); }
      else setPurchaseError(data.error || "Erro ao processar compra.");
    } catch { setPurchaseError("Erro de conexão. Tente novamente."); }
    finally { setPurchasing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Carregando evento...</p>
      </div>
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
      <div className="text-center text-white">
        <AlertTriangle size={48} className="mx-auto mb-4 text-amber-400" />
        <h1 className="text-2xl font-bold mb-2">Evento não encontrado</h1>
        <p className="text-slate-400">{error || "Este evento não existe ou foi removido."}</p>
        <a href="/" className="mt-6 inline-block px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-400 transition-colors">
          Voltar ao início
        </a>
      </div>
    </div>
  );

  const eventDate = new Date(event.date);
  const dateLabel = eventDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const timeLabel = eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const hasCategories = event.categories.length > 0;
  const hasBatches = event.batches.length > 0;
  const hasSponsors = event.sponsors.length > 0;
  const hasGallery = event.gallery.length > 0;
  const hasSchedule = event.schedule.length > 0;
  const hasFaq = event.faq.length > 0;

  const NAV_ITEMS = [
    { id: "ingresso", label: "Ingressos" },
    { id: "informacoes", label: "Informações" },
    ...(hasSchedule ? [{ id: "programacao", label: "Programação" }] : []),
    ...(hasSponsors ? [{ id: "patrocinadores", label: "Patrocinadores" }] : []),
    ...(hasGallery ? [{ id: "galeria", label: "Galeria" }] : []),
    ...(hasFaq ? [{ id: "faq", label: "FAQ" }] : []),
  ];

  const heroImage = event.heroImage || event.imageUrl;
  const typeLabels: Record<string, string> = {
    SHOW: "Show", CORRIDA: "Corrida", FESTIVAL: "Festival", ESPORTIVO: "Esportivo",
    CORPORATIVO: "Corporativo", CONGRESSO: "Congresso", TEATRO: "Teatro",
    WORKSHOP: "Workshop", CULTO: "Culto", OUTRO: "Outro"
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white font-sans">

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {/* Background */}
        {heroImage ? (
          <img src={heroImage} alt={event.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#090d16] via-indigo-950 to-[#090d16]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/60 to-transparent" />

        {/* Header Bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 md:px-8 py-4 z-10">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="PLAY+EVENTOS" className="h-8 w-auto object-contain rounded" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className="text-white font-bold text-sm hidden sm:block">PLAY+EVENTOS</span>
          </a>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur rounded-xl text-white text-sm hover:bg-white/20 transition-colors">
              {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
              {copied ? "Copiado!" : "Compartilhar"}
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-8 z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-amber-500/80 backdrop-blur text-white text-xs font-bold rounded-full uppercase tracking-wide">
                {typeLabels[event.type] || event.type}
              </span>
              {event.modality === "VIRTUAL" && (
                <span className="px-2 py-1 bg-indigo-500/80 backdrop-blur text-white text-xs font-bold rounded-full">Online</span>
              )}
              <span className={`px-2 py-1 backdrop-blur text-xs font-bold rounded-full ${event.status === "PUBLISHED" || event.status === "ACTIVE" ? "bg-green-500/80" : "bg-slate-500/80"}`}>
                {event.status === "PUBLISHED" || event.status === "ACTIVE" ? "Inscrições abertas" : event.status}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-lg">{event.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200 mb-4">
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-amber-400" />{dateLabel}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-400" />{timeLabel}</span>
              {event.city && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-amber-400" />{event.location ? `${event.location}, ` : ""}{event.city}{event.state ? `/${event.state}` : ""}</span>}
              <span className="flex items-center gap-1.5"><Users size={14} className="text-amber-400" />{event.capacity.toLocaleString("pt-BR")} vagas</span>
            </div>

            {/* Countdown */}
            {!countdown.expired && (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-slate-400 text-xs uppercase tracking-widest">Faltam</span>
                {[
                  { v: countdown.d, l: "dias" }, { v: countdown.h, l: "horas" },
                  { v: countdown.m, l: "min" }, { v: countdown.s, l: "seg" }
                ].map(({ v, l }) => (
                  <div key={l} className="text-center">
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5 min-w-[3rem]">
                      <div className="text-xl font-mono font-black text-amber-400">{String(v).padStart(2, "0")}</div>
                      <div className="text-xs text-slate-400">{l}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {countdown.expired && <p className="text-amber-400 text-sm font-semibold mb-4">✓ Evento encerrado</p>}

            <div className="flex flex-wrap gap-3">
              <button onClick={openCheckout} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-400/40 hover:scale-105 active:scale-95">
                <Ticket size={18} /> Comprar Ingresso
              </button>
              {event.mapLink && (
                <a href={event.mapLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20">
                  <MapPin size={16} /> Ver no Maps
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── STICKY NAV ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => scrollTo(n.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeSection === n.id ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-16">

        {/* ─── INGRESSOS & LOTES ─────────────────────────────────────────── */}
        <section id="ingresso">
          <SectionHeader icon={<Ticket size={20} />} title="Ingressos" subtitle="Selecione a categoria e o lote de sua preferência" />
          {!hasBatches && !hasCategories ? (
            <div className="bg-slate-800/50 rounded-2xl p-8 text-center">
              <Ticket size={40} className="mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">Ingressos ainda não disponíveis. Acompanhe as atualizações.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hasCategories ? (
                event.categories.map(cat => {
                  const catBatches = activeBatchesForCategory(cat.id);
                  const activeBatch = catBatches[0];
                  const pct = cat.totalCapacity > 0 ? (cat.soldCount / cat.totalCapacity) * 100 : 0;
                  return (
                    <div key={cat.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <div>
                            <h3 className="font-bold text-white">{cat.name}</h3>
                            {cat.description && <p className="text-slate-400 text-sm">{cat.description}</p>}
                          </div>
                        </div>
                        {activeBatch ? (
                          <div className="text-right flex-shrink-0">
                            {activeBatch.originalPrice && activeBatch.originalPrice > activeBatch.price && (
                              <div className="text-slate-500 text-xs line-through">{fmtBRL(activeBatch.originalPrice)}</div>
                            )}
                            <div className="text-xl font-black text-amber-400">{fmtBRL(activeBatch.promotionalPrice || activeBatch.price)}</div>
                            <div className="text-xs text-slate-500">{activeBatch.name}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 px-3 py-1 bg-slate-700 rounded-lg">Esgotado</span>
                        )}
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{cat.soldCount} inscrições</span>
                          <span>{cat.available} disponíveis</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                      {activeBatch && (
                        <button onClick={openCheckout}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-95">
                          Inscrever-se
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                allActiveBatches().map(batch => (
                  <div key={batch.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white">{batch.name}</h3>
                      {batch.description && <p className="text-slate-400 text-sm">{batch.description}</p>}
                      <p className="text-slate-500 text-xs mt-1">{batch.available} disponíveis</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black text-amber-400">{fmtBRL(batch.promotionalPrice || batch.price)}</div>
                      <button onClick={openCheckout}
                        className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-sm transition-all">
                        Comprar
                      </button>
                    </div>
                  </div>
                ))
              )}
              <div className="text-center pt-2">
                <button onClick={openCheckout}
                  className="flex items-center gap-2 mx-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:scale-105">
                  <Ticket size={18} /> Comprar Ingresso Agora
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ─── INFORMAÇÕES ───────────────────────────────────────────────── */}
        <section id="informacoes">
          <SectionHeader icon={<Info size={20} />} title="Sobre o Evento" />
          <div className="space-y-6">
            {event.description && (
              <div className="bg-slate-800/40 rounded-2xl p-6">
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>
            )}

            {/* Location card */}
            {(event.location || event.city) && (
              <div className="bg-slate-800/40 rounded-2xl p-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Local</h3>
                  <p className="text-white font-semibold">{event.location}</p>
                  <p className="text-slate-400 text-sm">{event.address}</p>
                  <p className="text-slate-400 text-sm">{event.city}{event.state ? `/${event.state}` : ""}</p>
                </div>
                {event.mapLink && (
                  <a href={event.mapLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 self-start sm:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
                    <ExternalLink size={14} /> Ver no Google Maps
                  </a>
                )}
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Data", value: dateLabel, icon: <Calendar size={16} className="text-amber-400" /> },
                { label: "Horário", value: timeLabel, icon: <Clock size={16} className="text-amber-400" /> },
                { label: "Modalidade", value: event.modality, icon: <Globe size={16} className="text-amber-400" /> },
                { label: "Capacidade", value: `${event.capacity.toLocaleString("pt-BR")} pessoas`, icon: <Users size={16} className="text-amber-400" /> },
              ].map(item => (
                <div key={item.label} className="bg-slate-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-xs text-slate-500">{item.label}</span></div>
                  <div className="text-sm text-white font-medium">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Regulations */}
            {event.regulations && (
              <InfoBlock icon={<FileText size={16} />} title="Regulamento" content={event.regulations} />
            )}

            {/* Route map (for races) */}
            {event.routeMap && (
              <InfoBlock icon={<MapPin size={16} />} title="Percurso" content={event.routeMap} />
            )}

            {/* Kit info */}
            {event.kitInfo && (
              <InfoBlock icon={<Gift size={16} />} title="Kit do Atleta" content={event.kitInfo} />
            )}

            {/* Awards/prizes */}
            {(event.awards || event.prizeInfo) && (
              <InfoBlock icon={<Award size={16} />} title="Premiação" content={event.awards || event.prizeInfo || ""} />
            )}

            {/* Cancellation / refund policies */}
            {(event.cancellationPolicy || event.refundPolicy) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {event.cancellationPolicy && <InfoBlock icon={<X size={16} />} title="Política de Cancelamento" content={event.cancellationPolicy} />}
                {event.refundPolicy && <InfoBlock icon={<Shield size={16} />} title="Política de Reembolso" content={event.refundPolicy} />}
              </div>
            )}
          </div>
        </section>

        {/* ─── PROGRAMAÇÃO ───────────────────────────────────────────────── */}
        {hasSchedule && (
          <section id="programacao">
            <SectionHeader icon={<Clock size={20} />} title="Programação" subtitle="Linha do tempo completa do evento" />
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 to-indigo-600 rounded-full" />
              <div className="space-y-4 pl-12">
                {event.schedule.map((item: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-7 top-3 w-4 h-4 rounded-full bg-amber-500 border-2 border-[#090d16]" />
                    <div className="bg-slate-800/40 rounded-xl p-4 hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{item.title || item.name || item.activity || `Atividade ${idx + 1}`}</p>
                          {item.description && <p className="text-slate-400 text-sm mt-1">{item.description}</p>}
                          {item.location && <p className="text-slate-500 text-xs flex items-center gap-1 mt-1"><MapPin size={10} />{item.location}</p>}
                        </div>
                        {(item.time || item.hour || item.start) && (
                          <span className="text-amber-400 font-mono font-bold text-sm flex-shrink-0">{item.time || item.hour || item.start}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── PATROCINADORES ────────────────────────────────────────────── */}
        {hasSponsors && (
          <section id="patrocinadores">
            <SectionHeader icon={<Star size={20} />} title="Patrocinadores" subtitle="Empresas que tornam este evento possível" />
            <div className="space-y-6">
              {Object.entries(SPONSOR_TIERS).map(([tier, config]) => {
                const tierSponsors = event.sponsors.filter((s: any) =>
                  (s.tier || s.quota || s.quotaName || "Apoiador").toLowerCase().includes(tier.toLowerCase())
                );
                if (tierSponsors.length === 0) return null;
                return (
                  <div key={tier}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 bg-gradient-to-r ${config.color} text-slate-900`}>
                      <Star size={10} />{config.label}
                    </div>
                    <div className={`grid gap-3 ${tier === "Master" ? "grid-cols-1 sm:grid-cols-2" : tier === "Ouro" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-4"}`}>
                      {tierSponsors.map((s: any, i: number) => (
                        <a key={i} href={s.url || s.link || "#"} target="_blank" rel="noopener noreferrer"
                          className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-amber-500/40 hover:bg-white/10 transition-colors group">
                          {s.logo ? (
                            <img src={s.logo} alt={s.name} className="max-h-12 max-w-full object-contain" />
                          ) : (
                            <div className={`font-bold text-white ${config.size} text-center`}>{s.name}</div>
                          )}
                          {s.description && <p className="text-slate-500 text-xs text-center">{s.description}</p>}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── GALERIA ───────────────────────────────────────────────────── */}
        {hasGallery && (
          <section id="galeria">
            <SectionHeader icon={<ImageIcon size={20} />} title="Galeria" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {event.gallery.map((item: any, i: number) => (
                <div key={i} className="relative group overflow-hidden rounded-xl aspect-video bg-slate-800">
                  {item.type === "video" || item.url?.includes("youtube") || item.url?.includes("vimeo") ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                      <Play size={32} className="text-amber-400" />
                      <span className="sr-only">{item.caption || "Vídeo"}</span>
                    </div>
                  ) : (
                    <img src={item.url || item.src || item} alt={item.caption || `Foto ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── FAQ ───────────────────────────────────────────────────────── */}
        {hasFaq && (
          <section id="faq">
            <SectionHeader icon={<MessageIcon size={20} />} title="Perguntas Frequentes" />
            <div className="space-y-2">
              {event.faq.map((item: any, idx: number) => (
                <div key={idx} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                  <button className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-700/30 transition-colors"
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}>
                    <span className="font-medium text-white">{item.question || item.q}</span>
                    {expandedFaq === idx ? <ChevronUp size={16} className="text-amber-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-5 pb-4 text-slate-300 text-sm leading-relaxed border-t border-slate-700/50 pt-3">
                      {item.answer || item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── FOOTER CTA ────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-amber-500/10 to-indigo-600/10 border border-amber-500/20 rounded-3xl p-8 text-center">
          <Zap size={32} className="mx-auto mb-3 text-amber-400" />
          <h2 className="text-2xl font-black text-white mb-2">Não perca esta experiência!</h2>
          <p className="text-slate-400 mb-5">Garanta sua vaga agora. As inscrições são limitadas.</p>
          <button onClick={openCheckout}
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-xl transition-all shadow-lg shadow-amber-500/30 hover:scale-105 text-lg">
            <Ticket size={20} /> Comprar Ingresso
          </button>
        </section>
      </div>

      {/* ─── CHECKOUT MODAL ────────────────────────────────────────────── */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-xl bg-[#0f1521] border border-slate-700 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[95vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
              <div>
                <h2 className="font-black text-white">
                  {step === "select" && "Selecionar Ingresso"}
                  {step === "buyer" && "Dados do Comprador"}
                  {step === "participants" && "Dados dos Participantes"}
                  {step === "coupon" && "Cupom & Resumo"}
                  {step === "payment" && "Pagamento"}
                  {step === "confirmation" && "✓ Pedido Confirmado!"}
                </h2>
                <p className="text-slate-500 text-xs">{event.name}</p>
              </div>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Progress Bar */}
            {step !== "confirmation" && (
              <div className="px-5 py-2 border-b border-slate-800 flex-shrink-0">
                <div className="flex gap-1">
                  {(["select", "buyer", "participants", "coupon", "payment"] as CheckoutStep[]).map((s, i) => (
                    <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
                      ["select", "buyer", "participants", "coupon", "payment"].indexOf(step) >= i
                        ? "bg-amber-500" : "bg-slate-700"
                    }`} />
                  ))}
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-5">

              {/* ── STEP: SELECT ── */}
              {step === "select" && (
                <div className="space-y-4">
                  {hasCategories && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Categoria</p>
                      <div className="space-y-2">
                        {event.categories.map(cat => (
                          <button key={cat.id} onClick={() => handleCategorySelect(cat)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedCategory?.id === cat.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 hover:border-slate-600 bg-slate-800/40"}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="text-white text-sm font-medium">{cat.name}</span>
                              <span className="text-slate-500 text-xs">({cat.available} vagas)</span>
                            </div>
                            {selectedCategory?.id === cat.id && <CheckCircle size={16} className="text-amber-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lotes */}
                  {(() => {
                    const batchesToShow = selectedCategory
                      ? activeBatchesForCategory(selectedCategory.id)
                      : allActiveBatches();
                    return batchesToShow.length > 0 ? (
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Lote</p>
                        <div className="space-y-2">
                          {batchesToShow.map(b => (
                            <button key={b.id} onClick={() => setSelectedBatch(b)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedBatch?.id === b.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 hover:border-slate-600 bg-slate-800/40"}`}>
                              <div className="text-left">
                                <div className="text-white text-sm font-medium">{b.name}</div>
                                {b.description && <div className="text-slate-500 text-xs">{b.description}</div>}
                                {b.endDate && <div className="text-slate-500 text-xs">Até {new Date(b.endDate).toLocaleDateString("pt-BR")}</div>}
                              </div>
                              <div className="text-right flex-shrink-0">
                                {b.originalPrice && b.originalPrice > b.price && <div className="text-slate-500 text-xs line-through">{fmtBRL(b.originalPrice)}</div>}
                                <div className="text-amber-400 font-bold">{fmtBRL(b.promotionalPrice || b.price)}</div>
                                {selectedBatch?.id === b.id && <CheckCircle size={14} className="text-amber-400 ml-auto" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Quantity */}
                  {selectedBatch && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Quantidade</p>
                      <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700 rounded-xl p-3">
                        <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="flex-1 text-center text-white font-bold text-lg">{qty}</span>
                        <button onClick={() => setQty(q => Math.min(selectedBatch.maxPerPurchase, selectedBatch.available, q + 1))} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-slate-400">Total</span>
                        <span className="text-amber-400 font-bold">{fmtBRL((selectedBatch.promotionalPrice || selectedBatch.price) * qty)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP: BUYER ── */}
              {step === "buyer" && (
                <div className="space-y-3">
                  {[
                    { field: "name", label: "Nome completo *", type: "text", placeholder: "Seu nome" },
                    { field: "email", label: "E-mail *", type: "email", placeholder: "seu@email.com" },
                    { field: "cpf", label: "CPF *", type: "text", placeholder: "000.000.000-00" },
                    { field: "phone", label: "Telefone / WhatsApp", type: "tel", placeholder: "(11) 99999-9999" },
                    { field: "dob", label: "Data de nascimento", type: "date", placeholder: "" },
                  ].map(f => (
                    <div key={f.field}>
                      <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder}
                        value={(buyerForm as any)[f.field]}
                        onChange={e => setBuyerForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                  ))}
                  {/* Sport-specific fields */}
                  {(event.type === "CORRIDA" || event.type === "ESPORTIVO") && (
                    <>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">Distância / Prova</label>
                        <input type="text" placeholder="Ex: 5km, 10km..." value={buyerForm.distance}
                          onChange={e => setBuyerForm(p => ({ ...p, distance: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">Equipe / Clube</label>
                        <input type="text" placeholder="Nome da equipe" value={buyerForm.team}
                          onChange={e => setBuyerForm(p => ({ ...p, team: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs mb-1 block">Tamanho da Camiseta</label>
                        <select value={buyerForm.shirtSize} onChange={e => setBuyerForm(p => ({ ...p, shirtSize: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors">
                          {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── STEP: PARTICIPANTS ── */}
              {step === "participants" && (
                <div className="space-y-5">
                  {qty > 1 ? participants.slice(1).map((p, i) => (
                    <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                      <p className="text-slate-400 text-xs font-bold uppercase mb-3">Participante {i + 2}</p>
                      {["name", "email", "cpf"].map(f => (
                        <div key={f} className="mb-2">
                          <input type={f === "email" ? "email" : "text"}
                            placeholder={{ name: "Nome completo", email: "E-mail", cpf: "CPF" }[f]}
                            value={(p as any)[f]}
                            onChange={e => updateParticipant(i + 1, f as keyof BuyerForm, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )) : (
                    <div className="text-center text-slate-400 py-6">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                      <p>Somente 1 participante. Continue para o próximo passo.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP: COUPON ── */}
              {step === "coupon" && (
                <div className="space-y-4">
                  {/* Order summary */}
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-2">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">Resumo do Pedido</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{selectedBatch?.name}</span>
                      <span className="text-slate-300">{fmtBRL(effectivePrice())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Quantidade</span>
                      <span className="text-slate-300">× {qty}</span>
                    </div>
                    {couponResult?.valid && (
                      <div className="flex justify-between text-sm text-green-400">
                        <span>Desconto ({couponCode})</span>
                        <span>-{fmtBRL(couponResult.discount * qty)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-amber-400 text-lg">{fmtBRL(totalPrice())}</span>
                    </div>
                  </div>

                  {/* Coupon input */}
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Cupom de Desconto</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Digite o código" value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError(""); }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                      <button onClick={validateCoupon} disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                        {couponLoading ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {couponResult?.valid && (
                      <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                        <CheckCircle size={12} /> Cupom aplicado! Desconto de {fmtBRL(couponResult.discount)} por ingresso.
                      </p>
                    )}
                    {couponError && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} />{couponError}</p>}
                  </div>
                </div>
              )}

              {/* ── STEP: PAYMENT ── */}
              {step === "payment" && (
                <div className="space-y-4">
                  <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Total a pagar</span>
                    <span className="text-2xl font-black text-amber-400">{fmtBRL(totalPrice())}</span>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Forma de Pagamento</p>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map(pm => (
                        <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${paymentMethod === pm.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 hover:border-slate-600 bg-slate-800/40"}`}>
                          <div className={`${paymentMethod === pm.id ? "text-amber-400" : "text-slate-400"}`}>{pm.icon}</div>
                          <div className="text-left">
                            <div className={`text-sm font-medium ${paymentMethod === pm.id ? "text-white" : "text-slate-300"}`}>{pm.label}</div>
                            <div className="text-xs text-slate-500">{pm.desc}</div>
                          </div>
                          {paymentMethod === pm.id && <CheckCircle size={16} className="text-amber-400 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {purchaseError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm">
                      <AlertTriangle size={16} className="flex-shrink-0" />{purchaseError}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP: CONFIRMATION ── */}
              {step === "confirmation" && purchaseResult && (
                <div className="space-y-5">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={32} className="text-green-400" />
                    </div>
                    <h3 className="text-xl font-black text-white">Inscrição Confirmada!</h3>
                    <p className="text-slate-400 text-sm mt-1">Seu(s) ingresso(s) foram emitidos com sucesso.</p>
                  </div>

                  {purchaseResult.tickets.map((tkt: any, i: number) => (
                    <div key={tkt.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Ingresso {i + 1}</p>
                          <p className="text-white font-bold">{tkt.name}</p>
                          <p className="text-slate-400 text-xs">{tkt.email}</p>
                          {tkt.batchName && <p className="text-amber-400 text-xs mt-0.5">{tkt.batchName}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 text-xs">Valor</p>
                          <p className="text-white font-bold">{fmtBRL(tkt.price)}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 py-4 bg-white rounded-xl">
                        <QRCodeDisplay value={tkt.qrCode} />
                        <p className="text-slate-800 font-mono text-xs font-bold">{tkt.qrCode}</p>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button onClick={() => navigator.clipboard.writeText(tkt.qrCode)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors">
                          <Copy size={12} /> Copiar Código
                        </button>
                        <button onClick={() => window.print()}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors">
                          <Download size={12} /> Salvar
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-slate-400">
                    <Info size={14} className="inline mr-1 text-blue-400" />
                    Guarde o QR Code para apresentar no evento. Uma cópia foi enviada para seu e-mail.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {step !== "confirmation" && (
              <div className="border-t border-slate-700 p-4 flex gap-3 flex-shrink-0">
                {step !== "select" && (
                  <button onClick={() => {
                    const steps: CheckoutStep[] = ["select", "buyer", "participants", "coupon", "payment"];
                    const idx = steps.indexOf(step);
                    if (idx > 0) setStep(steps[idx - 1]);
                  }} className="flex items-center gap-1.5 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition-colors">
                    <ArrowLeft size={14} /> Voltar
                  </button>
                )}
                <button
                  disabled={step === "select" ? !selectedBatch : step === "buyer" ? !buyerForm.name || !buyerForm.email : step === "payment" ? purchasing : false}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all"
                  onClick={() => {
                    if (step === "select") setStep("buyer");
                    else if (step === "buyer") { initParticipants(); setStep(qty > 1 ? "participants" : "coupon"); }
                    else if (step === "participants") setStep("coupon");
                    else if (step === "coupon") setStep("payment");
                    else if (step === "payment") handlePurchase();
                  }}>
                  {purchasing ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processando...</>
                  ) : step === "payment" ? (
                    <><CreditCard size={16} /> Confirmar Pagamento</>
                  ) : (
                    <>Continuar <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            )}
            {step === "confirmation" && (
              <div className="border-t border-slate-700 p-4 flex-shrink-0">
                <button onClick={() => setShowCheckout(false)}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors">
                  Concluído
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-amber-400">{icon}</div>
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>
      {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
    </div>
  );
}

function InfoBlock({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  const [expanded, setExpanded] = useState(content.length < 300);
  const isLong = content.length >= 300;
  return (
    <div className="bg-slate-800/40 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-amber-400">{icon}</div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>
      <p className={`text-slate-300 text-sm leading-relaxed whitespace-pre-line ${!expanded && isLong ? "line-clamp-4" : ""}`}>{content}</p>
      {isLong && (
        <button onClick={() => setExpanded(e => !e)} className="text-amber-400 text-xs mt-2 flex items-center gap-1 hover:text-amber-300 transition-colors">
          {expanded ? <><ChevronUp size={12} /> Mostrar menos</> : <><ChevronDown size={12} /> Mostrar mais</>}
        </button>
      )}
    </div>
  );
}

function MessageIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
