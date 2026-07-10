import { z } from "zod";

import { getCadastroConfig } from "./_lib/cadastro-config";
import { getSupabaseServerClient } from "./_lib/supabase";
import { getOriginIp, json, methodNotAllowed, readJsonBody } from "./_lib/http";
import { normalizeCpf, normalizePhone, validateCpf } from "./_lib/personal-data";

const cadastroSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  nome_completo: z.string().trim().min(3),
  telefone: z.string().trim().min(10),
  cpf: z.string().trim().min(11),
  cidade: z.string().trim().min(1),
  bairro: z.string().trim().min(2),
  rua_numero: z.string().trim().min(3),
  local_votacao: z.string().trim().min(2),
  observacoes: z.string().trim().max(500).optional().or(z.literal("")),
  pre_candidatos: z.array(z.string().uuid()).min(1),
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const body = cadastroSchema.parse(await readJsonBody(req));
    const cpfNormalizado = normalizeCpf(body.cpf);
    const telefoneNormalizado = normalizePhone(body.telefone);

    if (!validateCpf(cpfNormalizado) || telefoneNormalizado.length < 10) {
      return json(res, 400, { error: "Verifique os dados informados e tente novamente." });
    }

    const supabase = getSupabaseServerClient();
    const cadastroConfig = await getCadastroConfig();
    const slug = body.slug ?? cadastroConfig.slug;

    if (!slug) {
      return json(res, 404, { error: "Link de cadastro nao encontrado ou inativo." });
    }

    const { data: responsavel, error: responsavelError } = await supabase
      .from("responsaveis")
      .select("id")
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle();

    if (responsavelError) {
      throw responsavelError;
    }

    if (!responsavel) {
      return json(res, 404, { error: "Responsavel nao encontrado." });
    }

    const { data: duplicadoCpf, error: duplicadoCpfError } = await supabase
      .from("cadastros_apoio")
      .select("id")
      .eq("responsavel_id", responsavel.id)
      .eq("cpf_normalizado", cpfNormalizado)
      .maybeSingle();

    if (duplicadoCpfError) {
      throw duplicadoCpfError;
    }

    const { data: duplicadoTelefone, error: duplicadoTelefoneError } = await supabase
      .from("cadastros_apoio")
      .select("id")
      .eq("responsavel_id", responsavel.id)
      .eq("telefone_normalizado", telefoneNormalizado)
      .maybeSingle();

    if (duplicadoTelefoneError) {
      throw duplicadoTelefoneError;
    }

    if (duplicadoCpf || duplicadoTelefone) {
      return json(res, 409, { error: "Este cadastro ja foi registrado anteriormente." });
    }

    const { data: preCandidatos, error: preCandidatosError } = await supabase
      .from("pre_candidatos")
      .select("id, nome, cargo")
      .in("id", body.pre_candidatos)
      .eq("ativo", true);

    if (preCandidatosError) {
      throw preCandidatosError;
    }

    if (!preCandidatos || preCandidatos.length !== body.pre_candidatos.length) {
      return json(res, 400, { error: "Verifique os dados informados e tente novamente." });
    }

    const { data: cadastro, error: cadastroError } = await supabase
      .from("cadastros_apoio")
      .insert({
        responsavel_id: responsavel.id,
        nome_completo: body.nome_completo,
        telefone: body.telefone,
        telefone_normalizado: telefoneNormalizado,
        cpf: body.cpf,
        cpf_normalizado: cpfNormalizado,
        cidade: body.cidade,
        bairro: body.bairro,
        rua_numero: body.rua_numero,
        local_votacao: body.local_votacao,
        observacoes: body.observacoes || null,
        ip_origem: getOriginIp(req),
        user_agent: req.headers["user-agent"] ?? null,
      })
      .select("id")
      .single();

    if (cadastroError) {
      if (cadastroError.code === "23505") {
        return json(res, 409, { error: "Este cadastro ja foi registrado anteriormente." });
      }

      throw cadastroError;
    }

    const apoiosPayload = preCandidatos.map((item) => ({
      cadastro_id: cadastro.id,
      pre_candidato_id: item.id,
      cargo: item.cargo,
      nome_pre_candidato: item.nome,
    }));

    const { error: apoiosError } = await supabase.from("apoios_candidatos").insert(apoiosPayload);
    if (apoiosError) {
      await supabase.from("cadastros_apoio").delete().eq("id", cadastro.id);
      throw apoiosError;
    }

    return json(res, 201, { success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(res, 400, { error: "Verifique os dados informados e tente novamente." });
    }

    console.error("Erro ao registrar cadastro:", error);
    return json(res, 500, { error: "Nao foi possivel enviar o cadastro agora. Tente novamente." });
  }
}
