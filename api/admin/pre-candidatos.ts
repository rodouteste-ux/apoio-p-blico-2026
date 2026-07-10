import { z } from "zod";

import { handleAdminAuthError, requireAdmin } from "../_lib/admin-auth";
import { json, methodNotAllowed, readJsonBody } from "../_lib/http";
import { getSupabaseServerClient } from "../_lib/supabase";

const preCandidatoSchema = z.object({
  nome: z.string().trim().min(2),
  cargo: z.string().trim().min(2),
  ativo: z.boolean(),
  ordem: z.number().int().min(0),
});

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  try {
    await requireAdmin(req);
    const supabase = getSupabaseServerClient();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("pre_candidatos")
        .select("id, nome, cargo, ativo, ordem, criado_em")
        .order("ordem", { ascending: true })
        .order("criado_em", { ascending: true });

      if (error) throw error;
      return json(res, 200, data ?? []);
    }

    const body = preCandidatoSchema.parse(await readJsonBody(req));
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

    if (error) throw error;
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
  }
}
