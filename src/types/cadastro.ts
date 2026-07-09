export interface Cadastro {
  id: string;
  nome: string;
  whatsapp: string;
  cpf: string;
  cidade: string;
  bairro: string;
  ruaNumero: string;
  localVotacao: string;
  preCandidatos: string[];
  observacoes?: string;
  responsavelId: string;
  criadoEm: string;
}
