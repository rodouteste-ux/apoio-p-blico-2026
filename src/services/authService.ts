import type { Session } from "@supabase/supabase-js";

import { env } from "@/config/env";
import { supabaseClient } from "@/lib/supabase/client";
import type { AdminSession } from "@/types/auth";

const ADMIN_SESSION_KEY = "admin-session";
const API_URL = (env.apiUrl ?? "").trim();

interface AdminMeResponse {
  user: {
    id: string;
    email: string;
    nome?: string | null;
    role: "super_admin" | "admin" | "visualizador";
    ativo: boolean;
  };
}

function mapSession(session: Session, profile: AdminMeResponse): AdminSession {
  return {
    accessToken: session.access_token,
    email: profile.user.email,
    userId: profile.user.id,
    role: profile.user.role,
    nome: profile.user.nome,
  };
}

function toFriendlySignInMessage(error: { message?: string; status?: number; code?: string } | null) {
  const normalizedMessage = error?.message?.toLowerCase() ?? "";
  const normalizedCode = error?.code?.toLowerCase() ?? "";

  if (
    normalizedCode.includes("invalid_credentials") ||
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials") ||
    normalizedMessage.includes("email not confirmed") === false &&
    normalizedMessage.includes("invalid") &&
    normalizedMessage.includes("credential")
  ) {
    return "E-mail ou senha invalidos.";
  }

  if (
    normalizedCode.includes("email_not_confirmed") ||
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("confirm your email")
  ) {
    return "Confirme seu e-mail antes de acessar.";
  }

  return "Nao foi possivel entrar agora. Tente novamente.";
}

async function fetchAdminProfile(accessToken: string) {
  const response = await fetch(
    `${API_URL ? API_URL.replace(/\/$/, "") : ""}/api/admin/me`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as AdminMeResponse & { error?: string }) : null;
  if (!response.ok) {
    const error = new Error(payload?.error ?? "Nao foi possivel validar o acesso administrativo.");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return payload as AdminMeResponse;
}

export function readStoredAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

function storeAdminSession(session: AdminSession | null) {
  if (typeof window === "undefined") return;

  if (!session) {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return;
  }

  window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    const signInError = new Error(
      toFriendlySignInMessage(
        error
          ? {
              message: error.message,
              status: error.status,
              code: "code" in error && typeof error.code === "string" ? error.code : undefined,
            }
          : null,
      ),
    );
    (signInError as Error & { status?: number }).status = 401;
    throw signInError;
  }

  try {
    const profile = await fetchAdminProfile(data.session.access_token);

    const session = mapSession(data.session, profile);
    storeAdminSession(session);
    return session;
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 403) {
      await supabaseClient.auth.signOut();
      storeAdminSession(null);
      throw new Error("Usuario sem permissao para acessar o painel administrativo.");
    }

    if (status === 401) {
      await supabaseClient.auth.signOut();
      storeAdminSession(null);
      throw new Error("Sessao invalida ou expirada.");
    }

    throw new Error("Nao foi possivel validar seu acesso administrativo agora.");
  }
}

export async function signOutAdmin() {
  storeAdminSession(null);
  await supabaseClient.auth.signOut();
}

export async function getAdminSession() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    storeAdminSession(null);
    return null;
  }

  const cached = readStoredAdminSession();
  if (cached && cached.accessToken === session.access_token) {
    return cached;
  }

  try {
    const profile = await fetchAdminProfile(session.access_token);

    const adminSession = mapSession(session, profile);
    storeAdminSession(adminSession);
    return adminSession;
  } catch (error) {
    storeAdminSession(null);
    const status = (error as Error & { status?: number }).status;
    if (status === 401 || status === 403) {
      await supabaseClient.auth.signOut();
      return null;
    }

    throw error;
  }
}

export async function getAdminAccessToken() {
  const session = await getAdminSession();
  return session?.accessToken ?? null;
}
