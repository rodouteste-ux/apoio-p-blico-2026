import { z } from "zod";

import { handleAdminAuthError, requireAdmin } from "../../../_lib/admin-auth";
import { json, methodNotAllowed, readJsonBody } from "../../../_lib/http";
import { getSupabaseServerClient } from "../../../_lib/supabase";

const ordemSchema = z.object({
  ordem: z.number().int().min(0),
});

export default async function handler(req: any, res: any) {
  if (req.method !== "PATCH") {
    return methodNotAllowed(res, ["PATCH"]);
  }

  try {
    await requireAdmin(req);
    const id = String(req.query?.id ?? "").trim();
    if (!id) {
      return json(res, 400, { error: "Pre-candidato invalido." });
    }

    const body = ordemSchema.parse(await readJsonBody(req));
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("pre_candidatos")
      .update({ ordem: body.ordem })
      .eq("id", id)
      .select("id, nome, cargo, ativo, ordem, criado_em")
      .single();

    if (error) throw error;
    return json(res, 200, data);
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return handleAdminAuthError(res, error, "/api/admin/pre-candidatos/[id]/ordem");
    }

    if (error instanceof z.ZodError) {
      return json(res, 400, { error: "Verifique os dados informados e tente novamente." });
    }

    console.error("Erro ao atualizar ordem do pre-candidato:", error);
    return json(res, 500, { error: "Erro interno ao processar solicitacao." });
  }
}
