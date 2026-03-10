const { clickupRequest } = require("./clickup-client");

function usage() {
  console.log("Usage:");
  console.log(
    "  npm run clickup:dispatch -- --list <list_id> [--status Ready] [--limit 20]"
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

const TASK_TO_AGENT = {
  market_research: "market-research",
  competitor_analysis: "market-research",
  product_design: "product-design",
  web_development: "web-dev",
  content_seo: "content-seo",
  ops_automation: "ops-automation",
  qa_review: "qa-review"
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function customFieldTaskType(task) {
  const fields = Array.isArray(task.custom_fields) ? task.custom_fields : [];
  const field = fields.find((f) => normalizeText(f.name) === "task_type");
  if (!field) return null;

  if (typeof field.value === "string") return normalizeText(field.value);
  if (field.type_config?.options && field.value !== undefined) {
    const option = field.type_config.options.find(
      (opt) => String(opt.orderindex) === String(field.value) || opt.id === field.value
    );
    if (option?.name) return normalizeText(option.name);
  }
  return null;
}

function tagTaskType(task) {
  const tags = Array.isArray(task.tags) ? task.tags : [];
  for (const tag of tags) {
    const name = normalizeText(tag.name);
    if (TASK_TO_AGENT[name]) return name;
  }
  return null;
}

function titleTaskType(task) {
  const name = String(task.name || "");
  const match = name.match(/^\[([a-zA-Z0-9_\-\s]+)\]/);
  if (!match) return null;
  const candidate = normalizeText(match[1]);
  return TASK_TO_AGENT[candidate] ? candidate : null;
}

function resolveTaskType(task) {
  return customFieldTaskType(task) || tagTaskType(task) || titleTaskType(task) || null;
}

async function fetchTasks(listId, statuses, limit) {
  const tasks = [];
  const pages = Math.max(Math.ceil(limit / 100), 1);
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
  return tasks.slice(0, limit);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    usage();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const args = parseArgs(argv);
  const listId = args.list || process.env.CLICKUP_LIST_ID;
  if (!listId) throw new Error("Missing --list <list_id> or CLICKUP_LIST_ID.");

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
  const tasks = await fetchTasks(listId, statuses, limit);

  const dispatchable = [];
  const unresolved = [];

  for (const task of tasks) {
    const taskType = resolveTaskType(task);
    const agentId = taskType ? TASK_TO_AGENT[taskType] : null;

    const base = {
      task_id: task.id,
      task_name: task.name,
      clickup_url: task.url || null,
      task_type: taskType,
      status: task.status?.status || null
    };

    if (agentId) {
      dispatchable.push({
        ...base,
        agent_id: agentId
      });
    } else {
      unresolved.push({
        ...base,
        reason:
          "task_type missing. Set custom field 'task_type', or add a matching tag, or prefix title with [task_type]."
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        list_id: String(listId),
        requested_statuses: statuses,
        total_tasks: tasks.length,
        dispatchable_count: dispatchable.length,
        unresolved_count: unresolved.length,
        dispatchable,
        unresolved
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
