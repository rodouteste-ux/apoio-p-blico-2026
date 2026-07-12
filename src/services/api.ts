import { env } from "@/config/env";
import { startMeasure } from "@/utils/perf";
import { getAdminAccessToken } from "./authService";

const API_URL = (env.apiUrl ?? "").trim();
const DEFAULT_TIMEOUT_MS = 15000;

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_URL ? `${API_URL.replace(/\/$/, "")}${normalizedPath}` : normalizedPath;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getFriendlyMessage(status: number) {
  if (status === 401) return "Sessao expirada. Entre novamente.";
  if (status === 403) return "Voce nao tem permissao para acessar este recurso.";
  if (status === 409) return "Este registro ja existe.";
  if (status >= 500) return "Servico temporariamente indisponivel. Tente novamente.";
  return "Nao foi possivel concluir a requisicao.";
}

function getApiLogName(path: string) {
  return path.replace(/^\/api\//, "").split("?")[0];
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { auth?: boolean; token?: string | null; timeoutMs?: number },
): Promise<T> {
  const token = init?.token ?? (init?.auth ? await getAdminAccessToken() : null);
  if (init?.auth && !token) {
    throw new ApiError("Autenticacao necessaria.", 401);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    init?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const abortFromCaller = () => controller.abort();
  init?.signal?.addEventListener("abort", abortFromCaller, { once: true });

  const { auth, token: _token, timeoutMs: _timeoutMs, signal: _signal, ...fetchInit } = init ?? {};
  const start = startMeasure();
  let status: number | null = null;
  let aborted = false;

  try {
    const response = await fetch(buildApiUrl(path), {
      ...fetchInit,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
    status = response.status;

    const contentType = response.headers.get("content-type");
    const text = await response.text();
    let payload: unknown = null;

    if (text && contentType?.includes("application/json")) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    } else if (text) {
      payload = { error: text };
    }

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : getFriendlyMessage(response.status);
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      aborted = true;
      throw new ApiError("Tempo de resposta excedido. Tente novamente.", 408);
    }
    throw new ApiError("Nao foi possivel conectar ao servidor. Tente novamente.", 0);
  } finally {
    const elapsed = Math.round(((typeof performance !== "undefined" ? performance.now() : Date.now()) - start) * 100) / 100;
    const apiName = getApiLogName(path);
    if (aborted) {
      console.log(`[front] ${apiName} fetch=abort reason=params_changed tempo=${elapsed}ms`);
    } else {
      console.log(`[front] ${apiName} fetch=real status=${status ?? 0} tempo=${elapsed}ms`);
    }
    init?.signal?.removeEventListener("abort", abortFromCaller);
    window.clearTimeout(timeout);
  }
}
