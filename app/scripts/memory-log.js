const fs = require("node:fs");
const path = require("node:path");
const { getMemoryLogPath, ensureDirWritable } = require("./storage-paths");

function usage() {
  console.log("Usage:");
  console.log(
    "  npm run memory:log -- --venture <id> --agent <id> --thread <id> --type <event_type> --role <role> --text <content> [--task <task_id>] [--confidence <0..1>]"
  );
}

function parseArgs(argv) {
  const map = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const value = argv[i + 1];
    map[key.slice(2)] = value;
    i += 1;
  }
  return map;
}

function required(name, value) {
  if (!value) {
    throw new Error(`Missing required arg --${name}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const parsed = parseArgs(args);
  required("venture", parsed.venture);
  required("agent", parsed.agent);
  required("thread", parsed.thread);
  required("type", parsed.type);
  required("role", parsed.role);
  required("text", parsed.text);

  const logFile = getMemoryLogPath();
  const logDir = path.dirname(logFile);

  try {
    ensureDirWritable(logDir);
  } catch (error) {
    throw new Error(
      `Cannot write in log directory ${logDir}. Check mount permissions (rw) and ownership.`
    );
  }

  const event = {
    event_id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    created_at: new Date().toISOString(),
    project_id: "budgetapp",
    venture_id: parsed.venture,
    task_id: parsed.task || null,
    thread_id: parsed.thread,
    agent_id: parsed.agent,
    event_type: parsed.type,
    role: parsed.role,
    content: parsed.text,
    confidence: parsed.confidence ? Number(parsed.confidence) : null,
    metadata: {
      source: "manual-cli"
    }
  };

  fs.appendFileSync(logFile, `${JSON.stringify(event)}\n`, "utf8");
  console.log(`Logged event in ${logFile}`);
  console.log(`event_id=${event.event_id}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  usage();
  process.exit(1);
}
