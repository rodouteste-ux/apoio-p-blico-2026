export interface Apoio {
  id?: string;
  preCandidatoId?: string | null;
  nomePreCandidato: string;
  cargo: string;
}

export interface Cadastro {
  id: string;
  nomeCompleto: string;
  telefone: string;
  telefoneNormalizado?: string;
  liderancaNome: string;
  liderancaSlug?: string | null;
  cidade: string;
  cidadeMoradia: string;
  bairro: string;
  ruaNumero: string;
  localVotacao?: string | null;
  observacoes?: string | null;
  criadoEm: string;
  apoios: Apoio[];
}

export interface DashboardMetric {
  totalCadastros: number;
  cadastrosHoje: number;
  totalCidades: number;
  totalApoios: number;
  responsaveisAtivos: number;
  totalPreCandidatosAtivos?: number;
  totalPreCandidatosInativos?: number;
  apoiosPorPreCandidato: Array<
    Apoio & {
      totalApoios: number;
    }
  >;
  ultimosCadastros: Cadastro[];
}

export interface CadastrosResponse {
  data: Cadastro[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  liderancas: Array<{
    nome: string;
    slug: string;
  }>;
}
