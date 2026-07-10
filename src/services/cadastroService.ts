import type { AdminPreCandidato, Cargo } from "@/types/candidato";
import type { CadastrosResponse, DashboardMetric } from "@/types/cadastro";

import { apiRequest } from "./api";

export interface CadastroPayload {
  nome: string;
  whatsapp: string;
  cpf: string;
  cidade: string;
  bairro: string;
  ruaNumero: string;
  localVotacao: string;
  preCandidatos: string[];
  observacoes?: string;
  responsavelSlug?: string;
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
  cpf_mascarado: string;
  cidade: string;
  bairro: string;
  rua_numero: string;
  local_votacao: string;
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
}

interface CadastroConfigResponse {
  ativo: boolean;
}

interface AdminPreCandidatoApiItem {
  id: string;
  nome: string;
  cargo: string;
  ativo: boolean;
  ordem: number;
  criado_em: string;
}

function mapCadastro(item: CadastroApiItem) {
  return {
    id: item.id,
    nomeCompleto: item.nome_completo,
    telefone: item.telefone,
    telefoneNormalizado: item.telefone_normalizado,
    cpfMascarado: item.cpf_mascarado,
    cidade: item.cidade,
    bairro: item.bairro,
    ruaNumero: item.rua_numero,
    localVotacao: item.local_votacao,
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

export async function enviarCadastro(data: CadastroPayload) {
  return apiRequest<{ success: true }>("/api/cadastros", {
    method: "POST",
    body: JSON.stringify({
      slug: data.responsavelSlug,
      nome_completo: data.nome,
      telefone: data.whatsapp,
      cpf: data.cpf,
      cidade: data.cidade,
      bairro: data.bairro,
      rua_numero: data.ruaNumero,
      local_votacao: data.localVotacao,
      observacoes: data.observacoes,
      pre_candidatos: data.preCandidatos,
    }),
  });
}

export function buscarPreCandidatos() {
  return apiRequest<PreCandidatoOption[]>("/api/pre-candidatos");
}

export function buscarCadastroConfig() {
  return apiRequest<CadastroConfigResponse>("/api/cadastro-config");
}

export function validarResponsavel(slug: string) {
  return apiRequest<ResponsavelStatus>(`/api/responsaveis/${slug}`);
}

export async function buscarDashboard(): Promise<DashboardMetric> {
  const response = await apiRequest<DashboardApiResponse>("/api/admin/dashboard", {
    auth: true,
  });

  return {
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
  };
}

export async function buscarCadastros(params: {
  search?: string;
  cidade?: string;
  page?: number;
  limit?: number;
}): Promise<CadastrosResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.cidade && params.cidade !== "todas") searchParams.set("cidade", params.cidade);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await apiRequest<CadastrosApiResponse>(
    `/api/admin/cadastros${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    { auth: true },
  );

  return {
    data: response.data.map(mapCadastro),
    page: response.page,
    limit: response.limit,
    total: response.total,
    totalPages: response.totalPages,
  };
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

export async function buscarAdminPreCandidatos() {
  const response = await apiRequest<AdminPreCandidatoApiItem[]>("/api/admin/pre-candidatos", {
    auth: true,
  });
  return response.map(mapAdminPreCandidato);
}

export async function criarAdminPreCandidato(payload: {
  nome: string;
  cargo: string;
  ativo: boolean;
  ordem: number;
}) {
  const response = await apiRequest<AdminPreCandidatoApiItem>("/api/admin/pre-candidatos", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return mapAdminPreCandidato(response);
}

export async function atualizarAdminPreCandidato(
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
    auth: true,
    body: JSON.stringify(payload),
  });
  return mapAdminPreCandidato(response);
}

export async function atualizarStatusPreCandidato(id: string, ativo: boolean) {
  const response = await apiRequest<AdminPreCandidatoApiItem>(
    `/api/admin/pre-candidatos/${id}/status`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ ativo }),
    },
  );
  return mapAdminPreCandidato(response);
}

export async function atualizarOrdemPreCandidato(id: string, ordem: number) {
  const response = await apiRequest<AdminPreCandidatoApiItem>(
    `/api/admin/pre-candidatos/${id}/ordem`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ ordem }),
    },
  );
  return mapAdminPreCandidato(response);
}
