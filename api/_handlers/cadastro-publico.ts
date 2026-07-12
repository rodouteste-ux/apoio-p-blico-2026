import { getSupabaseEnv } from "../_lib/env";
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
      return json(res, 500, {
        error: "Configuração do servidor incompleta.",
        missing: envResult.missing,
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

    const details = error instanceof Error ? error.message : String(error);
    console.error("[api/cadastro-publico] erro inesperado", details);
    return json(res, 500, {
      error: "Erro interno ao carregar cadastro público.",
      details,
    });
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
    console.error("[api/cadastro-publico] supabase error", responsavelResult.error.message);
    throw new CadastroPublicoError(500, {
      error: "Erro ao carregar responsável padrão.",
      details: responsavelResult.error.message,
    });
  }

  if (!responsavelResult.data) {
    console.error("[api/cadastro-publico] responsável não encontrado");
    throw new CadastroPublicoError(500, { error: "Nenhum responsável ativo configurado." });
  }

  const preCandidatosResult = await supabase
    .from("pre_candidatos")
    .select("id, nome, cargo, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  console.log("[api/cadastro-publico] queries supabase:", Date.now() - queriesStart, "ms");

  if (preCandidatosResult.error) {
    console.error("[api/cadastro-publico] supabase error", preCandidatosResult.error.message);
    throw new CadastroPublicoError(500, {
      error: "Erro ao carregar pré-candidatos.",
      details: preCandidatosResult.error.message,
    });
  }

  const jsonStart = Date.now();
  const payload = {
    ativo: true,
    pre_candidatos: preCandidatosResult.data ?? [],
  };
  console.log("[api/cadastro-publico] montar json:", Date.now() - jsonStart, "ms");

  return payload;
}
