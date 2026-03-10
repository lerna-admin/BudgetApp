const fs = require("node:fs");
const readline = require("node:readline");
const { getMemoryLogPath } = require("./storage-paths");

function usage() {
  console.log("Usage:");
  console.log(
    "  npm run memory:search -- --query <text> [--venture <id>] [--limit <n>]"
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

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const parsed = parseArgs(args);
  if (!parsed.query) {
    throw new Error("Missing required arg --query");
  }

  const logFile = getMemoryLogPath();
  if (!fs.existsSync(logFile)) {
    console.error(`Log file not found: ${logFile}`);
    process.exit(1);
  }

  const query = parsed.query.toLowerCase();
  const venture = parsed.venture || null;
  const limit = parsed.limit ? Number(parsed.limit) : 20;
  const hits = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(logFile, { encoding: "utf8" }),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (venture && event.venture_id !== venture) continue;

    const haystack = [
      event.content || "",
      event.event_type || "",
      event.agent_id || "",
      event.thread_id || "",
      event.task_id || ""
    ]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(query)) hits.push(event);
  }

  hits
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, limit)
    .forEach((hit) => {
      console.log(
        `[${hit.created_at}] venture=${hit.venture_id} agent=${hit.agent_id} thread=${hit.thread_id}`
      );
      console.log(hit.content);
      console.log("---");
    });
}

main().catch((error) => {
  console.error(error.message);
  usage();
  process.exit(1);
});
