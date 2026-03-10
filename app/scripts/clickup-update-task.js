const { clickupRequest } = require("./clickup-client");

function usage() {
  console.log("Usage:");
  console.log(
    "  npm run clickup:update -- --task <task_id> [--status \"In Progress\"] [--comment \"text\"]"
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
  const taskId = args.task;
  if (!taskId) throw new Error("Missing --task <task_id>.");
  if (!args.status && !args.comment) {
    throw new Error("Provide at least one action: --status or --comment.");
  }

  const output = {
    task_id: taskId,
    updated: false,
    commented: false
  };

  if (args.status) {
    await clickupRequest("PUT", `/task/${taskId}`, {
      body: {
        status: args.status
      }
    });
    output.updated = true;
    output.new_status = args.status;
  }

  if (args.comment) {
    await clickupRequest("POST", `/task/${taskId}/comment`, {
      body: {
        comment_text: args.comment,
        notify_all: false
      }
    });
    output.commented = true;
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
