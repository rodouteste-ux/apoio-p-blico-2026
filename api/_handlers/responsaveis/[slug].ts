import { getSupabaseServerClient } from "../../_lib/supabase";
import { json, methodNotAllowed } from "../../_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const slug = String(req.query?.slug ?? "").trim();
    if (!slug) {
      return json(res, 400, { error: "Slug invalido." });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("responsaveis")
      .select("slug, ativo")
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return json(res, 404, { error: "Link de cadastro nao encontrado ou inativo." });
    }

    return json(res, 200, data);
  } catch (error) {
    console.error("Erro ao buscar responsavel:", error);
    return json(res, 500, { error: "Erro interno ao validar link de cadastro." });
  }
}
