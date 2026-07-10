import { env } from "@/config/env";
import { getAdminAccessToken } from "./authService";

const API_URL = (env.apiUrl ?? "").trim();

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

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const token = init?.auth ? await getAdminAccessToken() : null;
  if (init?.auth && !token) {
    throw new ApiError("Autenticacao necessaria.", 401);
  }

  const response = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const contentType = response.headers.get("content-type");
  const text = await response.text();
  const payload =
    text && contentType?.includes("application/json")
      ? (JSON.parse(text) as Record<string, unknown>)
      : null;

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : "Nao foi possivel concluir a requisicao.";
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
