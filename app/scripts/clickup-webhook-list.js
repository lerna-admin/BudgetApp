const { clickupRequest } = require("./clickup-client");

function usage() {
  console.log("Usage:");
  console.log("  npm run clickup:webhook:list -- [--team <team_id>]");
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
  if (argv.includes("--help") || argv.includes("-h")) {
    usage();
    process.exit(0);
  }

  const args = parseArgs(argv);
  const teamId = args.team || process.env.CLICKUP_TEAM_ID;
  if (!teamId) throw new Error("Missing --team <team_id> or CLICKUP_TEAM_ID.");

  const data = await clickupRequest("GET", `/team/${teamId}/webhook`);
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
