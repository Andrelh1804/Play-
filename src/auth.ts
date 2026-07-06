/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * JWT Authentication & RBAC Middleware — PLAY+EVENTOS Enterprise V2.0
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { query, queryOne } from "./pgService.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "playeventos-enterprise-secret-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "playeventos-refresh-secret-change-in-production";
const ACCESS_TOKEN_TTL = "2h";
const REFRESH_TOKEN_TTL_DAYS = 30;

// Role hierarchy (higher index = more permissions)
export const ROLES = ["VIEWER", "STAFF", "COORDINATOR", "PRODUCER", "ADMIN", "SUPER_ADMIN"] as const;
export type UserRole = typeof ROLES[number];

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  name: string;
}

// ─── Token generation ────────────────────────────────────────────────────────

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export async function storeRefreshToken(userId: string, rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()]
  );
}

export async function validateRefreshToken(rawToken: string): Promise<{ userId: string } | null> {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const row = await queryOne<{ user_id: string; expires_at: Date; revoked: boolean }>(
    `SELECT user_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash]
  );

  if (!row || row.revoked || new Date(row.expires_at) < new Date()) return null;
  return { userId: row.user_id };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  await query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [tokenHash]);
}

// ─── Password helpers ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação não fornecido." });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expirado. Faça login novamente.", code: "TOKEN_EXPIRED" });
    } else {
      res.status(401).json({ error: "Token inválido." });
    }
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado." });
      return;
    }
    const userRoleIndex = ROLES.indexOf(req.user.role);
    const hasPermission = roles.some(r => {
      const requiredIndex = ROLES.indexOf(r);
      return userRoleIndex >= requiredIndex;
    });

    if (!hasPermission) {
      res.status(403).json({
        error: `Permissão insuficiente. Requer: ${roles.join(" ou ")}. Seu perfil: ${req.user.role}`
      });
      return;
    }
    next();
  };
}

// Tenant isolation: ensures the user can only access their own tenant's data
export function requireTenant(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  // SUPER_ADMIN can access all tenants
  if (req.user.role === "SUPER_ADMIN") {
    next();
    return;
  }
  next();
}

// ─── Auth routes handler (exported for use in server.ts) ─────────────────────

export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "E-mail e senha são obrigatórios." });
      return;
    }

    const user = await queryOne<{
      id: string; tenant_id: string; name: string; email: string;
      password_hash: string; role: string; active: boolean;
    }>(
      `SELECT id, tenant_id, name, email, password_hash, role, active
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase().trim()]
    );

    if (!user || !user.active) {
      res.status(401).json({ error: "Credenciais inválidas ou usuário inativo." });
      return;
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Credenciais inválidas ou usuário inativo." });
      return;
    }

    // Update last_login
    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

    const payload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
    };

    const accessToken = generateAccessToken(payload);
    const rawRefreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, rawRefreshToken);

    res.json({
      accessToken,
      refreshToken: rawRefreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleRefreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token não fornecido." });
      return;
    }

    const tokenData = await validateRefreshToken(refreshToken);
    if (!tokenData) {
      res.status(401).json({ error: "Refresh token inválido ou expirado." });
      return;
    }

    const user = await queryOne<{
      id: string; tenant_id: string; name: string; email: string; role: string; active: boolean;
    }>(
      `SELECT id, tenant_id, name, email, role, active FROM users WHERE id = $1`,
      [tokenData.userId]
    );

    if (!user || !user.active) {
      res.status(401).json({ error: "Usuário inativo ou não encontrado." });
      return;
    }

    // Rotate: revoke old, issue new
    await revokeRefreshToken(refreshToken);
    const payload: JWTPayload = {
      userId: user.id, tenantId: user.tenant_id,
      email: user.email, role: user.role as UserRole, name: user.name
    };
    const newAccessToken = generateAccessToken(payload);
    const newRawRefresh = generateRefreshToken();
    await storeRefreshToken(user.id, newRawRefresh);

    res.json({ accessToken: newAccessToken, refreshToken: newRawRefresh });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleLogout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.json({ message: "Logout realizado com sucesso." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
