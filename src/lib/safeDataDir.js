import path from "node:path";
import os from "node:os";

function defaultDataDir(appName = "localllm") {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), appName);
  }
  return path.join(os.homedir(), `.${appName}`);
}

function isUnsafeDir(dirPath) {
  const normalized = path.resolve(dirPath);
  if (!normalized || normalized === path.parse(normalized).root) return true;
  return false;
}

export function resolveSafeDataDir({ appName = "localllm", fallbackDir } = {}) {
  const envDir = (process.env.DATA_DIR || "").trim();
  if (envDir) {
    if (!path.isAbsolute(envDir) || isUnsafeDir(envDir)) {
      throw new Error("DATA_DIR must be an absolute, non-root path");
    }
    return path.resolve(envDir);
  }

  const target = fallbackDir ? path.resolve(fallbackDir) : defaultDataDir(appName);
  if (isUnsafeDir(target)) {
    throw new Error(`Unsafe data directory resolved: ${target}`);
  }
  return target;
}
