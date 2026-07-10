import { getSupabaseServerClient } from "./supabase";

export async function getCadastroConfig() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("responsaveis")
    .select("id, slug")
    .eq("ativo", true)
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    ativo: Boolean(data),
    responsavelId: data?.id ?? null,
    slug: data?.slug ?? null,
  };
}
