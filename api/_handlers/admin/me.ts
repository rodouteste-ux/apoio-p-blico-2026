import { handleAdminAuthError, requireAdmin } from "../../_lib/admin-auth";
import { json, methodNotAllowed } from "../../_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const start = Date.now();
  try {
    const authStart = Date.now();
    const admin = await requireAdmin(req, "[api/admin/me]");
    console.log("[api/admin/me] requireAdmin:", Date.now() - authStart, "ms");

    const jsonStart = Date.now();
    const payload = {
      user: {
        id: admin.userId,
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
