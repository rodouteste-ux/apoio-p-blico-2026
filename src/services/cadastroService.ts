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
  responsavelSlug: string;
}

// TODO: substituir por chamada real ao backend Supabase/Vercel depois
export async function enviarCadastro(data: CadastroPayload) {
  console.log("Cadastro enviado:", data);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { success: true as const };
}
