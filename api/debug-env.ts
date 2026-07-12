export default async function handler(_req: any, res: any) {
  try {
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    res.statusCode = 200;
    return res.end(JSON.stringify({
      ok: true,
      message: "debug-env funcionando",
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      DEFAULT_RESPONSAVEL_ID: Boolean(process.env.DEFAULT_RESPONSAVEL_ID),
      VITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL),
      VITE_SUPABASE_ANON_KEY: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
      NODE_ENV: process.env.NODE_ENV || null,
      VERCEL_ENV: process.env.VERCEL_ENV || null,
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({
      ok: false,
      error: "debug-env fatal",
      details: error instanceof Error ? error.message : String(error),
    }));
  }
}
