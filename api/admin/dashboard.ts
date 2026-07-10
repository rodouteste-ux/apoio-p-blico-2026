import { handleAdminAuthError, requireAdmin } from "../_lib/admin-auth";
import { getSupabaseServerClient } from "../_lib/supabase";
import { formatPhone, maskCpf } from "../_lib/personal-data";
import { json, methodNotAllowed } from "../_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    await requireAdmin(req);
    const supabase = getSupabaseServerClient();
    const today = new Date();
    const startOfDayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    ).toISOString();

    const [
      totalCadastrosResult,
      cadastrosHojeResult,
      cidadesResult,
      totalApoiosResult,
      responsaveisAtivosResult,
      totalPreCandidatosAtivosResult,
      totalPreCandidatosInativosResult,
      apoiosResult,
      ultimosCadastrosResult,
    ] = await Promise.all([
      supabase.from("cadastros_apoio").select("id", { count: "exact", head: true }),
      supabase
        .from("cadastros_apoio")
        .select("id", { count: "exact", head: true })
        .gte("criado_em", startOfDayUtc),
      supabase.from("cadastros_apoio").select("cidade"),
      supabase.from("apoios_candidatos").select("id", { count: "exact", head: true }),
      supabase
        .from("responsaveis")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true),
      supabase.from("pre_candidatos").select("id", { count: "exact", head: true }).eq("ativo", true),
      supabase.from("pre_candidatos").select("id", { count: "exact", head: true }).eq("ativo", false),
      supabase.from("apoios_candidatos").select("id, nome_pre_candidato, cargo, pre_candidato_id"),
      supabase
        .from("cadastros_apoio")
        .select("id, nome_completo, telefone, cpf, cidade, bairro, rua_numero, local_votacao, observacoes, criado_em")
        .order("criado_em", { ascending: false })
        .limit(5),
    ]);

    const results = [
      totalCadastrosResult,
      cadastrosHojeResult,
      cidadesResult,
      totalApoiosResult,
      responsaveisAtivosResult,
      totalPreCandidatosAtivosResult,
      totalPreCandidatosInativosResult,
      apoiosResult,
      ultimosCadastrosResult,
    ];

    const firstError = results.find((result) => result.error)?.error;
    if (firstError) {
      throw firstError;
    }

    const groupedApoios = new Map<string, { nomePreCandidato: string; cargo: string; totalApoios: number; preCandidatoId: string | null }>();
    for (const apoio of apoiosResult.data ?? []) {
      const key = `${apoio.nome_pre_candidato}::${apoio.cargo}`;
      const current = groupedApoios.get(key);
      if (current) {
        current.totalApoios += 1;
      } else {
        groupedApoios.set(key, {
          nomePreCandidato: apoio.nome_pre_candidato,
          cargo: apoio.cargo,
          totalApoios: 1,
          preCandidatoId: apoio.pre_candidato_id,
        });
      }
    }

    return json(res, 200, {
      total_cadastros: totalCadastrosResult.count ?? 0,
      cadastros_hoje: cadastrosHojeResult.count ?? 0,
      total_cidades: new Set((cidadesResult.data ?? []).map((item) => item.cidade)).size,
      total_apoios: totalApoiosResult.count ?? 0,
      responsaveis_ativos: responsaveisAtivosResult.count ?? 0,
      total_pre_candidatos_ativos: totalPreCandidatosAtivosResult.count ?? 0,
      total_pre_candidatos_inativos: totalPreCandidatosInativosResult.count ?? 0,
      apoios_por_pre_candidato: Array.from(groupedApoios.values()).sort(
        (a, b) => b.totalApoios - a.totalApoios,
      ),
      ultimos_cadastros: (ultimosCadastrosResult.data ?? []).map((item) => ({
        id: item.id,
        nome_completo: item.nome_completo,
        telefone: formatPhone(item.telefone),
        cpf_mascarado: maskCpf(item.cpf),
        cidade: item.cidade,
        bairro: item.bairro,
        rua_numero: item.rua_numero,
        local_votacao: item.local_votacao,
        observacoes: item.observacoes,
        criado_em: item.criado_em,
        apoios: [],
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return handleAdminAuthError(res, error, "/api/admin/dashboard");
    }

    console.error("Erro ao carregar dashboard admin:", error);
    return json(res, 500, { error: "Nao foi possivel carregar o dashboard." });
  }
}
