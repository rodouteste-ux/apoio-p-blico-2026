import { getSupabaseServerClient } from "./supabase";
import { getServerEnv } from "./env";

function getDefaultResponsavelId() {
  try {
    return getServerEnv("DEFAULT_RESPONSAVEL_ID").replace(/^['"]|['"]$/g, "").trim();
  } catch {
    return "";
  }
}

export async function getCadastroConfig() {
  const supabase = getSupabaseServerClient();
  const defaultResponsavelId = getDefaultResponsavelId();
  let query = supabase
    .from("responsaveis")
    .select("id")
    .eq("ativo", true);

  if (defaultResponsavelId) {
    query = query.eq("id", defaultResponsavelId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw error;
  }

  return {
    ativo: Boolean(data),
    responsavelId: data?.id ?? null,
  };
}
