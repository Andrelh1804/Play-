import React, { useState, useEffect, useRef, useCallback } from "react";
import { authFetch } from "../authService";
import {
  FolderOpen, Upload, Search, Filter, Trash2, Download, Eye,
  FileText, Image, Video, Archive, File, FileSpreadsheet,
  Sparkles, X, Plus, Tag, Calendar, User, HardDrive,
  CheckCircle, AlertCircle, Loader2, RefreshCw, FolderArchive,
  Shield, Layers, ChevronDown, MoreVertical, Info
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Document {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  eventId?: string;
  uploadedBy?: string;
  uploaderName?: string;
  tags: string[];
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  byCategory: { category: string; count: string; total_size: string }[];
  total: { count: number; totalSize: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",       label: "Todos",            icon: FolderOpen,    color: "text-slate-400",   bg: "bg-slate-800/60" },
  { id: "contract",  label: "Contratos",        icon: FileText,      color: "text-blue-400",    bg: "bg-blue-900/40" },
  { id: "license",   label: "Alvarás",          icon: Shield,        color: "text-emerald-400", bg: "bg-emerald-900/40" },
  { id: "blueprint", label: "Plantas/Projetos", icon: Layers,        color: "text-violet-400",  bg: "bg-violet-900/40" },
  { id: "photo",     label: "Fotos",            icon: Image,         color: "text-amber-400",   bg: "bg-amber-900/40" },
  { id: "report",    label: "Relatórios",       icon: FileSpreadsheet, color: "text-cyan-400",  bg: "bg-cyan-900/40" },
  { id: "video",     label: "Vídeos",           icon: Video,         color: "text-pink-400",    bg: "bg-pink-900/40" },
  { id: "other",     label: "Outros",           icon: Archive,       color: "text-orange-400",  bg: "bg-orange-900/40" },
];

function formatBytes(b: number) {
  if (b === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getCatMeta(cat: string) {
  return CATEGORIES.find(c => c.id === cat) || CATEGORIES[CATEGORIES.length - 1];
}

function getMimeIcon(mime: string) {
  if (mime.startsWith("image/")) return { Icon: Image, color: "text-amber-400" };
  if (mime.startsWith("video/")) return { Icon: Video, color: "text-pink-400" };
  if (mime === "application/pdf") return { Icon: FileText, color: "text-red-400" };
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") return { Icon: FileSpreadsheet, color: "text-emerald-400" };
  if (mime.includes("word")) return { Icon: FileText, color: "text-blue-400" };
  if (mime === "application/zip") return { Icon: Archive, color: "text-orange-400" };
  return { Icon: File, color: "text-slate-400" };
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSuccess, events }: { onClose: () => void; onSuccess: () => void; events: { id: string; name: string }[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [eventId, setEventId] = useState("");
  const [tags, setTags] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^/.]+$/, "")); }
  }, [name]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^/.]+$/, "")); }
  };

  const analyzeWithAI = async () => {
    if (!file) return;
    setAiAnalyzing(true);
    try {
      const res = await authFetch("/api/ai/document-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category) setCategory(data.category);
        if (data.summary) setDescription(data.summary);
        if (data.tags?.length) setTags(data.tags.join(", "));
      }
    } catch { /* ignore */ } finally { setAiAnalyzing(false); }
  };

  const handleSubmit = async () => {
    if (!file) return setError("Selecione um arquivo.");
    if (!name.trim()) return setError("Dê um nome ao documento.");
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name.trim());
      fd.append("category", category);
      fd.append("description", description);
      if (eventId) fd.append("eventId", eventId);
      fd.append("tags", JSON.stringify(tags.split(",").map(t => t.trim()).filter(Boolean)));
      const res = await authFetch("/api/documents", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erro no upload."); }
      onSuccess();
      onClose();
    } catch (err: any) { setError(err.message); } finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1623] border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Upload size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Enviar Documento</h3>
              <p className="text-[10px] text-slate-400">Máx. 50 MB · PDF, Imagem, Vídeo, Office, ZIP</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragging ? "border-amber-500 bg-amber-500/10" :
              file ? "border-emerald-500/60 bg-emerald-900/20" : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/40"
            }`}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={28} className="text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-medium">Arraste ou clique para selecionar</p>
                <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG, DOCX, XLSX, MP4, ZIP</p>
              </>
            )}
          </div>

          {file && (
            <button onClick={analyzeWithAI} disabled={aiAnalyzing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-500/25 transition-colors disabled:opacity-50">
              {aiAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {aiAnalyzing ? "Analisando com IA..." : "Categorizar Automaticamente com IA"}
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Nome do Documento *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                placeholder="Ex: Contrato Patrocínio 2025" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/60">
                {CATEGORIES.filter(c => c.id !== "all").map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Evento (opcional)</label>
              <select value={eventId} onChange={e => setEventId(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/60">
                <option value="">— Nenhum —</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 resize-none"
                placeholder="Descrição breve do documento..." />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Tags (separadas por vírgula)</label>
              <input value={tags} onChange={e => setTags(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                placeholder="Ex: 2025, patrocínio, assinado" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-sm text-red-300">
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={uploading || !file}
            className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : <><Upload size={14} /> Enviar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const isImage = doc.mimeType.startsWith("image/");
  const isPDF = doc.mimeType === "application/pdf";
  const isVideo = doc.mimeType.startsWith("video/");
  const meta = getCatMeta(doc.category);
  const CatIcon = meta.icon;
  const { Icon: MimeIcon, color: mimeColor } = getMimeIcon(doc.mimeType);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1623] border border-slate-700/60 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
              <MimeIcon size={16} className={mimeColor} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{doc.name}</h3>
              <p className="text-[10px] text-slate-400">{doc.fileName} · {formatBytes(doc.fileSize)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-3 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {isImage && (
            <div className="flex items-center justify-center p-4 bg-slate-900/50 min-h-48">
              <img src={`/uploads/${doc.filePath}`} alt={doc.name}
                className="max-w-full max-h-96 rounded-xl object-contain shadow-xl" />
            </div>
          )}
          {isPDF && (
            <iframe src={`/uploads/${doc.filePath}`} className="w-full h-96 border-0" title={doc.name} />
          )}
          {isVideo && (
            <div className="p-4 bg-slate-900/50">
              <video controls className="w-full rounded-xl max-h-80">
                <source src={`/uploads/${doc.filePath}`} type={doc.mimeType} />
              </video>
            </div>
          )}
          {!isImage && !isPDF && !isVideo && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <MimeIcon size={48} className={`${mimeColor} mb-4 opacity-60`} />
              <p className="text-slate-400 text-sm">Pré-visualização não disponível para este tipo de arquivo.</p>
              <p className="text-slate-500 text-xs mt-1">Faça o download para visualizar.</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-700/50 space-y-3 flex-shrink-0">
          {doc.aiSummary && (
            <div className="flex gap-2 p-3 bg-violet-900/20 border border-violet-500/20 rounded-xl">
              <Sparkles size={13} className="text-violet-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-violet-200">{doc.aiSummary}</p>
            </div>
          )}
          {doc.description && (
            <p className="text-xs text-slate-400">{doc.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {doc.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><User size={11} />{doc.uploaderName || "—"}</div>
            <div className="flex items-center gap-1.5"><Calendar size={11} />{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</div>
            <div className="flex items-center gap-1.5"><HardDrive size={11} />{formatBytes(doc.fileSize)}</div>
          </div>
          <a href={`/uploads/${doc.filePath}`} download={doc.fileName}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-400 transition-colors">
            <Download size={14} /> Baixar Arquivo
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

function DocCard({ doc, onPreview, onDelete }: { doc: Document; onPreview: () => void; onDelete: () => void }) {
  const [menu, setMenu] = useState(false);
  const meta = getCatMeta(doc.category);
  const CatIcon = meta.icon;
  const { Icon: MimeIcon, color: mimeColor } = getMimeIcon(doc.mimeType);
  const isImage = doc.mimeType.startsWith("image/");

  return (
    <div className="bg-[#0f1623] border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-all group">
      {/* Thumbnail / icon area */}
      <div className={`h-28 flex items-center justify-center relative ${isImage ? "bg-slate-900" : meta.bg.replace("/40", "/20")}`}>
        {isImage ? (
          <img src={`/uploads/${doc.filePath}`} alt={doc.name}
            className="w-full h-full object-cover" />
        ) : (
          <MimeIcon size={36} className={`${mimeColor} opacity-60`} />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button onClick={onPreview}
            className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white hover:bg-white/20 transition-colors">
            <Eye size={14} />
          </button>
        </div>
        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md ${meta.bg} border border-slate-700/30 flex items-center gap-1`}>
          <CatIcon size={9} className={meta.color} />
          <span className={`text-[9px] font-bold uppercase ${meta.color}`}>{meta.label}</span>
        </div>
        {doc.aiSummary && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500/30 border border-violet-500/40 flex items-center justify-center" title="Analisado por IA">
            <Sparkles size={9} className="text-violet-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold text-white truncate leading-tight">{doc.name}</p>
          <div className="relative flex-shrink-0">
            <button onClick={() => setMenu(m => !m)}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-500 hover:text-white transition-colors">
              <MoreVertical size={12} />
            </button>
            {menu && (
              <div className="absolute right-0 top-6 z-10 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 w-36">
                <button onClick={() => { onPreview(); setMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white">
                  <Eye size={12} /> Visualizar
                </button>
                <a href={`/uploads/${doc.filePath}`} download={doc.fileName}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white">
                  <Download size={12} /> Baixar
                </a>
                <button onClick={() => { onDelete(); setMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300">
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            )}
          </div>
        </div>
        {doc.description && (
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{doc.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] text-slate-500">{formatBytes(doc.fileSize)}</span>
          <span className="text-[9px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {doc.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-slate-800 rounded-full text-[8px] text-slate-400">#{tag}</span>
            ))}
            {doc.tags.length > 3 && <span className="text-[8px] text-slate-500">+{doc.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface BibliotecaProps {
  events?: { id: string; name: string }[];
}

export default function BibliotecaDigital({ events = [] }: BibliotecaProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (search) params.set("q", search);
      const [docsRes, statsRes] = await Promise.all([
        authFetch(`/api/documents?${params}`),
        authFetch("/api/documents/stats")
      ]);
      if (docsRes.ok) setDocs(await docsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [activeCategory, search]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Excluir "${doc.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(doc.id);
    try {
      const res = await authFetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) { showToast("success", "Documento excluído."); fetchDocs(); }
      else { const d = await res.json(); showToast("error", d.error || "Erro ao excluir."); }
    } catch { showToast("error", "Erro de rede."); } finally { setDeleting(null); }
  };

  const catCount = (catId: string) => {
    if (!stats) return 0;
    if (catId === "all") return stats.total.count;
    const row = stats.byCategory.find(r => r.category === catId);
    return row ? parseInt(row.count) : 0;
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <FolderArchive size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Biblioteca Digital</h2>
            <p className="text-[11px] text-slate-400">
              {stats ? `${stats.total.count} documento${stats.total.count !== 1 ? "s" : ""} · ${formatBytes(stats.total.totalSize)} usados` : "Carregando..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDocs} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
            <Plus size={14} /> Enviar Documento
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total de Documentos", value: stats.total.count, icon: FolderOpen, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Armazenamento Usado", value: formatBytes(stats.total.totalSize), icon: HardDrive, color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { label: "Contratos & Alvarás", value: (catCount("contract") + catCount("license")), icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Fotos & Vídeos", value: (catCount("photo") + catCount("video")), icon: Image, color: "text-pink-400", bg: "bg-pink-500/10" },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1623] border border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category tabs + search */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
          {CATEGORIES.map(cat => {
            const count = catCount(cat.id);
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? `${cat.bg} ${cat.color} border border-slate-600`
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <CatIcon size={12} />
                {cat.label}
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/10" : "bg-slate-800"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full bg-[#0f1623] border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Document grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={28} className="animate-spin mb-3" />
          <p className="text-sm">Carregando documentos...</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <FolderOpen size={28} className="text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Nenhum documento encontrado</h3>
          <p className="text-xs text-slate-500 mb-4">
            {search ? "Tente outros termos de busca." : "Envie o primeiro documento para esta biblioteca."}
          </p>
          {!search && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-colors">
              <Upload size={13} /> Enviar Documento
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {docs.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              onPreview={() => setPreviewDoc(doc)}
              onDelete={() => handleDelete(doc)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { showToast("success", "Documento enviado com sucesso!"); fetchDocs(); }}
          events={events}
        />
      )}
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}
