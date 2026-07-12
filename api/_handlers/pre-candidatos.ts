import { getSupabaseServerClient } from "../_lib/supabase";
import { json, methodNotAllowed } from "../_lib/http";

type PublicPreCandidato = {
  id: string;
  nome: string;
  cargo: string;
  ordem: number;
};

let cachedResponse: { data: PublicPreCandidato[]; expiresAt: number } | null = null;
let inFlight: Promise<PublicPreCandidato[]> | null = null;
const CACHE_TTL_MS = 60 * 1000;

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const start = Date.now();
  try {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
      console.log("[api/pre-candidatos] cache hit:", Date.now() - start, "ms");
      return json(res, 200, cachedResponse.data);
    }

    if (!inFlight) {
      inFlight = loadPreCandidatos();
    }

    const data = await inFlight;
    cachedResponse = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return json(res, 200, data);
  } catch (error) {
    console.error("Erro ao buscar pre-candidatos:", error);
    return json(res, 500, { error: "Nao foi possivel carregar os pre-candidatos." });
  } finally {
    inFlight = null;
    console.log("[api/pre-candidatos] tempo:", Date.now() - start, "ms");
  }
}

async function loadPreCandidatos() {
  const clientStart = Date.now();
  const supabase = getSupabaseServerClient();
  console.log("[api/pre-candidatos] criar client:", Date.now() - clientStart, "ms");

  const queryStart = Date.now();
  const { data, error } = await supabase
    .from("pre_candidatos")
    .select("id, nome, cargo, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  console.log("[api/pre-candidatos] supabase query:", Date.now() - queryStart, "ms");

  if (error) {
    throw error;
  }

  const jsonStart = Date.now();
  const payload = data ?? [];
  console.log("[api/pre-candidatos] montar json:", Date.now() - jsonStart, "ms");

  return payload;
}
