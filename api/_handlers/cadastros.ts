import { z } from "zod";

import { invalidateDashboardCache } from "../_lib/admin-cache.js";
import { getCadastroConfig } from "../_lib/cadastro-config.js";
import { getSupabaseServerClient } from "../_lib/supabase.js";
import { getOriginIp, json, methodNotAllowed, readJsonBody } from "../_lib/http.js";
import { normalizePhone } from "../_lib/personal-data.js";

const cadastroSchema = z.object({
  nome_completo: z.string().trim().min(3),
  telefone: z.string().trim().min(10),
  lideranca_nome: z.string().trim().min(3),
  lideranca_slug: z.string().trim().optional().or(z.literal("")),
  cidade_moradia: z.string().trim().min(1),
  cidade_votacao: z.string().trim().optional().nullable().or(z.literal("")),
  bairro: z.string().trim().min(2),
  rua_numero: z.string().trim().min(3),
  local_votacao: z.string().trim().optional().nullable().or(z.literal("")),
  observacoes: z.string().trim().max(500).optional().or(z.literal("")),
  pre_candidatos: z.array(z.string().refine((value) => value.startsWith("mock-") || z.string().uuid().safeParse(value).success)).min(1),
});

const mockPreCandidatos = new Map([
  ["mock-governador", { id: "mock-governador", nome: "Valmir de Francisquinho", cargo: "Governador do Estado" }],
  ["mock-senador-1", { id: "mock-senador-1", nome: "Nome do candidato", cargo: "Primeiro Senador" }],
  ["mock-senador-2", { id: "mock-senador-2", nome: "Nome do candidato", cargo: "Segundo Senador" }],
  ["mock-federal", { id: "mock-federal", nome: "Nome do candidato", cargo: "Deputado Federal" }],
  ["mock-estadual", { id: "mock-estadual", nome: "Nome do candidato", cargo: "Deputado Estadual" }],
]);

function fallbackCadastroRecebido(res: any, details?: string) {
  // TODO: remover fallback emergencial depois que producao estiver estabilizada.
  return json(res, 200, {
    success: true,
    modo_fallback: true,
    message: "Cadastro recebido em modo apresentação.",
    ...(details ? { details } : {}),
  });
}

function gerarSlugLideranca(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const start = Date.now();
  try {
    const body = cadastroSchema.parse(await readJsonBody(req));
    const telefoneNormalizado = normalizePhone(body.telefone);
    const liderancaNome = body.lideranca_nome.trim();
    const liderancaSlug = body.lideranca_slug?.trim() || gerarSlugLideranca(liderancaNome);
    const cidadeMoradia = body.cidade_moradia.trim();
    const cidadeVotacao = body.cidade_votacao?.trim() || null;
    const localVotacao = body.local_votacao?.trim() || null;

    if (telefoneNormalizado.length < 10 || !liderancaSlug) {
      return json(res, 400, { error: "Verifique os dados informados e tente novamente." });
    }

    const supabase = getSupabaseServerClient();
    const cadastroConfig = await getCadastroConfig();

    if (!cadastroConfig.responsavelId) {
      return json(res, 404, { error: "Link de cadastro nao encontrado ou inativo." });
    }

    const { data: duplicadoTelefone, error: duplicadoTelefoneError } = await supabase
      .from("cadastros_apoio")
      .select("id")
      .eq("responsavel_id", cadastroConfig.responsavelId)
      .eq("telefone_normalizado", telefoneNormalizado)
      .maybeSingle();

    if (duplicadoTelefoneError) {
      throw duplicadoTelefoneError;
    }

    if (duplicadoTelefone) {
      return json(res, 409, { error: "Este telefone ja foi cadastrado anteriormente." });
    }

    const mockIds = body.pre_candidatos.filter((id) => id.startsWith("mock-"));
    const realIds = body.pre_candidatos.filter((id) => !id.startsWith("mock-"));

    const preCandidatosResult = realIds.length > 0
      ? await supabase
          .from("pre_candidatos")
          .select("id, nome, cargo")
          .in("id", realIds)
          .eq("ativo", true)
      : { data: [], error: null };

    if (preCandidatosResult.error) {
      throw preCandidatosResult.error;
    }

    const preCandidatos = preCandidatosResult.data ?? [];
    const mockCandidatos = mockIds.map((id) => mockPreCandidatos.get(id)).filter(Boolean) as Array<{
      id: string;
      nome: string;
      cargo: string;
    }>;

    if (preCandidatos.length !== realIds.length || mockCandidatos.length !== mockIds.length) {
      return json(res, 400, { error: "Verifique os dados informados e tente novamente." });
    }

    const { data: cadastro, error: cadastroError } = await supabase
      .from("cadastros_apoio")
      .insert({
        responsavel_id: cadastroConfig.responsavelId,
        nome_completo: body.nome_completo,
        telefone: body.telefone,
        telefone_normalizado: telefoneNormalizado,
        lideranca_nome: liderancaNome,
        lideranca_slug: liderancaSlug,
        cidade: cidadeMoradia,
        cidade_moradia: cidadeMoradia,
        cidade_votacao: cidadeVotacao,
        bairro: body.bairro,
        rua_numero: body.rua_numero,
        local_votacao: localVotacao,
        observacoes: body.observacoes || null,
        ip_origem: getOriginIp(req),
        user_agent: req.headers["user-agent"] ?? null,
      })
      .select("id")
      .single();

    if (cadastroError) {
      if (cadastroError.code === "23505") {
        return json(res, 409, { error: "Este telefone ja foi cadastrado anteriormente." });
      }

      throw cadastroError;
    }

    const apoiosPayload = [
      ...preCandidatos.map((item) => ({
      cadastro_id: cadastro.id,
      pre_candidato_id: item.id,
      cargo: item.cargo,
      nome_pre_candidato: item.nome,
      })),
      ...mockCandidatos.map((item) => ({
        cadastro_id: cadastro.id,
        pre_candidato_id: null,
        cargo: item.cargo,
        nome_pre_candidato: item.nome,
      })),
    ];

    const { error: apoiosError } = await supabase.from("apoios_candidatos").insert(apoiosPayload);
    if (apoiosError) {
      await supabase.from("cadastros_apoio").delete().eq("id", cadastro.id);
      throw apoiosError;
    }

    invalidateDashboardCache();
    return json(res, 201, { success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(res, 400, { error: "Verifique os dados informados e tente novamente." });
    }

    const details = error instanceof Error ? error.message : String(error);
    console.error("Erro ao registrar cadastro:", details);
    return fallbackCadastroRecebido(res, details);
  } finally {
    console.log("[api/cadastros] tempo:", Date.now() - start, "ms");
  }
}
