export type Cargo =
  | "Governador do Estado"
  | "Primeiro Senador"
  | "Segundo Senador"
  | "Deputado Federal"
  | "Deputado Estadual";

export interface PreCandidato {
  id: string;
  nome: string;
  cargo: Cargo;
}
