import type { Session } from "@supabase/supabase-js";

import { env } from "@/config/env";
import { supabaseClient } from "@/lib/supabase/client";
import type { AdminSession } from "@/types/auth";
import { logMeasure, startMeasure } from "@/utils/perf";

const ADMIN_SESSION_KEY = "admin-session";
const API_URL = (env.apiUrl ?? "").trim();
const ADMIN_PROFILE_TIMEOUT_MS = 15000;

let cachedAdminSession: AdminSession | null = null;
let sessionLoadPromise: Promise<AdminSession | null> | null = null;

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
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ADMIN_PROFILE_TIMEOUT_MS);
  const start = startMeasure();

  try {
    const requestStart = startMeasure();
    const response = await fetch(`${API_URL ? API_URL.replace(/\/$/, "") : ""}/api/admin/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
    logMeasure("[front] chamada /api/admin/me", requestStart);

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as AdminMeResponse & { error?: string }) : null;
    if (!response.ok) {
      const error = new Error(payload?.error ?? "Nao foi possivel validar o acesso administrativo.");
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return payload as AdminMeResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error("Tempo de resposta excedido. Tente novamente.");
      (timeoutError as Error & { status?: number }).status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    logMeasure("[front] validacao sessao admin", start);
    window.clearTimeout(timeout);
  }
}

export function readStoredAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    cachedAdminSession = JSON.parse(raw) as AdminSession;
    return cachedAdminSession;
  } catch {
    return null;
  }
}

function storeAdminSession(session: AdminSession | null) {
  if (typeof window === "undefined") return;

  if (!session) {
    cachedAdminSession = null;
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return;
  }

  cachedAdminSession = session;
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
  if (sessionLoadPromise) {
    return sessionLoadPromise;
  }

  sessionLoadPromise = loadAdminSession();
  try {
    return await sessionLoadPromise;
  } finally {
    sessionLoadPromise = null;
  }
}

async function loadAdminSession() {
  const sessionStart = startMeasure();
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  logMeasure("[front] supabase.auth.getSession", sessionStart);

  if (!session) {
    storeAdminSession(null);
    return null;
  }

  const cached = cachedAdminSession ?? readStoredAdminSession();
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
  if (cachedAdminSession?.accessToken) {
    return cachedAdminSession.accessToken;
  }

  const stored = readStoredAdminSession();
  if (stored?.accessToken) {
    return stored.accessToken;
  }

  const {
    data: { session: supabaseSession },
  } = await supabaseClient.auth.getSession();

  const adminSession = await getAdminSession();
  return adminSession?.accessToken ?? supabaseSession?.access_token ?? null;
}
