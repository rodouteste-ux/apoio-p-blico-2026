import type { AdminPreCandidato, Cargo } from "@/types/candidato";
import type { CadastrosResponse, DashboardMetric } from "@/types/cadastro";

import { ApiError } from "./api";
import { apiRequest } from "./api";

export interface CadastroPayload {
  nome: string;
  whatsapp: string;
  liderancaNome: string;
  cidadeMoradia: string;
  bairro: string;
  ruaNumero: string;
  localVotacao?: string;
  preCandidatos: string[];
  observacoes?: string;
}

export interface PreCandidatoOption {
  id: string;
  nome: string;
  cargo: Cargo;
  ordem: number;
}

export interface ResponsavelStatus {
  slug: string;
  ativo: boolean;
}

interface DashboardApiResponse {
  total_cadastros: number;
  cadastros_hoje: number;
  total_cidades: number;
  total_apoios: number;
  responsaveis_ativos: number;
  total_pre_candidatos_ativos: number;
  total_pre_candidatos_inativos: number;
  apoios_por_pre_candidato: Array<{
    nomePreCandidato: string;
    cargo: string;
    totalApoios: number;
    preCandidatoId: string | null;
  }>;
  ultimos_cadastros: CadastroApiItem[];
}

interface CadastroApiItem {
  id: string;
  nome_completo: string;
  telefone: string;
  telefone_normalizado?: string;
  lideranca_nome?: string | null;
  lideranca_slug?: string | null;
  cidade?: string | null;
  cidade_moradia?: string | null;
  bairro: string;
  rua_numero: string;
  local_votacao?: string | null;
  observacoes?: string | null;
  criado_em: string;
  apoios: Array<{
    id?: string;
    pre_candidato_id?: string | null;
    nome_pre_candidato: string;
    cargo: string;
  }>;
}

interface CadastrosApiResponse {
  data: CadastroApiItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  liderancas?: Array<{
    nome: string;
    slug: string;
  }>;
}

interface CadastroConfigResponse {
  ativo: boolean;
}

interface CadastroPublicoApiResponse {
  ativo: boolean;
  pre_candidatos: PreCandidatoOption[];
}

interface AdminPreCandidatoApiItem {
  id: string;
  nome: string;
  cargo: string;
  ativo: boolean;
  ordem: number;
  criado_em: string;
}

const PUBLIC_CACHE_TTL_MS = 2 * 60 * 1000;
const ADMIN_DASHBOARD_CACHE_TTL_MS = 30 * 1000;
const ADMIN_CADASTROS_CACHE_TTL_MS = 10 * 1000;
const ADMIN_PRE_CANDIDATOS_CACHE_TTL_MS = 60 * 1000;

let cadastroConfigCache: { data: CadastroConfigResponse; expiresAt: number } | null = null;
let cadastroConfigPromise: Promise<CadastroConfigResponse> | null = null;
let cadastroPublicoCache: { data: CadastroPublicoApiResponse; expiresAt: number } | null = null;
let cadastroPublicoPromise: Promise<CadastroPublicoApiResponse> | null = null;
let preCandidatosCache: { data: PreCandidatoOption[]; expiresAt: number } | null = null;
let preCandidatosPromise: Promise<PreCandidatoOption[]> | null = null;
let dashboardCache: { data: DashboardMetric; expiresAt: number } | null = null;
let dashboardPromise: Promise<DashboardMetric> | null = null;
let adminPreCandidatosCache: { data: AdminPreCandidato[]; expiresAt: number } | null = null;
let adminPreCandidatosPromise: Promise<AdminPreCandidato[]> | null = null;
const cadastrosCache = new Map<string, { data: CadastrosResponse; expiresAt: number }>();
const cadastrosInFlight = new Map<string, Promise<CadastrosResponse>>();

