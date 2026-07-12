import { handleAdminAuthError, requireAdmin } from "../_lib/admin-auth";
import { getSupabaseServerClient } from "../_lib/supabase";
import { formatPhone, maskCpf } from "../_lib/personal-data";
import { json, methodNotAllowed, parsePositiveInt } from "../_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const start = Date.now();
  try {
    const authStart = Date.now();
    await requireAdmin(req, "[api/admin/cadastros]");
    console.log("[api/admin/cadastros] requireAdmin:", Date.now() - authStart, "ms");
    const search = String(req.query?.search ?? "").trim();
    const cidade = String(req.query?.cidade ?? "").trim();
    console.log("[api/admin/cadastros] filtro cidade:", cidade || "todas");
    const page = parsePositiveInt(req.query?.page, 1);
    const limit = Math.min(parsePositiveInt(req.query?.limit, 20), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabaseServerClient();
    const countMode = "planned";

    let query = supabase
      .from("cadastros_apoio")
      .select(
        "id, nome_completo, telefone, telefone_normalizado, cpf_normalizado, cidade, bairro, rua_numero, local_votacao, observacoes, criado_em",
        { count: countMode },
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

    const queryStart = Date.now();
    const { data, count, error } = await query;
    console.log("[api/admin/cadastros] query cadastros:", Date.now() - queryStart, "ms");

    if (error) {
      throw error;
    }

    const cadastroIds = (data ?? []).map((item) => item.id);
    let apoiosByCadastro = new Map<string, Array<{ id?: string; pre_candidato_id?: string | null; nome_pre_candidato: string; cargo: string }>>();

    if (cadastroIds.length > 0) {
      const apoiosStart = Date.now();
      const { data: apoiosData, error: apoiosError } = await supabase
        .from("apoios_candidatos")
        .select("id, cadastro_id, pre_candidato_id, nome_pre_candidato, cargo")
        .in("cadastro_id", cadastroIds);
      console.log("[api/admin/cadastros] query apoios:", Date.now() - apoiosStart, "ms");

      if (apoiosError) {
        throw apoiosError;
      }

      apoiosByCadastro = new Map();
      for (const apoio of apoiosData ?? []) {
        const current = apoiosByCadastro.get(apoio.cadastro_id) ?? [];
        current.push({
          id: apoio.id,
          pre_candidato_id: apoio.pre_candidato_id,
          nome_pre_candidato: apoio.nome_pre_candidato,
          cargo: apoio.cargo,
        });
        apoiosByCadastro.set(apoio.cadastro_id, current);
      }
    } else {
      console.log("[api/admin/cadastros] query apoios:", 0, "ms");
    }

    const total = count ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const jsonStart = Date.now();
    const payload = {
      data:
        data?.map((item) => ({
          id: item.id,
          nome_completo: item.nome_completo,
          telefone: formatPhone(item.telefone),
          telefone_normalizado: item.telefone_normalizado,
          cpf_mascarado: maskCpf(item.cpf_normalizado),
          cidade: item.cidade,
          bairro: item.bairro,
          rua_numero: item.rua_numero,
          local_votacao: item.local_votacao,
          observacoes: item.observacoes,
          criado_em: item.criado_em,
          apoios: apoiosByCadastro.get(item.id) ?? [],
        })) ?? [],
      page,
      limit,
      total,
      totalPages,
    };
    console.log("[api/admin/cadastros] montar resposta:", Date.now() - jsonStart, "ms");

    return json(res, 200, payload);
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return handleAdminAuthError(res, error, "/api/admin/cadastros");
    }

    console.error("Erro ao carregar cadastros admin:", error);
    return json(res, 500, { error: "Nao foi possivel carregar os cadastros." });
  } finally {
    console.log("[api/admin/cadastros] total:", Date.now() - start, "ms");
  }
}
