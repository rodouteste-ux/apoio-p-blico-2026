import { handleAdminAuthError, requireAdmin } from "../../_lib/admin-auth.js";
import {
  getCachedDashboard,
  getDashboardInFlight,
  setCachedDashboard,
  setDashboardInFlight,
} from "../../_lib/admin-cache.js";
import { getSupabaseServerClient } from "../../_lib/supabase.js";
import { formatPhone } from "../../_lib/personal-data.js";
import { json, methodNotAllowed } from "../../_lib/http.js";

async function loadDashboardMetrics(supabase: ReturnType<typeof getSupabaseServerClient>, startOfDayUtc: string) {
  const countsStart = Date.now();
  try {
    const rpcResult = await supabase.rpc("get_admin_dashboard_metrics", {
      p_start_of_day: startOfDayUtc,
    });

    if (!rpcResult.error && rpcResult.data) {
      const row = Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data;
      return {
        total_cadastros: Number(row.total_cadastros ?? 0),
        cadastros_hoje: Number(row.cadastros_hoje ?? 0),
        total_cidades: Number(row.total_cidades ?? 0),
        total_apoios: Number(row.total_apoios ?? 0),
        responsaveis_ativos: Number(row.responsaveis_ativos ?? 0),
        total_pre_candidatos_ativos: Number(row.pre_candidatos_ativos ?? 0),
        total_pre_candidatos_inativos: Number(row.pre_candidatos_inativos ?? 0),
      };
    }

    const [
      totalCadastrosResult,
      cadastrosHojeResult,
      totalCidades,
      totalApoiosResult,
      responsaveisAtivosResult,
      totalPreCandidatosAtivosResult,
      totalPreCandidatosInativosResult,
    ] = await Promise.all([
      supabase.from("cadastros_apoio").select("id", { count: "exact", head: true }),
      supabase
        .from("cadastros_apoio")
        .select("id", { count: "exact", head: true })
        .gte("criado_em", startOfDayUtc),
      countDistinctCidades(supabase),
      supabase.from("apoios_candidatos").select("id", { count: "exact", head: true }),
      supabase
        .from("responsaveis")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true),
      supabase.from("pre_candidatos").select("id", { count: "exact", head: true }).eq("ativo", true),
      supabase.from("pre_candidatos").select("id", { count: "exact", head: true }).eq("ativo", false),
    ]);

    const results = [
      totalCadastrosResult,
      cadastrosHojeResult,
      totalApoiosResult,
      responsaveisAtivosResult,
      totalPreCandidatosAtivosResult,
      totalPreCandidatosInativosResult,
    ];

    const firstError = results.find((result) => result.error)?.error;
    if (firstError) {
      throw firstError;
    }

    return {
      total_cadastros: totalCadastrosResult.count ?? 0,
      cadastros_hoje: cadastrosHojeResult.count ?? 0,
      total_cidades: totalCidades,
      total_apoios: totalApoiosResult.count ?? 0,
      responsaveis_ativos: responsaveisAtivosResult.count ?? 0,
      total_pre_candidatos_ativos: totalPreCandidatosAtivosResult.count ?? 0,
      total_pre_candidatos_inativos: totalPreCandidatosInativosResult.count ?? 0,
    };
  } finally {
    console.log("[api/admin/dashboard] counts:", Date.now() - countsStart, "ms");
  }
}

async function countDistinctCidades(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const rpcResult = await supabase.rpc("count_distinct_cidades");
  if (!rpcResult.error && typeof rpcResult.data === "number") {
    return rpcResult.data;
  }

  const fallback = await supabase.from("cadastros_apoio").select("cidade");
  if (fallback.error) throw fallback.error;
  return new Set((fallback.data ?? []).map((item) => item.cidade)).size;
}

