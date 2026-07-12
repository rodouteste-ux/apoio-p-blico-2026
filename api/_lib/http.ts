export function sendJson(res: any, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(body));
}

export function json(res: any, status: number, payload: unknown) {
  return sendJson(res, status, payload);
}

export function methodNotAllowed(res: any, methods: string[]) {
  res.setHeader("Allow", methods.join(", "));
  return json(res, 405, { error: "Metodo nao permitido." });
}

export async function readJsonBody(req: any) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.length > 0) {
    return JSON.parse(req.body);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

export const readJson = readJsonBody;

export const readBody = readJsonBody;

export function getOriginIp(req: any): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]?.trim() ?? null;
  }

  return req.socket?.remoteAddress ?? null;
}

export function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}
