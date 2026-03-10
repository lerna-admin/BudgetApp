const { clickupRequest } = require("./clickup-client");

function usage() {
  console.log("Usage:");
  console.log(
    "  npm run clickup:webhook:create -- --endpoint <url> [--team <team_id>] [--list <list_id>] [--events taskCreated,taskUpdated,taskStatusUpdated]"
  );
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    args[key] = value;
    i += 1;
  }
  return args;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    usage();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const args = parseArgs(argv);
  const teamId = args.team || process.env.CLICKUP_TEAM_ID;
  const endpoint = args.endpoint;
  if (!teamId) throw new Error("Missing --team <team_id> or CLICKUP_TEAM_ID.");
  if (!endpoint) throw new Error("Missing --endpoint <url>.");

  const events = args.events
    ? args.events
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : ["taskCreated", "taskUpdated", "taskStatusUpdated", "taskCommentPosted"];

  const body = {
    endpoint,
    events
  };

  if (args.list) body.list_id = Number(args.list);
  if (args.space) body.space_id = Number(args.space);
  if (args.folder) body.folder_id = Number(args.folder);
  if (args.task) body.task_id = args.task;

  const data = await clickupRequest("POST", `/team/${teamId}/webhook`, {
    body
  });

  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
