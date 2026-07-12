type ApiRequest = {
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
};

function sendJson(res: any, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(body));
}

function methodNotAllowed(res: any, methods: string[]) {
  res.setHeader("Allow", methods.join(", "));
  return sendJson(res, 405, { error: "Metodo nao permitido." });
}

function getRouteInfo(req: ApiRequest) {
  const rawUrl = req.url || "";
  const url = new URL(rawUrl || "/api", "https://dummy.local");
  let pathname = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");

  if (!pathname || pathname.startsWith("[...path]")) {
    const rawPath = req.query?.path;
    if (Array.isArray(rawPath)) {
      pathname = rawPath.map((part) => String(part)).filter(Boolean).join("/");
    } else if (typeof rawPath === "string") {
      pathname = rawPath.replace(/\/$/, "");
    } else {
      pathname = (url.searchParams.get("path") ?? "").replace(/\/$/, "");
    }
  }

  const parts = pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  return {
    rawUrl,
    pathname: parts.join("/"),
    parts,
  };
}

function withQuery(req: any, params: Record<string, string>) {
  req.query = {
    ...(req.query ?? {}),
    ...params,
  };
  return req;
}

function debugEnvPayload(source: "catch-all") {
  return {
    ok: true,
    source,
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    DEFAULT_RESPONSAVEL_ID: Boolean(process.env.DEFAULT_RESPONSAVEL_ID),
    VITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
    NODE_ENV: process.env.NODE_ENV || null,
    VERCEL_ENV: process.env.VERCEL_ENV || null,
  };
}

export default async function handler(req: any, res: any) {
  try {
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    const method = req.method || "GET";
    const { rawUrl, pathname, parts } = getRouteInfo(req);
    console.log("[api router] method:", method, "url:", rawUrl, "pathname:", pathname, "parts:", parts);

    if (method === "GET" && pathname === "debug-env") {
      return sendJson(res, 200, debugEnvPayload("catch-all"));
    }

    if (method === "GET" && pathname === "cadastro-publico") {
      const mod = await import("./_handlers/cadastro-publico.js");
      return mod.default(req, res);
    }

    if (method === "GET" && pathname === "cadastro-config") {
      const mod = await import("./_handlers/cadastro-config.js");
      return mod.default(req, res);
    }

    if (method === "GET" && pathname === "pre-candidatos") {
      const mod = await import("./_handlers/pre-candidatos.js");
      return mod.default(req, res);
    }

    if (parts[0] === "responsaveis" && parts[1] && parts.length === 2) {
      if (method !== "GET") return methodNotAllowed(res, ["GET"]);
      const mod = await import("./_handlers/responsaveis/[slug].js");
      return mod.default(withQuery(req, { slug: parts[1] }), res);
    }

    if (method === "POST" && pathname === "cadastros") {
      const mod = await import("./_handlers/cadastros.js");
      return mod.default(req, res);
    }

    if (method === "GET" && pathname === "admin/me") {
      const mod = await import("./_handlers/admin/me.js");
      return mod.default(req, res);
    }

    if (method === "GET" && pathname === "admin/dashboard") {
      const mod = await import("./_handlers/admin/dashboard.js");
      return mod.default(req, res);
    }

    if (method === "GET" && pathname === "admin/cadastros") {
      const mod = await import("./_handlers/admin/cadastros.js");
      return mod.default(req, res);
    }

    if (parts[0] === "admin" && parts[1] === "pre-candidatos") {
      const id = parts[2];

      if ((method === "GET" || method === "POST") && !id && parts.length === 2) {
        const mod = await import("./_handlers/admin/pre-candidatos.js");
        return mod.default(req, res);
      }

      if (method === "PUT" && id && parts.length === 3) {
        const mod = await import("./_handlers/admin/pre-candidatos/[id].js");
        return mod.default(withQuery(req, { id }), res);
      }

      if (method === "PATCH" && id && parts.length === 4 && parts[3] === "status") {
        const mod = await import("./_handlers/admin/pre-candidatos/[id]/status.js");
        return mod.default(withQuery(req, { id }), res);
      }

      if (method === "PATCH" && id && parts.length === 4 && parts[3] === "ordem") {
        const mod = await import("./_handlers/admin/pre-candidatos/[id]/ordem.js");
        return mod.default(withQuery(req, { id }), res);
      }
    }

    return sendJson(res, 404, {
      error: "Rota nao encontrada.",
      method,
      rawUrl,
      pathname,
      parts,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error("[api catch-all fatal]", details);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({
      error: "Erro fatal no roteador da API.",
      details,
    }));
  }
}
