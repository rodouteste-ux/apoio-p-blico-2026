import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";
import { json } from "./http";
import { getSupabaseServerClient } from "./supabase";
import type { Database } from "../../src/types/database";

export interface AdminIdentity {
  adminId: string;
  userId: string;
  email: string;
  nome?: string | null;
  role: "super_admin" | "admin" | "visualizador";
  ativo: boolean;
}

function logDuration(label: string, start: number) {
  console.log(`${label}:`, Date.now() - start, "ms");
}

const ADMIN_CACHE_TTL_MS = 60 * 1000;
type AdminUser = {
  id: string;
  user_id: string;
  email: string;
  nome: string | null;
  role: AdminIdentity["role"];
  ativo: boolean;
};

let supabaseTokenClient: SupabaseClient<Database> | null = null;
const adminProfileCache = new Map<string, { identity: AdminIdentity; expiresAt: number }>();

export class AdminAuthError extends Error {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
    this.details = details;
  }
}

function getBearerToken(req: any, context: string) {
  const header = req.headers.authorization ?? req.headers.Authorization;
  if (!header || typeof header !== "string") {
    console.error(`${context} token ausente`);
    throw new AdminAuthError(401, "Token ausente.");
  }

  if (!header.startsWith("Bearer ")) {
    console.error(`${context} formato de token inválido`);
    throw new AdminAuthError(401, "Formato de token inválido.");
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    console.error(`${context} token ausente`);
    throw new AdminAuthError(401, "Token ausente.");
  }

  return token;
}

function getSupabaseTokenClient() {
  if (supabaseTokenClient) {
    return supabaseTokenClient;
  }

  const envResult = getSupabaseEnv();
  if (!envResult.ok) {
    throw new AdminAuthError(500, "Configuração do servidor incompleta.", envResult.missing.join(", "));
  }

  supabaseTokenClient = createClient<Database>(envResult.env.SUPABASE_URL, envResult.env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseTokenClient;
}

async function validateUserToken(token: string) {
  return getSupabaseTokenClient().auth.getUser(token);
}

async function findAdminByUserId(userId: string, context: string) {
  const supabase = getSupabaseServerClient();

  const result = await supabase
    .from("admin_users")
    .select("id, user_id, email, nome, role, ativo")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    console.error(`${context} supabase error`, result.error.message);
    throw new AdminAuthError(500, "Erro ao buscar administrador.", result.error.message);
  }

  return result.data satisfies AdminUser | null;
}

async function findAdminByEmail(email: string, context: string) {
  const supabase = getSupabaseServerClient();

  const result = await supabase
    .from("admin_users")
    .select("id, user_id, email, nome, role, ativo")
    .eq("email", email)
    .maybeSingle();

  if (result.error) {
    console.error(`${context} supabase error`, result.error.message);
    throw new AdminAuthError(500, "Erro ao buscar administrador.", result.error.message);
  }

  return result.data satisfies AdminUser | null;
}

export async function requireAdmin(req: any, context = "[api/admin]") {
  const totalStart = Date.now();
  const token = getBearerToken(req, context);

  const tokenStart = Date.now();
  const { data, error } = await validateUserToken(token);
  const getUserMs = Date.now() - tokenStart;
  console.log(`${context} getUser:`, getUserMs, "ms");
  console.log("[requireAdmin] getUser:", getUserMs, "ms");

  if (error || !data.user?.id || !data.user.email) {
    console.error(`${context} token inválido`, error?.message ?? "usuario ausente");
    throw new AdminAuthError(401, "Token inválido ou expirado.");
  }

  const cached = adminProfileCache.get(data.user.id);
  if (cached && cached.expiresAt > Date.now()) {
    console.log("[requireAdmin] cache hit:", true);
    console.log(`${context} admin_users:`, 0, "ms");
    logDuration("[requireAdmin] total", totalStart);
    logDuration(`${context} auth total`, totalStart);
    return cached.identity;
  }

  console.log("[requireAdmin] cache hit:", false);

  const adminStart = Date.now();
  let adminUser = await findAdminByUserId(data.user.id, context);
  const adminUsersMs = Date.now() - adminStart;
  console.log(`${context} admin_users:`, adminUsersMs, "ms");
  console.log("[requireAdmin] admin_users:", adminUsersMs, "ms");

  if (!adminUser) {
    const emailStart = Date.now();
    adminUser = await findAdminByEmail(data.user.email, context);
    const emailFallbackMs = Date.now() - emailStart;
    console.log(`${context} admin_users email fallback:`, emailFallbackMs, "ms");
    console.log("[requireAdmin] admin_users email fallback:", emailFallbackMs, "ms");
  }

  if (!adminUser) {
    console.error(`${context} usuário sem permissão`, data.user.email);
    throw new AdminAuthError(403, "Usuário sem permissão administrativa.");
  }

  if (!adminUser.ativo) {
    console.error(`${context} usuário sem permissão`, data.user.email);
    throw new AdminAuthError(403, "Administrador inativo.");
  }

  const identity = {
    adminId: adminUser.id,
    userId: adminUser.user_id,
    email: adminUser.email,
    nome: adminUser.nome,
    role: adminUser.role,
    ativo: adminUser.ativo,
  } satisfies AdminIdentity;

  logDuration("[requireAdmin] total", totalStart);
  logDuration(`${context} auth total`, totalStart);
  adminProfileCache.set(data.user.id, { identity, expiresAt: Date.now() + ADMIN_CACHE_TTL_MS });
  return identity;
}

export function handleAdminAuthError(res: any, error: unknown, context: string) {
  if (error instanceof AdminAuthError) {
    const payload: { error: string; details?: string } = { error: error.message };
    if (error.details) {
      payload.details = error.details;
    }

    return json(res, error.status, payload);
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(`Erro em ${context}:`, details);
  return json(res, 500, {
    error: "Erro interno ao validar administrador.",
    details,
  });
}
