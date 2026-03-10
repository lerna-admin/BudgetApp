const fs = require("node:fs");
const path = require("node:path");
const { getStorageRoot, getMemoryLogPath } = require("./storage-paths");

function canWrite(targetDir) {
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.accessSync(targetDir, fs.constants.W_OK);
    const probe = path.join(targetDir, `.write-test-${Date.now()}`);
    fs.writeFileSync(probe, "ok", "utf8");
    fs.unlinkSync(probe);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

function main() {
  const storageRoot = getStorageRoot();
  const logPath = getMemoryLogPath();
  const logsDir = path.dirname(logPath);

  console.log("Storage root:", storageRoot);
  console.log("Memory log path:", logPath);

  const rootCheck = canWrite(storageRoot);
  const logsCheck = canWrite(logsDir);

  console.log("");
  console.log("Writable checks:");
  console.log(
    `- root: ${rootCheck.ok ? "OK" : "FAIL"}${
      rootCheck.ok ? "" : ` (${rootCheck.message})`
    }`
  );
  console.log(
    `- logs: ${logsCheck.ok ? "OK" : "FAIL"}${
      logsCheck.ok ? "" : ` (${logsCheck.message})`
    }`
  );

  if (!rootCheck.ok || !logsCheck.ok) process.exit(1);
}

main();