function getAdminLogName(path: string) {
  return path.replace(/^\/api\//, "").split("?")[0];
}

function logFrontCache(path: string, state: "hit" | "miss" | "stale") {
  console.log(`[front] ${getAdminLogName(path)} cache=${state} tempo=0ms`);
}

function logFrontInFlight(path: string) {
  console.log(`[front] ${getAdminLogName(path)} revalidate=skipped reason=in_flight`);
}

function logFrontRevalidate(path: string) {
  console.log(`[front] ${getAdminLogName(path)} revalidate=started`);
}

function requireToken(token: string | null | undefined) {
  if (!token) {
    throw new ApiError("Sessao expirada. Faca login novamente.", 401);
  }

  return token;
}

function mapCadastro(item: CadastroApiItem) {
  const cidadeMoradia = item.cidade_moradia || item.cidade || "";

  return {
    id: item.id,
    nomeCompleto: item.nome_completo,
    telefone: item.telefone,
    telefoneNormalizado: item.telefone_normalizado,
    liderancaNome: item.lideranca_nome || "Sem lideranca",
    liderancaSlug: item.lideranca_slug,
    cidade: cidadeMoradia,
    cidadeMoradia,
    bairro: item.bairro,
    ruaNumero: item.rua_numero,
    localVotacao: item.local_votacao || null,
    observacoes: item.observacoes,
    criadoEm: item.criado_em,
    apoios: item.apoios.map((apoio) => ({
      id: apoio.id,
      preCandidatoId: apoio.pre_candidato_id,
      nomePreCandidato: apoio.nome_pre_candidato,
      cargo: apoio.cargo,
    })),
  };
}

export function gerarSlugLideranca(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function enviarCadastro(data: CadastroPayload) {
  const liderancaNome = data.liderancaNome.trim();
  const localVotacao = data.localVotacao?.trim() || null;

  return apiRequest<{ success: true }>("/api/cadastros", {
    method: "POST",
    body: JSON.stringify({
      nome_completo: data.nome,
      telefone: data.whatsapp,
      lideranca_nome: liderancaNome,
      lideranca_slug: gerarSlugLideranca(liderancaNome),
      cidade_moradia: data.cidadeMoradia,
      bairro: data.bairro,
      rua_numero: data.ruaNumero,
      local_votacao: localVotacao,
      observacoes: data.observacoes,
      pre_candidatos: data.preCandidatos,
    }),
  });
}

export function buscarPreCandidatos() {
  if (preCandidatosCache && preCandidatosCache.expiresAt > Date.now()) {
    return Promise.resolve(preCandidatosCache.data);
  }
  if (preCandidatosPromise) return preCandidatosPromise;

  preCandidatosPromise = apiRequest<PreCandidatoOption[]>("/api/pre-candidatos", {
    timeoutMs: 8000,
  })
    .then((response) => {
      preCandidatosCache = { data: response, expiresAt: Date.now() + PUBLIC_CACHE_TTL_MS };
      return response;
    })
    .finally(() => {
      preCandidatosPromise = null;
    });

  return preCandidatosPromise;
}

export function buscarCadastroConfig() {
  if (cadastroConfigCache && cadastroConfigCache.expiresAt > Date.now()) {
    return Promise.resolve(cadastroConfigCache.data);
  }
  if (cadastroConfigPromise) return cadastroConfigPromise;

  cadastroConfigPromise = apiRequest<CadastroConfigResponse>("/api/cadastro-config", {
    timeoutMs: 8000,
  })
    .then((response) => {
      cadastroConfigCache = { data: response, expiresAt: Date.now() + PUBLIC_CACHE_TTL_MS };
      return response;
    })
    .finally(() => {
      cadastroConfigPromise = null;
    });

  return cadastroConfigPromise;
}

export function buscarCadastroPublico() {
  if (cadastroPublicoCache && cadastroPublicoCache.expiresAt > Date.now()) {
    return Promise.resolve(cadastroPublicoCache.data);
  }
  if (cadastroPublicoPromise) return cadastroPublicoPromise;

  cadastroPublicoPromise = apiRequest<CadastroPublicoApiResponse>("/api/cadastro-publico", {
    timeoutMs: 8000,
  })
    .then((response) => {
      cadastroPublicoCache = { data: response, expiresAt: Date.now() + PUBLIC_CACHE_TTL_MS };
      cadastroConfigCache = {
        data: { ativo: response.ativo },
        expiresAt: Date.now() + PUBLIC_CACHE_TTL_MS,
      };
      preCandidatosCache = {
        data: response.pre_candidatos,
        expiresAt: Date.now() + PUBLIC_CACHE_TTL_MS,
      };
      return response;
    })
    .finally(() => {
      cadastroPublicoPromise = null;
    });

  return cadastroPublicoPromise;
}

export function validarResponsavel(slug: string) {
  return apiRequest<ResponsavelStatus>(`/api/responsaveis/${slug}`);
}

export async function getAdminDashboard(token: string): Promise<DashboardMetric> {
  if (dashboardCache && dashboardCache.expiresAt > Date.now()) {
    logFrontCache("/api/admin/dashboard", "hit");
    return dashboardCache.data;
  }

  if (dashboardPromise) {
    logFrontInFlight("/api/admin/dashboard");
    return dashboardPromise;
  }

  logFrontCache("/api/admin/dashboard", dashboardCache ? "stale" : "miss");
  logFrontRevalidate("/api/admin/dashboard");
  dashboardPromise = apiRequest<DashboardApiResponse>("/api/admin/dashboard", {
    token: requireToken(token),
    timeoutMs: 15000,
  })
    .then((response) => ({
      totalCadastros: response.total_cadastros,
      cadastrosHoje: response.cadastros_hoje,
      totalCidades: response.total_cidades,
      totalApoios: response.total_apoios,
      responsaveisAtivos: response.responsaveis_ativos,
      totalPreCandidatosAtivos: response.total_pre_candidatos_ativos,
      totalPreCandidatosInativos: response.total_pre_candidatos_inativos,
      apoiosPorPreCandidato: response.apoios_por_pre_candidato.map((item) => ({
        nomePreCandidato: item.nomePreCandidato,
        cargo: item.cargo,
        totalApoios: item.totalApoios,
        preCandidatoId: item.preCandidatoId,
      })),
      ultimosCadastros: response.ultimos_cadastros.map(mapCadastro),
    }))
    .then((mapped) => {
      dashboardCache = {
        data: mapped,
        expiresAt: Date.now() + ADMIN_DASHBOARD_CACHE_TTL_MS,
      };
      return mapped;
    })
    .finally(() => {
      dashboardPromise = null;
    });

  return dashboardPromise;
}

export function prefetchAdminDashboard(token: string) {
  if (!token || (dashboardCache && dashboardCache.expiresAt > Date.now()) || dashboardPromise) {
    return;
  }

  void getAdminDashboard(token).catch((error) => {
    console.warn(
      "[front] admin/dashboard prefetch=failed",
      error instanceof Error ? error.message : String(error),
    );
  });
}

export async function getAdminCadastros(token: string, params: {
  search?: string;
  cidade?: string;
  lideranca?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<CadastrosResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.cidade && params.cidade !== "todas") searchParams.set("cidade", params.cidade);
  if (params.lideranca && params.lideranca !== "todas") {
    searchParams.set("lideranca", params.lideranca);
  }
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const path = `/api/admin/cadastros${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const cached = cadastrosCache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    logFrontCache(path, "hit");
    return cached.data;
  }

  if (cadastrosInFlight.has(path)) {
    logFrontInFlight(path);
    return cadastrosInFlight.get(path)!;
  }

  logFrontCache(path, cached ? "stale" : "miss");
  logFrontRevalidate(path);
  const request = apiRequest<CadastrosApiResponse>(path, {
    token: requireToken(token),
    timeoutMs: 15000,
  })
    .then((response) => {
      const mapped = {
        data: response.data.map(mapCadastro),
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        liderancas: response.liderancas ?? [],
      };
      cadastrosCache.set(path, {
        data: mapped,
        expiresAt: Date.now() + ADMIN_CADASTROS_CACHE_TTL_MS,
      });
      return mapped;
    })
    .finally(() => {
      cadastrosInFlight.delete(path);
    });

  cadastrosInFlight.set(path, request);
  return request;
}

function mapAdminPreCandidato(item: AdminPreCandidatoApiItem): AdminPreCandidato {
  return {
    id: item.id,
    nome: item.nome,
    cargo: item.cargo,
    ativo: item.ativo,
    ordem: item.ordem,
    criadoEm: item.criado_em,
  };
}

export async function getAdminPreCandidatos(token: string) {
  if (adminPreCandidatosCache && adminPreCandidatosCache.expiresAt > Date.now()) {
    logFrontCache("/api/admin/pre-candidatos", "hit");
    return adminPreCandidatosCache.data;
  }
  if (adminPreCandidatosPromise) {
    logFrontInFlight("/api/admin/pre-candidatos");
    return adminPreCandidatosPromise;
  }

  logFrontCache("/api/admin/pre-candidatos", adminPreCandidatosCache ? "stale" : "miss");
  logFrontRevalidate("/api/admin/pre-candidatos");
  adminPreCandidatosPromise = apiRequest<AdminPreCandidatoApiItem[]>("/api/admin/pre-candidatos", {
    token: requireToken(token),
    timeoutMs: 15000,
  })
    .then((response) => {
      const mapped = response.map(mapAdminPreCandidato);
      adminPreCandidatosCache = {
        data: mapped,
        expiresAt: Date.now() + ADMIN_PRE_CANDIDATOS_CACHE_TTL_MS,
      };
      return mapped;
    })
    .finally(() => {
      adminPreCandidatosPromise = null;
    });

  return adminPreCandidatosPromise;
}

export async function createAdminPreCandidato(token: string, payload: {
  nome: string;
  cargo: string;
  ativo: boolean;
  ordem: number;
}) {
  const response = await apiRequest<AdminPreCandidatoApiItem>("/api/admin/pre-candidatos", {
    method: "POST",
    token: requireToken(token),
    timeoutMs: 15000,
    body: JSON.stringify(payload),
  });
  const mapped = mapAdminPreCandidato(response);
  adminPreCandidatosCache = null;
  dashboardCache = null;
  return mapped;
}

export async function updateAdminPreCandidato(
  token: string,
  id: string,
  payload: {
    nome: string;
    cargo: string;
    ativo: boolean;
    ordem: number;
  },
) {
  const response = await apiRequest<AdminPreCandidatoApiItem>(`/api/admin/pre-candidatos/${id}`, {
    method: "PUT",
    token: requireToken(token),
    timeoutMs: 15000,
    body: JSON.stringify(payload),
  });
  const mapped = mapAdminPreCandidato(response);
  adminPreCandidatosCache = null;
  dashboardCache = null;
  return mapped;
}

export async function toggleAdminPreCandidato(token: string, id: string, ativo: boolean) {
  const response = await apiRequest<AdminPreCandidatoApiItem>(
    `/api/admin/pre-candidatos/${id}/status`,
    {
      method: "PATCH",
      token: requireToken(token),
      timeoutMs: 15000,
      body: JSON.stringify({ ativo }),
    },
  );
  const mapped = mapAdminPreCandidato(response);
  adminPreCandidatosCache = null;
  dashboardCache = null;
  return mapped;
}

export async function updateAdminPreCandidatoOrdem(token: string, id: string, ordem: number) {
  const response = await apiRequest<AdminPreCandidatoApiItem>(
    `/api/admin/pre-candidatos/${id}/ordem`,
    {
      method: "PATCH",
      token: requireToken(token),
      timeoutMs: 15000,
      body: JSON.stringify({ ordem }),
    },
  );
  const mapped = mapAdminPreCandidato(response);
  adminPreCandidatosCache = null;
  dashboardCache = null;
  return mapped;
}
