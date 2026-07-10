export type Cargo = string;

export interface PreCandidato {
  id: string;
  nome: string;
  cargo: Cargo;
}

export interface AdminPreCandidato extends PreCandidato {
  ativo: boolean;
  ordem: number;
  criadoEm: string;
}
