import { getSupabaseServerClient } from "./_lib/supabase";
import { json, methodNotAllowed } from "./_lib/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("pre_candidatos")
      .select("id, nome, cargo, ordem")
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (error) {
      throw error;
    }

    return json(res, 200, data ?? []);
  } catch (error) {
    console.error("Erro ao buscar pre-candidatos:", error);
    return json(res, 500, { error: "Nao foi possivel carregar os pre-candidatos." });
  }
}
