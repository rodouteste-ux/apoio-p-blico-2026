import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../src/types/database";
import { getSupabaseEnv } from "./env";

let supabaseServerClient: SupabaseClient<Database> | null = null;

export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (supabaseServerClient) {
    return supabaseServerClient;
  }

  const envResult = getSupabaseEnv();
  if (!envResult.ok) {
    throw new Error(`Missing env: ${envResult.missing.join(", ")}`);
  }

  supabaseServerClient = createClient<Database>(
    envResult.env.SUPABASE_URL,
    envResult.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return supabaseServerClient;
}