async function loadApoiosRanking(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const rankingStart = Date.now();
  try {
    const rpcResult = await supabase.rpc("apoios_ranking");
    if (!rpcResult.error && Array.isArray(rpcResult.data)) {
      return rpcResult.data.map((item: any) => ({
        nomePreCandidato: item.nome_pre_candidato,
        cargo: item.cargo,
        totalApoios: Number(item.total_apoios ?? 0),
        preCandidatoId: item.pre_candidato_id,
      }));
    }

    const fallback = await supabase
      .from("apoios_candidatos")
      .select("nome_pre_candidato, cargo, pre_candidato_id");
    if (fallback.error) throw fallback.error;

    const groupedApoios = new Map<string, { nomePreCandidato: string; cargo: string; totalApoios: number; preCandidatoId: string | null }>();
    for (const apoio of fallback.data ?? []) {
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

    return Array.from(groupedApoios.values()).sort((a, b) => b.totalApoios - a.totalApoios);
  } finally {
    console.log("[api/admin/dashboard] ranking:", Date.now() - rankingStart, "ms");
  }
}

async function loadUltimosCadastros(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const ultimosStart = Date.now();
  try {
    return await supabase
      .from("cadastros_apoio")
      .select("id, nome_completo, telefone, lideranca_nome, lideranca_slug, cidade, cidade_moradia, cidade_votacao, bairro, rua_numero, local_votacao, observacoes, criado_em")
      .order("criado_em", { ascending: false })
      .limit(5);
  } finally {
    console.log("[api/admin/dashboard] ultimos:", Date.now() - ultimosStart, "ms");
  }
}

async function buildDashboardPayload() {
  const supabase = getSupabaseServerClient();
  const today = new Date();
  const startOfDayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  ).toISOString();

  const queryStart = Date.now();
  const [
    metrics,
    apoiosRanking,
    ultimosCadastrosResult,
  ] = await Promise.all([
    loadDashboardMetrics(supabase, startOfDayUtc),
    loadApoiosRanking(supabase),
    loadUltimosCadastros(supabase),
  ]);
  console.log("[api/admin/dashboard] queries:", Date.now() - queryStart, "ms");

  if (ultimosCadastrosResult.error) {
    throw ultimosCadastrosResult.error;
  }

  const jsonStart = Date.now();
  const payload = {
    total_cadastros: metrics.total_cadastros,
    cadastros_hoje: metrics.cadastros_hoje,
    total_cidades: metrics.total_cidades,
    total_apoios: metrics.total_apoios,
    responsaveis_ativos: metrics.responsaveis_ativos,
    total_pre_candidatos_ativos: metrics.total_pre_candidatos_ativos,
    total_pre_candidatos_inativos: metrics.total_pre_candidatos_inativos,
    apoios_por_pre_candidato: apoiosRanking,
    ultimos_cadastros: (ultimosCadastrosResult.data ?? []).map((item) => ({
      id: item.id,
      nome_completo: item.nome_completo,
      telefone: formatPhone(item.telefone),
      lideranca_nome: item.lideranca_nome,
      lideranca_slug: item.lideranca_slug,
      cidade: item.cidade,
      cidade_moradia: item.cidade_moradia,
      cidade_votacao: item.cidade_votacao,
      bairro: item.bairro,
      rua_numero: item.rua_numero,
      local_votacao: item.local_votacao,
      observacoes: item.observacoes,
      criado_em: item.criado_em,
      apoios: [],
    })),
  };
  console.log("[api/admin/dashboard] montar resposta:", Date.now() - jsonStart, "ms");
  setCachedDashboard(payload);
  return payload;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const start = Date.now();
  try {
    const authStart = Date.now();
    await requireAdmin(req, "[api/admin/dashboard]");
    console.log("[api/admin/dashboard] requireAdmin:", Date.now() - authStart, "ms");

    const cached = getCachedDashboard();
    if (cached) {
      console.log("[api/admin/dashboard] cache hit:", true);
      console.log("[api/admin/dashboard] queries:", 0, "ms");
      console.log("[api/admin/dashboard] montar resposta:", 0, "ms");
      return json(res, 200, cached);
    }

    console.log("[api/admin/dashboard] cache hit:", false);
    const inFlight = getDashboardInFlight();
    if (inFlight) {
      console.log("[api/admin/dashboard] revalidate skipped: in_flight");
      return json(res, 200, await inFlight);
    }

    const payload = await setDashboardInFlight(buildDashboardPayload());
    return json(res, 200, payload);
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return handleAdminAuthError(res, error, "/api/admin/dashboard");
    }

    console.error("Erro ao carregar dashboard admin:", error);
    return json(res, 500, { error: "Nao foi possivel carregar o dashboard." });
  } finally {
    console.log("[api/admin/dashboard] total:", Date.now() - start, "ms");
  }
}
