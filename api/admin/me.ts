import { handleAdminAuthError, requireAdmin } from "../_lib/admin-auth";
import { json, methodNotAllowed } from "../_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const admin = await requireAdmin(req);

    return json(res, 200, {
      user: {
        id: admin.userId,
        email: admin.email,
        nome: admin.nome,
        role: admin.role,
        ativo: admin.ativo,
      },
    });
  } catch (error) {
    return handleAdminAuthError(res, error, "/api/admin/me");
  }
}
