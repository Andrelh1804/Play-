/**
 * PLAY+EVENTOS Enterprise — Frontend Auth Service
 * Manages JWT access tokens + refresh token rotation in localStorage
 */

const ACCESS_TOKEN_KEY  = "pe_access_token";
const REFRESH_TOKEN_KEY = "pe_refresh_token";
const USER_KEY          = "pe_user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function storeTokens(accessToken: string, refreshToken: string, user: AuthUser) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isTokenExpiredError(response: Response): boolean {
  return response.status === 401;
}

// ─── Authenticated fetch wrapper ──────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    const user = getStoredUser()!;
    storeTokens(data.accessToken, data.refreshToken, user);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });

  if (response.status !== 401) return response;

  // Token expired — attempt refresh
  if (isRefreshing) {
    return new Promise(resolve => {
      refreshQueue.push(async (newToken) => {
        if (!newToken) { resolve(response); return; }
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        resolve(fetch(url, { ...options, headers: retryHeaders }));
      });
    });
  }

  isRefreshing = true;
  const newToken = await refreshAccessToken();
  isRefreshing = false;
  refreshQueue.forEach(cb => cb(newToken));
  refreshQueue = [];

  if (!newToken) return response;

  const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
  return fetch(url, { ...options, headers: retryHeaders });
}

// ─── Login / Logout helpers ───────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Credenciais inválidas." };
    storeTokens(data.accessToken, data.refreshToken, data.user);
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: "Erro de conexão com o servidor." };
  }
}

export async function logout(refreshToken?: string): Promise<void> {
  const token = getAccessToken();
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ refreshToken: refreshToken || getRefreshToken() }),
    });
  } catch { /* non-fatal */ }
  clearTokens();
}
