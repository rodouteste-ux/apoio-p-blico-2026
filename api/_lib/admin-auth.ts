import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "./env";
import { json } from "./http";
import { getSupabaseServerClient } from "./supabase";

export interface AdminIdentity {
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
let supabaseTokenClient: ReturnType<typeof createClient> | null = null;
const adminProfileCache = new Map<string, { identity: AdminIdentity; expiresAt: number }>();

export class AdminAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

function getBearerToken(req: any) {
  const header = req.headers.authorization ?? req.headers.Authorization;
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

function getSupabaseTokenClient() {
  if (supabaseTokenClient) {
    return supabaseTokenClient;
  }

  supabaseTokenClient = createClient(getServerEnv("SUPABASE_URL"), getServerEnv("SUPABASE_ANON_KEY"), {
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

async function findAdminByUserId(userId: string) {
  const supabase = getSupabaseServerClient();

  const result = await supabase
    .from("admin_users")
    .select("id, user_id, email, nome, role, ativo")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    console.error("Erro ao buscar admin_users:", result.error);
    throw new AdminAuthError(500, "Erro interno ao validar administrador.");
  }

  return result.data;
}

async function findAdminByEmail(email: string) {
  const supabase = getSupabaseServerClient();

  const result = await supabase
    .from("admin_users")
    .select("id, user_id, email, nome, role, ativo")
    .eq("email", email)
    .maybeSingle();

  if (result.error) {
    console.error("Erro ao buscar admin_users por email:", result.error);
    throw new AdminAuthError(500, "Erro interno ao validar administrador.");
  }

  return result.data;
}

export async function requireAdmin(req: any, context = "[api/admin]") {
  const totalStart = Date.now();
  const token = getBearerToken(req);
  if (!token) {
    console.warn(`[admin auth] token ausente em ${context}`);
    throw new AdminAuthError(401, "Token de autenticacao nao informado.");
  }

  const tokenStart = Date.now();
  const { data, error } = await validateUserToken(token);
  const getUserMs = Date.now() - tokenStart;
  console.log(`${context} getUser:`, getUserMs, "ms");
  console.log("[requireAdmin] getUser:", getUserMs, "ms");

  if (error || !data.user?.id || !data.user.email) {
    console.warn("Erro ao validar token admin:", error?.message ?? "usuario ausente");
    throw new AdminAuthError(401, "Sessao invalida ou expirada.");
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
  let adminUser = await findAdminByUserId(data.user.id);
  const adminUsersMs = Date.now() - adminStart;
  console.log(`${context} admin_users:`, adminUsersMs, "ms");
  console.log("[requireAdmin] admin_users:", adminUsersMs, "ms");

  if (!adminUser) {
    const emailStart = Date.now();
    adminUser = await findAdminByEmail(data.user.email);
    const emailFallbackMs = Date.now() - emailStart;
    console.log(`${context} admin_users email fallback:`, emailFallbackMs, "ms");
    console.log("[requireAdmin] admin_users email fallback:", emailFallbackMs, "ms");
  }

  if (!adminUser || !adminUser.ativo) {
    throw new AdminAuthError(403, "Usuario sem permissao para acessar o painel administrativo.");
  }

  const identity = {
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
    return json(res, error.status, { error: error.message });
  }

  console.error(`Erro em ${context}:`, error);
  return json(res, 500, { error: "Erro interno ao validar administrador." });
}
