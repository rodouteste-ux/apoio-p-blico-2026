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
  cpfMascarado: string;
  cidade: string;
  bairro: string;
  ruaNumero: string;
  localVotacao: string;
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
}
