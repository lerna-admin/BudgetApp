const { clickupRequest } = require("./clickup-client");

function usage() {
  console.log("Usage:");
  console.log(
    "  npm run clickup:pull -- --list <list_id> [--status Ready] [--statuses Ready,Review] [--limit 20]"
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

function compactTask(task) {
  const customFields = Array.isArray(task.custom_fields) ? task.custom_fields : [];
  return {
    id: task.id,
    name: task.name,
    status: task.status?.status || null,
    status_color: task.status?.color || null,
    priority: task.priority?.priority || null,
    due_date: task.due_date || null,
    date_updated: task.date_updated || null,
    creator: task.creator?.username || task.creator?.email || null,
    assignees: (task.assignees || []).map((a) => a.username || a.email || a.id),
    tags: (task.tags || []).map((t) => t.name),
    custom_fields: customFields.map((field) => ({
      id: field.id,
      name: field.name,
      type: field.type,
      value: field.value
    })),
    url: task.url || null
  };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    usage();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const args = parseArgs(argv);
  const listId = args.list || process.env.CLICKUP_LIST_ID;
  if (!listId) {
    throw new Error("Missing --list <list_id> or CLICKUP_LIST_ID.");
  }

  const statuses = [];
  if (args.statuses) {
    for (const raw of args.statuses.split(",")) {
      const value = raw.trim();
      if (value) statuses.push(value);
    }
  }
  if (args.status) statuses.push(args.status.trim());
  if (statuses.length === 0) statuses.push("Ready");

  const limit = Number(args.limit || 20);
  const perPageTarget = Math.max(limit, 20);
  const pages = Math.max(Math.ceil(perPageTarget / 100), 1);

  const tasks = [];
  for (let page = 0; page < pages; page += 1) {
    const data = await clickupRequest("GET", `/list/${listId}/task`, {
      query: {
        archived: false,
        include_closed: false,
        statuses,
        page
      }
    });
    const pageTasks = Array.isArray(data?.tasks) ? data.tasks : [];
    tasks.push(...pageTasks);
    if (pageTasks.length === 0 || tasks.length >= limit) break;
  }

  const output = {
    list_id: String(listId),
    requested_statuses: statuses,
    count: Math.min(tasks.length, limit),
    tasks: tasks.slice(0, limit).map(compactTask)
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
