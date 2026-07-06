/**
 * PLAY+EVENTOS Enterprise — Login Page Component
 * Professional enterprise login with JWT auth
 */

import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, Building2, Shield } from "lucide-react";
const logo = "/src/assets/images/logo.jpg";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("admin@eventflow.com.br");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true);
    setError("");
    const result = await onLogin(email.trim(), password);
    if (!result.success) {
      setError(result.error || "Credenciais inválidas.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src={logo} alt="PLAY+EVENTOS" className="w-10 h-10 rounded-lg object-cover shadow-lg" onError={(e) => (e.currentTarget.style.display = "none")} />
              <div className="text-left">
                <h1 className="text-white font-bold text-xl tracking-tight">PLAY+EVENTOS</h1>
                <p className="text-blue-200 text-xs font-medium">Enterprise Platform V2.0</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Shield size={14} className="text-blue-200" />
              <span className="text-blue-100 text-xs">Acesso Seguro · JWT · RBAC</span>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-white text-xl font-semibold">Bem-vindo de volta</h2>
              <p className="text-slate-400 text-sm mt-1">Faça login para acessar a plataforma corporativa</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">E-mail Corporativo</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@eventflow.com.br"
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-semibold rounded-lg py-3 text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Entrar na Plataforma
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Building2 size={14} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-blue-300 text-xs font-semibold mb-1">Credenciais de Demonstração</p>
                  <p className="text-slate-400 text-xs">
                    <span className="text-slate-300">Admin:</span> admin@eventflow.com.br
                  </p>
                  <p className="text-slate-400 text-xs">
                    <span className="text-slate-300">Senha:</span> Admin@123
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          PLAY+EVENTOS Enterprise V2.0 · Powered by PostgreSQL + JWT
        </p>
      </div>
    </div>
  );
}
