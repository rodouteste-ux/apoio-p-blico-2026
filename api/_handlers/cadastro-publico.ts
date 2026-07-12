import { getSupabaseEnv } from "../_lib/env.js";
import { json, methodNotAllowed } from "../_lib/http.js";
import { getSupabaseServerClient } from "../_lib/supabase.js";

type CadastroPublicoResponse = {
  ativo: boolean;
  modo_fallback?: boolean;
  fallback_reason?: string;
  details?: string;
  missing?: string[];
  pre_candidatos: Array<{
    id: string;
    nome: string;
    cargo: string;
    ordem: number;
  }>;
};

let cachedResponse: { data: CadastroPublicoResponse; expiresAt: number } | null = null;
let inFlight: Promise<CadastroPublicoResponse> | null = null;
const CACHE_TTL_MS = 60 * 1000;
const fallbackCadastroPublico = {
  ativo: true,
  modo_fallback: true,
  pre_candidatos: [
    { id: "mock-governador", nome: "Valmir de Francisquinho", cargo: "Governador do Estado", ordem: 1 },
    { id: "mock-senador-1", nome: "Nome do candidato", cargo: "Primeiro Senador", ordem: 2 },
    { id: "mock-senador-2", nome: "Nome do candidato", cargo: "Segundo Senador", ordem: 3 },
    { id: "mock-federal", nome: "Nome do candidato", cargo: "Deputado Federal", ordem: 4 },
    { id: "mock-estadual", nome: "Nome do candidato", cargo: "Deputado Estadual", ordem: 5 },
  ],
};

function fallback(reason: string, extra: Partial<CadastroPublicoResponse> = {}): CadastroPublicoResponse {
  // TODO: remover fallback emergencial depois que producao estiver estabilizada.
  return {
    ...fallbackCadastroPublico,
    fallback_reason: reason,
    ...extra,
  };
}

function getDefaultResponsavelId() {
  const envResult = getSupabaseEnv();
  return envResult.ok ? envResult.env.DEFAULT_RESPONSAVEL_ID.trim() : "";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const start = Date.now();
  try {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    const envResult = getSupabaseEnv();
    if (!envResult.ok) {
      console.error("[api/cadastro-publico] env faltando", envResult.missing);
      return json(res, 200, fallback("env_missing", { missing: envResult.missing }));
    }

    if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
      console.log("[api/cadastro-publico] cache hit:", Date.now() - start, "ms");
      return json(res, 200, cachedResponse.data);
    }

    if (!inFlight) {
      inFlight = loadCadastroPublico();
    }

    const payload = await inFlight;
    cachedResponse = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS };
    return json(res, 200, payload);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error("[cadastro-publico fatal]", details);
    return json(res, 200, fallback("fatal_error", { details }));
  } finally {
    inFlight = null;
    console.log("[api/cadastro-publico] total:", Date.now() - start, "ms");
  }
}

async function loadCadastroPublico() {
  const clientStart = Date.now();
  const supabase = getSupabaseServerClient();
  console.log("[api/cadastro-publico] criar client:", Date.now() - clientStart, "ms");

  const defaultResponsavelId = getDefaultResponsavelId();
  let responsavelQuery = supabase.from("responsaveis").select("id, nome, ativo").eq("ativo", true);

  if (defaultResponsavelId) {
    responsavelQuery = responsavelQuery.eq("id", defaultResponsavelId);
  }

  const queriesStart = Date.now();
  const responsavelResult = await responsavelQuery.limit(1).maybeSingle();

  if (responsavelResult.error) {
    console.error("[cadastro-publico] erro responsavel", responsavelResult.error.message);
    return fallback("responsavel_query_error", { details: responsavelResult.error.message });
  }

  if (!responsavelResult.data) {
    console.error("[cadastro-publico] nenhum responsavel ativo");
    return fallback("no_active_responsavel");
  }

  const preCandidatosResult = await supabase
    .from("pre_candidatos")
    .select("id, nome, cargo, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  console.log("[api/cadastro-publico] queries supabase:", Date.now() - queriesStart, "ms");

  if (preCandidatosResult.error) {
    console.error("[cadastro-publico] erro candidatos", preCandidatosResult.error.message);
    return fallback("pre_candidatos_query_error", { details: preCandidatosResult.error.message });
  }

  const jsonStart = Date.now();
  const payload = {
    ativo: true,
    modo_fallback: false,
    pre_candidatos: preCandidatosResult.data ?? [],
  };
  console.log("[api/cadastro-publico] montar json:", Date.now() - jsonStart, "ms");

  return payload;
}
