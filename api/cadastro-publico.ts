import { getServerEnv } from "./_lib/env";
import { json, methodNotAllowed } from "./_lib/http";
import { getSupabaseServerClient } from "./_lib/supabase";

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
    console.error("Erro ao carregar cadastro publico:", error);
    return json(res, 500, { error: "Nao foi possivel carregar o cadastro publico." });
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
    throw responsavelResult.error;
  }

  if (preCandidatosResult.error) {
    throw preCandidatosResult.error;
  }

  const jsonStart = Date.now();
  const payload = {
    ativo: Boolean(responsavelResult.data),
    pre_candidatos: preCandidatosResult.data ?? [],
  };
  console.log("[api/cadastro-publico] montar json:", Date.now() - jsonStart, "ms");

  return payload;
}
