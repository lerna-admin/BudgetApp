const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const appRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(appRoot, ".env"), quiet: true });

function getStorageRoot() {
  return process.env.BUDGETAPP_STORAGE_ROOT || appRoot;
}

function getMemoryLogPath() {
  return (
    process.env.BUDGETAPP_MEMORY_LOG_PATH ||
    path.join(getStorageRoot(), "logs", "logs.jsonl")
  );
}

function ensureDirWritable(dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.accessSync(dir, fs.constants.W_OK);
}

module.exports = {
  appRoot,
  getStorageRoot,
  getMemoryLogPath,
  ensureDirWritable
};
