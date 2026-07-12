import { handleAdminAuthError, requireAdmin } from "../../_lib/admin-auth.js";
import { getRequiredSupabaseEnvMissing } from "../../_lib/env.js";
import { json, methodNotAllowed } from "../../_lib/http.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const start = Date.now();
  try {
    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    if (!authHeader || Array.isArray(authHeader)) {
      console.error("[api/admin/me] token ausente");
      return json(res, 401, { error: "Token ausente." });
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.error("[api/admin/me] formato de token inválido");
      return json(res, 401, { error: "Formato de token inválido." });
    }

    const missing = getRequiredSupabaseEnvMissing();
    if (missing.length > 0) {
      console.error("[api/admin/me] env faltando", missing);
      return json(res, 500, {
        error: "Configuração do servidor incompleta.",
        missing,
      });
    }

    const authStart = Date.now();
    const admin = await requireAdmin(req, "[api/admin/me]");
    console.log("[api/admin/me] requireAdmin:", Date.now() - authStart, "ms");

    const jsonStart = Date.now();
    const payload = {
      user: {
        id: admin.adminId,
        user_id: admin.userId,
        email: admin.email,
        nome: admin.nome,
        role: admin.role,
        ativo: admin.ativo,
      },
    };
    console.log("[api/admin/me] montar resposta:", Date.now() - jsonStart, "ms");
    return json(res, 200, {
      ...payload,
    });
  } catch (error) {
    return handleAdminAuthError(res, error, "/api/admin/me");
  } finally {
    console.log("[api/admin/me] total:", Date.now() - start, "ms");
  }
}
