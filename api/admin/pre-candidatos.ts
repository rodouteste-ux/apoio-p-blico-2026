import { z } from "zod";

import {
  getAdminPreCandidatosInFlight,
  getCachedAdminPreCandidatos,
  invalidateAdminCaches,
  setAdminPreCandidatosInFlight,
  setCachedAdminPreCandidatos,
} from "../_lib/admin-cache";
import { handleAdminAuthError, requireAdmin } from "../_lib/admin-auth";
import { json, methodNotAllowed, readJsonBody } from "../_lib/http";
import { getSupabaseServerClient } from "../_lib/supabase";

const preCandidatoSchema = z.object({
  nome: z.string().trim().min(2),
  cargo: z.string().trim().min(2),
  ativo: z.boolean(),
  ordem: z.number().int().min(0),
});

async function loadAdminPreCandidatos() {
  const supabase = getSupabaseServerClient();
  const queryStart = Date.now();
  const { data, error } = await supabase
    .from("pre_candidatos")
    .select("id, nome, cargo, ativo, ordem, criado_em")
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: true });
  console.log(
    "[api/admin/pre-candidatos] query:",
    Date.now() - queryStart,
    "ms",
  );

  if (error) throw error;
  const payload = data ?? [];
  setCachedAdminPreCandidatos(payload);
  return payload;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  const start = Date.now();
  try {
    const authStart = Date.now();
    await requireAdmin(req, "[api/admin/pre-candidatos]");
    console.log("[api/admin/pre-candidatos] requireAdmin:", Date.now() - authStart, "ms");
    const supabase = getSupabaseServerClient();

    if (req.method === "GET") {
      const cached = getCachedAdminPreCandidatos();
      if (cached) {
        console.log("[api/admin/pre-candidatos] cache hit:", true);
        console.log("[api/admin/pre-candidatos] query:", 0, "ms");
        return json(res, 200, cached);
      }

      console.log("[api/admin/pre-candidatos] cache hit:", false);
      const inFlight = getAdminPreCandidatosInFlight();
      if (inFlight) {
        console.log("[api/admin/pre-candidatos] revalidate skipped: in_flight");
        return json(res, 200, await inFlight);
      }

      return json(res, 200, await setAdminPreCandidatosInFlight(loadAdminPreCandidatos()));
    }

    const body = preCandidatoSchema.parse(await readJsonBody(req));
    const queryStart = Date.now();
    const { data, error } = await supabase
      .from("pre_candidatos")
      .insert({
        nome: body.nome,
        cargo: body.cargo,
        ativo: body.ativo,
        ordem: body.ordem,
      })
      .select("id, nome, cargo, ativo, ordem, criado_em")
      .single();
    console.log("[api/admin/pre-candidatos] supabase write:", Date.now() - queryStart, "ms");

    if (error) throw error;
    invalidateAdminCaches();
    return json(res, 201, data);
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return handleAdminAuthError(res, error, "/api/admin/pre-candidatos");
    }

    if (error instanceof z.ZodError) {
      return json(res, 400, { error: "Verifique os dados informados e tente novamente." });
    }

    console.error("Erro ao gerenciar pre-candidatos:", error);
    return json(res, 500, { error: "Erro interno ao processar solicitacao." });
  } finally {
    console.log("[api/admin/pre-candidatos] total:", Date.now() - start, "ms");
  }
}
