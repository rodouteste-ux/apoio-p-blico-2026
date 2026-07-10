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
  return createClient(getServerEnv("SUPABASE_URL"), getServerEnv("SUPABASE_ANON_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function validateUserToken(token: string) {
  return getSupabaseTokenClient().auth.getUser(token);
}

async function findAdminByUserId(userId: string) {
  const supabase = getSupabaseServerClient();

  const result = await supabase
    .from("admin_users")
    .select("user_id, email, nome, role, ativo")
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
    .select("user_id, email, nome, role, ativo")
    .eq("email", email)
    .maybeSingle();

  if (result.error) {
    console.error("Erro ao buscar admin_users:", result.error);
    throw new AdminAuthError(500, "Erro interno ao validar administrador.");
  }

  return result.data;
}

export async function requireAdmin(req: any) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AdminAuthError(401, "Token de autenticacao nao informado.");
  }

  const { data, error } = await validateUserToken(token);
  if (error || !data.user?.id || !data.user.email) {
    console.error("Erro ao validar token admin:", error);
    throw new AdminAuthError(401, "Sessao invalida ou expirada.");
  }

  const adminByUserId = await findAdminByUserId(data.user.id);
  const adminUser = adminByUserId ?? (await findAdminByEmail(data.user.email));

  if (!adminUser || !adminUser.ativo) {
    throw new AdminAuthError(403, "Usuario sem permissao para acessar o painel administrativo.");
  }

  return {
    userId: adminUser.user_id,
    email: adminUser.email,
    nome: adminUser.nome,
    role: adminUser.role,
    ativo: adminUser.ativo,
  } satisfies AdminIdentity;
}

export function handleAdminAuthError(res: any, error: unknown, context: string) {
  if (error instanceof AdminAuthError) {
    return json(res, error.status, { error: error.message });
  }

  console.error(`Erro em ${context}:`, error);
  return json(res, 500, { error: "Erro interno ao validar administrador." });
}
