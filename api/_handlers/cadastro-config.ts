import { getServerEnv } from "../_lib/env.js";
import { json, methodNotAllowed } from "../_lib/http.js";
import { getSupabaseServerClient } from "../_lib/supabase.js";

let cachedResponse: { ativo: boolean; expiresAt: number } | null = null;
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
      console.log("[api/cadastro-config] cache hit:", Date.now() - start, "ms");
      return json(res, 200, { ativo: cachedResponse.ativo });
    }

    const clientStart = Date.now();
    const supabase = getSupabaseServerClient();
    console.log("[api/cadastro-config] criar client:", Date.now() - clientStart, "ms");

    const defaultResponsavelId = getDefaultResponsavelId();
    let query = supabase.from("responsaveis").select("id").eq("ativo", true);

    if (defaultResponsavelId) {
      query = query.eq("id", defaultResponsavelId);
    }

    const queryStart = Date.now();
    const { data, error } = await query.limit(1).maybeSingle();
    console.log("[api/cadastro-config] supabase query:", Date.now() - queryStart, "ms");

    if (error) throw error;

    const jsonStart = Date.now();
    const payload = { ativo: Boolean(data) };
    console.log("[api/cadastro-config] montar json:", Date.now() - jsonStart, "ms");

    cachedResponse = { ...payload, expiresAt: Date.now() + CACHE_TTL_MS };
    return json(res, 200, payload);
  } catch (error) {
    console.error("Erro ao carregar configuracao publica de cadastro:", error);
    return json(res, 500, { error: "Erro interno ao processar solicitacao." });
  } finally {
    console.log("[api/cadastro-config] tempo:", Date.now() - start, "ms");
  }
}
