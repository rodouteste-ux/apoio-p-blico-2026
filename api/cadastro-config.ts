import { getCadastroConfig } from "./_lib/cadastro-config";
import { json, methodNotAllowed } from "./_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const config = await getCadastroConfig();
    return json(res, 200, { ativo: config.ativo });
  } catch (error) {
    console.error("Erro ao carregar configuracao publica de cadastro:", error);
    return json(res, 500, { error: "Erro interno ao processar solicitacao." });
  }
}
