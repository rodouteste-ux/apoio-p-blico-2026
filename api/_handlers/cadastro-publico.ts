import { getRequiredSupabaseEnvMissing, getServerEnv } from "../_lib/env";
import { json, methodNotAllowed } from "../_lib/http";
import { getSupabaseServerClient } from "../_lib/supabase";

type CadastroPublicoResponse = {
  ativo: boolean;
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

class CadastroPublicoError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Cadastro publico error");
    this.status = status;
    this.payload = payload;
  }
}

function getDefaultResponsavelId() {
  try {
    return getServerEnv("DEFAULT_RESPONSAVEL_ID").replace(/^['"]|['"]$/g, "").trim();
  } catch {
    return "";
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const start = Date.now();
  try {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    const missing = getRequiredSupabaseEnvMissing();
    if (missing.length > 0) {
      console.error("[api/cadastro-publico] env faltando", missing);
      return json(res, 500, {
        error: "Configuração do servidor incompleta.",
        missing,
      });
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
    if (error instanceof CadastroPublicoError) {
      return json(res, error.status, error.payload);
    }

    console.error("[api/cadastro-publico] erro inesperado", error instanceof Error ? error.message : error);
    return json(res, 500, { error: "Erro ao carregar configuração pública." });
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
  let responsavelQuery = supabase.from("responsaveis").select("id").eq("ativo", true);

  if (defaultResponsavelId) {
    responsavelQuery = responsavelQuery.eq("id", defaultResponsavelId);
  }

  const queriesStart = Date.now();
  const [responsavelResult, preCandidatosResult] = await Promise.all([
    responsavelQuery.limit(1).maybeSingle(),
    supabase
      .from("pre_candidatos")
      .select("id, nome, cargo, ordem")
      .eq("ativo", true)
      .order("ordem", { ascending: true }),
  ]);
  console.log("[api/cadastro-publico] queries supabase:", Date.now() - queriesStart, "ms");

  if (responsavelResult.error) {
    console.error("[api/cadastro-publico] supabase error", responsavelResult.error.message);
    throw new CadastroPublicoError(500, { error: "Erro ao carregar configuração pública." });
  }

  if (preCandidatosResult.error) {
    console.error("[api/cadastro-publico] supabase error", preCandidatosResult.error.message);
    throw new CadastroPublicoError(500, { error: "Erro ao carregar configuração pública." });
  }

  if (!responsavelResult.data) {
    console.error("[api/cadastro-publico] responsável não encontrado");
    throw new CadastroPublicoError(500, { error: "Nenhum responsável ativo configurado." });
  }

  const jsonStart = Date.now();
  const payload = {
    ativo: true,
    pre_candidatos: preCandidatosResult.data ?? [],
  };
  console.log("[api/cadastro-publico] montar json:", Date.now() - jsonStart, "ms");

  return payload;
}
