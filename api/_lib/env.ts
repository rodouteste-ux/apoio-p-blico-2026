import fs from "node:fs";
import path from "node:path";

let localEnvCache: Record<string, string> | null = null;

function parseEnvFile(content: string) {
  const result: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    result[key] = value;
  }

  return result;
}

function loadLocalEnvFile() {
  if (localEnvCache) return localEnvCache;

  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    localEnvCache = {};
    return localEnvCache;
  }

  localEnvCache = parseEnvFile(fs.readFileSync(envPath, "utf-8"));
  return localEnvCache;
}

export function getServerEnv(name: string) {
  const runtimeValue = process.env[name];
  if (runtimeValue && runtimeValue.trim().length > 0) {
    return runtimeValue;
  }

  const localValue = loadLocalEnvFile()[name];
  if (localValue && localValue.trim().length > 0) {
    return localValue;
  }

  throw new Error(`${name} nao configurada`);
}
