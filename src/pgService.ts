/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PostgreSQL Database Service — PLAY+EVENTOS Enterprise V2.0
 * Replaces the JSON file-based db.json / dbService.ts
 */

import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("[PG] Unexpected pool error:", err.message);
    });
  }
  return pool;
}

export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const client = getPool();
  return client.query<T>(sql, params);
}

export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] ?? null;
}

export async function queryAll<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(sql, params);
  return result.rows;
}

export async function healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await query("SELECT 1");
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}
