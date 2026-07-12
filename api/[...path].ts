import handleAdminCadastros from "./_handlers/admin/cadastros";
import handleAdminDashboard from "./_handlers/admin/dashboard";
import handleAdminMe from "./_handlers/admin/me";
import handleAdminPreCandidatos from "./_handlers/admin/pre-candidatos";
import handleAtualizarPreCandidato from "./_handlers/admin/pre-candidatos/[id]";
import handleAtualizarOrdemPreCandidato from "./_handlers/admin/pre-candidatos/[id]/ordem";
import handleAtualizarStatusPreCandidato from "./_handlers/admin/pre-candidatos/[id]/status";
import handleCadastroConfig from "./_handlers/cadastro-config";
import handleCadastroPublico from "./_handlers/cadastro-publico";
import handleCriarCadastro from "./_handlers/cadastros";
import handlePreCandidatos from "./_handlers/pre-candidatos";
import handleResponsavel from "./_handlers/responsaveis/[slug]";
import { json, methodNotAllowed } from "./_lib/http";

type ApiRequest = {
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
};

function getRouteInfo(req: ApiRequest) {
  const url = new URL(req.url || "/api", "http://localhost");
  const pathFromUrl = url.pathname.replace(/^\/api\/?/, "");
  if (pathFromUrl && !pathFromUrl.startsWith("[...path]")) {
    const parts = pathFromUrl.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
    return {
      pathname: parts.join("/"),
      parts,
      rawUrl: req.url || "",
    };
  }

  const rawPath = req.query?.path;
  if (Array.isArray(rawPath)) {
    const parts = rawPath.map((part) => String(part)).filter(Boolean);
    return {
      pathname: parts.join("/"),
      parts,
      rawUrl: req.url || "",
    };
  }

  if (typeof rawPath === "string" && rawPath) {
    const parts = rawPath.split("/").filter(Boolean);
    return {
      pathname: parts.join("/"),
      parts,
      rawUrl: req.url || "",
    };
  }

  const pathParam = url.searchParams.get("path") ?? "";
  const parts = pathParam.split("/").filter(Boolean);
  return {
    pathname: parts.join("/"),
    parts,
    rawUrl: req.url || "",
  };
}

function withQuery(req: any, params: Record<string, string>) {
  req.query = {
    ...(req.query ?? {}),
    ...params,
  };
  return req;
}

export default async function handler(req: any, res: any) {
  const method = req.method || "GET";
  const { pathname, parts, rawUrl } = getRouteInfo(req);
  console.log("[api router] method:", method, "url:", rawUrl, "pathname:", pathname, "parts:", parts);

  try {
    if (!pathname) {
      return json(res, 404, {
        error: "Rota nao encontrada.",
        details: "Path vazio no roteador da API.",
      });
    }

    if (pathname === "cadastro-publico") {
      return method === "GET" ? handleCadastroPublico(req, res) : methodNotAllowed(res, ["GET"]);
    }

    if (pathname === "cadastro-config") {
      return method === "GET" ? handleCadastroConfig(req, res) : methodNotAllowed(res, ["GET"]);
    }

    if (pathname === "pre-candidatos") {
      return method === "GET" ? handlePreCandidatos(req, res) : methodNotAllowed(res, ["GET"]);
    }

    if (parts[0] === "responsaveis" && parts[1] && parts.length === 2) {
      return method === "GET"
        ? handleResponsavel(withQuery(req, { slug: parts[1] }), res)
        : methodNotAllowed(res, ["GET"]);
    }

    if (pathname === "cadastros") {
      return method === "POST" ? handleCriarCadastro(req, res) : methodNotAllowed(res, ["POST"]);
    }

    if (pathname === "admin/me") {
      return method === "GET" ? handleAdminMe(req, res) : methodNotAllowed(res, ["GET"]);
    }

    if (pathname === "admin/dashboard") {
      return method === "GET" ? handleAdminDashboard(req, res) : methodNotAllowed(res, ["GET"]);
    }

    if (pathname === "admin/cadastros") {
      return method === "GET" ? handleAdminCadastros(req, res) : methodNotAllowed(res, ["GET"]);
    }

    if (parts[0] === "admin" && parts[1] === "pre-candidatos") {
      const id = parts[2];

      if (!id && parts.length === 2) {
        return method === "GET" || method === "POST"
          ? handleAdminPreCandidatos(req, res)
          : methodNotAllowed(res, ["GET", "POST"]);
      }

      if (id && parts.length === 3) {
        return method === "PUT"
          ? handleAtualizarPreCandidato(withQuery(req, { id }), res)
          : methodNotAllowed(res, ["PUT"]);
      }

      if (id && parts.length === 4 && parts[3] === "status") {
        return method === "PATCH"
          ? handleAtualizarStatusPreCandidato(withQuery(req, { id }), res)
          : methodNotAllowed(res, ["PATCH"]);
      }

      if (id && parts.length === 4 && parts[3] === "ordem") {
        return method === "PATCH"
          ? handleAtualizarOrdemPreCandidato(withQuery(req, { id }), res)
          : methodNotAllowed(res, ["PATCH"]);
      }
    }

    return json(res, 404, { error: "Rota nao encontrada." });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error("[api catch-all]", details);
    return json(res, 500, {
      error: "Erro interno do servidor.",
      details,
    });
  }
}
