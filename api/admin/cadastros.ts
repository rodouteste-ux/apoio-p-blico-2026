import { getSupabaseServerClient } from "../_lib/supabase";
import { formatPhone, maskCpf } from "../_lib/personal-data";
import { json, methodNotAllowed, parsePositiveInt } from "../_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const search = String(req.query?.search ?? "").trim();
    const cidade = String(req.query?.cidade ?? "").trim();
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, 20), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("cadastros_apoio")
      .select(
        "id, nome_completo, telefone, telefone_normalizado, cpf, cidade, bairro, rua_numero, local_votacao, observacoes, criado_em, apoios_candidatos ( id, pre_candidato_id, nome_pre_candidato, cargo )",
        { count: "exact" },
      )
      .order("criado_em", { ascending: false })
      .range(from, to);

    if (cidade) {
      query = query.eq("cidade", cidade);
    }

    if (search) {
      const normalizedSearch = search.replace(/\D/g, "");
      const orFilters = [
        `nome_completo.ilike.%${search}%`,
        `telefone.ilike.%${search}%`,
      ];

      if (normalizedSearch) {
        orFilters.push(`telefone_normalizado.ilike.%${normalizedSearch}%`);
      }

      query = query.or(orFilters.join(","));
    }

    const { data, count, error } = await query;
    if (error) {
      throw error;
    }

    return json(res, 200, {
      data:
        data?.map((item) => ({
          id: item.id,
          nome_completo: item.nome_completo,
          telefone: formatPhone(item.telefone),
          telefone_normalizado: item.telefone_normalizado,
          cpf_mascarado: maskCpf(item.cpf),
          cidade: item.cidade,
          bairro: item.bairro,
          rua_numero: item.rua_numero,
          local_votacao: item.local_votacao,
          observacoes: item.observacoes,
          criado_em: item.criado_em,
          apoios: (item.apoios_candidatos ?? []).map((apoio: any) => ({
            id: apoio.id,
            pre_candidato_id: apoio.pre_candidato_id,
            nome_pre_candidato: apoio.nome_pre_candidato,
            cargo: apoio.cargo,
          })),
        })) ?? [],
      page,
      limit,
      total: count ?? 0,
    });
  } catch (error) {
    console.error("Erro ao carregar cadastros admin:", error);
    return json(res, 500, { error: "Nao foi possivel carregar os cadastros." });
  }
}
