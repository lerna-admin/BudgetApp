const fs = require("node:fs");
const path = require("node:path");

function printHelp() {
  console.log("Usage: npm run venture:init -- <venture-slug>");
  console.log("");
  console.log("Rules:");
  console.log("- lowercase letters, numbers and hyphens only");
  console.log("- example: saas-landing-audit");
}

function validSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafe(filePath, content) {
  if (fs.existsSync(filePath)) return false;
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

function run() {
  const arg = process.argv[2];

  if (!arg || arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(arg ? 0 : 1);
  }

  if (!validSlug(arg)) {
    console.error("Invalid venture slug:", arg);
    printHelp();
    process.exit(1);
  }

  const ventureRoot = path.join(process.cwd(), "ops", "ventures", arg);

  if (fs.existsSync(ventureRoot)) {
    console.error("Venture already exists:", ventureRoot);
    process.exit(1);
  }

  const dirs = [
    "knowledge",
    "tasks",
    "reports",
    "deliverables",
    "configs"
  ];

  ensureDir(ventureRoot);
  for (const dir of dirs) ensureDir(path.join(ventureRoot, dir));

  writeFileSafe(
    path.join(ventureRoot, "venture-profile.md"),
    `# ${arg} - Venture Profile

- venture_id: ${arg}
- name:
- owner:
- stage: discovery

## Problem

...

## Target user

...

## Value proposition

...

## 90-day goals

1. ...
2. ...
3. ...

## KPIs

- north_star:
- acquisition:
- activation:
- retention:
- revenue:
`
  );

  writeFileSafe(
    path.join(ventureRoot, "tasks", "backlog.md"),
    `# ${arg} - Backlog

| id | title | task_type | priority | status | owner_agent |
|----|-------|-----------|----------|--------|-------------|
| ${arg.toUpperCase()}-001 | Define market scope | market_research | P1 | Backlog | supervisor |
`
  );

  writeFileSafe(
    path.join(ventureRoot, "reports", "weekly.md"),
    `# ${arg} - Weekly Report

## Wins

- ...

## Risks

- ...

## KPI snapshot

- ...

## Next week focus

- ...
`
  );

  writeFileSafe(
    path.join(ventureRoot, "configs", "agents.yaml"),
    `supervisor:
  enabled: true
  model: primary
  fallback: true
  memory:
    required: true
    read_before_action: true
    write_after_action: true

workers:
  - id: market-research
    task_types: [market_research, competitor_analysis]
    memory_required: true
  - id: product-design
    task_types: [product_design]
    memory_required: true
  - id: web-dev
    task_types: [web_development]
    memory_required: true
  - id: content-seo
    task_types: [content_seo]
    memory_required: true
  - id: ops-automation
    task_types: [ops_automation]
    memory_required: true
  - id: qa-review
    task_types: [qa_review]
    memory_required: true
`
  );

  writeFileSafe(
    path.join(ventureRoot, "configs", "tooling.md"),
    `# Tooling And Credentials

## Task Manager

- provider:
- workspace:
- project:

## n8n

- base_url:
- workflow_supervisor_id:
- worker_workflows:

## Memory

- log_file: ${process.env.BUDGETAPP_MEMORY_LOG_PATH || "$BUDGETAPP_STORAGE_ROOT/logs/logs.jsonl"}
- write_mode: append_only
- read_window_events: 40

## LLM

- primary_provider:
- fallback_provider:

## Publishing

- domain:
- hosting:
- analytics:
`
  );

  console.log("Venture created:", ventureRoot);
  console.log("Next steps:");
  console.log("1) Fill venture-profile.md");
  console.log("2) Add tickets in tasks/backlog.md");
  console.log("3) Map real workflow IDs in ops/n8n/supervisor-routing.json");
  console.log(
    "4) Use shared memory log file: BUDGETAPP_MEMORY_LOG_PATH or BUDGETAPP_STORAGE_ROOT/logs/logs.jsonl"
  );
}

run();
