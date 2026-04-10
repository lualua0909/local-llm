const path = require("path");
const os = require("os");

// Single source of truth for data directory — matches localDb.js logic
function getDataDir() {
  if (process.env.DATA_DIR) {
    const value = process.env.DATA_DIR.trim();
    const resolved = path.resolve(value);
    if (!path.isAbsolute(value) || resolved === path.parse(resolved).root) {
      throw new Error("DATA_DIR must be an absolute, non-root path");
    }
    return resolved;
  }
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "localllm");
  }
  return path.join(os.homedir(), ".localllm");
}

const DATA_DIR = getDataDir();
const MITM_DIR = path.join(DATA_DIR, "mitm");

module.exports = { DATA_DIR, MITM_DIR };
