import { NextResponse } from "next/server";
import { getApiKeys } from "@/lib/localDb";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const KEY_ENV_NAMES = [
  "ROUTER_API_KEY",
  "OPENAI_API_KEY",
  "API_KEY",
  "DEFAULT_API_KEY",
];

function pickEnvApiKey(source) {
  for (const name of KEY_ENV_NAMES) {
    const value = source?.[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseEnvText(envText) {
  const out = {};
  for (const rawLine of String(envText || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function readApiKeyFromEnvFiles() {
  const envFiles = [".env.local", ".env", ".env.production", ".env.development"];
  for (const fileName of envFiles) {
    try {
      const fullPath = path.join(process.cwd(), fileName);
      const content = await fs.readFile(fullPath, "utf8");
      const parsed = parseEnvText(content);
      const key = pickEnvApiKey(parsed);
      if (key) return key;
    } catch {}
  }
  return "";
}

export async function GET() {
  try {
    const envApiKey = pickEnvApiKey(process.env);
    if (envApiKey) {
      return NextResponse.json({ apiKey: envApiKey, source: "env" });
    }

    const fileApiKey = await readApiKeyFromEnvFiles();
    if (fileApiKey) {
      return NextResponse.json({ apiKey: fileApiKey, source: "env-file" });
    }

    const keys = await getApiKeys();
    const activeKey = (keys || []).find((k) => k.isActive !== false)?.key || "";
    if (activeKey) {
      return NextResponse.json({ apiKey: activeKey, source: "db" });
    }

    return NextResponse.json({ apiKey: "sk_localllm", source: "fallback" });
  } catch (error) {
    console.log("Error loading default API key:", error);
    return NextResponse.json({ error: "Failed to load default API key" }, { status: 500 });
  }
}
